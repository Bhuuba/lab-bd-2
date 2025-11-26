import sql, { Table } from "mssql";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { performance } from "perf_hooks";

type LogRecord = {
  userId: number;
  tourId: number | null;
  actionType: string;
  meta: Record<string, unknown>;
  createdAt: Date;
};

type MessageRecord = {
  chatId: string;
  sender: "user" | "manager";
  body: string;
  sentAt: Date;
};

async function measureSql(
  pool: sql.ConnectionPool,
  logs: LogRecord[],
  messages: MessageRecord[]
) {
  const logTable = new Table("UserActivityLogs");
  logTable.columns.add("UserID", sql.Int, { nullable: false });
  logTable.columns.add("TourID", sql.Int, { nullable: true });
  logTable.columns.add("ActionType", sql.NVarChar(50), { nullable: false });
  logTable.columns.add("Metadata", sql.NVarChar(1000), { nullable: true });
  logTable.columns.add("CreatedAt", sql.DateTime2, { nullable: false });
  logs.forEach((log) =>
    logTable.rows.add(
      log.userId,
      log.tourId ?? 0,
      log.actionType,
      JSON.stringify(log.meta),
      log.createdAt
    )
  );

  const sqlInsertStart = performance.now();
  await pool.request().bulk(logTable);
  const sqlInsertLogs = performance.now() - sqlInsertStart;

  const sqlReadAllStart = performance.now();
  await pool
    .request()
    .input("userId", sql.Int, logs[0].userId)
    .query("SELECT * FROM UserActivityLogs WHERE UserID = @userId");
  const sqlReadAll = performance.now() - sqlReadAllStart;

  const msgTable = new Table("Messages");
  msgTable.columns.add("ConversationID", sql.UniqueIdentifier, {
    nullable: false,
  });
  msgTable.columns.add("UserID", sql.Int, { nullable: false });
  msgTable.columns.add("AgencyID", sql.Int, { nullable: false });
  msgTable.columns.add("SenderRole", sql.NVarChar(20), { nullable: false });
  msgTable.columns.add("Body", sql.NVarChar(2000), { nullable: false });
  msgTable.columns.add("SentAt", sql.DateTime2, { nullable: false });
  messages.forEach((msg) =>
    msgTable.rows.add(
      msg.chatId,
      logs[0].userId,
      1,
      msg.sender,
      msg.body,
      msg.sentAt
    )
  );

  const sqlInsertMessagesStart = performance.now();
  await pool.request().bulk(msgTable);
  const sqlInsertMessages = performance.now() - sqlInsertMessagesStart;

  const sqlRead50Start = performance.now();
  await pool
    .request()
    .input("conversationId", sql.UniqueIdentifier, messages[0].chatId).query(`
      SELECT TOP (50) * FROM Messages
      WHERE ConversationID = @conversationId
      ORDER BY SentAt DESC
    `);
  const sqlRead50 = performance.now() - sqlRead50Start;

  return { sqlInsertLogs, sqlReadAll, sqlInsertMessages, sqlRead50 };
}

async function measureFirestore(logs: LogRecord[], messages: MessageRecord[]) {
  const app = initializeApp({
    credential: cert({
      projectId: process.env.FB_PROJECT_ID!,
      clientEmail: process.env.FB_CLIENT_EMAIL!,
      privateKey: process.env.FB_PRIVATE_KEY!.replace(/\\n/g, "\n"),
    }),
  });
  const db = getFirestore(app);

  const batchSize = 500;
  const insertStart = performance.now();
  for (let i = 0; i < logs.length; i += batchSize) {
    const batch = db.batch();
    logs.slice(i, i + batchSize).forEach((log) => {
      const ref = db.collection(`users/${log.userId}/activityLogs`).doc();
      batch.set(ref, {
        actionType: log.actionType,
        tourId: log.tourId,
        metadata: log.meta,
        createdAt: log.createdAt,
      });
    });
    await batch.commit();
  }
  const firestoreInsertLogs = performance.now() - insertStart;

  const readAllStart = performance.now();
  await db.collection(`users/${logs[0].userId}/activityLogs`).get();
  const firestoreReadAll = performance.now() - readAllStart;

  const chatBatchStart = performance.now();
  for (let i = 0; i < messages.length; i += batchSize) {
    const batch = db.batch();
    messages.slice(i, i + batchSize).forEach((msg) => {
      const ref = db.collection(`chats/${msg.chatId}/messages`).doc();
      batch.set(ref, {
        sender: msg.sender,
        body: msg.body,
        sentAt: msg.sentAt,
      });
    });
    await batch.commit();
  }
  const firestoreInsertMessages = performance.now() - chatBatchStart;

  const read50Start = performance.now();
  await db
    .collection(`chats/${messages[0].chatId}/messages`)
    .orderBy("sentAt", "desc")
    .limit(50)
    .get();
  const firestoreRead50 = performance.now() - read50Start;

  return {
    firestoreInsertLogs,
    firestoreReadAll,
    firestoreInsertMessages,
    firestoreRead50,
  };
}

export async function runBenchmark() {
  const logs: LogRecord[] = Array.from({ length: 10_000 }, (_, i) => ({
    userId: 1,
    tourId: i % 2 === 0 ? 1 : null,
    actionType: i % 3 === 0 ? "view" : i % 3 === 1 ? "search" : "favorite",
    meta: { device: i % 2 ? "mobile" : "web", duration: 5 + (i % 30) },
    createdAt: new Date(),
  }));

  const chatId = "11111111-1111-1111-1111-111111111111";
  const messages: MessageRecord[] = Array.from({ length: 2_000 }, (_, i) => ({
    chatId,
    sender: i % 2 === 0 ? "user" : "manager",
    body: `Test message #${i}`,
    sentAt: new Date(),
  }));

  const pool = new sql.ConnectionPool(process.env.MSSQL_URL!);
  await pool.connect();
  const sqlMetrics = await measureSql(pool, logs, messages);
  const firestoreMetrics = await measureFirestore(logs, messages);

  console.table({
    sqlMetrics,
    firestoreMetrics,
  });

  await pool.close();
}

if (require.main === module) {
  runBenchmark()
    .then(() => {
      console.log("Benchmark finished");
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
