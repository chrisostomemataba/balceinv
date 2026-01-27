import { H3Event, createError, readBody, getQuery } from 'h3';
import { eq, sql, and, gte, lte, desc } from 'drizzle-orm';
import { db, tables } from '../utils/db';

interface ServiceResponse<T = unknown> { 
  success: boolean; 
  message: string; 
  data?: T;
}

interface SaleItemInput {
  productId: number;
  quantity: number;
  isWholesale?: boolean;
}

interface CreateSaleInput {
  items: SaleItemInput[];
  paymentType: 'cash' | 'card' | 'mobile';
  saleType?: 'retail' | 'wholesale';
  taxAmount?: number;
  useEFD?: boolean;
}

interface SaleData {
  id: number;
  receiptNumber: string;
  userId: number;
  totalAmount: number;
  paymentType: string;
  saleType: string;
  taxAmount: number;
  createdAt: Date;
  items?: SaleItemData[];
}

interface SaleItemData {
  id: number;
  saleId: number;
  productId: number;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  isWholesale: boolean;
  product?: {
    name: string;
    sku: string;
  };
}

interface SalesQuery {
  startDate?: string;
  endDate?: string;
  paymentType?: 'cash' | 'card' | 'mobile';
  saleType?: 'retail' | 'wholesale';
  page?: number;
  limit?: number;
}

interface EFDResponse {
  success: boolean;
  receiptNumber?: string;
  fiscalCode?: string;
  error?: string;
}

export class SalesService {
  private static generateReceiptNumber(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `SALE-${timestamp}-${random}`;
  }

  private static async sendToEFD(saleData: {
    receiptNumber: string;
    items: Array<{ name: string; quantity: number; price: number; total: number }>;
    total: number;
    tax: number;
    paymentType: string;
  }): Promise<EFDResponse> {
    try {
      const efdEndpoint = process.env.EFD_ENDPOINT || '';
      const efdApiKey = process.env.EFD_API_KEY || '';

      if (!efdEndpoint) {
        console.warn('EFD endpoint not configured, skipping TRA integration');
        return { 
          success: false, 
          error: 'EFD not configured' 
        };
      }

      const response = await fetch(efdEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${efdApiKey}`
        },
        body: JSON.stringify({
          receiptNumber: saleData.receiptNumber,
          items: saleData.items,
          totalAmount: saleData.total,
          taxAmount: saleData.tax,
          paymentMethod: saleData.paymentType,
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error(`EFD request failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      return {
        success: true,
        receiptNumber: result.receiptNumber,
        fiscalCode: result.fiscalCode
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown EFD error';
      console.error('EFD integration error:', errorMessage);
      
      return { success: false, error: errorMessage };
    }
  }

  static async createSale(event: H3Event, userId: number): Promise<ServiceResponse<SaleData>> {
    const body = await readBody<CreateSaleInput>(event);

    if (!body.items || body.items.length === 0) {
      throw createError({ statusCode: 400, message: 'No items provided' });
    }

    const receiptNumber = this.generateReceiptNumber();
    let totalAmount = 0;
    const processedItems: Array<{
      productId: number;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
      isWholesale: boolean;
    }> = [];

    const efdItems: Array<{ name: string; quantity: number; price: number; total: number }> = [];

    for (const item of body.items) {
      const product = await db.query.products.findFirst({
        where: eq(tables.products.id, item.productId)
      });

      if (!product) {
        throw createError({ 
          statusCode: 404, 
          message: `Product with ID ${item.productId} not found` 
        });
      }

      if (product.quantity < item.quantity) {
        throw createError({ 
          statusCode: 400, 
          message: `Insufficient stock for ${product.name}. Available: ${product.quantity}` 
        });
      }

      const isWholesale = !!(item.isWholesale && product.wholesalePrice && item.quantity >= (product.wholesaleMin || 10));
      
      const unitPrice = isWholesale && product.wholesalePrice ? product.wholesalePrice : product.price;
      
      const itemTotal = unitPrice * item.quantity;

      processedItems.push({
        productId: product.id,
        quantity: item.quantity,
        unitPrice,
        totalPrice: itemTotal,
        isWholesale: isWholesale
      });

      efdItems.push({
        name: product.name,
        quantity: item.quantity,
        price: unitPrice,
        total: itemTotal
      });

      totalAmount += itemTotal;

      const newQuantity = product.quantity - item.quantity;
      await db.update(tables.products)
        .set({ quantity: newQuantity })
        .where(eq(tables.products.id, product.id));

      await db.insert(tables.stockMovements).values({
        productId: product.id,
        change: -item.quantity,
        newQuantity,
        reason: 'sale',
        reference: receiptNumber,
        userId
      });
    }

    const taxAmount = body.taxAmount ?? 0;

    const [sale] = await db.insert(tables.sales)
      .values({
        receiptNumber,
        userId,
        totalAmount,
        paymentType: body.paymentType,
        saleType: body.saleType || 'retail',
        taxAmount
      })
      .returning();

    const saleItemsData = processedItems.map(item => ({
      saleId: sale.id,
      ...item
    }));

    await db.insert(tables.saleItems).values(saleItemsData);

    if (body.useEFD !== false) {
      const efdResult = await this.sendToEFD({
        receiptNumber,
        items: efdItems,
        total: totalAmount,
        tax: taxAmount,
        paymentType: body.paymentType
      });

      if (!efdResult.success) {
        console.warn(`Sale ${receiptNumber} created but EFD failed: ${efdResult.error}`);
      }
    }

    const saleWithItems = await db.query.sales.findFirst({
      where: eq(tables.sales.id, sale.id),
      with: {
        items: {
          with: {
            product: {
              columns: { name: true, sku: true }
            }
          }
        }
      }
    });

    return { 
      success: true, 
      message: 'Sale completed successfully', 
      data: saleWithItems as SaleData
    };
  }

  static async getAllSales(event: H3Event): Promise<ServiceResponse<SaleData[]>> {
    const query = getQuery<SalesQuery>(event);

    const whereConditions = [];

    if (query.startDate) {
      const startDate = new Date(query.startDate);
      whereConditions.push(gte(tables.sales.createdAt, startDate));
    }

    if (query.endDate) {
      const endDate = new Date(query.endDate);
      endDate.setHours(23, 59, 59, 999);
      whereConditions.push(lte(tables.sales.createdAt, endDate));
    }

    if (query.paymentType) {
      whereConditions.push(eq(tables.sales.paymentType, query.paymentType));
    }

    if (query.saleType) {
      whereConditions.push(eq(tables.sales.saleType, query.saleType));
    }

    const sales = await db.query.sales.findMany({
      where: whereConditions.length > 0 
        ? and(...whereConditions) 
        : undefined,
      orderBy: [desc(tables.sales.createdAt)],
      with: {
        user: {
          columns: { name: true, email: true }
        }
      }
    });

    return { 
      success: true, 
      message: 'Sales fetched', 
      data: sales as SaleData[]
    };
  }

  static async getSaleById(id: number): Promise<ServiceResponse<SaleData>> {
    const sale = await db.query.sales.findFirst({
      where: eq(tables.sales.id, id),
      with: {
        items: {
          with: {
            product: true
          }
        },
        user: {
          columns: { name: true, email: true }
        }
      }
    });

    if (!sale) {
      throw createError({ statusCode: 404, message: 'Sale not found' });
    }

    return { 
      success: true, 
      message: 'Sale details fetched', 
      data: sale as SaleData
    };
  }

  static async getSalesByDateRange(
    startDate: Date, 
    endDate: Date
  ): Promise<ServiceResponse<SaleData[]>> {
    const sales = await db.query.sales.findMany({
      where: and(
        gte(tables.sales.createdAt, startDate),
        lte(tables.sales.createdAt, endDate)
      ),
      orderBy: [desc(tables.sales.createdAt)],
      with: {
        items: {
          with: {
            product: {
              columns: { name: true, sku: true }
            }
          }
        }
      }
    });

    return { 
      success: true, 
      message: 'Sales fetched for date range', 
      data: sales as SaleData[]
    };
  }

  static async getDailySales(date: Date): Promise<ServiceResponse<{
    sales: SaleData[];
    totalRevenue: number;
    totalTransactions: number;
    totalTax: number;
  }>> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const sales = await db.query.sales.findMany({
      where: and(
        gte(tables.sales.createdAt, startOfDay),
        lte(tables.sales.createdAt, endOfDay)
      ),
      orderBy: [desc(tables.sales.createdAt)],
      with: {
        items: true
      }
    });

    const totalRevenue = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const totalTax = sales.reduce((sum, sale) => sum + (sale.taxAmount || 0), 0);

    return {
      success: true,
      message: 'Daily sales summary',
      data: {
        sales: sales as SaleData[],
        totalRevenue,
        totalTransactions: sales.length,
        totalTax
      }
    };
  }

  static async getMonthlySales(year: number, month: number): Promise<ServiceResponse<{
    sales: SaleData[];
    totalRevenue: number;
    totalTransactions: number;
    totalTax: number;
    averageTransaction: number;
  }>> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const sales = await db.query.sales.findMany({
      where: and(
        gte(tables.sales.createdAt, startDate),
        lte(tables.sales.createdAt, endDate)
      ),
      orderBy: [desc(tables.sales.createdAt)]
    });

    const totalRevenue = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const totalTax = sales.reduce((sum, sale) => sum + (sale.taxAmount || 0), 0);
    const averageTransaction = sales.length > 0 ? totalRevenue / sales.length : 0;

    return {
      success: true,
      message: 'Monthly sales summary',
      data: {
        sales: sales as SaleData[],
        totalRevenue,
        totalTransactions: sales.length,
        totalTax,
        averageTransaction
      }
    };
  }
}