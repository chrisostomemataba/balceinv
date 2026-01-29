import { H3Event, createError, readBody, getQuery } from 'h3';
import { eq, and, gte, lte, desc } from 'drizzle-orm';
import { db, tables } from '../utils/db';
import * as XLSX from 'xlsx';

interface ServiceResponse<T = unknown> { 
  success: boolean; 
  message: string; 
  data?: T;
}

interface StockMovementData {
  id: number;
  productId: number;
  change: number;
  newQuantity: number;
  reason: string;
  reference?: string | null;
  userId?: number | null;
  createdAt: Date;
  product?: {
    name: string;
    sku: string;
    unit: string;
  };
  user?: {
    name: string;
    email: string;
  };
}

interface MovementFilters {
  startDate?: string;
  endDate?: string;
  productId?: string;
  reason?: string;
  search?: string;
}

interface CreateMovementInput {
  productId: number;
  change: number;
  reason: 'purchase' | 'adjust' | 'damage';
  reference?: string;
}

export class StockMovementsService {
  static async getAll(event: H3Event): Promise<ServiceResponse<StockMovementData[]>> {
    const query = getQuery<MovementFilters>(event);

    const whereConditions = [];

    if (query.startDate) {
      const startDate = new Date(query.startDate);
      whereConditions.push(gte(tables.stockMovements.createdAt, startDate));
    }

    if (query.endDate) {
      const endDate = new Date(query.endDate);
      endDate.setHours(23, 59, 59, 999);
      whereConditions.push(lte(tables.stockMovements.createdAt, endDate));
    }

    if (query.productId) {
      whereConditions.push(eq(tables.stockMovements.productId, Number(query.productId)));
    }

    if (query.reason) {
      whereConditions.push(eq(tables.stockMovements.reason, query.reason as 'purchase' | 'adjust' | 'damage' | 'sale'));
    }

    const movements = await db.query.stockMovements.findMany({
      where: whereConditions.length > 0 ? and(...whereConditions) : undefined,
      orderBy: [desc(tables.stockMovements.createdAt)],
      with: {
        product: {
          columns: { name: true, sku: true, unit: true }
        },
        user: {
          columns: { name: true, email: true }
        }
      }
    });

    let filteredMovements = movements;

    if (query.search) {
      const searchLower = query.search.toLowerCase();
      filteredMovements = movements.filter(movement => 
        movement.product.name.toLowerCase().includes(searchLower) ||
        movement.product.sku.toLowerCase().includes(searchLower)
      );
    }

    return { 
      success: true, 
      message: 'Stock movements fetched', 
      data: filteredMovements as StockMovementData[]
    };
  }

  static async getById(id: number): Promise<ServiceResponse<StockMovementData>> {
    const movement = await db.query.stockMovements.findFirst({
      where: eq(tables.stockMovements.id, id),
      with: {
        product: true,
        user: {
          columns: { name: true, email: true }
        }
      }
    });

    if (!movement) {
      throw createError({ statusCode: 404, message: 'Stock movement not found' });
    }

    return { 
      success: true, 
      message: 'Stock movement fetched', 
      data: movement as StockMovementData
    };
  }

  static async getByProduct(productId: number): Promise<ServiceResponse<StockMovementData[]>> {
    const movements = await db.query.stockMovements.findMany({
      where: eq(tables.stockMovements.productId, productId),
      orderBy: [desc(tables.stockMovements.createdAt)],
      with: {
        product: {
          columns: { name: true, sku: true, unit: true }
        },
        user: {
          columns: { name: true, email: true }
        }
      }
    });

    return { 
      success: true, 
      message: 'Product movements fetched', 
      data: movements as StockMovementData[]
    };
  }

  static async getByDateRange(
    startDate: Date, 
    endDate: Date
  ): Promise<ServiceResponse<StockMovementData[]>> {
    const movements = await db.query.stockMovements.findMany({
      where: and(
        gte(tables.stockMovements.createdAt, startDate),
        lte(tables.stockMovements.createdAt, endDate)
      ),
      orderBy: [desc(tables.stockMovements.createdAt)],
      with: {
        product: {
          columns: { name: true, sku: true, unit: true }
        },
        user: {
          columns: { name: true, email: true }
        }
      }
    });

    return { 
      success: true, 
      message: 'Movements fetched for date range', 
      data: movements as StockMovementData[]
    };
  }

  static async create(
    event: H3Event, 
    userId: number
  ): Promise<ServiceResponse<StockMovementData>> {
    const body = await readBody<CreateMovementInput>(event);

    const product = await db.query.products.findFirst({
      where: eq(tables.products.id, body.productId)
    });

    if (!product) {
      throw createError({ statusCode: 404, message: 'Product not found' });
    }

    const newQuantity = product.quantity + body.change;

    if (newQuantity < 0) {
      throw createError({ 
        statusCode: 400, 
        message: 'Cannot reduce stock below zero' 
      });
    }

    await db.update(tables.products)
      .set({ quantity: newQuantity })
      .where(eq(tables.products.id, body.productId));

    const [movement] = await db.insert(tables.stockMovements)
      .values({
        productId: body.productId,
        change: body.change,
        newQuantity,
        reason: body.reason,
        reference: body.reference || null,
        userId
      })
      .returning();

    const movementWithDetails = await db.query.stockMovements.findFirst({
      where: eq(tables.stockMovements.id, movement.id),
      with: {
        product: {
          columns: { name: true, sku: true, unit: true }
        },
        user: {
          columns: { name: true, email: true }
        }
      }
    });

    return { 
      success: true, 
      message: 'Stock movement created', 
      data: movementWithDetails as StockMovementData
    };
  }

  static async exportReport(
    startDate?: Date, 
    endDate?: Date
  ): Promise<Buffer> {
    const whereConditions = [];

    if (startDate) {
      whereConditions.push(gte(tables.stockMovements.createdAt, startDate));
    }

    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      whereConditions.push(lte(tables.stockMovements.createdAt, end));
    }

    const movements = await db.query.stockMovements.findMany({
      where: whereConditions.length > 0 ? and(...whereConditions) : undefined,
      orderBy: [desc(tables.stockMovements.createdAt)],
      with: {
        product: true,
        user: {
          columns: { name: true }
        }
      }
    });

    const reportData = movements.map(movement => ({
      'Date': new Date(movement.createdAt || Date.now()).toLocaleDateString('en-TZ', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      'Product Name': movement.product.name,
      'SKU': movement.product.sku,
      'Change': movement.change,
      'New Quantity': movement.newQuantity,
      'Unit': movement.product.unit,
      'Reason': movement.reason.charAt(0).toUpperCase() + movement.reason.slice(1),
      'Reference': movement.reference || 'N/A',
      'User': movement.user?.name || 'System'
    }));

    const summaryByReason = movements.reduce((acc, movement) => {
      if (!acc[movement.reason]) {
        acc[movement.reason] = { count: 0, totalChange: 0 };
      }
      acc[movement.reason].count++;
      acc[movement.reason].totalChange += movement.change;
      return acc;
    }, {} as Record<string, { count: number; totalChange: number }>);

    const summaryData = Object.entries(summaryByReason).map(([reason, data]) => ({
      'Reason': reason.charAt(0).toUpperCase() + reason.slice(1),
      'Total Movements': data.count,
      'Net Change': data.totalChange
    }));

    const workbook = XLSX.utils.book_new();

    const summarySheet = XLSX.utils.json_to_sheet(summaryData);
    summarySheet['!cols'] = [{ wch: 20 }, { wch: 20 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

    const detailsSheet = XLSX.utils.json_to_sheet(reportData);
    detailsSheet['!cols'] = [
      { wch: 18 },
      { wch: 30 },
      { wch: 15 },
      { wch: 10 },
      { wch: 15 },
      { wch: 10 },
      { wch: 12 },
      { wch: 20 },
      { wch: 20 }
    ];
    XLSX.utils.book_append_sheet(workbook, detailsSheet, 'Movement Details');

    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }

  static async getSummary(): Promise<ServiceResponse<{
    totalMovements: number;
    bySale: number;
    byPurchase: number;
    byAdjustment: number;
    byDamage: number;
    netChange: number;
  }>> {
    const movements = await db.query.stockMovements.findMany();

    const summary = {
      totalMovements: movements.length,
      bySale: movements.filter(m => m.reason === 'sale').length,
      byPurchase: movements.filter(m => m.reason === 'purchase').length,
      byAdjustment: movements.filter(m => m.reason === 'adjust').length,
      byDamage: movements.filter(m => m.reason === 'damage').length,
      netChange: movements.reduce((sum, m) => sum + m.change, 0)
    };

    return {
      success: true,
      message: 'Movement summary fetched',
      data: summary
    };
  }
}