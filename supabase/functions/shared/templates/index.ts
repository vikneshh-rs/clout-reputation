import { formatNegativeReview } from "./negativeReview.ts";
import { formatPositiveReview } from "./positiveReview.ts";
import { formatDailySummary } from "./dailySummary.ts";
import { formatWeeklyReport } from "./weeklyReport.ts";

export const templates: Record<string, (payload: any) => string> = {
  NEGATIVE_REVIEW: formatNegativeReview,
  POSITIVE_REVIEW: formatPositiveReview,
  DAILY_SUMMARY: formatDailySummary,
  WEEKLY_REPORT: formatWeeklyReport,
};
