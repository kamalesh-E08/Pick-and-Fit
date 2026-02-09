#!/usr/bin/env ts-node

import fs from "fs";
import path from "path";
import { getMongoClient } from "@/lib/mongodb";

async function main() {
  const file = path.join(process.cwd(), ".data", "events.json");
  if (!fs.existsSync(file)) {
    console.log("No events file found at .data/events.json");
    return;
  }

  const raw = JSON.parse(fs.readFileSync(file, "utf-8"));
  if (!Array.isArray(raw)) {
    console.error("Unexpected format");
    return;
  }

  const client = await getMongoClient();
  if (!client) {
    console.error("MongoDB not configured (set MONGODB_URI)");
    return;
  }

  const db = client.db(process.env.MONGODB_DB_NAME || "pickfit");
  const col = db.collection("events");

  for (const ev of raw) {
    try {
      await col.insertOne({ ...ev, migratedAt: new Date() });
    } catch (e) {
      console.error("Failed to insert", e);
    }
  }

  console.log("Migration complete");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
