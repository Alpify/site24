import dotenv from "dotenv";
import { defineConfig } from "drizzle-kit";

// .env.local must win over a stale `export DATABASE_URL=...` in the shell.
dotenv.config({ path: ".env.local", override: true });
dotenv.config({ override: true });

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
});
