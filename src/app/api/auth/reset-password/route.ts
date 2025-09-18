import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import bcrypt from 'bcryptjs';
import { ObjectId } from 'mongodb';

// Define DatabaseType locally to match db.ts
type DatabaseType = 'default' | 'tradesmen' | 'customers' | 'admin';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { resetKey, newPassword } = body;

    if (!resetKey || !newPassword) {
      return NextResponse.json(
        { success: false, message: 'Reset key and new password are required' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { success: false, message: 'Password should be at least 6 characters long' },
        { status: 400 }
      );
    }

    // Parse resetKey: format is mobile-email
    const sepIndex = resetKey.indexOf('-');
    if (sepIndex === -1) {
      return NextResponse.json(
        { success: false, message: 'Invalid reset key format' },
        { status: 400 }
      );
    }
    const mobile = resetKey.slice(0, sepIndex);
    const email = resetKey.slice(sepIndex + 1);

    // Validate mobile and email
    const phoneRegex = /^[0-9]{10,15}$/;
    if (!phoneRegex.test(mobile) || !email.includes('@')) {
      return NextResponse.json(
        { success: false, message: 'Invalid mobile or email in reset key' },
        { status: 400 }
      );
    }

    // Try all DBs: customers, tradesmen, admin
    const dbs: DatabaseType[] = ['customers', 'tradesmen', 'admin'];
    let user = null;
    let dbType: DatabaseType | null = null;
    let userId: ObjectId | null = null;

    for (const db of dbs) {
      try {
        const conn = await connectDB(db);
        const collection = conn.collection('users');
        const found = await collection.findOne({ phone: mobile, email: email });
        if (found) {
          user = found;
          dbType = db;
          userId = found._id;
          break;
        }
      } catch (e) {
        // continue
      }
    }

    if (!user || !dbType || !userId) {
      return NextResponse.json(
        { success: false, message: 'User not found with provided reset key' },
        { status: 404 }
      );
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    try {
      const conn = await connectDB(dbType);
      const collection = conn.collection('users');
      await collection.updateOne(
        { _id: userId },
        { $set: { password: hashedPassword, updatedAt: new Date() } }
      );
    } catch (e) {
      return NextResponse.json(
        { success: false, message: 'Failed to update password' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, message: 'Password reset successful' },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Something went wrong' },
      { status: 500 }
    );
  }
} 