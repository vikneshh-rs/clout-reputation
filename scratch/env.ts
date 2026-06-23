import fs from 'fs';
import path from 'path';

export function loadEnv() {
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      envContent.split(/\r?\n/).forEach(line => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) return;
        
        const match = trimmed.match(/^([\w.-]+)\s*=\s*(.*)?\s*$/);
        if (match) {
          const key = match[1];
          let value = match[2] || '';
          if (value.startsWith('"') && value.endsWith('"')) {
            value = value.substring(1, value.length - 1);
          } else if (value.startsWith("'") && value.endsWith("'")) {
            value = value.substring(1, value.length - 1);
          }
          process.env[key] = value;
        }
      });
    }
  } catch (err) {
    console.error('Failed to load .env', err);
  }
}

// Execute immediately when imported
loadEnv();
