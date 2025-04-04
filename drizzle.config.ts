import { defineConfig } from 'drizzle-kit';
import "dotenv/config";

export default defineConfig({
  schema: './db/schema.ts',
  out: './db/migration',
  dialect: 'postgresql',
  // driver: "pg",
  dbCredentials: {
    host: process.env.DB_HOST as string,
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : undefined,
    database: process.env.DB_NAME as string,
    user: process.env.DB_USER as string,
    password: process.env.DB_PASS as string,
    ssl : process.env.DB_SSL=="true"?true:false,
  },
  verbose:true,
  strict:true
});
