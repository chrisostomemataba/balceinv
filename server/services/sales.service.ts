import { H3Event, createError, readBody, getQuery, readMultipartFormData } from 'h3';
import { eq, sql, and, gte, lte, desc } from 'drizzle-orm';
import { db, tables } from '../utils/db';
import * as XLSX from 'xlsx';

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
}

interface EFDResponse {
  success: boolean;
  receiptNumber?: string;
  fiscalCode?: string;
  error?: string;
}

interface ExcelSaleRow {
  receiptNumber: string;
  saleDate: string;
  paymentType: string;
  saleType: string;
  productName: string;
  productSKU: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  isWholesale: string;
}

interface UploadSaleError {
  row: number;
  error: string;
}

interface UploadSalesResult {
  created: number;
  errors: UploadSaleError[];
}

export class SalesService {

  static async getSettings() {
    try {
      const systemSettings = await db.select().from(tables.settings).limit(1);
      return systemSettings[0] || null;
    } catch (error) {
      console.error('Error fetching settings:', error);
      return null;
    }
  }

  static async generateReceiptNumber(): Promise<string> {
    try {
      const systemSettings = await this.getSettings();
      const format = systemSettings?.receiptNumberFormat || 'SALE-{TIMESTAMP}-{COUNTER}';
      
      // Get today's sales count for counter
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayTimestamp = Math.floor(today.getTime() / 1000);
      
      const todaySales = await db
        .select({ count: sql<number>`count(*)` })
        .from(tables.sales)
        .where(gte(tables.sales.createdAt, new Date(todayTimestamp * 1000)));
      
      const counter = (todaySales[0]?.count || 0) + 1;
      const timestamp = Date.now();

      let receiptNumber = format
        .replace('{TIMESTAMP}', timestamp.toString())
        .replace('{COUNTER}', counter.toString().padStart(4, '0'))
        .replace('{DATE}', new Date().toISOString().split('T')[0].replace(/-/g, ''));
      
      return receiptNumber;
    } catch (error) {
      console.error('Error generating receipt number:', error);
      // Fallback to simple format
      return `SALE-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    }
  }

  static calculateTotals(items: any[], systemSettings: any) {
    const subtotal = items.reduce((sum, item) => {
      const product = item.product;
      const price = item.isWholesale && product.wholesalePrice 
        ? product.wholesalePrice 
        : product.price;
      return sum + (price * item.quantity);
    }, 0);

    // Tax is already included in the price (as per POS design)
    const taxRate = systemSettings?.taxRate || 18;
    const taxAmount = subtotal * (taxRate / (100 + taxRate));
    
    return {
      subtotal,
      taxAmount,
      total: subtotal,
    };
  }

  /**
   * Send sale data to EFD (TRA Electronic Fiscal Device)
   */
  private static async sendToEFD(
    receiptNumber: string,
    items: any[],
    total: number,
    taxAmount: number,
    settings: any
  ) {
    try {
      // Only attempt if EFD is enabled and configured
      if (!settings?.efdEnabled || !settings?.efdEndpoint) {
        return null;
      }

      // Prepare EFD payload
      const efdPayload = {
        receiptNumber,
        timestamp: new Date().toISOString(),
        items: items.map(item => ({
          name: item.product.name,
          quantity: item.quantity,
          price: item.isWholesale && item.product.wholesalePrice 
            ? item.product.wholesalePrice 
            : item.product.price,
          taxRate: settings.taxRate || 18,
        })),
        totalAmount: total,
        taxAmount,
        tin: settings.businessTIN,
      };

      // Send to EFD endpoint
      const response = await fetch(settings.efdEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${settings.efdApiKey}`,
        },
        body: JSON.stringify(efdPayload),
      });

      if (!response.ok) {
        console.error('EFD submission failed:', response.statusText);
        return { success: false, error: response.statusText };
      }

      const result = await response.json();
      return { success: true, data: result };
    } catch (error) {
      console.error('Error sending to EFD:', error);
      return { success: false, error: String(error) };
    }
  }

static async createSale(data: {
    userId: number;
    items: Array<{ productId: number; quantity: number; isWholesale?: boolean }>;
    paymentType: 'cash' | 'card' | 'mobile';
    saleType?: 'retail' | 'wholesale';
    amountPaid?: number; // Amount customer paid (for cash payments)
    useEFD?: boolean;
  }) {
    try {
      // Get system settings for EFD and receipt configuration
      const systemSettings = await this.getSettings();
      
      // Fetch all products involved in the sale
      const itemsWithProducts = await Promise.all(
        data.items.map(async (item) => {
          const [product] = await db
            .select()
            .from(tables.products)
            .where(eq(tables.products.id, item.productId));

          if (!product) {
            throw new Error(`Product with ID ${item.productId} not found`);
          }

          // Check stock availability
          if (product.quantity < item.quantity) {
            throw new Error(`Insufficient stock for ${product.name}`);
          }

          return { ...item, product };
        })
      );

      // Calculate totals
      const { subtotal, taxAmount, total } = this.calculateTotals(itemsWithProducts, systemSettings);

      // Calculate change if cash payment
      let change = 0;
      if (data.paymentType === 'cash' && data.amountPaid) {
        change = data.amountPaid - total;
        if (change < 0) {
          throw new Error(`Insufficient payment. Required: ${total}, Paid: ${data.amountPaid}`);
        }
      }

      // Generate receipt number
      const receiptNumber = await this.generateReceiptNumber();

      // EFD Integration (if enabled)
      let efdResponse = null;
      if (systemSettings?.efdEnabled && data.useEFD) {
        efdResponse = await SalesService.sendToEFD(
          receiptNumber,
          itemsWithProducts.map(item => ({
            name: item.product.name,
            quantity: item.quantity,
            price: item.isWholesale ? item.product.wholesalePrice || item.product.price : item.product.price,
            total: item.quantity * (item.isWholesale ? item.product.wholesalePrice || item.product.price : item.product.price)
          })),
          total,
          taxAmount,
          systemSettings
        );
      }

      // Create the sale record
      const [sale] = await db
        .insert(tables.sales)
        .values({
          userId: data.userId,
          receiptNumber,
          totalAmount: total,
          taxAmount,
          paymentType: data.paymentType,
          saleType: data.saleType || 'retail',
        })
        .returning();

      // Create sale items and update stock
      for (const item of itemsWithProducts) {
        const product = item.product;
        const unitPrice = item.isWholesale && product.wholesalePrice 
          ? product.wholesalePrice 
          : product.price;
        const totalPrice = unitPrice * item.quantity;

        // Insert sale item
        await db.insert(tables.saleItems).values({
          saleId: sale.id,
          productId: product.id,
          quantity: item.quantity,
          unitPrice,
          totalPrice,
          isWholesale: item.isWholesale || false,
        });

        // Update product stock
        const newQuantity = product.quantity - item.quantity;
        await db
          .update(tables.products)
          .set({ quantity: newQuantity })
          .where(eq(tables.products.id, product.id));

        // Record stock movement
        await db.insert(tables.stockMovements).values({
          productId: product.id,
          change: -item.quantity, // Negative because stock is reduced
          newQuantity,
          reason: 'sale',
          reference: receiptNumber,
          userId: data.userId,
        });
      }

      // Return sale details including change and receipt structure
      return {
        id: sale.id,
        receiptNumber: sale.receiptNumber,
        total: sale.totalAmount,
        taxAmount: sale.taxAmount,
        paymentType: sale.paymentType,
        amountPaid: data.amountPaid,
        change, // Change to give back to customer
        efdResponse, // EFD response if applicable
        receiptData: this.generateReceiptData(sale, itemsWithProducts, systemSettings, change),
      };
    } catch (error) {
      console.error('Error creating sale:', error);
      throw error;
    }
  }

  /**
   * Generate receipt data structure for printing
   */
  static generateReceiptData(
    sale: any,
    items: any[],
    settings: any,
    change: number
  ) {
    return {
      // Business details from settings
      businessName: settings?.businessName || 'POS System',
      businessAddress: settings?.businessAddress || '',
      businessPhone: settings?.businessPhone || '',
      businessTIN: settings?.businessTIN || '',
      
      // Receipt branding
      receiptHeader: settings?.receiptHeader || '',
      receiptFooter: settings?.receiptFooter || 'Thank you for your business!',
      
      // Sale details
      receiptNumber: sale.receiptNumber,
      date: new Date(),
      paymentType: sale.paymentType,
      
      // Items
      items: items.map(item => ({
        name: item.product.name,
        sku: item.product.sku,
        quantity: item.quantity,
        unitPrice: item.isWholesale && item.product.wholesalePrice 
          ? item.product.wholesalePrice 
          : item.product.price,
        total: (item.isWholesale && item.product.wholesalePrice 
          ? item.product.wholesalePrice 
          : item.product.price) * item.quantity,
        isWholesale: item.isWholesale || false,
      })),
      
      // Totals
      subtotal: sale.totalAmount - sale.taxAmount,
      taxAmount: sale.taxAmount,
      taxRate: settings?.taxRate || 18,
      total: sale.totalAmount,
      
      // Change calculation (for cash)
      change,
      
      // Currency
      currency: settings?.currency || 'TZS',
      currencySymbol: settings?.currencySymbol || 'TZS',
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
    const totalTax = sales.reduce((sum, sale) => sum + (sale.taxAmount ?? 0), 0);

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
    const totalTax = sales.reduce((sum, sale) => sum + (sale.taxAmount ?? 0), 0);
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

  static async uploadSalesExcel(event: H3Event, userId: number): Promise<ServiceResponse<UploadSalesResult>> {
    const formData = await readMultipartFormData(event);
    
    if (!formData || !formData[0]) {
      throw createError({ statusCode: 400, message: 'No file uploaded' });
    }
    
    const fileData = formData[0].data;
    const workbook = XLSX.read(fileData);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet) as ExcelSaleRow[];
    
    let createdCount = 0;
    const errors: UploadSaleError[] = [];
    
    const salesByReceipt = new Map<string, ExcelSaleRow[]>();
    
    rows.forEach((row, index) => {
      const receiptNumber = row.receiptNumber;
      if (!salesByReceipt.has(receiptNumber)) {
        salesByReceipt.set(receiptNumber, []);
      }
      salesByReceipt.get(receiptNumber)!.push(row);
    });

    for (const [receiptNumber, items] of salesByReceipt) {
      try {
        const firstItem = items[0];
        
        const saleDate = new Date(firstItem.saleDate);
        if (isNaN(saleDate.getTime())) {
          throw new Error('Invalid date format');
        }

        const paymentType = firstItem.paymentType?.toLowerCase();
        if (!['cash', 'card', 'mobile'].includes(paymentType)) {
          throw new Error('Invalid payment type');
        }

        const saleType = firstItem.saleType?.toLowerCase();
        if (!['retail', 'wholesale'].includes(saleType)) {
          throw new Error('Invalid sale type');
        }

        let totalAmount = 0;
        const processedItems: Array<{
          productId: number;
          quantity: number;
          unitPrice: number;
          totalPrice: number;
          isWholesale: boolean;
        }> = [];

        for (const item of items) {
          const product = await db.query.products.findFirst({
            where: eq(tables.products.sku, item.productSKU)
          });

          if (!product) {
            throw new Error(`Product ${item.productSKU} not found`);
          }

          const quantity = parseInt(String(item.quantity));
          const unitPrice = parseFloat(String(item.unitPrice));
          const itemTotal = parseFloat(String(item.totalPrice));

          processedItems.push({
            productId: product.id,
            quantity,
            unitPrice,
            totalPrice: itemTotal,
            isWholesale: item.isWholesale?.toLowerCase() === 'yes'
          });

          totalAmount += itemTotal;
        }

        const taxAmount = totalAmount * 0.18 / 1.18;

        const [sale] = await db.insert(tables.sales)
          .values({
            receiptNumber,
            userId,
            totalAmount,
            paymentType: paymentType as 'cash' | 'card' | 'mobile',
            saleType: saleType as 'retail' | 'wholesale',
            taxAmount,
            createdAt: saleDate
          })
          .returning();

        const saleItemsData = processedItems.map(item => ({
          saleId: sale.id,
          ...item
        }));

        await db.insert(tables.saleItems).values(saleItemsData);

        createdCount++;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push({ row: 0, error: `${receiptNumber}: ${errorMessage}` });
      }
    }
    
    return {
      success: true,
      message: `Imported ${createdCount} sales`,
      data: { created: createdCount, errors }
    };
  }

  static getSalesTemplate(): Buffer {
    const template = [
      {
        receiptNumber: 'SALE-001',
        saleDate: '2025-01-15',
        paymentType: 'cash',
        saleType: 'retail',
        productName: 'Sample Product',
        productSKU: 'SKU001',
        quantity: 2,
        unitPrice: 1000,
        totalPrice: 2000,
        isWholesale: 'no'
      },
      {
        receiptNumber: 'SALE-001',
        saleDate: '2025-01-15',
        paymentType: 'cash',
        saleType: 'retail',
        productName: 'Another Product',
        productSKU: 'SKU002',
        quantity: 1,
        unitPrice: 500,
        totalPrice: 500,
        isWholesale: 'no'
      }
    ];
    
    const worksheet = XLSX.utils.json_to_sheet(template);
    
    worksheet['!cols'] = [
      { wch: 15 },
      { wch: 12 },
      { wch: 12 },
      { wch: 10 },
      { wch: 25 },
      { wch: 12 },
      { wch: 10 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 }
    ];
    
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sales');
    
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }

static async exportSalesReport(startDate?: Date, endDate?: Date): Promise<Buffer> {
    const where = [];
    if (startDate) where.push(gte(tables.sales.createdAt, startDate));
    if (endDate) {
      const end = new Date(endDate); end.setHours(23, 59, 59, 999);
      where.push(lte(tables.sales.createdAt, end));
    }

    const sales = await db.query.sales.findMany({
      where: where.length ? and(...where) : undefined,
      orderBy: [desc(tables.sales.createdAt)],
      with: { items: { with: { product: true } }, user: { columns: { name: true } } }
    });

    const reportData = sales.flatMap(sale => 
      sale.items.map(item => ({
        'Receipt Number': sale.receiptNumber,
        'Date': new Date(sale.createdAt || new Date()).toLocaleDateString('en-TZ', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
        'Product Name': item.product?.name ?? 'Unknown Product',
        'SKU': item.product?.sku ?? 'N/A',
        'Quantity': item.quantity,
        'Unit Price': item.unitPrice,
        'Total Price': item.totalPrice,
        'Wholesale': item.isWholesale ? 'Yes' : 'No',
        'Payment Method': sale.paymentType.toUpperCase(),
        'Sale Type': (sale.saleType ?? 'retail').replace(/^\w/, c => c.toUpperCase()),
        'Sold By': sale.user?.name ?? 'Unknown',
        'Sale Total': sale.totalAmount
      }))
    );

    const totalRevenue = sales.reduce((sum, s) => sum + s.totalAmount, 0);
    const totalTax = sales.reduce((sum, s) => sum + (s.taxAmount ?? 0), 0);

    const summaryData = [
      { Metric: 'Total Sales', Value: sales.length },
      { Metric: 'Total Revenue', Value: totalRevenue },
      { Metric: 'Total Tax', Value: totalTax },
      { Metric: 'Average Transaction', Value: sales.length ? totalRevenue / sales.length : 0 }
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summaryData), 'Summary');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(reportData), 'Sales Details');
    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  }
}