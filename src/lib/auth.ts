import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { IUser } from '@/models/User';
import mongoose from 'mongoose';
import connectDB from '@/lib/db';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export interface JwtPayload {
  id: string;
  email: string;
  role: string;
}

export interface AuthUser {
  id: string;
  email: string;
  role: string;
}

export const authOptions = {
  session: {
    strategy: 'jwt',
    maxAge: MAX_AGE,
  },
  callbacks: {
    async session({ session, token }: any) {
      if (token?.id) {
        session.user.id = token.id;
      }
      return session;
    },
    async jwt({ token, user }: any) {
      if (user?.id) {
        token.id = user.id;
      }
      return token;
    },
  },
};

export function signJwtToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: MAX_AGE });
}

export function verifyJwtToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}

export function setAuthCookie(token: string): void {
  const cookieStore = cookies();
  cookieStore.set({
    name: 'token',
    value: token,
    httpOnly: true,
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    maxAge: MAX_AGE,
  });
}

export function getAuthCookie(): string | undefined {
  const cookieStore = cookies();
  return cookieStore.get('token')?.value;
}

export function clearAuthCookie(): void {
  const cookieStore = cookies();
  cookieStore.delete('token');
}

export async function getAuthUser(req: NextRequest): Promise<JwtPayload | null> {
  const token = req.cookies.get('token')?.value;
  
  if (!token) {
    return null;
  }
  
  try {
    const decoded = verifyJwtToken(token);
    
    // Check if user is banned by looking up in appropriate database
    const dbType = decoded.role === 'admin' ? 'admin' : decoded.role === 'tradesman' ? 'tradesmen' : 'customers';
    const conn = await connectDB(dbType);
    const user = await conn.collection('users').findOne({ _id: new mongoose.Types.ObjectId(decoded.id) });
    
    // If user is banned or not found, return null to invalidate the session
    if (!user || user.isBanned) {
      return null;
    }
    
    return decoded;
  } catch (error) {
    return null;
  }
}

export function withAuth(handler: any) {
  return async (req: NextRequest) => {
    const user = await getAuthUser(req);
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }
    
    return handler(req, user);
  };
}

export function withRole(handler: any, roles: string[]) {
  return async (req: NextRequest) => {
    const user = await getAuthUser(req);
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }
    
    if (!roles.includes(user.role)) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized access' },
        { status: 403 }
      );
    }
    
    return handler(req, user);
  };
} 