import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { getUserModel, IUser } from '@/models/User';
import { getAuthUser } from '@/lib/auth';
import mongoose from 'mongoose';

interface UserLeanDoc extends Omit<IUser, keyof mongoose.Document> {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export async function GET(req: NextRequest) {
  try {
    // Verify admin authentication
    const authUser = await getAuthUser(req);
    if (!authUser || authUser.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Connect to all databases to fetch users
    const customerConn = await connectDB('customers');
    const tradesmanConn = await connectDB('tradesmen');
    const adminConn = await connectDB('admin');

    // Get user models for each database
    const CustomerModel = await getUserModel('user');
    const TradesmanModel = await getUserModel('tradesman');
    const AdminModel = await getUserModel('admin');

    // Fetch users from all databases
    const [customers, tradesmen, admins] = await Promise.all([
      CustomerModel.find({ role: 'user' }).select('-password').lean(),
      TradesmanModel.find({ role: 'tradesman' }).select('-password').lean(),
      AdminModel.find({ role: 'admin' }).select('-password').lean()
    ]) as [UserLeanDoc[], UserLeanDoc[], UserLeanDoc[]];

    // Combine and format users
    const allUsers = [...customers, ...tradesmen, ...admins].map(user => ({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isBanned: user.isBanned || false
    }));

    return NextResponse.json({
      success: true,
      users: allUsers
    });

  } catch (error: any) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch users' },
      { status: 500 }
    );
  }
} 