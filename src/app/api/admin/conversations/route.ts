import { NextRequest, NextResponse } from 'next/server';
import { getConversationModel } from '@/models/Conversation';
import { getMessageModel } from '@/models/Message';
import { getAuthUser } from '@/lib/auth';
import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import { getUserModel } from '@/models/User';

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

    // Connect to the default database
    await connectDB('default');

    // Get conversation model
    const Conversation = await getConversationModel();

    // Get all conversations with participant details
    const conversations = await Conversation.find()
      .sort({ updatedAt: -1 });

    // Enhance participant information
    const enhancedConversations = await Promise.all(conversations.map(async (conv) => {
      const convObj = conv.toObject();
      const enhancedParticipants = await Promise.all(convObj.participants.map(async (participant: any) => {
        const participantId = typeof participant === 'object' ? participant._id : participant;
        
        // Try to find participant in tradesmen database
        try {
          const tradesmanModel = await getUserModel('tradesman');
          const tradesmanUser = await tradesmanModel.findById(participantId);
          if (tradesmanUser) {
            return {
              _id: participantId,
              name: tradesmanUser.name,
              email: tradesmanUser.email,
              role: 'tradesman'
            };
          }
        } catch (error) {
          console.error('Error looking up in tradesmen database:', error);
        }

        // Try to find participant in customers database
        try {
          const customerModel = await getUserModel('user');
          const customerUser = await customerModel.findById(participantId);
          if (customerUser) {
            return {
              _id: participantId,
              name: customerUser.name,
              email: customerUser.email,
              role: customerUser.role || 'user'
            };
          }
        } catch (error) {
          console.error('Error looking up in customers database:', error);
        }

        // Try to find participant in admin database
        try {
          const adminModel = await getUserModel('admin');
          const adminUser = await adminModel.findById(participantId);
          if (adminUser) {
            return {
              _id: participantId,
              name: adminUser.name,
              email: adminUser.email,
              role: 'admin'
            };
          }
        } catch (error) {
          console.error('Error looking up in admin database:', error);
        }

        // Return placeholder if user not found
        return {
          _id: participantId,
          name: 'Unknown User',
          email: '',
          role: 'unknown'
        };
      }));

      return {
        ...convObj,
        participants: enhancedParticipants
      };
    }));

    return NextResponse.json({
      success: true,
      data: enhancedConversations
    });

  } catch (error: any) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    // Verify admin authentication
    const authUser = await getAuthUser(req);
    if (!authUser || authUser.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Connect to the default database
    await connectDB('default');

    // Get conversation ID from request body
    const body = await req.json();
    const { conversationId } = body;

    if (!conversationId || !mongoose.Types.ObjectId.isValid(conversationId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid conversation ID' },
        { status: 400 }
      );
    }

    // Get models
    const Conversation = await getConversationModel();
    const Message = await getMessageModel();

    // Delete all messages in the conversation
    await Message.deleteMany({ conversation: conversationId });

    // Delete the conversation
    await Conversation.findByIdAndDelete(conversationId);

    return NextResponse.json({
      success: true,
      message: 'Conversation and all messages deleted successfully'
    });

  } catch (error: any) {
    console.error('Error deleting conversation:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to delete conversation' },
      { status: 500 }
    );
  }
} 