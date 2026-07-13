import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import postgres from "https://deno.land/x/postgresjs@v3.4.4/mod.js";
import { DispatcherService } from "../shared/DispatcherService.ts";

const connectionString = Deno.env.get("DATABASE_URL");
if (!connectionString) {
  console.error("DATABASE_URL environment variable is missing.");
}

const sql = postgres(connectionString || "");

serve(async (req) => {
  // Only allow POST requests
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { notificationJobId } = body;

    // Validate existence
    if (!notificationJobId) {
      return new Response(JSON.stringify({ error: "notificationJobId is required." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(notificationJobId)) {
      return new Response(JSON.stringify({ error: "Invalid notificationJobId format. Must be a valid UUID." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Execute the dispatch service
    const result = await DispatcherService.dispatch(sql, notificationJobId);

    if (!result.success) {
      if (result.error === "NOT_FOUND") {
        return new Response(JSON.stringify({ error: "NotificationJob not found." }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: result.error }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, job: result.job }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error(`[dispatch-notification] Unhandled error:`, err);
    return new Response(JSON.stringify({ error: err.message || String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
