import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { getUserModel } from '@/models/User';
import { getAuthUser } from '@/lib/auth';
import mongoose from 'mongoose';

export async function POST(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    // Verify admin authentication
    const authUser = await getAuthUser(req);
    if (!authUser || authUser.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { userId } = params;

    // Validate userId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid user ID' },
        { status: 400 }
      );
    }

    // Try to find and update user in each database
    const databases = ['customers', 'tradesmen', 'admin'] as const;
    let userUpdated = false;

    for (const dbType of databases) {
      const conn = await connectDB(dbType);
      const User = await getUserModel(dbType === 'customers' ? 'user' : dbType === 'tradesmen' ? 'tradesman' : 'admin');
      
      const user = await User.findById(userId);
      
      if (user) {
        // Update user
        await User.findByIdAndUpdate(userId, { isBanned: false });
        userUpdated = true;
        break;
      }
    }

    if (!userUpdated) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'User unbanned successfully'
    });

  } catch (error: any) {
    console.error('Error unbanning user:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to unban user' },
      { status: 500 }
    );
  }
} 