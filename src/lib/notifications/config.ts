const isServer = typeof window === 'undefined';

export const META_CONFIG = {
  accessToken: process.env.META_ACCESS_TOKEN || '',
  phoneNumberId: process.env.META_PHONE_NUMBER_ID || '',
  wabaId: process.env.META_WABA_ID || '',
  verifyToken: process.env.META_VERIFY_TOKEN || '',
};

export function validateMetaConfig() {
  if (!isServer) return;

  const missing: string[] = [];
  if (!META_CONFIG.accessToken) missing.push('META_ACCESS_TOKEN');
  if (!META_CONFIG.phoneNumberId) missing.push('META_PHONE_NUMBER_ID');
  if (!META_CONFIG.wabaId) missing.push('META_WABA_ID');
  if (!META_CONFIG.verifyToken) missing.push('META_VERIFY_TOKEN');

  if (missing.length > 0) {
    // If we're during build time in CI/Next.js build, we might want to check if standard build env vars are present to avoid blocking build,
    // but the prompt explicitly requests "fail fast if any are missing".
    // We will throw an error to strictly follow the requirement.
    throw new Error(
      `[MetaProvider Config Error] Missing required environment variables: ${missing.join(', ')}`
    );
  }
}

// Fail fast on startup
if (isServer) {
  validateMetaConfig();
}
