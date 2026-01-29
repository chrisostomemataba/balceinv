import { H3Event, getQuery } from 'h3';
import { eq, and, gte, lte, desc, sql } from 'drizzle-orm';
import { db, tables } from '../utils/db';
import * as XLSX from 'xlsx';

interface ServiceResponse<T = unknown> { 
  success: boolean; 
  message: string; 
  data?: T;
}

interface DateRange {
  startDate?: Date;
  endDate?: Date;
}

interface SalesSummary {
  totalSales: number;
  totalRevenue: number;
  totalTax: number;
  averageTransaction: number;
  cashSales: number;
  cardSales: number;
  mobileSales: number;
}

interface TopProduct {
  productId: number;
  productName: string;
  sku: string;
  totalQuantity: number;
  totalRevenue: number;
  salesCount: number;
}

interface SalesByUser {
  userId: number;
  userName: string;
  totalSales: number;
  totalRevenue: number;
}

interface InventoryReport {
  totalProducts: number;
  totalStockValue: number;
  lowStockCount: number;
  outOfStockCount: number;
  deadStockCount: number;
  lowStockItems: Array<{
    id: number;
    name: string;
    sku: string;
    quantity: number;
    minStock: number;
  }>;
  outOfStockItems: Array<{
    id: number;
    name: string;
    sku: string;
  }>;
  deadStockItems: Array<{
    id: number;
    name: string;
    sku: string;
    quantity: number;
    daysSinceLastSale: number;
  }>;
}

interface FinancialReport {
  totalRevenue: number;
  totalCost: number;
  grossProfit: number;
  profitMargin: number;
  totalTax: number;
  netProfit: number;
}

export class ReportsService {
  private static getDateRange(event: H3Event): DateRange {
    const query = getQuery(event);
    const startDate = query.startDate ? new Date(query.startDate as string) : undefined;
    const endDate = query.endDate ? new Date(query.endDate as string) : undefined;
    
    if (endDate) {
      endDate.setHours(23, 59, 59, 999);
    }
    
    return { startDate, endDate };
  }

  static async getSalesSummary(event: H3Event): Promise<ServiceResponse<SalesSummary>> {
    const { startDate, endDate } = this.getDateRange(event);
    
    const whereConditions = [];
    if (startDate) whereConditions.push(gte(tables.sales.createdAt, startDate));
    if (endDate) whereConditions.push(lte(tables.sales.createdAt, endDate));

    const sales = await db.query.sales.findMany({
      where: whereConditions.length > 0 ? and(...whereConditions) : undefined
    });

    const summary: SalesSummary = {
      totalSales: sales.length,
      totalRevenue: sales.reduce((sum, sale) => sum + sale.totalAmount, 0),
      totalTax: sales.reduce((sum, sale) => sum + (sale.taxAmount || 0), 0),
      averageTransaction: sales.length > 0 ? sales.reduce((sum, sale) => sum + sale.totalAmount, 0) / sales.length : 0,
      cashSales: sales.filter(s => s.paymentType === 'cash').reduce((sum, s) => sum + s.totalAmount, 0),
      cardSales: sales.filter(s => s.paymentType === 'card').reduce((sum, s) => sum + s.totalAmount, 0),
      mobileSales: sales.filter(s => s.paymentType === 'mobile').reduce((sum, s) => sum + s.totalAmount, 0)
    };

    return { success: true, message: 'Sales summary fetched', data: summary };
  }

  static async getTopProducts(event: H3Event): Promise<ServiceResponse<TopProduct[]>> {
    const { startDate, endDate } = this.getDateRange(event);
    const query = getQuery(event);
    const limit = query.limit ? Number(query.limit) : 10;

    const whereConditions = [];
    if (startDate) whereConditions.push(gte(tables.sales.createdAt, startDate));
    if (endDate) whereConditions.push(lte(tables.sales.createdAt, endDate));

    const salesInRange = await db.query.sales.findMany({
      where: whereConditions.length > 0 ? and(...whereConditions) : undefined,
      with: { items: { with: { product: true } } }
    });

    const productMap = new Map<number, TopProduct>();

    salesInRange.forEach(sale => {
      sale.items.forEach(item => {
        const existing = productMap.get(item.productId);
        if (existing) {
          existing.totalQuantity += item.quantity;
          existing.totalRevenue += item.totalPrice;
          existing.salesCount++;
        } else {
          productMap.set(item.productId, {
            productId: item.productId,
            productName: item.product.name,
            sku: item.product.sku,
            totalQuantity: item.quantity,
            totalRevenue: item.totalPrice,
            salesCount: 1
          });
        }
      });
    });

    const topProducts = Array.from(productMap.values())
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, limit);

    return { success: true, message: 'Top products fetched', data: topProducts };
  }

  static async getSalesByUser(event: H3Event): Promise<ServiceResponse<SalesByUser[]>> {
    const { startDate, endDate } = this.getDateRange(event);

    const whereConditions = [];
    if (startDate) whereConditions.push(gte(tables.sales.createdAt, startDate));
    if (endDate) whereConditions.push(lte(tables.sales.createdAt, endDate));

    const sales = await db.query.sales.findMany({
      where: whereConditions.length > 0 ? and(...whereConditions) : undefined,
      with: { user: true }
    });

    const userMap = new Map<number, SalesByUser>();

    sales.forEach(sale => {
      const existing = userMap.get(sale.userId);
      if (existing) {
        existing.totalSales++;
        existing.totalRevenue += sale.totalAmount;
      } else {
        userMap.set(sale.userId, {
          userId: sale.userId,
          userName: sale.user.name,
          totalSales: 1,
          totalRevenue: sale.totalAmount
        });
      }
    });

    const salesByUser = Array.from(userMap.values())
      .sort((a, b) => b.totalRevenue - a.totalRevenue);

    return { success: true, message: 'Sales by user fetched', data: salesByUser };
  }

  static async getInventoryReport(): Promise<ServiceResponse<InventoryReport>> {
    const products = await db.query.products.findMany();
    
    const lowStock = products.filter(p => p.quantity > 0 && p.quantity <= (p.minStock || 0));
    const outOfStock = products.filter(p => p.quantity === 0);
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentSales = await db.query.sales.findMany({
      where: gte(tables.sales.createdAt, thirtyDaysAgo),
      with: { items: true }
    });

    const productsSoldRecently = new Set(
      recentSales.flatMap(sale => sale.items.map(item => item.productId))
    );

    const deadStock = products.filter(p => 
      p.quantity > 0 && !productsSoldRecently.has(p.id)
    );

    const totalStockValue = products.reduce((sum, p) => 
      sum + (p.quantity * p.costPrice), 0
    );

    const report: InventoryReport = {
      totalProducts: products.length,
      totalStockValue,
      lowStockCount: lowStock.length,
      outOfStockCount: outOfStock.length,
      deadStockCount: deadStock.length,
      lowStockItems: lowStock.map(p => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        quantity: p.quantity,
        minStock: p.minStock || 0
      })),
      outOfStockItems: outOfStock.map(p => ({
        id: p.id,
        name: p.name,
        sku: p.sku
      })),
      deadStockItems: deadStock.map(p => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        quantity: p.quantity,
        daysSinceLastSale: 30
      }))
    };

    return { success: true, message: 'Inventory report fetched', data: report };
  }

  static async getFinancialReport(event: H3Event): Promise<ServiceResponse<FinancialReport>> {
    const { startDate, endDate } = this.getDateRange(event);

    const whereConditions = [];
    if (startDate) whereConditions.push(gte(tables.sales.createdAt, startDate));
    if (endDate) whereConditions.push(lte(tables.sales.createdAt, endDate));

    const sales = await db.query.sales.findMany({
      where: whereConditions.length > 0 ? and(...whereConditions) : undefined,
      with: { items: { with: { product: true } } }
    });

    const totalRevenue = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const totalTax = sales.reduce((sum, sale) => sum + (sale.taxAmount || 0), 0);
    
    const totalCost = sales.reduce((sum, sale) => {
      const saleCost = sale.items.reduce((itemSum, item) => 
        itemSum + (item.quantity * item.product.costPrice), 0
      );
      return sum + saleCost;
    }, 0);

    const grossProfit = totalRevenue - totalCost;
    const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
    const netProfit = grossProfit - totalTax;

    const report: FinancialReport = {
      totalRevenue,
      totalCost,
      grossProfit,
      profitMargin,
      totalTax,
      netProfit
    };

    return { success: true, message: 'Financial report fetched', data: report };
  }

  static async getDailySalesTrend(event: H3Event): Promise<ServiceResponse<Array<{
    date: string;
    sales: number;
    revenue: number;
  }>>> {
    const { startDate, endDate } = this.getDateRange(event);

    const whereConditions = [];
    if (startDate) whereConditions.push(gte(tables.sales.createdAt, startDate));
    if (endDate) whereConditions.push(lte(tables.sales.createdAt, endDate));

    const sales = await db.query.sales.findMany({
      where: whereConditions.length > 0 ? and(...whereConditions) : undefined,
      orderBy: [desc(tables.sales.createdAt)]
    });

    const dailyMap = new Map<string, { sales: number; revenue: number }>();

    sales.forEach(sale => {
      const date = new Date(sale.createdAt || new Date()).toISOString().split('T')[0];
      const existing = dailyMap.get(date);
      if (existing) {
        existing.sales++;
        existing.revenue += sale.totalAmount;
      } else {
        dailyMap.set(date, { sales: 1, revenue: sale.totalAmount });
      }
    });

    const trend = Array.from(dailyMap.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return { success: true, message: 'Daily sales trend fetched', data: trend };
  }

  static async exportExcelReport(event: H3Event): Promise<Buffer> {
    const salesSummary = await this.getSalesSummary(event);
    const topProducts = await this.getTopProducts(event);
    const inventoryReport = await this.getInventoryReport();
    const financialReport = await this.getFinancialReport(event);

    const workbook = XLSX.utils.book_new();

    const summaryData = [
      ['SALES SUMMARY REPORT'],
      [''],
      ['Metric', 'Value'],
      ['Total Sales', salesSummary.data!.totalSales],
      ['Total Revenue', salesSummary.data!.totalRevenue],
      ['Average Transaction', salesSummary.data!.averageTransaction],
      ['Tax Collected', salesSummary.data!.totalTax],
      [''],
      ['PAYMENT BREAKDOWN'],
      ['Cash Sales', salesSummary.data!.cashSales],
      ['Card Sales', salesSummary.data!.cardSales],
      ['Mobile Sales', salesSummary.data!.mobileSales]
    ];

    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    summarySheet['!cols'] = [{ wch: 25 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

    const topProductsSheet = XLSX.utils.json_to_sheet(topProducts.data!.map(p => ({
      'Product': p.productName,
      'SKU': p.sku,
      'Quantity Sold': p.totalQuantity,
      'Revenue': p.totalRevenue,
      'Times Sold': p.salesCount
    })));
    topProductsSheet['!cols'] = [{ wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(workbook, topProductsSheet, 'Top Products');

    const financialData = [
      ['FINANCIAL REPORT'],
      [''],
      ['Metric', 'Amount'],
      ['Total Revenue', financialReport.data!.totalRevenue],
      ['Total Cost', financialReport.data!.totalCost],
      ['Gross Profit', financialReport.data!.grossProfit],
      ['Profit Margin %', financialReport.data!.profitMargin.toFixed(2)],
      ['Tax Collected', financialReport.data!.totalTax],
      ['Net Profit', financialReport.data!.netProfit]
    ];

    const financialSheet = XLSX.utils.aoa_to_sheet(financialData);
    financialSheet['!cols'] = [{ wch: 25 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(workbook, financialSheet, 'Financial');

    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }
}