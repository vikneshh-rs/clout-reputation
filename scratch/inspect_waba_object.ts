import './env';

async function run() {
  const wabaId = process.env.META_WABA_ID?.trim();
  const accessToken = process.env.META_ACCESS_TOKEN?.trim();

  if (!wabaId || !accessToken) {
    console.error('Missing META_WABA_ID or META_ACCESS_TOKEN in env.');
    return;
  }

  const url = `https://graph.facebook.com/v20.0/${wabaId}`;
  console.log(`Fetching object metadata from Meta for ID: ${wabaId}...`);
  try {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    const data: any = await res.json();
    console.log('OBJECT DETAILS:', JSON.stringify(data, null, 2));
  } catch (err: any) {
    console.error('Failed to fetch object metadata:', err.message);
  }
}

run();
