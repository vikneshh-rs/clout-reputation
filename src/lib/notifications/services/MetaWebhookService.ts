import { db } from '../../db';
import { NotificationStatus } from '@prisma/client';

export class MetaWebhookService {
  private static getStatusRank(status: NotificationStatus): number {
    const ranks: Record<NotificationStatus, number> = {
      [NotificationStatus.PENDING]: 0,
      [NotificationStatus.PROCESSING]: 1,
      [NotificationStatus.SENT]: 2,
      [NotificationStatus.DELIVERED]: 3,
      [NotificationStatus.READ]: 4,
      [NotificationStatus.FAILED]: 5,
    };
    return ranks[status];
  }

  static async process(payload: any): Promise<{ success: boolean; error?: string }> {
    try {
      if (!payload || !payload.entry || !Array.isArray(payload.entry)) {
        return { success: false, error: 'Invalid payload structure: missing entry.' };
      }

      for (const entry of payload.entry) {
        if (!entry.changes || !Array.isArray(entry.changes)) continue;

        for (const change of entry.changes) {
          const value = change.value;
          if (!value || !value.statuses || !Array.isArray(value.statuses)) continue;

          for (const statusObj of value.statuses) {
            const providerMessageId = statusObj.id;
            const metaStatus = statusObj.status;

            if (!providerMessageId || !metaStatus) continue;

            // Map status
            let mappedStatus: NotificationStatus;
            switch (metaStatus.toLowerCase()) {
              case 'sent':
                mappedStatus = NotificationStatus.SENT;
                break;
              case 'delivered':
                mappedStatus = NotificationStatus.DELIVERED;
                break;
              case 'read':
                mappedStatus = NotificationStatus.READ;
                break;
              case 'failed':
                mappedStatus = NotificationStatus.FAILED;
                break;
              default:
                // Ignore unsupported statuses
                continue;
            }

            // Find matching job
            const job = await db.notificationJob.findFirst({
              where: { providerMessageId },
            });

            if (!job) {
              console.warn(
                JSON.stringify({
                  timestamp: new Date().toISOString(),
                  level: 'warn',
                  component: 'MetaWebhookService',
                  message: `Unknown providerMessageId received from Meta webhook. Skipping.`,
                  providerMessageId,
                })
              );
              continue;
            }

            // Check progression rules
            const currentRank = this.getStatusRank(job.status);
            const newRank = this.getStatusRank(mappedStatus);

            // Idempotency: skip if already same status
            if (job.status === mappedStatus) {
              console.log(
                JSON.stringify({
                  timestamp: new Date().toISOString(),
                  level: 'info',
                  component: 'MetaWebhookService',
                  message: `Duplicate status event ignored (Idempotency).`,
                  jobId: job.id,
                  status: mappedStatus,
                })
              );
              continue;
            }

            // Event ordering: Do not downgrade status
            if (currentRank >= newRank) {
              // Once terminal (READ or FAILED), never transition back
              if (job.status === NotificationStatus.READ || job.status === NotificationStatus.FAILED) {
                console.log(
                  JSON.stringify({
                    timestamp: new Date().toISOString(),
                    level: 'info',
                    component: 'MetaWebhookService',
                    message: `Terminal status preserved. Downgrade rejected.`,
                    jobId: job.id,
                    currentStatus: job.status,
                    newStatus: mappedStatus,
                  })
                );
                continue;
              }
              // Skip general downgrades
              console.log(
                JSON.stringify({
                  timestamp: new Date().toISOString(),
                  level: 'info',
                  component: 'MetaWebhookService',
                  message: `Out-of-order event ignored. Downgrade rejected.`,
                  jobId: job.id,
                  currentStatus: job.status,
                  newStatus: mappedStatus,
                })
              );
              continue;
            }

            const errorDetail = statusObj.errors?.[0];
            const errorMsg = errorDetail ? `${errorDetail.title} (Code: ${errorDetail.code})` : null;

            // Prepare metadata
            const metadata = {
              provider: 'META',
              event: metaStatus,
              timestamp: statusObj.timestamp,
              conversationId: statusObj.conversation?.id,
              pricing: statusObj.pricing,
              recipient: statusObj.recipient_id,
              rawWebhook: statusObj,
            };

            // Update Job
            await db.notificationJob.update({
              where: { id: job.id },
              data: {
                status: mappedStatus,
                processedAt: new Date(),
                error: errorMsg,
                metadata,
                retryCount: mappedStatus === NotificationStatus.FAILED ? { increment: 1 } : undefined,
              },
            });

            // Write Log
            await db.notificationLog.create({
              data: {
                jobId: job.id,
                provider: job.provider,
                attemptNumber: job.retryCount,
                previousStatus: job.status,
                newStatus: mappedStatus,
                channel: job.channel,
                notificationType: job.notificationType,
                providerResponse: statusObj,
                errorMessage: errorMsg,
              },
            });

            console.log(
              JSON.stringify({
                timestamp: new Date().toISOString(),
                level: 'info',
                component: 'MetaWebhookService',
                message: `Successfully synchronized Meta webhook event.`,
                jobId: job.id,
                providerMessageId,
                oldStatus: job.status,
                newStatus: mappedStatus,
              })
            );
          }
        }
      }

      return { success: true };
    } catch (err: any) {
      console.error(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          level: 'error',
          component: 'MetaWebhookService',
          message: 'Error processing Meta webhook payload.',
          error: err.message || String(err),
        })
      );
      return { success: false, error: err.message || String(err) };
    }
  }
}
