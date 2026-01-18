import { H3Event, createError } from 'h3';
import { eq, like, sql } from 'drizzle-orm';
import { db, tables } from '../utils/db';
import * as XLSX from 'xlsx';

interface ServiceResponse { success: boolean; message: string; data?: any }

export class ProductsService {
  static async getAll(event: H3Event): Promise<ServiceResponse> {
    const query = getQuery(event);
    const search = query.search as string || '';
    const category = query.category as string || '';
    
    let whereConditions = [];
    
    if (search) {
      whereConditions.push(
        sql`${tables.products.name} LIKE ${`%${search}%`} OR ${tables.products.sku} LIKE ${`%${search}%`}`
      );
    }
    
    if (category) {
      whereConditions.push(eq(tables.products.category, category));
    }
    
    const products = await db.query.products.findMany({
      where: whereConditions.length > 0 ? sql`${sql.join(whereConditions, sql` AND `)}` : undefined,
      orderBy: (products, { desc }) => [desc(products.createdAt)]
    });
    
    return { success: true, message: 'Products fetched', data: products };
  }

  static async getById(id: number): Promise<ServiceResponse> {
    const product = await db.query.products.findFirst({
      where: eq(tables.products.id, id),
      with: {
        barcodes: true,
        stockMovements: {
          limit: 10,
          orderBy: (movements, { desc }) => [desc(movements.createdAt)]
        }
      }
    });
    
    if (!product) {
      throw createError({ statusCode: 404, message: 'Product not found' });
    }
    
    return { success: true, message: 'Product fetched', data: product };
  }

  static async create(event: H3Event): Promise<ServiceResponse> {
    const body = await readBody(event);
    
    const exists = await db.query.products.findFirst({
      where: eq(tables.products.sku, (body as any)?.sku || '')
    });
    
    if (exists) {
      throw createError({ statusCode: 409, message: 'Product with this SKU already exists' });
    }
    
    const [product] = await db.insert(tables.products)
      .values({
        name: (body as any)?.name || '',
        sku: (body as any)?.sku || '',
        barcode: (body as any)?.barcode || null,
        price: (body as any)?.price || 0,
        costPrice: (body as any)?.costPrice || 0,
        quantity: (body as any)?.quantity || 0,
        minStock: (body as any)?.minStock || 5,
        wholesalePrice: (body as any)?.wholesalePrice || null,
        wholesaleMin: (body as any)?.wholesaleMin || 10,
        category: (body as any)?.category || null,
        unit: (body as any)?.unit || 'pcs', 
        piecesPerUnit: (body as any)?.piecesPerUnit || 1
      })
      .returning();
    
    if ((body as any)?.quantity > 0) {
      await db.insert(tables.stockMovements).values({
        productId: product.id,
        change: (body as any)?.quantity || 0,
        newQuantity: (body as any)?.quantity || 0,
        reason: 'adjust',
        reference: 'Initial stock'
      });
    }
    
    return { success: true, message: 'Product created', data: product };
  }

  static async update(event: H3Event, id: number): Promise<ServiceResponse> {
    const body = await readBody(event);
    
    const existing = await db.query.products.findFirst({
      where: eq(tables.products.id, id)
    });
    
    if (!existing) {
      throw createError({ statusCode: 404, message: 'Product not found' });
    }
    
    if ((body as any)?.price && (body as any)?.price !== existing.price) {
      await db.insert(tables.priceHistory).values({
        productId: id,
        oldPrice: existing.price,
        newPrice: (body as any)?.price || 0
      });
    }
    
    const [product] = await db.update(tables.products)
      .set({
        name: (body as any)?.name || '',
        price: (body as any)?.price || 0,
        costPrice: (body as any)?.costPrice || 0,
        minStock: (body as any)?.minStock || 5,
        wholesalePrice: (body as any)?.wholesalePrice || null,
        wholesaleMin: (body as any)?.wholesaleMin || 10,
        category: (body as any)?.category || null,
        unit: (body as any)?.unit || 'pcs',
        piecesPerUnit: (body as any)?.piecesPerUnit || 1,
        updatedAt: new Date()
      })
      .where(eq(tables.products.id, id))
      .returning();
    
    return { success: true, message: 'Product updated', data: product };
  }

  static async delete(id: number): Promise<ServiceResponse> {
    const product = await db.query.products.findFirst({
      where: eq(tables.products.id, id)
    });
    
    if (!product) {
      throw createError({ statusCode: 404, message: 'Product not found' });
    }
    
    await db.delete(tables.products).where(eq(tables.products.id, id));
    
    return { success: true, message: 'Product deleted' };
  }

  static async uploadExcel(event: H3Event): Promise<ServiceResponse> {
    const form = await readMultipartFormData(event);
    
    if (!form || !form[0]) {
      throw createError({ statusCode: 400, message: 'No file uploaded' });
    }
    
    const fileData = form[0].data;
    const workbook = XLSX.read(fileData);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet) as any[];
    
    const created = [];
    const errors = [];
    
    for (const row of rows) {
      try {
        const exists = await db.query.products.findFirst({
          where: eq(tables.products.sku, row.sku)
        });
        
        if (exists) {
          errors.push({ sku: row.sku, error: 'Already exists' });
          continue;
        }
        
        const [product] = await db.insert(tables.products)
          .values({
            name: row.name || '',
            sku: row.sku || '',
            barcode: row.barcode || null,
            price: parseFloat(row.price || '0'),
            costPrice: parseFloat(row.costPrice || '0'),
            quantity: parseInt(row.quantity || '0') || 0,
            minStock: parseInt(row.minStock || '5') || 5,
            wholesalePrice: row.wholesalePrice ? parseFloat(row.wholesalePrice || '0') : null,
            wholesaleMin: parseInt(row.wholesaleMin || '10') || 10,
            category: row.category || null,
            unit: row.unit || 'pcs',
            piecesPerUnit: parseInt(row.piecesPerUnit || '1') || 1
          })
          .returning();
        
        if (product.quantity > 0) {
          await db.insert(tables.stockMovements).values({
            productId: product.id,
            change: product.quantity,
            newQuantity: product.quantity,
            reason: 'adjust',
            reference: 'Excel upload'
          });
        }
        
        created.push(product);
      } catch (error: any) {
        errors.push({ sku: row.sku, error: error.message });
      }
    }
    
    return {
      success: true,
      message: `Imported ${created.length} products`,
      data: { created: created.length, errors }
    };
  }

  static getTemplate(): Buffer {
    const template = [
      {
        name: 'Sample Product',
        sku: 'SKU001',
        barcode: '1234567890',
        price: 100,
        costPrice: 70,
        quantity: 50,
        minStock: 10,
        wholesalePrice: 85,
        wholesaleMin: 20,
        category: 'Drinks',
        unit: 'pcs',
        piecesPerUnit: 1
      }
    ];
    
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Products');
    
    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  }

  static async getLowStock(): Promise<ServiceResponse> {
    const lowStock = await db.query.products.findMany({
      where: sql`${tables.products.quantity} <= ${tables.products.minStock}`,
      orderBy: (products, { asc }) => [asc(products.quantity)]
    });
    
    return { success: true, message: 'Low stock products', data: lowStock };
  }
}