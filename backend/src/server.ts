import { createApp } from './app';
import { connectDB } from './config/db';
import { env } from './config/env';

async function main(): Promise<void> {
  console.log(`[boot] connecting to MongoDB: ${env.mongoUri}`);
  try {
    await connectDB();
  } catch (err) {
    console.error(
      '[fatal] could not connect to MongoDB. Is mongod running?\n',
      err,
    );
    process.exit(1);
  }
  const app = createApp();
  app.listen(env.port, () => {
    console.log(`[api] listening on http://localhost:${env.port}`);
  });
}

main().catch((err) => {
  console.error('[fatal]', err);
  process.exit(1);
});
