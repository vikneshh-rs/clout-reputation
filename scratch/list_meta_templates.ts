import './env';

async function run() {
  const wabaId = process.env.META_WABA_ID?.trim();
  const accessToken = process.env.META_ACCESS_TOKEN?.trim();

  if (!wabaId || !accessToken) {
    console.error('Missing META_WABA_ID or META_ACCESS_TOKEN in env.');
    return;
  }

  const url = `https://graph.facebook.com/v20.0/${wabaId}/message_templates`;
  console.log(`Fetching templates from Meta for WABA ID: ${wabaId}...`);
  try {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`HTTP ${res.status}: ${errText}`);
    }

    const data: any = await res.json();

    console.log('TEMPLATES LIST FROM META:');
    data.data.forEach((template: any) => {
      console.log(`- Name: ${template.name}`);
      console.log(`  Language: ${template.language}`);
      console.log(`  Status: ${template.status}`);
      console.log(`  Category: ${template.category}`);
      template.components.forEach((comp: any) => {
        if (comp.type === 'BODY') {
          console.log(`  Body text: ${comp.text}`);
        }
      });
      console.log('------------------------------');
    });
  } catch (err: any) {
    console.error('Failed to fetch templates:', err.message);
  }
}

run();
