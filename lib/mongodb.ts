import { MongoClient, Db, Collection } from "mongodb";

const uri = process.env.MONGODB_URI || "";
const dbName = process.env.MONGODB_DB_NAME || "pickfit";

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export async function getMongoClient(): Promise<MongoClient | null> {
  if (!uri) return null;
  if (cachedClient) return cachedClient;
  const client = new MongoClient(uri);
  await client.connect();
  cachedClient = client;
  cachedDb = client.db(dbName);
  return client;
}

export async function getDb(): Promise<Db | null> {
  if (cachedDb) return cachedDb;
  const client = await getMongoClient();
  return client ? client.db(dbName) : null;
}

export async function getEventsCollection(): Promise<Collection | null> {
  const db = await getDb();
  if (!db) return null;
  return db.collection("events");
}

export async function insertEvent(event: any) {
  const col = await getEventsCollection();
  if (!col) throw new Error("MongoDB not configured");
  return col.insertOne(event);
}

export async function findEvents(filter: any = {}): Promise<any[]> {
  const col = await getEventsCollection();
  if (!col) return [];
  return col.find(filter).toArray();
}
