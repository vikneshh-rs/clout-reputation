import './env';

async function run() {
  const phoneId = process.env.META_PHONE_NUMBER_ID?.trim();
  const accessToken = process.env.META_ACCESS_TOKEN?.trim();

  if (!phoneId || !accessToken) {
    console.error('Missing META_PHONE_NUMBER_ID or META_ACCESS_TOKEN in env.');
    return;
  }

  const url = `https://graph.facebook.com/v20.0/${phoneId}`;
  console.log(`Fetching Phone Number ID: ${phoneId}...`);
  try {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    const data: any = await res.json();
    console.log('PHONE DETAILS:', JSON.stringify(data, null, 2));

    const wabaId = data.whatsapp_business_account?.id;
    if (wabaId) {
      console.log(`\nFound real WABA ID: ${wabaId}`);
      console.log('Now listing templates for this WABA...');
      const templatesUrl = `https://graph.facebook.com/v20.0/${wabaId}/message_templates`;
      const tRes = await fetch(templatesUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });
      const tData: any = await tRes.json();
      console.log('TEMPLATES LIST FROM META:');
      tData.data.forEach((template: any) => {
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
    }
  } catch (err: any) {
    console.error('Failed:', err.message);
  }
}

run();
