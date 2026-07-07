import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import postgres from "https://deno.land/x/postgresjs@v3.4.4/mod.js";
import { resolveProvider, resolveTemplate } from "../shared/dispatcher.ts";

const connectionString = Deno.env.get("DATABASE_URL");

if (!connectionString) {
  console.error("DATABASE_URL environment variable is missing.");
}

const sql = postgres(connectionString || "");

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // 1. Fetch pending/failed jobs due for dispatch
    const jobs = await sql`
      SELECT * FROM "NotificationJob"
      WHERE "status" IN ('PENDING', 'FAILED')
        AND "retryCount" < 3
        AND ("scheduledFor" IS NULL OR "scheduledFor" <= NOW())
      ORDER BY "createdAt" ASC
      LIMIT 20;
    `;

    console.log(`[send-notifications] Found ${jobs.length} jobs to process.`);
    const processedJobs = [];

    // 2. Process each job sequentially
    for (const job of jobs) {
      const startTime = performance.now();
      const startStatus = job.status;
      const attemptNum = job.retryCount + 1;

      console.log(`[send-notifications] Processing Job ${job.id} (Attempt ${attemptNum})...`);

      // Update startedAt, increment retryCount and status to PROCESSING
      await sql`
        UPDATE "NotificationJob"
        SET "status" = 'PROCESSING',
            "retryCount" = ${attemptNum},
            "startedAt" = NOW(),
            "updatedAt" = NOW()
        WHERE "id" = ${job.id};
      `;

      try {
        // Resolve templates and providers via dispatcher
        const messageText = resolveTemplate(job.eventType, job.payload);
        const providerInstance = resolveProvider(job.provider);

        // Send the notification
        const sendResult = await providerInstance.send(job.recipient, messageText);

        const endTime = performance.now();
        const durationMs = Math.round(endTime - startTime);

        if (sendResult.success) {
          // Update job to SENT with metrics
          await sql`
            UPDATE "NotificationJob"
            SET "status" = 'SENT',
                "completedAt" = NOW(),
                "processedAt" = NOW(),
                "processingTimeMs" = ${durationMs},
                "providerMessageId" = ${sendResult.messageId},
                "providerStatus" = ${sendResult.rawResponse?.status || "delivered"},
                "providerResponse" = ${JSON.stringify(sendResult.rawResponse)},
                "errorMessage" = NULL,
                "updatedAt" = NOW()
            WHERE "id" = ${job.id};
          `;

          // Insert structured audit log
          await sql`
            INSERT INTO "NotificationLog" (
              "id", "jobId", "provider", "attemptNumber",
              "previousStatus", "newStatus", "providerResponse", "errorMessage", "timestamp",
              "eventType", "notificationType", "processingDuration"
            ) VALUES (
              gen_random_uuid(), ${job.id}, ${job.provider}, ${attemptNum},
              ${startStatus}, 'SENT', ${JSON.stringify(sendResult.rawResponse)}, NULL, NOW(),
              ${job.eventType}, ${job.notificationType}, ${durationMs}
            );
          `;

          console.log(`[send-notifications] Job ${job.id} dispatched successfully. Duration: ${durationMs}ms`);
          processedJobs.push({ jobId: job.id, status: "SENT", durationMs });
        } else {
          throw new Error(sendResult.error || "Provider delivery failed");
        }
      } catch (err: any) {
        const endTime = performance.now();
        const durationMs = Math.round(endTime - startTime);
        const errorMsg = err?.message || String(err);
        
        console.error(`[send-notifications] Error processing Job ${job.id}:`, errorMsg);

        const finalStatus = attemptNum >= 3 ? "PERMANENTLY_FAILED" : "FAILED";

        // Update job to FAILED/PERMANENTLY_FAILED with metrics
        await sql`
          UPDATE "NotificationJob"
          SET "status" = ${finalStatus},
              "completedAt" = NOW(),
              "processingTimeMs" = ${durationMs},
              "errorMessage" = ${errorMsg},
              "updatedAt" = NOW()
          WHERE "id" = ${job.id};
        `;

        // Insert structured failure audit log
        await sql`
          INSERT INTO "NotificationLog" (
            "id", "jobId", "provider", "attemptNumber",
            "previousStatus", "newStatus", "providerResponse", "errorMessage", "timestamp",
            "eventType", "notificationType", "processingDuration"
          ) VALUES (
            gen_random_uuid(), ${job.id}, ${job.provider}, ${attemptNum},
            ${startStatus}, ${finalStatus}, NULL, ${errorMsg}, NOW(),
            ${job.eventType}, ${job.notificationType}, ${durationMs}
          );
        `;

        processedJobs.push({ jobId: job.id, status: finalStatus, error: errorMsg, durationMs });
      }
    }

    return new Response(JSON.stringify({ success: true, processedJobs }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (globalErr: any) {
    console.error("[send-notifications] Global Execution Error:", globalErr);
    return new Response(JSON.stringify({ error: globalErr?.message || String(globalErr) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
