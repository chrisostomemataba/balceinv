import { H3Event, createError, readBody } from 'h3';
import { eq } from 'drizzle-orm';
import { db, tables } from '../utils/db';

interface ServiceResponse<T = unknown> { 
  success: boolean; 
  message: string; 
  data?: T;
}

interface SettingsData {
  id: number;
  businessName: string | null;
  businessAddress: string | null;
  businessPhone: string | null;
  businessTIN: string | null;
  receiptHeader: string | null;
  receiptFooter: string | null;
  businessLogo: string | null;
  primaryColor: string;
  taxRate: number;
  currency: string;
  currencySymbol: string;
  dateFormat: string;
  receiptNumberFormat: string;
  efdEnabled: boolean;
  efdEndpoint: string | null;
  efdApiKey: string | null;
  efdLastTestDate: Date | null;
  efdTestStatus: string | null;
  lowStockThreshold: number;
  emailNotificationsEnabled: boolean;
  notificationEmail: string | null;
  alertSoundEnabled: boolean;
  alertOnLowStock: boolean;
  alertOnOutOfStock: boolean;
  alertOnDeadStock: boolean;
  deadStockDays: number;
  printReceiptAutomatically: boolean;
  showTaxOnReceipt: boolean;
  showBarcodesOnReceipt: boolean;
  updatedBy: number | null;
  createdAt: Date;
  updatedAt: Date;
}

interface UpdateSettingsInput {
  businessName?: string;
  businessAddress?: string;
  businessPhone?: string;
  businessTIN?: string;
  receiptHeader?: string;
  receiptFooter?: string;
  businessLogo?: string;
  primaryColor?: string;
  taxRate?: number;
  currency?: string;
  currencySymbol?: string;
  dateFormat?: string;
  receiptNumberFormat?: string;
  efdEnabled?: boolean;
  efdEndpoint?: string;
  efdApiKey?: string;
  lowStockThreshold?: number;
  emailNotificationsEnabled?: boolean;
  notificationEmail?: string;
  alertSoundEnabled?: boolean;
  alertOnLowStock?: boolean;
  alertOnOutOfStock?: boolean;
  alertOnDeadStock?: boolean;
  deadStockDays?: number;
  printReceiptAutomatically?: boolean;
  showTaxOnReceipt?: boolean;
  showBarcodesOnReceipt?: boolean;
}

export class SettingsService {
  static async getSettings(): Promise<ServiceResponse<SettingsData>> {
    let settings = await db.query.settings.findFirst();

    if (!settings) {
      const [newSettings] = await db.insert(tables.settings)
        .values({
          primaryColor: '#3b82f6',
          taxRate: 18.0,
          currency: 'TZS',
          currencySymbol: 'TZS',
          dateFormat: 'DD/MM/YYYY',
          receiptNumberFormat: 'SALE-{TIMESTAMP}-{COUNTER}',
          efdEnabled: false,
          lowStockThreshold: 5,
          emailNotificationsEnabled: false,
          alertSoundEnabled: true,
          alertOnLowStock: true,
          alertOnOutOfStock: true,
          alertOnDeadStock: false,
          deadStockDays: 30,
          printReceiptAutomatically: false,
          showTaxOnReceipt: true,
          showBarcodesOnReceipt: false
        })
        .returning();
      
      settings = newSettings;
    }

    return { 
      success: true, 
      message: 'Settings fetched', 
      data: settings as SettingsData 
    };
  }

  static async updateSettings(
    event: H3Event, 
    userId: number
  ): Promise<ServiceResponse<SettingsData>> {
    const body = await readBody<UpdateSettingsInput>(event);

    let settings = await db.query.settings.findFirst();

    if (!settings) {
      const getResult = await this.getSettings();
      settings = getResult.data!;
    }

    const [updatedSettings] = await db.update(tables.settings)
      .set({
        ...body,
        updatedBy: userId,
        updatedAt: new Date()
      })
      .where(eq(tables.settings.id, settings.id))
      .returning();

    return { 
      success: true, 
      message: 'Settings updated successfully', 
      data: updatedSettings as SettingsData 
    };
  }

  static async testEFDConnection(event: H3Event): Promise<ServiceResponse<{
    status: 'success' | 'failed';
    message: string;
  }>> {
    const body = await readBody<{ endpoint: string; apiKey: string }>(event);

    try {
      const response = await fetch(body.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${body.apiKey}`
        },
        body: JSON.stringify({
          test: true,
          timestamp: new Date().toISOString()
        })
      });

      const settings = await db.query.settings.findFirst();
      
      if (settings) {
        await db.update(tables.settings)
          .set({
            efdLastTestDate: new Date(),
            efdTestStatus: response.ok ? 'success' : 'failed'
          })
          .where(eq(tables.settings.id, settings.id));
      }

      if (!response.ok) {
        return {
          success: false,
          message: 'EFD connection failed',
          data: {
            status: 'failed',
            message: `HTTP ${response.status}: ${response.statusText}`
          }
        };
      }

      return {
        success: true,
        message: 'EFD connection successful',
        data: {
          status: 'success',
          message: 'Successfully connected to EFD endpoint'
        }
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      const settings = await db.query.settings.findFirst();
      if (settings) {
        await db.update(tables.settings)
          .set({
            efdLastTestDate: new Date(),
            efdTestStatus: 'failed'
          })
          .where(eq(tables.settings.id, settings.id));
      }

      return {
        success: false,
        message: 'EFD connection failed',
        data: {
          status: 'failed',
          message: errorMessage
        }
      };
    }
  }

  static async uploadLogo(event: H3Event): Promise<ServiceResponse<{ logoUrl: string }>> {
    const formData = await readMultipartFormData(event);
    
    if (!formData || !formData[0]) {
      throw createError({ statusCode: 400, message: 'No file uploaded' });
    }

    const file = formData[0];
    const base64Data = file.data.toString('base64');
    const mimeType = file.type || 'image/png';
    const logoUrl = `data:${mimeType};base64,${base64Data}`;

    const settings = await db.query.settings.findFirst();
    
    if (settings) {
      await db.update(tables.settings)
        .set({ businessLogo: logoUrl })
        .where(eq(tables.settings.id, settings.id));
    }

    return {
      success: true,
      message: 'Logo uploaded successfully',
      data: { logoUrl }
    };
  }
}