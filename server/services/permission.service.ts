import { H3Event, createError } from 'h3';
import { eq, and, inArray } from 'drizzle-orm';
import { db, tables } from '../utils/db';

interface ServiceResponse { 
  success: boolean; 
  message: string; 
  data?: any;
}

export class PermissionsService {
  static async getAll(): Promise<ServiceResponse> {
    const permissions = await db.query.permissions.findMany({
      orderBy: (permissions, { asc }) => [asc(permissions.resource), asc(permissions.action)],
    });
    
    return { 
      success: true, 
      message: 'Permissions fetched', 
      data: permissions 
    };
  }

  static async getById(id: number): Promise<ServiceResponse> {
    const permission = await db.query.permissions.findFirst({
      where: eq(tables.permissions.id, id),
    });
    
    if (!permission) {
      throw createError({ statusCode: 404, message: 'Permission not found' });
    }
    
    return { 
      success: true, 
      message: 'Permission fetched', 
      data: permission 
    };
  }

  static async getRolePermissions(roleId: number): Promise<ServiceResponse> {
    const rolePermissions = await db.query.rolePermissions.findMany({
      where: eq(tables.rolePermissions.roleId, roleId),
      with: {
        permission: true,
      },
    });
    
    const permissions = rolePermissions.map(rp => rp.permission);
    
    return { 
      success: true, 
      message: 'Role permissions fetched', 
      data: permissions 
    };
  }

  static async getUserPermissions(userId: number): Promise<ServiceResponse> {
    const user = await db.query.users.findFirst({
      where: eq(tables.users.id, userId),
      with: {
        role: {
          with: {
            rolePermissions: {
              with: {
                permission: true,
              },
            },
          },
        },
      },
    });
    
    if (!user) {
      throw createError({ statusCode: 404, message: 'User not found' });
    }
    
    const rolePermissions = user.role?.rolePermissions?.map(rp => rp.permission) || [];
    
    const userPermissions = await db.query.userPermissions.findMany({
      where: eq(tables.userPermissions.userId, userId),
      with: {
        permission: true,
      },
    });
    
    const extraPermissions = userPermissions.map(up => up.permission);
    
    const allPermissions = [...rolePermissions, ...extraPermissions];
    const uniquePermissions = Array.from(
      new Map(allPermissions.map(p => [p.id, p])).values()
    );
    
    return { 
      success: true, 
      message: 'User permissions fetched', 
      data: uniquePermissions 
    };
  }

  static async assignPermissionsToRole(event: H3Event): Promise<ServiceResponse> {
    const body = await readBody(event) as { 
      roleId?: number; 
      permissionIds?: number[];
    };
    const { roleId, permissionIds } = body;
    
    if (!roleId || !permissionIds || !Array.isArray(permissionIds)) {
      throw createError({ 
        statusCode: 400, 
        message: 'Role ID and permission IDs are required' 
      });
    }
    
    const role = await db.query.roles.findFirst({
      where: eq(tables.roles.id, roleId),
    });
    
    if (!role) {
      throw createError({ statusCode: 404, message: 'Role not found' });
    }
    
    await db.delete(tables.rolePermissions)
      .where(eq(tables.rolePermissions.roleId, roleId));
    
    if (permissionIds.length > 0) {
      const values = permissionIds.map(permissionId => ({
        roleId,
        permissionId,
      }));
      
      await db.insert(tables.rolePermissions).values(values);
    }
    
    return { 
      success: true, 
      message: 'Permissions assigned to role successfully' 
    };
  }

  static async assignPermissionsToUser(event: H3Event): Promise<ServiceResponse> {
    const body = await readBody(event) as { 
      userId?: number; 
      permissionIds?: number[];
    };
    const { userId, permissionIds } = body;
    
    if (!userId || !permissionIds || !Array.isArray(permissionIds)) {
      throw createError({ 
        statusCode: 400, 
        message: 'User ID and permission IDs are required' 
      });
    }
    
    const user = await db.query.users.findFirst({
      where: eq(tables.users.id, userId),
    });
    
    if (!user) {
      throw createError({ statusCode: 404, message: 'User not found' });
    }
    
    await db.delete(tables.userPermissions)
      .where(eq(tables.userPermissions.userId, userId));
    
    if (permissionIds.length > 0) {
      const values = permissionIds.map(permissionId => ({
        userId,
        permissionId,
      }));
      
      await db.insert(tables.userPermissions).values(values);
    }
    
    return { 
      success: true, 
      message: 'Permissions assigned to user successfully' 
    };
  }

  static async checkPermission(
    userId: number, 
    resource: string, 
    action: string
  ): Promise<boolean> {
    const result = await this.getUserPermissions(userId);
    const permissions = result.data;
    
    return permissions.some(
      (p: any) => p.resource === resource && p.action === action
    );
  }
}