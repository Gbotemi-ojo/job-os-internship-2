import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";
import pg, { Pool } from "pg";
import "dotenv/config"
const dbCredentials={
    host: process.env.DB_HOST,
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : undefined,
    database: process.env.DB_NAME,
    dialect: process.env.DB_DIALECT,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    ssl:process.env.DB_SSL=="true"?true:false,
    Pool_mode : "session",
}

const client = new pg.Client(dbCredentials)

async function connectAndInitialize() {
    await client.connect()
    const db = drizzle(client, { schema, logger: true })
    return db
}

const db = connectAndInitialize()
export default db