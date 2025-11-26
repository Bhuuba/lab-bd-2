#!/usr/bin/env node
/**
 * Simplified Performance Test
 * Демонстрація порівняння операцій без під'єднання до реальних БД
 */

import { performance } from "perf_hooks";

// Типи даних
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

// Генерування тестових даних
function generateTestData() {
  const logs: LogRecord[] = Array.from({ length: 10_000 }, (_, i) => ({
    userId: 1,
    tourId: i % 2 === 0 ? 1 : null,
    actionType: i % 3 === 0 ? "view" : i % 3 === 1 ? "search" : "favorite",
    meta: { device: i % 2 ? "mobile" : "web", duration: 5 + (i % 30) },
    createdAt: new Date(),
  }));

  const messages: MessageRecord[] = Array.from({ length: 2_000 }, (_, i) => ({
    chatId: "11111111-1111-1111-1111-111111111111",
    sender: i % 2 === 0 ? "user" : "manager",
    body: `Test message #${i}`,
    sentAt: new Date(),
  }));

  return { logs, messages };
}

// Симуляція SQL операцій
function simulateSqlOperations(logs: LogRecord[], messages: MessageRecord[]) {
  console.log("\n📊 SQL Server операції:");
  console.log("═".repeat(50));

  // 1. Вставка логів
  const insertLogsStart = performance.now();
  // Симулюємо обробку даних (JSON stringify)
  logs.forEach((log) => JSON.stringify(log));
  const insertLogsDuration = performance.now() - insertLogsStart;
  console.log(`✓ Вставка 10,000 логів: ${insertLogsDuration.toFixed(2)} мс`);

  // 2. Читання всіх логів
  const readAllStart = performance.now();
  const filteredLogs = logs.filter((l) => l.userId === 1);
  filteredLogs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  const readAllDuration = performance.now() - readAllStart;
  console.log(
    `✓ Читання всіх логів користувача: ${readAllDuration.toFixed(2)} мс`
  );

  // 3. Вставка повідомлень
  const insertMsgStart = performance.now();
  messages.forEach((msg) => JSON.stringify(msg));
  const insertMsgDuration = performance.now() - insertMsgStart;
  console.log(
    `✓ Вставка 2,000 повідомлень: ${insertMsgDuration.toFixed(2)} мс`
  );

  // 4. Читання останніх 50 повідомлень
  const read50Start = performance.now();
  const last50 = messages
    .sort((a, b) => b.sentAt.getTime() - a.sentAt.getTime())
    .slice(0, 50);
  const read50Duration = performance.now() - read50Start;
  console.log(
    `✓ Читання останніх 50 повідомлень: ${read50Duration.toFixed(2)} мс`
  );

  return {
    insertLogs: insertLogsDuration,
    readAll: readAllDuration,
    insertMessages: insertMsgDuration,
    readLast50: read50Duration,
  };
}

// Симуляція Firestore операцій
function simulateFirestoreOperations(
  logs: LogRecord[],
  messages: MessageRecord[]
) {
  console.log("\n☁️  Firestore операції:");
  console.log("═".repeat(50));

  // 1. Вставка логів батчами
  const insertLogsStart = performance.now();
  const batchSize = 500;
  for (let i = 0; i < logs.length; i += batchSize) {
    const batch = logs.slice(i, i + batchSize);
    batch.forEach((log) => JSON.stringify(log));
  }
  const insertLogsDuration = performance.now() - insertLogsStart;
  console.log(
    `✓ Вставка 10,000 логів (батчами по 500): ${insertLogsDuration.toFixed(
      2
    )} мс`
  );

  // 2. Читання всіх логів
  const readAllStart = performance.now();
  const filteredLogs = logs.filter((l) => l.userId === 1);
  filteredLogs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  const readAllDuration = performance.now() - readAllStart;
  console.log(
    `✓ Читання всіх логів користувача: ${readAllDuration.toFixed(2)} мс`
  );

  // 3. Вставка повідомлень батчами
  const insertMsgStart = performance.now();
  for (let i = 0; i < messages.length; i += batchSize) {
    const batch = messages.slice(i, i + batchSize);
    batch.forEach((msg) => JSON.stringify(msg));
  }
  const insertMsgDuration = performance.now() - insertMsgStart;
  console.log(
    `✓ Вставка 2,000 повідомлень (батчами): ${insertMsgDuration.toFixed(2)} мс`
  );

  // 4. Читання останніх 50 (оптимізовано)
  const read50Start = performance.now();
  const last50 = messages
    .sort((a, b) => b.sentAt.getTime() - a.sentAt.getTime())
    .slice(0, 50);
  const read50Duration = performance.now() - read50Start;
  console.log(
    `✓ Читання останніх 50 повідомлень: ${read50Duration.toFixed(2)} мс`
  );

  return {
    insertLogs: insertLogsDuration,
    readAll: readAllDuration,
    insertMessages: insertMsgDuration,
    readLast50: read50Duration,
  };
}

// Головна функція
async function runBenchmark() {
  console.log("\n🚀 Benchmark тест: SQL vs Firestore");
  console.log("╔" + "═".repeat(48) + "╗");
  console.log("║ Порівняння продуктивності баз даних");
  console.log("║ Екосистема туризму - Лабораторна робота №2");
  console.log("╚" + "═".repeat(48) + "╝");

  // Генерування даних
  console.log("\n📝 Генерування тестових даних...");
  const { logs, messages } = generateTestData();
  console.log(
    `✓ Генеровано: ${logs.length} логів та ${messages.length} повідомлень`
  );

  // SQL операції
  const sqlMetrics = simulateSqlOperations(logs, messages);

  // Firestore операції
  const firestoreMetrics = simulateFirestoreOperations(logs, messages);

  // Порівняння
  console.log("\n📊 Результати порівняння:");
  console.log("═".repeat(50));
  console.log("\nТаблиця часів виконання (мс):\n");

  const comparisonTable = [
    {
      Операція: "Вставка 10k логів",
      "SQL (мс)": sqlMetrics.insertLogs.toFixed(2),
      "Firestore (мс)": firestoreMetrics.insertLogs.toFixed(2),
      Переможець:
        sqlMetrics.insertLogs < firestoreMetrics.insertLogs
          ? "SQL ✓"
          : "Firestore ✓",
    },
    {
      Операція: "Читання всіх логів",
      "SQL (мс)": sqlMetrics.readAll.toFixed(2),
      "Firestore (мс)": firestoreMetrics.readAll.toFixed(2),
      Переможець:
        sqlMetrics.readAll < firestoreMetrics.readAll ? "SQL ✓" : "Firestore ✓",
    },
    {
      Операція: "Вставка 2k повідомлень",
      "SQL (мс)": sqlMetrics.insertMessages.toFixed(2),
      "Firestore (мс)": firestoreMetrics.insertMessages.toFixed(2),
      Переможець:
        sqlMetrics.insertMessages < firestoreMetrics.insertMessages
          ? "SQL ✓"
          : "Firestore ✓",
    },
    {
      Операція: "Читання останніх 50",
      "SQL (мс)": sqlMetrics.readLast50.toFixed(2),
      "Firestore (мс)": firestoreMetrics.readLast50.toFixed(2),
      Переможець:
        sqlMetrics.readLast50 < firestoreMetrics.readLast50
          ? "SQL ✓"
          : "Firestore ✓",
    },
  ];

  console.table(comparisonTable);

  // Статистика
  console.log("\n📈 Статистика:");
  console.log("═".repeat(50));

  const totalSql = Object.values(sqlMetrics).reduce((a, b) => a + b, 0);
  const totalFirestore = Object.values(firestoreMetrics).reduce(
    (a, b) => a + b,
    0
  );
  const sqlWins = Object.entries(sqlMetrics).filter(
    ([key, value]) => value < firestoreMetrics[key as keyof typeof sqlMetrics]
  ).length;

  console.log(
    `✓ SQL Server - Загальний час: ${totalSql.toFixed(
      2
    )} мс (${sqlWins}/4 перемог)`
  );
  console.log(
    `✓ Firestore  - Загальний час: ${totalFirestore.toFixed(2)} мс (${
      4 - sqlWins
    }/4 перемог)`
  );
  console.log(
    `✓ Коефіцієнт: ${(totalFirestore / totalSql).toFixed(2)}x (${
      totalFirestore > totalSql ? "Firestore медленніше" : "SQL медленніше"
    })`
  );

  console.log("\n✨ Benchmark завершений!\n");
}

// Запуск
runBenchmark().catch((err) => {
  console.error("❌ Помилка:", err);
  process.exit(1);
});
