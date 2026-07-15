import net from 'net';

function testPort(host: string, port: number) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(3000);
    socket.on('connect', () => {
      console.log(`Connection to ${host}:${port} succeeded!`);
      socket.destroy();
      resolve(true);
    });
    socket.on('timeout', () => {
      console.log(`Connection to ${host}:${port} timed out.`);
      socket.destroy();
      resolve(false);
    });
    socket.on('error', (err) => {
      console.log(`Connection to ${host}:${port} failed:`, err.message);
      socket.destroy();
      resolve(false);
    });
    socket.connect(port, host);
  });
}

async function run() {
  await testPort('aws-1-ap-northeast-1.pooler.supabase.com', 5432);
  await testPort('aws-1-ap-northeast-1.pooler.supabase.com', 6543);
  await testPort('graph.facebook.com', 443);
}

run();
