import { db, tables } from '../utils/db';
import bcrypt from 'bcryptjs';
import { eq, and } from 'drizzle-orm';

const SUPER_USER_EMAIL = 'admin@example.com';
const SUPER_USER_PASSWORD = 'Admin@123';
const SUPER_USER_NAME = 'Super Administrator';

const roles = [
  { id: 1, name: 'SuperAdmin' },
  { id: 2, name: 'Admin' },
  { id: 3, name: 'Manager' },
  { id: 4, name: 'Cashier' },
];

const permissions = [
  { name: 'POS - View', resource: 'pos', action: 'view', description: 'Access the Point of Sale system' },
  { name: 'POS - Create', resource: 'pos', action: 'create', description: 'Process sales transactions' },
  
  { name: 'Sales - View', resource: 'sales', action: 'view', description: 'View sales history' },
  { name: 'Sales - Create', resource: 'sales', action: 'create', description: 'Create new sales records' },
  { name: 'Sales - Edit', resource: 'sales', action: 'edit', description: 'Modify sales records' },
  { name: 'Sales - Delete', resource: 'sales', action: 'delete', description: 'Delete sales records' },
  
  { name: 'Products - View', resource: 'products', action: 'view', description: 'View product catalog' },
  { name: 'Products - Create', resource: 'products', action: 'create', description: 'Add new products' },
  { name: 'Products - Edit', resource: 'products', action: 'edit', description: 'Modify product details' },
  { name: 'Products - Delete', resource: 'products', action: 'delete', description: 'Remove products' },
  
  { name: 'Stock Movements - View', resource: 'stock-movements', action: 'view', description: 'View stock movement history' },
  { name: 'Stock Movements - Create', resource: 'stock-movements', action: 'create', description: 'Record stock movements' },
  { name: 'Stock Movements - Edit', resource: 'stock-movements', action: 'edit', description: 'Modify stock movements' },
  { name: 'Stock Movements - Delete', resource: 'stock-movements', action: 'delete', description: 'Remove stock movements' },
  
  { name: 'Reports - View', resource: 'reports', action: 'view', description: 'Access business reports' },
  { name: 'Reports - Create', resource: 'reports', action: 'create', description: 'Generate new reports' },
  
  { name: 'Notifications - View', resource: 'notifications', action: 'view', description: 'View system notifications' },
  
  { name: 'Users - View', resource: 'users', action: 'view', description: 'View user list' },
  { name: 'Users - Create', resource: 'users', action: 'create', description: 'Add new users' },
  { name: 'Users - Edit', resource: 'users', action: 'edit', description: 'Modify user details' },
  { name: 'Users - Delete', resource: 'users', action: 'delete', description: 'Remove users' },
  
  { name: 'Roles - View', resource: 'roles', action: 'view', description: 'View roles list' },
  { name: 'Roles - Create', resource: 'roles', action: 'create', description: 'Create new roles' },
  { name: 'Roles - Edit', resource: 'roles', action: 'edit', description: 'Modify role details' },
  { name: 'Roles - Delete', resource: 'roles', action: 'delete', description: 'Remove roles' },
  
  { name: 'Settings - View', resource: 'settings', action: 'view', description: 'Access system settings' },
  { name: 'Settings - Edit', resource: 'settings', action: 'edit', description: 'Modify system settings' },
];

const rolePermissionMappings = {
  SuperAdmin: [
    'pos:view', 'pos:create',
    'sales:view', 'sales:create', 'sales:edit', 'sales:delete',
    'products:view', 'products:create', 'products:edit', 'products:delete',
    'stock-movements:view', 'stock-movements:create', 'stock-movements:edit', 'stock-movements:delete',
    'reports:view', 'reports:create',
    'notifications:view',
    'users:view', 'users:create', 'users:edit', 'users:delete',
    'roles:view', 'roles:create', 'roles:edit', 'roles:delete',
    'settings:view', 'settings:edit',
  ],
  Admin: [
    'pos:view', 'pos:create',
    'sales:view', 'sales:create', 'sales:edit', 'sales:delete',
    'products:view', 'products:create', 'products:edit', 'products:delete',
    'stock-movements:view', 'stock-movements:create', 'stock-movements:edit', 'stock-movements:delete',
    'reports:view', 'reports:create',
    'notifications:view',
    'users:view', 'users:create', 'users:edit',
    'settings:view',
  ],
  Manager: [
    'pos:view', 'pos:create',
    'sales:view', 'sales:create', 'sales:edit',
    'products:view', 'products:create', 'products:edit',
    'stock-movements:view', 'stock-movements:create', 'stock-movements:edit',
    'reports:view', 'reports:create',
    'notifications:view',
  ],
  Cashier: [
    'pos:view', 'pos:create',
    'sales:view',
    'products:view',
  ],
};

async function seedRoles() {
  console.log('Seeding roles...');
  
  for (const role of roles) {
    const existing = await db.query.roles.findFirst({
      where: eq(tables.roles.name, role.name),
    });
    
    if (!existing) {
      await db.insert(tables.roles).values(role);
      console.log(`Created role: ${role.name}`);
    } else {
      console.log(`Role already exists: ${role.name}`);
    }
  }
}

async function seedPermissions() {
  console.log('Seeding permissions...');
  
  for (const permission of permissions) {
    const existing = await db.query.permissions.findFirst({
      where: and(
        eq(tables.permissions.resource, permission.resource),
        eq(tables.permissions.action, permission.action)
      ),
    });
    
    if (!existing) {
      await db.insert(tables.permissions).values(permission);
      console.log(`Created permission: ${permission.name}`);
    } else {
      console.log(`Permission already exists: ${permission.name}`);
    }
  }
}

async function seedRolePermissions() {
  console.log('Seeding role permissions...');
  
  for (const [roleName, permissionKeys] of Object.entries(rolePermissionMappings)) {
    const role = await db.query.roles.findFirst({
      where: eq(tables.roles.name, roleName),
    });
    
    if (!role) {
      console.log(`Role not found: ${roleName}`);
      continue;
    }
    
    await db.delete(tables.rolePermissions)
      .where(eq(tables.rolePermissions.roleId, role.id));
    
    for (const permissionKey of permissionKeys) {
      const [resource, action] = permissionKey.split(':');
      
      const permission = await db.query.permissions.findFirst({
        where: and(
          eq(tables.permissions.resource, resource),
          eq(tables.permissions.action, action)
        ),
      });
      
      if (permission) {
        await db.insert(tables.rolePermissions).values({
          roleId: role.id,
          permissionId: permission.id,
        });
      }
    }
    
    console.log(`Assigned ${permissionKeys.length} permissions to ${roleName}`);
  }
}

async function seedSuperUser() {
  console.log('Seeding super user...');
  
  const superAdminRole = await db.query.roles.findFirst({
    where: eq(tables.roles.name, 'SuperAdmin'),
  });
  
  if (!superAdminRole) {
    console.error('SuperAdmin role not found');
    return;
  }
  
  const existingUser = await db.query.users.findFirst({
    where: eq(tables.users.email, SUPER_USER_EMAIL),
  });
  
  if (existingUser) {
    console.log(`Super user already exists: ${SUPER_USER_EMAIL}`);
    return;
  }
  
  const passwordHash = await bcrypt.hash(SUPER_USER_PASSWORD, 10);
  
  await db.insert(tables.users).values({
    name: SUPER_USER_NAME,
    email: SUPER_USER_EMAIL,
    passwordHash,
    roleId: superAdminRole.id,
  });
  
  console.log(`Created super user: ${SUPER_USER_EMAIL}`);
  console.log(`Password: ${SUPER_USER_PASSWORD}`);
}

async function main() {
  try {
    console.log('Starting database seed...');
    
    await seedRoles();
    await seedPermissions();
    await seedRolePermissions();
    await seedSuperUser();
    
    console.log('Database seed completed successfully!');
    console.log('\n=== Super User Credentials ===');
    console.log(`Email: ${SUPER_USER_EMAIL}`);
    console.log(`Password: ${SUPER_USER_PASSWORD}`);
    console.log('==============================\n');
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
}

main();