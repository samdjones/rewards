import dotenv from 'dotenv';
import { initDatabase } from './db/init.js';
import { createApp } from './app.js';

dotenv.config();

const PORT = process.env.PORT || 3000;

await initDatabase();

const app = createApp();

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
