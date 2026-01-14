import dotenv from "dotenv";
import { createApp } from "./app";
import { initDb } from "./db/init";

dotenv.config();

const port = Number(process.env.PORT ?? "3000");

async function start() {
  await initDb();

  const app = createApp();
  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
}

start().catch((err) => {
  console.error("Failed to start server", err);
  process.exit(1);
});
