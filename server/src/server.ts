import dotenv from 'dotenv';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { generate } from 'selfsigned';
import { initDatabase } from './db/init.js';
import { createApp } from './app.js';
import { refreshBusData, refreshBusDataIfStale } from './utils/busIngest.js';

dotenv.config();

const PORT = process.env.PORT || 3000;
const BUS_REFRESH_INTERVAL_HOURS = Number(process.env.BUS_REFRESH_INTERVAL_HOURS) || 24;
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

    // Extra hostnames (e.g. Tailscale machine name) via SERVER_HOSTNAMES=host1,host2
    const extraHosts = (process.env.SERVER_HOSTNAMES || '')
      .split(',')
      .map((h) => h.trim())
      .filter(Boolean);
    const altNames = [
      { type: 2, value: 'localhost' },
      { type: 7, ip: '127.0.0.1' },
      ...extraHosts.map((h) => ({ type: 2, value: h })),
    ];
    const extensions = [{ name: 'subjectAltName', altNames }];

    const pems = await generate(attrs, { notAfterDate, extensions });
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

// Build/refresh the bus timetable index in the background. Runs once on
// startup if the local index is stale, then on a fixed interval. Failures are
// logged but never crash the server.
refreshBusDataIfStale().catch((err) => console.error('Initial bus refresh failed:', err));
setInterval(
  () => {
    refreshBusData().catch((err) => console.error('Scheduled bus refresh failed:', err));
  },
  BUS_REFRESH_INTERVAL_HOURS * 60 * 60 * 1000
).unref();
