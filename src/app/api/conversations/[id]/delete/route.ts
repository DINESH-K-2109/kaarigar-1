import { NextRequest, NextResponse } from 'next/server';
import { getConversationModel } from '@/models/Conversation';
import { getAuthUser } from '@/lib/auth';
import mongoose from 'mongoose';
import connectDB from '@/lib/db';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = params;

    // Validate conversation ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: 'Invalid conversation ID' },
        { status: 400 }
      );
    }

    // Connect to the default database
    await connectDB('default');

    // Get conversation model
    const Conversation = await getConversationModel();

    // Find conversation and verify user is a participant
    const conversation = await Conversation.findOne({
      _id: id,
      participants: user.id
    });

    if (!conversation) {
      return NextResponse.json(
        { success: false, message: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Add user to deletedFor array if not already there
    if (!conversation.deletedFor || !Array.isArray(conversation.deletedFor)) {
      conversation.deletedFor = [];
    }
    
    if (!conversation.deletedFor.some(id => id.toString() === user.id)) {
      conversation.deletedFor.push(new mongoose.Types.ObjectId(user.id));
      await conversation.save();
    }

    return NextResponse.json({
      success: true,
      message: 'Conversation deleted from your view'
    });

  } catch (error: any) {
    console.error('Error deleting conversation:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to delete conversation' },
      { status: 500 }
    );
  }
} 