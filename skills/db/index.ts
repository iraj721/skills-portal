import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as schema from "./schema"

const connectionString = process.env.DATABASE_URL!

// IMPORTANT: Add max connections limit to avoid pool exhaustion
const client = postgres(connectionString, {
  prepare: false,
  max: 5,              // Maximum 5 connections in pool (Supabase limit is 15 total)
  idle_timeout: 20,    // Close idle connections after 20 seconds
  connect_timeout: 10, // Connection timeout
})

export const db = drizzle(client, { schema })