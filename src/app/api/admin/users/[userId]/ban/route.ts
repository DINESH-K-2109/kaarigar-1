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
      console.log(`Checking ${dbType} database for user ${userId}`);
      
      // Use direct MongoDB access for consistency
      const collection = conn.collection('users');
      const user = await collection.findOne({ _id: new mongoose.Types.ObjectId(userId) });
      
      if (user) {
        console.log(`Found user in ${dbType} database:`, {
          id: user._id.toString(),
          email: user.email,
          role: user.role,
          currentBanStatus: user.isBanned
        });
        
        // Don't allow banning admin users
        if (user.role === 'admin') {
          console.log('Attempted to ban admin user - not allowed');
          return NextResponse.json(
            { success: false, message: 'Cannot ban admin users' },
            { status: 403 }
          );
        }

        // Update user with MongoDB directly
        const result = await collection.updateOne(
          { _id: new mongoose.Types.ObjectId(userId) },
          { $set: { isBanned: true, updatedAt: new Date() } }
        );
        
        console.log(`Ban update result for ${dbType}:`, {
          matched: result.matchedCount,
          modified: result.modifiedCount
        });
        
        userUpdated = result.modifiedCount > 0;
        break;
      }
    }

    if (!userUpdated) {
      console.log('No user found to ban in any database');
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    console.log('User banned successfully');
    return NextResponse.json({
      success: true,
      message: 'User banned successfully'
    });

  } catch (error: any) {
    console.error('Error banning user:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to ban user' },
      { status: 500 }
    );
  }
} 