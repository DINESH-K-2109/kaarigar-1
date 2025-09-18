import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { getConversationModel, IConversation } from '@/models/Conversation';
import { withAuth } from '@/lib/auth';
import mongoose, { Types } from 'mongoose';
import { getUserModel } from '@/models/User';

// Define interfaces for participant objects
interface IParticipant {
  _id: Types.ObjectId;
  name: string;
  email: string;
  role: string;
}

interface IPopulatedConversation {
  _id: Types.ObjectId;
  participants: IParticipant[];
  lastMessage?: string;
  updatedAt: Date;
  createdAt: Date;
}

/**
 * GET /api/conversations/[id]
 * Get a single conversation by ID with populated participants
 */
async function getConversationHandler(req: NextRequest, authUser: any) {
  try {
    // Extract conversation ID from the URL
    const url = new URL(req.url);
    const pathSegments = url.pathname.split('/');
    const conversationId = pathSegments[pathSegments.length - 1]; // Get the ID from the URL path
    
    if (!conversationId) {
      return NextResponse.json(
        { success: false, message: 'Conversation ID is required' },
        { status: 400 }
      );
    }
    
    console.log(`Getting conversation details for ID: ${conversationId}`);
    
    // Connect to the default database
    await connectDB('default');
    
    // Get the Conversation model
    const Conversation = await getConversationModel();
    
    // Validate conversation exists, user is a participant, and hasn't deleted it
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: authUser.id,
      deletedFor: { $ne: new mongoose.Types.ObjectId(authUser.id) }
    });
    
    if (!conversation) {
      return NextResponse.json(
        { success: false, message: 'Conversation not found or not authorized' },
        { status: 404 }
      );
    }
    
    // We need to manually populate the participants since they might be in different databases
    const unpopulatedConversation = conversation.toObject();
    // Cast participants to an array of ObjectIds
    const participantIds = unpopulatedConversation.participants.map(
      (id: any) => typeof id === 'object' && id._id ? id._id : id
    );
    
    // Initialize array to store populated participants
    const populatedParticipants: IParticipant[] = [];
    
    // Try to find participants in all databases
    for (const participantId of participantIds) {
      const objectId = new mongoose.Types.ObjectId(participantId.toString());
      let found = false;

      // Try tradesmen database
      try {
        const tradesmanModel = await getUserModel('tradesman');
        const tradesmanUser = await tradesmanModel.findById(objectId);
        if (tradesmanUser) {
          populatedParticipants.push({
            _id: objectId,
            name: tradesmanUser.name,
            email: tradesmanUser.email,
            role: 'tradesman'
          });
          found = true;
          continue;
        }
      } catch (error) {
        console.error('Error looking up in tradesmen database:', error);
      }

      // Try customers database
      try {
        const customerModel = await getUserModel('user');
        const customerUser = await customerModel.findById(objectId);
        if (customerUser) {
          populatedParticipants.push({
            _id: objectId,
            name: customerUser.name,
            email: customerUser.email,
            role: customerUser.role || 'user'
          });
          found = true;
          continue;
        }
      } catch (error) {
        console.error('Error looking up in customers database:', error);
      }

      // Try admin database
      try {
        const adminModel = await getUserModel('admin');
        const adminUser = await adminModel.findById(objectId);
        if (adminUser) {
          populatedParticipants.push({
            _id: objectId,
            name: adminUser.name,
            email: adminUser.email,
            role: 'admin'
          });
          found = true;
          continue;
        }
      } catch (error) {
        console.error('Error looking up in admin database:', error);
      }

      // If user not found in any database, add placeholder
      if (!found) {
        populatedParticipants.push({
          _id: objectId,
          name: 'Unknown User',
          email: '',
          role: 'unknown'
        });
      }
    }
    
    // Create a new object with populated participants instead of modifying the original
    const populatedConversation: IPopulatedConversation = {
      ...unpopulatedConversation,
      _id: unpopulatedConversation._id as Types.ObjectId,
      participants: populatedParticipants
    };
    
    return NextResponse.json(
      {
        success: true,
        data: populatedConversation,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error getting conversation:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error.message || 'Something went wrong',
        stack: error.stack 
      },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getConversationHandler); 