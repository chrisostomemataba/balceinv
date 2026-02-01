import { H3Event, createError } from 'h3';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { db, tables } from '../utils/db';

interface ServiceResponse { 
  success: boolean; 
  message: string; 
  data?: any;
}

export class UsersService {
  static async getAll(): Promise<ServiceResponse> {
    const users = await db.query.users.findMany({
      with: {
        role: true,
      },
      columns: {
        passwordHash: false,
      },
    });
    
    return { 
      success: true, 
      message: 'Users fetched', 
      data: users 
    };
  }

  static async getById(id: number): Promise<ServiceResponse> {
    const user = await db.query.users.findFirst({
      where: eq(tables.users.id, id),
      with: {
        role: true,
      },
      columns: {
        passwordHash: false,
      },
    });
    
    if (!user) {
      throw createError({ statusCode: 404, message: 'User not found' });
    }
    
    return { 
      success: true, 
      message: 'User fetched', 
      data: user 
    };
  }

  static async create(event: H3Event): Promise<ServiceResponse> {
    const body = await readBody(event) as { 
      name?: string; 
      email?: string; 
      password?: string; 
      roleId?: number;
    };
    
    const { name, email, password, roleId } = body;
    
    if (!name || !email || !password || !roleId) {
      throw createError({ 
        statusCode: 400, 
        message: 'Name, email, password, and role are required' 
      });
    }
    
    const exists = await db.query.users.findFirst({
      where: eq(tables.users.email, email),
    });
    
    if (exists) {
      throw createError({ statusCode: 409, message: 'User already exists' });
    }
    
    const role = await db.query.roles.findFirst({
      where: eq(tables.roles.id, roleId),
    });
    
    if (!role) {
      throw createError({ statusCode: 404, message: 'Role not found' });
    }
    
    const passwordHash = await bcrypt.hash(password, 10);
    
    const [user] = await db.insert(tables.users)
      .values({
        name,
        email,
        passwordHash,
        roleId,
      })
      .returning();
    
    return { 
      success: true, 
      message: 'User created successfully', 
      data: { 
        id: user.id, 
        name: user.name, 
        email: user.email,
        roleId: user.roleId,
      } 
    };
  }

  static async update(event: H3Event, id: number): Promise<ServiceResponse> {
    const body = await readBody(event) as { 
      name?: string; 
      email?: string; 
      roleId?: number;
    };
    
    const { name, email, roleId } = body;
    
    const user = await db.query.users.findFirst({
      where: eq(tables.users.id, id),
    });
    
    if (!user) {
      throw createError({ statusCode: 404, message: 'User not found' });
    }
    
    if (email && email !== user.email) {
      const emailExists = await db.query.users.findFirst({
        where: eq(tables.users.email, email),
      });
      
      if (emailExists) {
        throw createError({ statusCode: 409, message: 'Email already in use' });
      }
    }
    
    if (roleId) {
      const role = await db.query.roles.findFirst({
        where: eq(tables.roles.id, roleId),
      });
      
      if (!role) {
        throw createError({ statusCode: 404, message: 'Role not found' });
      }
    }
    
    const [updatedUser] = await db.update(tables.users)
      .set({
        name: name || user.name,
        email: email || user.email,
        roleId: roleId || user.roleId,
        updatedAt: new Date(),
      })
      .where(eq(tables.users.id, id))
      .returning();
    
    return { 
      success: true, 
      message: 'User updated successfully', 
      data: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        roleId: updatedUser.roleId,
      }
    };
  }

  static async updatePassword(event: H3Event): Promise<ServiceResponse> {
    const body = await readBody(event) as { 
      userId?: number; 
      newPassword?: string;
    };
    
    const { userId, newPassword } = body;
    
    if (!userId || !newPassword) {
      throw createError({ 
        statusCode: 400, 
        message: 'User ID and new password are required' 
      });
    }
    
    if (newPassword.length < 6) {
      throw createError({ 
        statusCode: 400, 
        message: 'Password must be at least 6 characters long' 
      });
    }
    
    const user = await db.query.users.findFirst({
      where: eq(tables.users.id, userId),
    });
    
    if (!user) {
      throw createError({ statusCode: 404, message: 'User not found' });
    }
    
    const passwordHash = await bcrypt.hash(newPassword, 10);
    
    await db.update(tables.users)
      .set({
        passwordHash,
        updatedAt: new Date(),
      })
      .where(eq(tables.users.id, userId));
    
    await db.delete(tables.sessions)
      .where(eq(tables.sessions.userId, userId));
    
    return { 
      success: true, 
      message: 'Password updated successfully. User sessions have been cleared.' 
    };
  }

  static async delete(id: number): Promise<ServiceResponse> {
    const user = await db.query.users.findFirst({
      where: eq(tables.users.id, id),
    });
    
    if (!user) {
      throw createError({ statusCode: 404, message: 'User not found' });
    }
    
    await db.delete(tables.sessions)
      .where(eq(tables.sessions.userId, id));
    
    await db.delete(tables.users)
      .where(eq(tables.users.id, id));
    
    return { 
      success: true, 
      message: 'User deleted successfully' 
    };
  }
}