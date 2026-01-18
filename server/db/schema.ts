import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { relations, sql } from 'drizzle-orm';
import { InferSelectModel } from 'drizzle-orm';


export const roles = sqliteTable('roles', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').unique().notNull(),
});


export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  email: text('email').unique().notNull(),
  passwordHash: text('password_hash').notNull(),
  roleId: integer('role_id').notNull().references(() => roles.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
});

export const sessions = sqliteTable('sessions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  refreshToken: text('refresh_token').unique().notNull(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
});


export const loginLogs = sqliteTable('login_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  loginTime: integer('login_time', { mode: 'timestamp' }).default(sql`(unixepoch())`),
});


export const products = sqliteTable('products', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  sku: text('sku').unique().notNull(),
  barcode: text('barcode').unique(), 
  
  // Simple pricing
  price: real('price').notNull(), // Selling price
  costPrice: real('cost_price').notNull(), // What you bought it for
  
  // Simple stock tracking
  quantity: integer('quantity').notNull().default(0),
  minStock: integer('min_stock').default(5), // When to reorder
  
  // Optional: For wholesale tracking
  wholesalePrice: real('wholesale_price'),
  wholesaleMin: integer('wholesale_min').default(10), // Minimum for wholesale price
  
  // Simple categorization
  category: text('category'), // Just a text field: "Drinks", "Food", etc.
  
  // Unit tracking (super simple)
  unit: text('unit').default('pcs'), // 'pcs', 'btl', 'crt', 'kg', 'L'
  piecesPerUnit: integer('pieces_per_unit').default(1), // For crates: 24 bottles
  
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
});

// --- Suppliers (Simple & Optional) ---
export const suppliers = sqliteTable('suppliers', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  phone: text('phone'), // Just phone number - that's all shops need
  notes: text('notes'), // Any extra info (area, contact person, etc.)
  
  // No email, no address unless needed
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
});

// --- Sales (Simple checkout) ---
export const sales = sqliteTable('sales', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  
  // No customer name - just track sales
  receiptNumber: text('receipt_number').unique().notNull(), // Auto-generated: "SALE-001"
  
  // Simple payment info
  userId: integer('user_id').notNull().references(() => users.id),
  totalAmount: real('total_amount').notNull(),
  paymentType: text('payment_type', { enum: ['cash', 'card', 'mobile'] }).notNull(),
  
  // Optional: For wholesale vs retail
  saleType: text('sale_type', { enum: ['retail', 'wholesale'] }).default('retail'),
  
  // Simple tax if needed
  taxAmount: real('tax_amount').default(0),
  
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
});

// --- Sale Items ---
export const saleItems = sqliteTable('sale_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  saleId: integer('sale_id').notNull().references(() => sales.id),
  productId: integer('product_id').notNull().references(() => products.id),
  
  // What was sold
  quantity: integer('quantity').notNull(),
  unitPrice: real('unit_price').notNull(), // Price at time of sale
  totalPrice: real('total_price').notNull(),
  
  // Track if it was wholesale price
  isWholesale: integer('is_wholesale', { mode: 'boolean' }).default(false),
});

// --- Stock Movements (Simple tracking) ---
export const stockMovements = sqliteTable('stock_movements', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  productId: integer('product_id').notNull().references(() => products.id),
  change: integer('change').notNull(), // + for add, - for remove
  newQuantity: integer('new_quantity').notNull(), // Stock after change
  
  // Simple reason
  reason: text('reason', { enum: ['sale', 'purchase', 'adjust', 'damage'] }).notNull(),
  
  // Optional reference
  reference: text('reference'), // Receipt number or purchase ref
  
  userId: integer('user_id').references(() => users.id),
  
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
});

// --- Price History (Simple tracking) ---
export const priceHistory = sqliteTable('price_history', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  productId: integer('product_id').notNull().references(() => products.id),
  
  // Just track price changes
  oldPrice: real('old_price'),
  newPrice: real('new_price'),
  
  // Optional: who changed it
  userId: integer('user_id').references(() => users.id),
  
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
});

// --- Simple Stock Alerts ---
export const stockAlerts = sqliteTable('stock_alerts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  productId: integer('product_id').notNull().references(() => products.id),
  currentQuantity: integer('current_quantity').notNull(),
  threshold: integer('threshold').notNull(), 
  alertType: text('alert_type', { enum: ['low', 'out'] }).notNull(),
  
  isSeen: integer('is_seen', { mode: 'boolean' }).default(false),
  
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
});

// --- Purchase Records (Simple) ---
export const purchases = sqliteTable('purchases', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  supplierId: integer('supplier_id').references(() => suppliers.id),
  invoiceNumber: text('invoice_number'),
  totalCost: real('total_cost').notNull(),
  supplierName: text('supplier_name'),
  userId: integer('user_id').references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
});

// --- Purchase Items ---
export const purchaseItems = sqliteTable('purchase_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  purchaseId: integer('purchase_id').notNull().references(() => purchases.id),
  productId: integer('product_id').references(() => products.id),
  
  // What was bought
  productName: text('product_name').notNull(), 
  quantity: integer('quantity').notNull(),
  unitCost: real('unit_cost').notNull(),
  totalCost: real('total_cost').notNull(),
});

// --- Barcode Mapping (Simple) ---
export const barcodes = sqliteTable('barcodes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  productId: integer('product_id').notNull().references(() => products.id),
  code: text('code').unique().notNull(), 
  packSize: integer('pack_size').default(1), 
  
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
});

// --- Relations ---
export const usersRelations = relations(users, ({ one, many }) => ({
  role: one(roles, { fields: [users.roleId], references: [roles.id] }),
  sessions: many(sessions),
  sales: many(sales),
  stockMovements: many(stockMovements),
  loginLogs: many(loginLogs), 
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  saleItems: many(saleItems),
  stockMovements: many(stockMovements),
  priceHistory: many(priceHistory),
  stockAlerts: many(stockAlerts),
  barcodes: many(barcodes),
}));

export const salesRelations = relations(sales, ({ one, many }) => ({
  user: one(users, { fields: [sales.userId], references: [users.id] }),
  items: many(saleItems),
}));

// Types
export type Role = InferSelectModel<typeof roles>;
export type User = InferSelectModel<typeof users>;
export type Product = InferSelectModel<typeof products>;
export type Supplier = InferSelectModel<typeof suppliers>;
export type Sale = InferSelectModel<typeof sales>;
export type SaleItem = InferSelectModel<typeof saleItems>;
export type StockMovement = InferSelectModel<typeof stockMovements>;
export type PriceHistory = InferSelectModel<typeof priceHistory>;
export type StockAlert = InferSelectModel<typeof stockAlerts>;
export type Purchase = InferSelectModel<typeof purchases>;
export type PurchaseItem = InferSelectModel<typeof purchaseItems>;
export type Barcode = InferSelectModel<typeof barcodes>;