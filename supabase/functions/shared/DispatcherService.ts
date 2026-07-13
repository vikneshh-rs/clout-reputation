import { NotificationProviderFactory } from "./dispatcher.ts";
import { NotificationRenderer } from "./NotificationRenderer.ts";

export class DispatcherService {
  static async dispatch(
    sql: any,
    notificationJobId: string
  ): Promise<{ success: boolean; error?: string; job?: any }> {
    try {
      const startTime = Date.now();

      // 1. Fetch check to see if the job exists (for 404 validation)
      const checkJobs = await sql`
        SELECT * FROM "NotificationJob"
        WHERE "id" = ${notificationJobId}
        LIMIT 1;
      `;

      if (checkJobs.length === 0) {
        return { success: false, error: "NOT_FOUND" };
      }

      const checkJob = checkJobs[0];

      // 2. Concurrency Safety: Atomic status transition from PENDING to PROCESSING
      const updated = await sql`
        UPDATE "NotificationJob"
        SET "status" = 'PROCESSING', "updatedAt" = NOW()
        WHERE "id" = ${notificationJobId} AND "status" = 'PENDING'
        RETURNING *;
      `;

      // If count is 0, the job was already claimed or processed. Exit safely (Idempotency).
      if (updated.length === 0) {
        console.log(`[DispatcherService] Idempotency bypass: Job ${notificationJobId} already claimed.`);
        return { success: true };
      }

      const job = updated[0];
      const attemptNum = job.retryCount + 1;

      // Log processing transition to NotificationLog
      await sql`
        INSERT INTO "NotificationLog" (
          "id", "jobId", "provider", "attemptNumber",
          "previousStatus", "newStatus", "providerResponse", "errorMessage", "timestamp",
          "channel", "notificationType", "processingDuration"
        ) VALUES (
          gen_random_uuid(), ${job.id}, ${job.provider}, ${attemptNum},
          'PENDING', 'PROCESSING', NULL, NULL, NOW(),
          ${job.channel}, ${job.notificationType}, NULL
        );
      `;

      try {
        // 3. Resolve Provider and Render message
        const provider = NotificationProviderFactory.getProvider(job.provider);
        const message = NotificationRenderer.render(job);

        // Standardized Deno MetaProvider.send takes (recipient, messageBody)
        // Let's resolve the text content generically
        let bodyContent = "";
        if (message.text) {
          bodyContent = message.text.body;
        } else if (message.template) {
          const params = message.template.components?.[0]?.parameters || [];
          bodyContent = `Template: ${message.template.name}. Params: ${params.map((p: any) => p.text).join(", ")}`;
        }

        // 4. Send with 10-second timeout handling
        const sendPromise = provider.send(message.recipient, bodyContent);
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("TIMEOUT")), 10000)
        );

        const sendResult = await Promise.race([sendPromise, timeoutPromise]);

        const latency = Date.now() - startTime;

        // 5. Handle outcomes
        if (sendResult.success) {
          const metadata = {
            provider: job.provider,
            latency,
            httpStatus: 200,
            attempt: attemptNum,
            dispatcherVersion: "v1",
          };

          const finalJobs = await sql`
            UPDATE "NotificationJob"
            SET "status" = 'SENT',
                "providerMessageId" = ${sendResult.messageId || null},
                "processedAt" = NOW(),
                "metadata" = ${JSON.stringify(metadata)},
                "updatedAt" = NOW()
            WHERE "id" = ${job.id}
            RETURNING *;
          `;

          // Write success log to NotificationLog
          await sql`
            INSERT INTO "NotificationLog" (
              "id", "jobId", "provider", "attemptNumber",
              "previousStatus", "newStatus", "providerResponse", "errorMessage", "timestamp",
              "channel", "notificationType", "processingDuration"
            ) VALUES (
              gen_random_uuid(), ${job.id}, ${job.provider}, ${attemptNum},
              'PROCESSING', 'SENT', ${JSON.stringify(sendResult.rawResponse || null)}, NULL, NOW(),
              ${job.channel}, ${job.notificationType}, ${latency}
            );
          `;

          return { success: true, job: finalJobs[0] };
        } else {
          throw new Error(sendResult.error || "Provider delivery failed");
        }
      } catch (err: any) {
        const latency = Date.now() - startTime;
        const errorMsg = err.message || String(err);

        const metadata = {
          provider: job.provider,
          latency,
          httpStatus: errorMsg.includes("TIMEOUT") ? 408 : 500,
          attempt: attemptNum,
          dispatcherVersion: "v1",
          error: errorMsg,
        };

        const finalJobs = await sql`
          UPDATE "NotificationJob"
          SET "status" = 'FAILED',
              "error" = ${errorMsg},
              "retryCount" = ${attemptNum},
              "processedAt" = NOW(),
              "metadata" = ${JSON.stringify(metadata)},
              "updatedAt" = NOW()
          WHERE "id" = ${job.id}
          RETURNING *;
        `;

        // Write failure log to NotificationLog
        await sql`
          INSERT INTO "NotificationLog" (
            "id", "jobId", "provider", "attemptNumber",
            "previousStatus", "newStatus", "providerResponse", "errorMessage", "timestamp",
            "channel", "notificationType", "processingDuration"
          ) VALUES (
            gen_random_uuid(), ${job.id}, ${job.provider}, ${attemptNum},
            'PROCESSING', 'FAILED', NULL, ${errorMsg}, NOW(),
            ${job.channel}, ${job.notificationType}, ${latency}
          );
        `;

        return { success: false, error: errorMsg, job: finalJobs[0] };
      }
    } catch (globalError: any) {
      console.error(`[DispatcherService] Global exception: ${globalError.message}`);
      return { success: false, error: globalError.message || String(globalError) };
    }
  }
}
