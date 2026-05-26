import type { ObjectId } from "mongodb";
import { getDB } from "./mongodb";
import type { CrawlSessionDocument } from "./types";
import log from "./logger";

const COLLECTION_NAME = "crawl_sessions";

export const saveCrawlSession = async (): Promise<ObjectId> => {
  const db = getDB();
  const collection = db.collection<CrawlSessionDocument>(COLLECTION_NAME);

  const document: CrawlSessionDocument = {
    createdAt: new Date(),
    done: false,
  };

  const result = await collection.insertOne(document);
  log.ok("db", `crawl_sessions 저장 완료 (세션 ID: ${result.insertedId})`);

  return result.insertedId;
};

export const updateCrawlSessionDone = async (sessionId: ObjectId): Promise<void> => {
  const db = getDB();
  const collection = db.collection<CrawlSessionDocument>(COLLECTION_NAME);

  await collection.updateOne({ _id: sessionId }, { $set: { done: true } });
  log.ok("db", `crawl_sessions 완료 처리 (세션 ID: ${sessionId})`);
};

export default saveCrawlSession;

