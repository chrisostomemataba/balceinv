import { H3Event, setCookie, deleteCookie, getCookie, createError } from 'h3';
import { PrismaClient } from '../../generated/prisma/client';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const ACCESS_SECRET = process.env.ACCESS_TOKEN_SECRET || 'access-secret-key';
const REFRESH_SECRET = process.env.REFRESH_TOKEN_SECRET || 'refresh-secret-key';

// Types
type TokenPayload = { userId: number; role: string; email: string };
interface AuthResponse { success: boolean; message: string; data?: any }

export class AuthService {
  /**
   * 1. LOGIN: Validates credentials, creates Session, sets HTTP-Only Cookies.
   */
  static async login(event: H3Event): Promise<AuthResponse> {
    const { email, password } = await readBody(event);

    const user = await prisma.user.findUnique({
      where: { email },
      include: { role: true }
    });

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw createError({ statusCode: 401, message: 'Invalid credentials' });
    }

    // Generate Tokens
    const accessToken = jwt.sign({ userId: user.id, role: user.role.name, email: user.email }, ACCESS_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ userId: user.id }, REFRESH_SECRET, { expiresIn: '7d' });

    // Store Refresh Token in DB (Session Control)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.session.create({
      data: { userId: user.id, refreshToken, expiresAt },
    });

    await prisma.loginLog.create({ data: { userId: user.id } });

    // Set Cookies (No tokens in body)
    this.setAuthCookies(event, accessToken, refreshToken);

    return { success: true, message: 'Logged in successfully', data: { user: { id: user.id, name: user.name, role: user.role.name } } };
  }

  /**
   * 2. LOGOUT: Revokes DB Session and clears Cookies.
   */
  static async logout(event: H3Event): Promise<AuthResponse> {
    const refreshToken = getCookie(event, 'refresh_token');
    if (refreshToken) {
      // Remove session from DB
      await prisma.session.deleteMany({ where: { refreshToken } }).catch(() => null);
    }

    deleteCookie(event, 'access_token');
    deleteCookie(event, 'refresh_token');

    return { success: true, message: 'Logged out successfully' };
  }

  /**
   * 3. REFRESH SESSION: Rotates tokens using valid Refresh Cookie.
   */
  static async refresh(event: H3Event): Promise<AuthResponse> {
    const token = getCookie(event, 'refresh_token');
    if (!token) throw createError({ statusCode: 401, message: 'No refresh token' });

    const session = await prisma.session.findUnique({ where: { refreshToken: token }, include: { user: { include: { role: true } } } });

    if (!session || session.expiresAt < new Date()) {
      await this.logout(event);
      throw createError({ statusCode: 403, message: 'Session expired' });
    }

    // Rotate Tokens
    const newAccess = jwt.sign({ userId: session.user.id, role: session.user.role.name, email: session.user.email }, ACCESS_SECRET, { expiresIn: '15m' });
    const newRefresh = jwt.sign({ userId: session.user.id }, REFRESH_SECRET, { expiresIn: '7d' });

    // Update DB Session
    await prisma.session.update({
      where: { id: session.id },
      data: { refreshToken: newRefresh, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }
    });

    this.setAuthCookies(event, newAccess, newRefresh);
    return { success: true, message: 'Session refreshed' };
  }

  /**
   * 4. CREATE USER (Protected): Creates a new user with a specific Role.
   */
  static async createUser(event: H3Event): Promise<AuthResponse> {
    // Ideally, check for Admin role here using context or middleware
    const { name, email, password, roleId } = await readBody(event);

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) throw createError({ statusCode: 409, message: 'User already exists' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email, passwordHash, roleId: Number(roleId) }
    });

    return { success: true, message: 'User created', data: { id: user.id, email: user.email } };
  }

  /**
   * 5. MANAGE ROLES: Update User Role or Create New Role.
   */
  static async createRole(event: H3Event): Promise<AuthResponse> {
    const { name } = await readBody(event);
    const role = await prisma.role.create({ data: { name } });
    return { success: true, message: 'Role created', data: role };
  }

  static async updateUserRole(event: H3Event): Promise<AuthResponse> {
    const { userId, roleId } = await readBody(event);
    await prisma.user.update({
      where: { id: Number(userId) },
      data: { roleId: Number(roleId) }
    });
    return { success: true, message: 'User role updated' };
  }

  static async deleteUser(event: H3Event): Promise<AuthResponse> {
    const { userId } = await readBody(event);
    // Cascade delete handling is usually done in Prisma schema, but we ensure basic cleanup
    await prisma.session.deleteMany({ where: { userId: Number(userId) } });
    await prisma.user.delete({ where: { id: Number(userId) } });
    return { success: true, message: 'User deleted' };
  }

  /**
   * 6. SUPER USER SETUP (Postman Only): Call this once to bootstrap the system.
   */
  static async createSuperUser(event: H3Event): Promise<AuthResponse> {
    const { email, password, name } = await readBody(event);

    // 1. Ensure Admin Role Exists
    let adminRole = await prisma.role.findUnique({ where: { name: 'SuperAdmin' } });
    if (!adminRole) {
      adminRole = await prisma.role.create({ data: { name: 'SuperAdmin' } });
    }

    // 2. Create User
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.upsert({
      where: { email },
      update: {}, 
      create: {
        name: name || 'Super Admin',
        email,
        passwordHash,
        roleId: adminRole.id
      }
    });

    return { success: true, message: 'Super User ensured', data: user };
  }

  // --- Helpers ---
  private static setAuthCookies(event: H3Event, access: string, refresh: string) {
    setCookie(event, 'access_token', access, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 900 }); // 15m
    setCookie(event, 'refresh_token', refresh, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 604800 }); // 7d
  }

  /**
   * Utility to extract User Payload from current Request Cookie (for internal API usage)
   */
  static getUserFromToken(event: H3Event): TokenPayload | null {
    const token = getCookie(event, 'access_token');
    if (!token) return null;
    try { return jwt.verify(token, ACCESS_SECRET) as TokenPayload; } catch { return null; }
  }
}