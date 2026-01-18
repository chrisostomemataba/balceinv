import { H3Event, setCookie, deleteCookie, getCookie, createError, readBody } from 'h3';
import { eq } from 'drizzle-orm';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { db, tables } from '../utils/db';

const ACCESS_SECRET = process.env.ACCESS_TOKEN_SECRET || 'access-secret-key';
const REFRESH_SECRET = process.env.REFRESH_TOKEN_SECRET || 'refresh-secret-key';

interface TokenPayload { 
  userId: number; 
  role: string; 
  email: string;
}

interface ServiceResponse<T = unknown> { 
  success: boolean; 
  message: string; 
  data?: T;
}

interface LoginInput {
  email: string;
  password: string;
}

interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  roleId: number;
}

interface DeleteUserInput {
  userId: number;
}

interface CreateSuperUserInput {
  email: string;
  password: string;
  name?: string;
}

interface UserData {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface LoginResponse {
  user: UserData;
}

interface CreateUserResponse {
  id: number;
  email: string;
}

export class AuthService {
  static async login(event: H3Event): Promise<ServiceResponse<LoginResponse>> {
    const body = await readBody<LoginInput>(event);
    
    const user = await db.query.users.findFirst({
      where: eq(tables.users.email, body?.email || ''),
      with: { role: true }
    });

    if (!user || !(await bcrypt.compare(body?.password || '', user.passwordHash))) {
      throw createError({ statusCode: 401, message: 'Invalid credentials' });
    }

    const accessToken = jwt.sign(
      { userId: user.id, role: user.role.name, email: user.email }, 
      ACCESS_SECRET, 
      { expiresIn: '15m' }
    );
    
    const refreshToken = jwt.sign(
      { userId: user.id }, 
      REFRESH_SECRET, 
      { expiresIn: '7d' }
    );

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
      data: { 
        user: { 
          id: user.id, 
          name: user.name, 
          email: user.email,
          role: user.role.name 
        } 
      } 
    };
  }

  static async logout(event: H3Event): Promise<ServiceResponse<null>> {
    const refreshToken = getCookie(event, 'refresh_token');
    
    if (refreshToken) {
      await db.delete(tables.sessions)
        .where(eq(tables.sessions.refreshToken, refreshToken));
    }

    deleteCookie(event, 'access_token');
    deleteCookie(event, 'refresh_token');

    return { success: true, message: 'Logged out successfully' };
  }

  static async refresh(event: H3Event): Promise<ServiceResponse<null>> {
    const token = getCookie(event, 'refresh_token');
    
    if (!token) {
      throw createError({ statusCode: 401, message: 'No refresh token' });
    }

    const session = await db.query.sessions.findFirst({
      where: eq(tables.sessions.refreshToken, token)
    });

    if (!session || session.expiresAt < new Date()) {
      await this.logout(event);
      throw createError({ statusCode: 403, message: 'Session expired' });
    }

    const user = await db.query.users.findFirst({
      where: eq(tables.users.id, session.userId),
      with: { role: true }
    });

    if (!user) {
      throw createError({ statusCode: 404, message: 'User not found' });
    }

    const newAccessToken = jwt.sign(
      { userId: user.id, role: user.role.name, email: user.email }, 
      ACCESS_SECRET, 
      { expiresIn: '15m' }
    );
    
    const newRefreshToken = jwt.sign(
      { userId: user.id }, 
      REFRESH_SECRET, 
      { expiresIn: '7d' }
    );

    const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await db.update(tables.sessions)
      .set({ 
        refreshToken: newRefreshToken, 
        expiresAt: newExpiresAt
      })
      .where(eq(tables.sessions.id, session.id));

    this.setAuthCookies(event, newAccessToken, newRefreshToken);
    
    return { success: true, message: 'Session refreshed' };
  }

  static async createUser(event: H3Event): Promise<ServiceResponse<CreateUserResponse>> {
    const body = await readBody<CreateUserInput>(event);

    const exists = await db.query.users.findFirst({
      where: body?.email ? eq(tables.users.email, body.email) : undefined
    });
    
    if (exists) {
      throw createError({ statusCode: 409, message: 'User already exists' });
    }

    const passwordHash = await bcrypt.hash(body?.password || '', 10);
    
    const [user] = await db.insert(tables.users)
      .values({
        name: body?.name || '',
        email: body?.email || '', 
        passwordHash, 
        roleId: body?.roleId || 1  
      })
      .returning();

    return { 
      success: true, 
      message: 'User created', 
      data: { id: user.id, email: user.email } 
    };
  }

  static async deleteUser(event: H3Event): Promise<ServiceResponse<null>> {
    const body = await readBody<DeleteUserInput>(event);
    
    await db.delete(tables.sessions).where(eq(tables.sessions.userId, body?.userId || 0));
    await db.delete(tables.users).where(eq(tables.users.id, body?.userId || 0));  
    
    return { success: true, message: 'User deleted' };
  }

  static async createSuperUser(event: H3Event): Promise<ServiceResponse<UserData>> {
    const body = await readBody<CreateSuperUserInput>(event);

    let adminRole = await db.query.roles.findFirst({
      where: eq(tables.roles.name, 'SuperAdmin')
    });
    
    if (!adminRole) {
      const [newRole] = await db.insert(tables.roles)
        .values({ name: 'SuperAdmin' })
        .returning();
      adminRole = newRole;
    }

    const passwordHash = await bcrypt.hash(body?.password || '', 10);
    const userName = body?.name || 'Super Admin';
    
    const [user] = await db.insert(tables.users)
      .values({
        name: userName,
        email: body?.email || '',
        passwordHash,
        roleId: adminRole?.id || 1
      })
      .onConflictDoUpdate({
        target: tables.users.email,
        set: { name: userName }
      })
      .returning();

    return { 
      success: true, 
      message: 'Super User ensured', 
      data: { 
        id: user.id, 
        name: user.name, 
        email: user.email, 
        role: 'SuperAdmin' 
      } 
    };
  }

  private static setAuthCookies(event: H3Event, accessToken: string, refreshToken: string): void {
    setCookie(event, 'access_token', accessToken, { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production', 
      sameSite: 'lax', 
      maxAge: 900 
    });
    
    setCookie(event, 'refresh_token', refreshToken, { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production', 
      sameSite: 'lax', 
      maxAge: 604800 
    });
  }

  static getUserFromToken(event: H3Event): TokenPayload | null {
    const token = getCookie(event, 'access_token');
    if (!token) return null;
    
    try { 
      return jwt.verify(token, ACCESS_SECRET) as TokenPayload; 
    } catch { 
      return null; 
    }
  }
}