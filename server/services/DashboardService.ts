import { eq, gte, sql, sum, count, inArray, desc } from 'drizzle-orm';
import { db, tables } from '../utils/db';

export class DashboardService {
  /**
   * 1. GET SUMMARY
   * Fetches total counts and total revenue across the platform.
   */
  static async getSummary() {
    const [
      [userRes],
      [productRes],
      [saleRes],
      [revenueRes]
    ] = await Promise.all([
      db.select({ value: count() }).from(tables.users),
      db.select({ value: count() }).from(tables.products),
      db.select({ value: count() }).from(tables.sales),
      db.select({ value: sum(tables.sales.totalAmount) }).from(tables.sales),
    ]);

    return {
      userCount: Number(userRes?.value || 0),
      productCount: Number(productRes?.value || 0),
      saleCount: Number(saleRes?.value || 0),
      totalRevenue: Number(revenueRes?.value || 0),
    };
  }

  /**
   * 2. GET DAILY SALES
   * Groups sales by date. Note: SQL date formatting depends on your DB (SQLite/Postgres).
   * This example uses SQLite syntax for date formatting.
   */
  static async getDailySales(lastDays = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - lastDays);

    // SQL fragment to extract date (YYYY-MM-DD) from the createdAt timestamp
    const dateQuery = sql<string>`DATE(${tables.sales.createdAt})`;

    const raw = await db
      .select({
        date: dateQuery,
        total: sum(tables.sales.totalAmount),
      })
      .from(tables.sales)
      .where(gte(tables.sales.createdAt, startDate))
      .groupBy(dateQuery)
      .orderBy(dateQuery);

    return raw.map(r => ({
      date: r.date,
      total: Number(r.total || 0),
    }));
  }

  /**
   * 3. GET TOP PRODUCTS
   * Aggregates quantities from sale items and joins with product info.
   */
  static async getTopProducts(limit = 5) {
    // Get the aggregate data first
    const topSales = await db
      .select({
        productId: tables.saleItems.productId,
        totalSold: sum(tables.saleItems.quantity),
      })
      .from(tables.saleItems)
      .groupBy(tables.saleItems.productId)
      .orderBy(desc(sum(tables.saleItems.quantity)))
      .limit(limit);

    if (topSales.length === 0) return [];

    const productIds = topSales.map(t => t.productId);

    // Fetch product details
    const products = await db
      .select({
        id: tables.products.id,
        name: tables.products.name,
        sku: tables.products.sku,
      })
      .from(tables.products)
      .where(inArray(tables.products.id, productIds));

    // Combine the data
    const map = new Map(products.map(p => [p.id, p]));
    
    return topSales.map(t => {
      const p = map.get(t.productId);
      return {
        ...p,
        totalSold: Number(t.totalSold || 0),
      };
    });
  }
}