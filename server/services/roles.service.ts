import { H3Event, createError } from 'h3';
import { eq } from 'drizzle-orm';
import { db, tables } from '../utils/db';

interface ServiceResponse { success: boolean; message: string; data?: any }

export class RolesService {
  static async getAll(): Promise<ServiceResponse> {
    const roles = await db.query.roles.findMany({
      with: {
        users: {
          columns: { id: true, name: true, email: true }
        }
      }
    });
    return { success: true, message: 'Roles fetched', data: roles };
  }

  static async getById(id: number): Promise<ServiceResponse> {
    const role = await db.query.roles.findFirst({
      where: eq(tables.roles.id, id),
      with: {
        users: {
          columns: { id: true, name: true, email: true }
        }
      }
    });
    
    if (!role) {
      throw createError({ statusCode: 404, message: 'Role not found' });
    }
    
    return { success: true, message: 'Role fetched', data: role };
  }

  static async create(event: H3Event): Promise<ServiceResponse> {
    const { name } = await readBody(event);
    
    const exists = await db.query.roles.findFirst({
      where: eq(tables.roles.name, name)
    });
    
    if (exists) {
      throw createError({ statusCode: 409, message: 'Role already exists' });
    }
    
    const [role] = await db.insert(tables.roles)
      .values({ name })
      .returning();
    
    return { success: true, message: 'Role created', data: role };
  }

  static async update(event: H3Event, id: number): Promise<ServiceResponse> {
    const { name } = await readBody(event);
    
    const exists = await db.query.roles.findFirst({
      where: eq(tables.roles.id, id)
    });
    
    if (!exists) {
      throw createError({ statusCode: 404, message: 'Role not found' });
    }
    
    const [role] = await db.update(tables.roles)
      .set({ name })
      .where(eq(tables.roles.id, id))
      .returning();
    
    return { success: true, message: 'Role updated', data: role };
  }

  static async delete(id: number): Promise<ServiceResponse> {
    const usersWithRole = await db.query.users.findFirst({
      where: eq(tables.users.roleId, id)
    });
    
    if (usersWithRole) {
      throw createError({ 
        statusCode: 400, 
        message: 'Cannot delete role with assigned users' 
      });
    }
    
    await db.delete(tables.roles).where(eq(tables.roles.id, id));
    
    return { success: true, message: 'Role deleted' };
  }

  static async assignRole(event: H3Event): Promise<ServiceResponse> {
    const { userId, roleId } = await readBody(event);
    
    const user = await db.query.users.findFirst({
      where: eq(tables.users.id, userId)
    });
    
    if (!user) {
      throw createError({ statusCode: 404, message: 'User not found' });
    }
    
    const role = await db.query.roles.findFirst({
      where: eq(tables.roles.id, roleId)
    });
    
    if (!role) {
      throw createError({ statusCode: 404, message: 'Role not found' });
    }
    
    await db.update(tables.users)
      .set({ roleId })
      .where(eq(tables.users.id, userId));
    
    return { success: true, message: 'Role assigned to user' };
  }
}