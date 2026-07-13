import { db } from '../../db';
import { NotificationStatus, NotificationLog } from '@prisma/client';
import { NotificationProviderFactory } from '../factories/NotificationProviderFactory';
import { NotificationRenderer } from '../renderers/NotificationRenderer';

export class DispatcherService {
  static async dispatch(
    notificationJobId: string
  ): Promise<{ success: boolean; error?: string; job?: any }> {
    try {
      const startTime = Date.now();

      console.log(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          level: 'info',
          component: 'DispatcherService',
          message: 'DispatcherService.dispatch starting',
          jobId: notificationJobId,
        })
      );

      // 1. Fetch check to see if the job exists (for 404 validation)
      const checkJob = await db.notificationJob.findUnique({
        where: { id: notificationJobId },
      });

      if (!checkJob) {
        return { success: false, error: 'NOT_FOUND' };
      }

      // 2. Concurrency Safety: Atomic status transition from PENDING to PROCESSING
      const updated = await db.notificationJob.updateMany({
        where: {
          id: notificationJobId,
          status: NotificationStatus.PENDING,
        },
        data: {
          status: NotificationStatus.PROCESSING,
        },
      });

      // If count is 0, the job was already claimed or processed. Exit safely (Idempotency).
      if (updated.count === 0) {
        console.log(
          JSON.stringify({
            timestamp: new Date().toISOString(),
            level: 'info',
            component: 'DispatcherService',
            message: 'Idempotency bypass: Job already claimed or processed.',
            jobId: notificationJobId,
          })
        );
        return { success: true };
      }

      // 3. Load the job that is now in PROCESSING state
      const job = await db.notificationJob.findUnique({
        where: { id: notificationJobId },
      });
      if (!job) {
        return { success: false, error: 'NOT_FOUND' };
      }

      // Log processing transition to NotificationLog
      await db.notificationLog.create({
        data: {
          jobId: job.id,
          provider: job.provider,
          attemptNumber: job.retryCount + 1,
          previousStatus: NotificationStatus.PENDING,
          newStatus: NotificationStatus.PROCESSING,
          channel: job.channel,
          notificationType: job.notificationType,
        },
      });

      try {
        // 4. Resolve Provider and Render independent message payload
        const provider = NotificationProviderFactory.getProvider(job.provider as any);
        const message = NotificationRenderer.render(job);

        // 5. Send with 10-second timeout handling
        const sendPromise = (async () => {
          if (message.type === 'template') {
            return provider.sendTemplate(message);
          } else if (message.type === 'interactive') {
            return provider.sendInteractiveTemplate(message);
          } else {
            return provider.sendText(message);
          }
        })();

        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('TIMEOUT')), 10000)
        );

        const sendResult = await Promise.race([sendPromise, timeoutPromise]);

        const latency = Date.now() - startTime;
        const attempt = job.retryCount + 1;

        // 6. Handle send results
        if (sendResult.success) {
          const metadata = {
            provider: job.provider,
            latency,
            httpStatus: 200,
            attempt,
            dispatcherVersion: 'v1',
          };

          const finalJob = await db.notificationJob.update({
            where: { id: job.id },
            data: {
              status: NotificationStatus.SENT,
              providerMessageId: sendResult.messageId || null,
              processedAt: new Date(),
              metadata,
            },
          });

          // Write success log to NotificationLog
          await db.notificationLog.create({
            data: {
              jobId: job.id,
              provider: job.provider,
              attemptNumber: attempt,
              previousStatus: NotificationStatus.PROCESSING,
              newStatus: NotificationStatus.SENT,
              channel: job.channel,
              notificationType: job.notificationType,
              processingDuration: latency,
              providerResponse: sendResult.error?.raw || null,
            },
          });

          console.log(
            JSON.stringify({
              timestamp: new Date().toISOString(),
              level: 'info',
              component: 'DispatcherService',
              message: 'DispatcherService.dispatch completed successfully',
              jobId: job.id,
              latency,
              attempt
            })
          );

          return { success: true, job: finalJob };
        } else {
          // Provider error
          throw new Error(sendResult.error?.message || 'Provider failed to send.');
        }
      } catch (err: any) {
        const latency = Date.now() - startTime;
        const attempt = job.retryCount + 1;
        const errorMsg = err.message || String(err);

        // Update Job to FAILED state and increment retryCount
        const finalJob = await db.notificationJob.update({
          where: { id: job.id },
          data: {
            status: NotificationStatus.FAILED,
            error: errorMsg,
            retryCount: {
              increment: 1,
            },
            processedAt: new Date(),
            metadata: {
              provider: job.provider,
              latency,
              httpStatus: errorMsg.includes('TIMEOUT') ? 408 : 500,
              attempt,
              dispatcherVersion: 'v1',
              error: errorMsg,
            },
          },
        });

        // Write failure log to NotificationLog
        await db.notificationLog.create({
          data: {
            jobId: job.id,
            provider: job.provider,
            attemptNumber: attempt,
            previousStatus: NotificationStatus.PROCESSING,
            newStatus: NotificationStatus.FAILED,
            channel: job.channel,
            notificationType: job.notificationType,
            processingDuration: latency,
            errorMessage: errorMsg,
          },
        });

        console.log(
          JSON.stringify({
            timestamp: new Date().toISOString(),
            level: 'error',
            component: 'DispatcherService',
            message: 'DispatcherService.dispatch failed',
            jobId: job.id,
            latency,
            attempt,
            error: errorMsg,
          })
        );

        return { success: false, error: errorMsg, job: finalJob };
      }
    } catch (globalError: any) {
      console.error(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          level: 'error',
          component: 'DispatcherService',
          message: 'Unhandled exception inside DispatcherService.',
          jobId: notificationJobId,
          error: globalError.message || String(globalError),
        })
      );
      return { success: false, error: globalError.message || String(globalError) };
    }
  }
}
