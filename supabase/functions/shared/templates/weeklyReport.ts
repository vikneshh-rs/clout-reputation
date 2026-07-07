/**
 * Template formatting for weekly performance reports.
 */
export function formatWeeklyReport(payload: any): string {
  return `📈 *Weekly Performance Report for ${payload.businessName}*\n\n` +
         `*Total Reviews:* ${payload.totalReviews}\n` +
         `*Average Rating:* ${payload.averageRating.toFixed(1)}/5\n` +
         `*New Customers:* ${payload.newCustomerCount}`;
}
