import './env';

async function run() {
  const accessToken = process.env.META_ACCESS_TOKEN?.trim();

  if (!accessToken) {
    console.error('Missing META_ACCESS_TOKEN in env.');
    return;
  }

  // 1. Inspect Token
  console.log('Inspecting Access Token...');
  try {
    const debugUrl = `https://graph.facebook.com/debug_token?input_token=${accessToken}&access_token=${accessToken}`;
    const res = await fetch(debugUrl);
    const data: any = await res.json();
    console.log('TOKEN DEBUG INFO:', JSON.stringify(data, null, 2));
  } catch (err: any) {
    console.error('Failed to debug token:', err.message);
  }

  // 2. Fetch associated WhatsApp Business Accounts
  console.log('\nFetching associated WhatsApp Business Accounts...');
  try {
    const wabaUrl = `https://graph.facebook.com/v20.0/me/whatsapp_business_accounts`;
    const res = await fetch(wabaUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });
    const data: any = await res.json();
    console.log('WABA ACCOUNTS:', JSON.stringify(data, null, 2));
  } catch (err: any) {
    console.error('Failed to fetch WABA accounts:', err.message);
  }
}

run();
