/**
 * Template formatting for negative reviews.
 */
export function formatNegativeReview(payload: any): string {
  const starsStr = "★".repeat(payload.rating) + "☆".repeat(5 - payload.rating);
  return `⚠️ *New Low Rating Alert for ${payload.businessName}*\n\n` +
         `*Rating:* ${payload.rating}/5 stars (${starsStr})\n` +
         `*Customer:* ${payload.customerName}\n` +
         `*Comment:* "${payload.comment || 'No comment provided'}"\n\n` +
         `👉 *Take action on dashboard:* ${payload.dashboardUrl}`;
}
