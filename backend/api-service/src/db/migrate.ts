import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { migrate } from "drizzle-orm/neon-http/migrator";
import { env } from "@/configs/env";

async function main() {
  console.log("⏳ Running migrations on Neon database...");
  const sql = neon(env.DB_URL);
  const db = drizzle(sql);
  await migrate(db, { migrationsFolder: "./drizzle" });
  console.log("✅ Migrations completed successfully!");
}

main().catch((err) => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});
