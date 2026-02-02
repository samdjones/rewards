import dotenv from 'dotenv';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { generate } from 'selfsigned';
import { initDatabase } from './db/init.js';
import { createApp } from './app.js';

dotenv.config();

const PORT = process.env.PORT || 3000;
const CERT_DIR = process.env.CERT_DIR || '.';
const KEY_PATH = path.join(CERT_DIR, 'server.key');
const CERT_PATH = path.join(CERT_DIR, 'server.cert');

// Generate self-signed certificate if it doesn't exist
async function ensureCertificates() {
  if (!fs.existsSync(KEY_PATH) || !fs.existsSync(CERT_PATH)) {
    console.log('Generating self-signed certificate...');
    const attrs = [{ name: 'commonName', value: 'localhost' }];
    const notAfterDate = new Date();
    notAfterDate.setFullYear(notAfterDate.getFullYear() + 1);
    const pems = await generate(attrs, { notAfterDate });
    fs.mkdirSync(CERT_DIR, { recursive: true });
    fs.writeFileSync(KEY_PATH, pems.private);
    fs.writeFileSync(CERT_PATH, pems.cert);
    console.log('Certificate generated successfully');
  }
}

await ensureCertificates();

await initDatabase();

const app = createApp();

const options = {
  key: fs.readFileSync(KEY_PATH),
  cert: fs.readFileSync(CERT_PATH),
};

https.createServer(options, app).listen(PORT, () => {
  console.log(`Server running on https://localhost:${PORT}`);
});
