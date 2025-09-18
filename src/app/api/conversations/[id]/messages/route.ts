import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { getConversationModel } from '@/models/Conversation';
import { getMessageModel } from '@/models/Message';
import { getUserModel, IUser } from '@/models/User';
import { withAuth } from '@/lib/auth';
import mongoose from 'mongoose';

// Define interfaces for type safety
interface UserInfo {
  name: string;
  email: string;
  role: string;
}

interface IMessageParticipant {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
}

interface IPopulatedMessage {
  _id: mongoose.Types.ObjectId;
  conversation: mongoose.Types.ObjectId;
  sender: IMessageParticipant;
  receiver: IMessageParticipant;
  content: string;
  isRead: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
}

// Function to find user info across databases
async function findUserInfo(userId: string): Promise<UserInfo> {
  let userInfo: UserInfo = { name: '', email: '', role: 'unknown' };
  const objectId = new mongoose.Types.ObjectId(userId);
  console.log('Looking up user info for ID:', userId);

  // Try tradesmen database first
  try {
    const tradesmanModel = await getUserModel('tradesman');
    const tradesmanUser = await tradesmanModel.findById(objectId);
    if (tradesmanUser) {
      console.log('Found user in tradesmen database:', tradesmanUser.name);
      return {
        name: tradesmanUser.name,
        email: tradesmanUser.email,
        role: 'tradesman'
      };
    }
  } catch (error) {
    console.error('Error looking up in tradesmen database:', error);
  }

  // Try customers database
  try {
    const customerModel = await getUserModel('user');
    const customerUser = await customerModel.findById(objectId);
    if (customerUser) {
      console.log('Found user in customers database:', customerUser.name);
      return {
        name: customerUser.name,
        email: customerUser.email,
        role: customerUser.role || 'user'
      };
    }
  } catch (error) {
    console.error('Error looking up in customers database:', error);
  }

  // Try admin database
  try {
    const adminModel = await getUserModel('admin');
    const adminUser = await adminModel.findById(objectId);
    if (adminUser) {
      console.log('Found user in admin database:', adminUser.name);
      return {
        name: adminUser.name,
        email: adminUser.email,
        role: 'admin'
      };
    }
  } catch (error) {
    console.error('Error looking up in admin database:', error);
  }

  console.log('User not found in any database:', userId);
  return userInfo;
}

async function getMessagesHandler(req: NextRequest, authUser: any) {
  try {
    console.log('Inside getMessagesHandler: authUser =', authUser);
    
    if (!authUser) {
      console.error('Authentication failed in getMessagesHandler: authUser is undefined');
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Extract conversation ID from the URL
    const url = new URL(req.url);
    const pathSegments = url.pathname.split('/');
    const conversationId = pathSegments[pathSegments.length - 2]; // Get the ID from the URL path
    
    if (!conversationId) {
      return NextResponse.json(
        { success: false, message: 'Conversation ID is required' },
        { status: 400 }
      );
    }
    
    console.log(`Getting messages for conversation: ${conversationId}`);
    
    // Connect to the default database
    await connectDB('default');
    
    // Get models
    const Conversation = await getConversationModel();
    const Message = await getMessageModel();
    
    // Validate conversation exists and user is a participant
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
    
    // Get messages for this conversation
    const messages = await Message.find({ conversation: conversationId })
      .sort({ createdAt: 1 });

    if (!messages || messages.length === 0) {
      return NextResponse.json(
        {
          success: true,
          count: 0,
          data: [],
        },
        { status: 200 }
      );
    }

    // Enhance messages with proper user names
    const enhancedMessages = await Promise.all(messages.map(async (message) => {
      if (!message) {
        console.warn('Null message found in conversation');
        return null;
      }

      const messageObj = message.toObject() as {
        _id: mongoose.Types.ObjectId;
        conversation: mongoose.Types.ObjectId;
        sender: mongoose.Types.ObjectId;
        receiver: mongoose.Types.ObjectId;
        content: string;
        isRead: boolean;
        createdAt: Date;
        updatedAt: Date;
      };
      
      // Get sender and receiver IDs from the message
      const senderId = messageObj.sender;
      const receiverId = messageObj.receiver;

      if (!senderId || !receiverId) {
        console.warn('Message missing sender or receiver IDs:', messageObj);
        return null;
      }

      // Find sender info
      const senderInfo = await findUserInfo(senderId.toString());
      const receiverInfo = await findUserInfo(receiverId.toString());

      const populatedMessage: IPopulatedMessage = {
        ...messageObj,
        _id: messageObj._id,
        conversation: messageObj.conversation,
        sender: {
          _id: senderId,
          name: senderInfo.name || 'Unknown User',
          email: senderInfo.email || ''
        },
        receiver: {
          _id: receiverId,
          name: receiverInfo.name || 'Unknown User',
          email: receiverInfo.email || ''
        }
      };

      return populatedMessage;
    }));
    
    return NextResponse.json(
      {
        success: true,
        count: enhancedMessages.filter(Boolean).length,
        data: enhancedMessages.filter(Boolean),
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error getting messages:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Something went wrong' },
      { status: 500 }
    );
  }
}

async function sendMessageHandler(req: NextRequest, authUser: any) {
  try {
    // Extract conversation ID from the URL
    const url = new URL(req.url);
    const pathSegments = url.pathname.split('/');
    const conversationId = pathSegments[pathSegments.length - 2];
    
    if (!conversationId) {
      return NextResponse.json(
        { success: false, message: 'Conversation ID is required' },
        { status: 400 }
      );
    }
    
    // Connect to the default database
    await connectDB('default');
    
    // Get models
    const Conversation = await getConversationModel();
    const Message = await getMessageModel();
    
    // Get request body
    const body = await req.json();
    const { content } = body;
    
    if (!content || content.trim() === '') {
      return NextResponse.json(
        { success: false, message: 'Message content is required' },
        { status: 400 }
      );
    }
    
    // Validate conversation exists and user is a participant
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
    
    // Find the other participant (receiver)
    const receiverId = conversation.participants.find(
      (participantId: any) => participantId.toString() !== authUser.id
    );
    
    if (!receiverId) {
      return NextResponse.json(
        { success: false, message: 'Receiver not found in conversation' },
        { status: 400 }
      );
    }

    // Create message
    const message = await Message.create({
      conversation: conversationId,
      sender: authUser.id,
      receiver: receiverId,
      content,
      isRead: false
    });
    
    // Update conversation's lastMessage and updatedAt
    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: content,
      updatedAt: new Date()
    });
    
    // Get sender and receiver info for response
    const senderInfo = await findUserInfo(authUser.id);
    const receiverInfo = await findUserInfo(receiverId.toString());
    
    // Return populated message
    const populatedMessage = {
      _id: message._id,
      conversation: message.conversation,
      content: message.content,
      isRead: message.isRead,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
      sender: {
        _id: authUser.id,
        name: senderInfo.name || 'Unknown User',
        email: senderInfo.email || ''
      },
      receiver: {
        _id: receiverId,
        name: receiverInfo.name || 'Unknown User',
        email: receiverInfo.email || ''
      }
    };
    
    return NextResponse.json(
      {
        success: true,
        data: populatedMessage
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to send message' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getMessagesHandler);
export const POST = withAuth(sendMessageHandler); 