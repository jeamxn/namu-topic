import { type Db, MongoClient } from "mongodb";
import log from "./logger";

const MONGODB_URI = Bun.env.MONGODB_URI || "mongodb://mongodb:27017";
const DB_NAME = "namu_topic";

let client: MongoClient | null = null;
let db: Db | null = null;

export const connectDB = async (): Promise<Db> => {
  if (db) return db;

  client = new MongoClient(MONGODB_URI);
  await client.connect();
  db = client.db(DB_NAME);

  log.ok("db.conn", "MongoDB 연결 성공");
  return db;
};

export const getDB = (): Db => {
  if (!db) {
    throw new Error("MongoDB가 연결되지 않았습니다. connectDB()를 먼저 호출하세요.");
  }
  return db;
};

export const closeDB = async (): Promise<void> => {
  if (client) {
    await client.close();
    client = null;
    db = null;
    log.info("db.conn", "MongoDB 연결 종료");
  }
};

export default { connectDB, getDB, closeDB };
