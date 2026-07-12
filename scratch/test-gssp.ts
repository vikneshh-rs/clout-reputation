import { getServerSideProps } from '../src/pages/r/[slug]';
import { GetServerSidePropsContext } from 'next';

async function main() {
  const context = {
    params: { slug: 'cqr-S001' },
    req: { headers: { 'user-agent': 'test-agent' } }
  } as unknown as GetServerSidePropsContext;

  console.log("Running getServerSideProps for cqr-S001...");
  try {
    const res = await getServerSideProps(context);
    console.log("Result:", JSON.stringify(res, null, 2));
  } catch (err) {
    console.error("Error in getServerSideProps:", err);
  }
}

main().catch(console.error);
