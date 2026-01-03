import { H3Event, setCookie, deleteCookie, getCookie, createError } from 'h3';
import { eq, and } from 'drizzle-orm';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { SessionWithUser } from '../db/schema'
import { db, tables } from '../utils/db';

const ACCESS_SECRET = process.env.ACCESS_TOKEN_SECRET || 'access-secret-key';
const REFRESH_SECRET = process.env.REFRESH_TOKEN_SECRET || 'refresh-secret-key';

type TokenPayload = { userId: number; role: string; email: string };
interface AuthResponse { success: boolean; message: string; data?: any }

export class AuthService {
  static async login(event: H3Event): Promise<AuthResponse> {
    const { email, password } = await readBody(event);
    const user = await db.query.users.findFirst({
      where: eq(tables.users.email, email),
      with: { role: true }
    });

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw createError({ statusCode: 401, message: 'Invalid credentials' });
    }

    const accessToken = jwt.sign({ userId: user.id, role: user.role.name, email: user.email }, ACCESS_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ userId: user.id }, REFRESH_SECRET, { expiresIn: '7d' });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await db.insert(tables.sessions).values({
      userId: user.id,
      refreshToken,
      expiresAt,
    });

    await db.insert(tables.loginLogs).values({ userId: user.id });

    this.setAuthCookies(event, accessToken, refreshToken);

    return { 
      success: true, 
      message: 'Logged in successfully', 
      data: { user: { id: user.id, name: user.name, role: user.role.name } } 
    };
  }

  static async logout(event: H3Event): Promise<AuthResponse> {
    const refreshToken = getCookie(event, 'refresh_token');
    if (refreshToken) {
      await db.delete(tables.sessions).where(eq(tables.sessions.refreshToken, refreshToken));
    }

    deleteCookie(event, 'access_token');
    deleteCookie(event, 'refresh_token');

    return { success: true, message: 'Logged out successfully' };
  }

  static async refresh(event: H3Event): Promise<AuthResponse> {
    const token = getCookie(event, 'refresh_token');
    if (!token) throw createError({ statusCode: 401, message: 'No refresh token' });

    const session = await db.query.sessions.findFirst({
      where: eq(tables.sessions.refreshToken, token),
      with: { user: { with: { role: true } } }
    })as SessionWithUser | undefined;

    if (!session || session.expiresAt < new Date()) {
      await this.logout(event);
      throw createError({ statusCode: 403, message: 'Session expired' });
    }

    const newAccess = jwt.sign({ userId: session.user.id, role: session.user.role.name, email: session.user.email }, ACCESS_SECRET, { expiresIn: '15m' });
    const newRefresh = jwt.sign({ userId: session.user.id }, REFRESH_SECRET, { expiresIn: '7d' });

    await db.update(tables.sessions)
      .set({ 
        refreshToken: newRefresh, 
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) 
      })
      .where(eq(tables.sessions.id, session.id));

    this.setAuthCookies(event, newAccess, newRefresh);
    return { success: true, message: 'Session refreshed' };
  }

  static async createUser(event: H3Event): Promise<AuthResponse> {
    const { name, email, password, roleId } = await readBody(event);

    const exists = await db.query.users.findFirst({
      where: eq(tables.users.email, email)
    });
    if (exists) throw createError({ statusCode: 409, message: 'User already exists' });

    const passwordHash = await bcrypt.hash(password, 10);
    
    const [user] = await db.insert(tables.users).values({
      name, email, passwordHash, roleId: Number(roleId)
    }).returning();

    return { success: true, message: 'User created', data: { id: user.id, email: user.email } };
  }

  static async createRole(event: H3Event): Promise<AuthResponse> {
    const { name } = await readBody(event);
    const [role] = await db.insert(tables.roles).values({ name }).returning();
    return { success: true, message: 'Role created', data: role };
  }

  static async updateUserRole(event: H3Event): Promise<AuthResponse> {
    const { userId, roleId } = await readBody(event);
    await db.update(tables.users)
      .set({ roleId: Number(roleId) })
      .where(eq(tables.users.id, Number(userId)));
    return { success: true, message: 'User role updated' };
  }

  static async deleteUser(event: H3Event): Promise<AuthResponse> {
    const { userId } = await readBody(event);
    const uId = Number(userId);
    
    await db.delete(tables.sessions).where(eq(tables.sessions.userId, uId));
    await db.delete(tables.users).where(eq(tables.users.id, uId));
    
    return { success: true, message: 'User deleted' };
  }

  static async createSuperUser(event: H3Event): Promise<AuthResponse> {
    const { email, password, name } = await readBody(event);

    let adminRole = await db.query.roles.findFirst({ where: eq(tables.roles.name, 'SuperAdmin') });
    if (!adminRole) {
      const [newRole] = await db.insert(tables.roles).values({ name: 'SuperAdmin' }).returning();
      adminRole = newRole;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    
    const [user] = await db.insert(tables.users)
      .values({
        name: name || 'Super Admin',
        email,
        passwordHash,
        roleId: adminRole.id
      })
      .onConflictDoUpdate({
        target: tables.users.email,
        set: { name: name || 'Super Admin' }
      })
      .returning();

    return { success: true, message: 'Super User ensured', data: user };
  }

  private static setAuthCookies(event: H3Event, access: string, refresh: string) {
    setCookie(event, 'access_token', access, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 900 });
    setCookie(event, 'refresh_token', refresh, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 604800 });
  }

  static getUserFromToken(event: H3Event): TokenPayload | null {
    const token = getCookie(event, 'access_token');
    if (!token) return null;
    try { return jwt.verify(token, ACCESS_SECRET) as TokenPayload; } catch { return null; }
  }
}