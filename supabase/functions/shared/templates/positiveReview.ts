/**
 * Template formatting for positive reviews.
 */
export function formatPositiveReview(payload: any): string {
  return `✨ *New Positive Review for ${payload.businessName}*\n\n` +
         `*Rating:* ${payload.rating}/5 stars\n` +
         `*Customer:* ${payload.customerName}\n` +
         `*Comment:* "${payload.comment || 'No comment'}"`;
}
