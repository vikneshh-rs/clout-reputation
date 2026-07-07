/**
 * Template formatting for daily summary reports.
 */
export function formatDailySummary(payload: any): string {
  return `📊 *Daily Performance Summary for ${payload.businessName}*\n\n` +
         `*Total Reviews:* ${payload.totalReviews}\n` +
         `*Average Rating:* ${payload.averageRating.toFixed(1)}/5\n` +
         `*Negative Reviews:* ${payload.negativeCount}\n` +
         `*Positive Reviews:* ${payload.positiveCount}`;
}
