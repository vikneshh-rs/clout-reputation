import fs from 'fs';
import path from 'path';

// Load .env manually before importing anything else
const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const firstEqual = trimmed.indexOf('=');
    if (firstEqual === -1) continue;
    const key = trimmed.slice(0, firstEqual).trim();
    let val = trimmed.slice(firstEqual + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    process.env[key] = val;
  }
}

// Use relative import path to guarantee resolution in standalone CLI runs
async function main() {
  const { MetaProvider } = await import("../src/lib/notifications");

  const provider = new MetaProvider();

  const result = await provider.sendText(
    "919092334499", // Your verified test number
    "✅ Babe, I Love You !"
  );

  console.log(result);
}

main().catch(console.error);
