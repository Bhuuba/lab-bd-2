import sql from "mssql";
import { createClient } from "redis";

const redis = createClient();

export async function initRedis() {
  if (!redis.isOpen) {
    await redis.connect();
  }
}

export async function cachePopularTours(pool: sql.ConnectionPool) {
  const result = await pool.request().query(`
    SELECT TOP (10)
      t.TourID,
      t.Title,
      t.Price,
      COUNT(b.BookingID) AS bookings
    FROM Tours t
    LEFT JOIN Bookings b ON b.TourID = t.TourID
    GROUP BY t.TourID, t.Title, t.Price
    ORDER BY bookings DESC;
  `);

  const pipeline = redis.multi();
  pipeline.del("tour:popular");

  result.recordset.forEach(row => {
    const key = `tour:${row.TourID}`;
    const score = row.bookings ?? 0;
    pipeline.hSet(key, {
      id: row.TourID.toString(),
      title: row.Title,
      price: row.Price.toString()
    });
    pipeline.zAdd("tour:popular", [{ score, value: key }]);
  });

  await pipeline.exec();
}

export async function getPopularToursFromCache() {
  const keys = await redis.zRange("tour:popular", -10, -1, { REV: true });
  const tours = [];

  for (const key of keys) {
    tours.push(await redis.hGetAll(key));
  }

  return tours;
}

export async function pushRecentView(userId: number, tourId: number) {
  const key = `user:${userId}:recent_views`;
  await redis.lPush(key, tourId.toString());
  await redis.lTrim(key, 0, 19); // залишаємо 20 останніх
  await redis.expire(key, 60 * 60 * 24); // TTL 24 години
}

export async function getRecentViews(userId: number) {
  const key = `user:${userId}:recent_views`;
  return redis.lRange(key, 0, 19);
}
