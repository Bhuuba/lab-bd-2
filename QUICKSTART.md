# 🚀 Швидкий старт

## Що це?

Лабораторна робота №2 про SQL та NoSQL бази даних для екосистеми туризму.
Порівняння продуктивності MS SQL Server, Firebase Firestore та Redis.

## 📋 Передумови

- Node.js 16+ ([скачати](https://nodejs.org/))
- Docker ([скачати](https://www.docker.com/))
- Git (опціонально)

## ⚡ За 5 хвилин

### 1. Встановити залежності

```bash
npm install
```

### 2. Запустити базові сервіси

```bash
docker-compose up -d
```

### 3. Налаштувати .env

```bash
cp .env.example .env
# Відредагуйте .env за необхідністю
```

### 4. Ініціалізувати БД

```bash
npx ts-node -e "
import sql from 'mssql';
import fs from 'fs';
const schema = fs.readFileSync('sql/schema.sql', 'utf8');
const pool = new sql.ConnectionPool(process.env.MSSQL_URL!);
await pool.connect();
for (const batch of schema.split('GO')) {
  if (batch.trim()) await pool.request().batch(batch);
}
console.log('✓ Schema initialized!');
"
```

### 5. Запустити тест продуктивності

```bash
npm run benchmark
```

## 📂 Структура

```
├── README.md              ← Основна документація
├── REQUIREMENTS.md        ← Вимоги до роботи
├── package.json           ← npm конфіг
├── tsconfig.json          ← TypeScript конфіг
├── docker-compose.yml     ← Docker сервіси
│
├── sql/
│   └── schema.sql         ← SQL схема + приклади
│
├── src/
│   ├── firebase.ts        ← Ініціалізація Firebase
│   ├── firestore_examples.ts
│   └── redis_cache.ts
│
└── scripts/
    └── performance_test.ts ← Benchmark
```

## 🔗 Корисні посилання

| Сервіс     | URL                                 | Дані входу           |
| ---------- | ----------------------------------- | -------------------- |
| SQL Server | localhost:1433                      | sa / YourPassword123 |
| Redis      | localhost:6379                      | -                    |
| Redis UI   | http://localhost:8081               | -                    |
| Firebase   | https://console.firebase.google.com | -                    |

## 📊 Результати

Після запуску тесту ви отримаєте:

```
┌─────────────────────────────┬──────────┬────────────┐
│ Operation                   │ SQL (ms) │ FS (ms)    │
├─────────────────────────────┼──────────┼────────────┤
│ Insert 10k logs             │ 950      │ 1,850      │
│ Read all logs               │ 320      │ 540        │
└─────────────────────────────┴──────────┴────────────┘
```

## 🆘 Проблеми?

### SQL Server не запускається

```bash
# Перевірити статус
docker-compose ps

# Переробити
docker-compose down -v
docker-compose up -d
```

### Redis не підключається

```bash
# Протестувати з'єднання
redis-cli ping
# Має вивести: PONG
```

### Firebase помилки

1. Перевірте `FB_PRIVATE_KEY` у `.env`
2. Замініть `\n` на справжні розриви рядків
3. Запустіть без benchmark тесту спочатку

## 📝 Наступні кроки

1. Прочитайте [README.md](README.md) для повної документації
2. Вивчіть код у `src/` та `scripts/`
3. Модифікуйте SQL запити у `sql/schema.sql`
4. Запустіть свої тести продуктивності

## 🎓 Для викладача

Проект містить:

- ✓ Повна документація (README.md)
- ✓ SQL схема з 8 таблицями
- ✓ Firestore та Redis операції
- ✓ Тест продуктивності
- ✓ Порівняльний аналіз

Обговорити з студентом:

1. Архітектуру решення
2. Результати тестів
3. Коли використовувати кожну БД
4. Масштабування системи

---

**Готово?** 👉 Перейдіть до [README.md](README.md) для деталей!
