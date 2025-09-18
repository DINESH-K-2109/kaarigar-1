import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { getConversationModel } from '@/models/Conversation';
import { getUserModel } from '@/models/User';
import { getAuthUser } from '@/lib/auth';
import mongoose from 'mongoose';
import { getMessageModel } from '@/models/Message';

// Define interfaces for type safety
interface UserInfo {
  name: string;
  email: string;
  role: string;
}

// Function to find user info across databases
async function findUserInfo(userId: string): Promise<UserInfo> {
  let userInfo: UserInfo = { name: '', email: '', role: 'unknown' };
  const objectId = new mongoose.Types.ObjectId(userId);
  console.log('Looking up user info for ID:', userId);

  // Try tradesmen database first
  try {
    const tradesmenConn = await connectDB('tradesmen');
    
    // First check tradesmen collection
    const tradesmenCollection = tradesmenConn.collection('tradesmen');
    const tradesman = await tradesmenCollection.findOne({
      $or: [
        { userId: userId },
        { userId: objectId.toString() },
        { user: objectId },
        { _id: objectId }
      ]
    });

    if (tradesman) {
      console.log('Found user in tradesmen collection:', tradesman.name);
      return {
        name: tradesman.name,
        email: tradesman.email || "",
        role: 'tradesman'
      };
    }

    // Then check users collection in tradesmen db
    const usersCollection = tradesmenConn.collection('users');
    const tradesmanUser = await usersCollection.findOne({ 
      _id: objectId
    });

    if (tradesmanUser) {
      console.log('Found user in tradesmen users collection:', tradesmanUser.name);
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
    const customersConn = await connectDB('customers');
    const usersCollection = customersConn.collection('users');
    
    const customerUser = await usersCollection.findOne({
      _id: objectId
    });

    if (customerUser) {
      console.log('Found user in customers collection:', customerUser.name);
      return {
        name: customerUser.name,
        email: customerUser.email,
        role: customerUser.role || 'user'
      };
    }
  } catch (error) {
    console.error('Error looking up in customers database:', error);
  }

  console.log('User not found in any collection:', userId);
  return userInfo;
}

async function getConversations(req: NextRequest, authUser: any) {
  try {
    // Connect to the default database
    await connectDB('default');
    
    // Get the Conversation model
    const Conversation = await getConversationModel();
    
    // Find all conversations where user is a participant and hasn't deleted the conversation
    const conversations = await Conversation.find({
      participants: authUser.id,
      deletedFor: { $ne: new mongoose.Types.ObjectId(authUser.id) }
    })
      .sort({ updatedAt: -1 });

    // Enhance conversations with participant information
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

async function createConversation(req: NextRequest, authUser: any) {
  try {
    // Connect to the default database
    await connectDB('default');
    
    // Get the Conversation model
    const Conversation = await getConversationModel();
    
    const body = await req.json();
    let { receiverId: receiverIdString } = body;
    
    if (!receiverIdString) {
      return NextResponse.json(
        { success: false, message: 'Receiver ID is required' },
        { status: 400 }
      );
    }
    
    // Prevent messaging yourself
    if (authUser.id === receiverIdString) {
      return NextResponse.json(
        { success: false, message: 'You cannot start a conversation with yourself' },
        { status: 400 }
      );
    }

    // Convert IDs to strings for consistent comparison
    const participantId1 = typeof authUser.id === 'string' ? authUser.id : authUser.id.toString();
    const participantId2 = typeof receiverIdString === 'string' ? receiverIdString : receiverIdString.toString();

    // IMPORTANT: Check for existing conversation first, considering both possible orders of participants
    const existingConversation = await Conversation.findOne({
      $or: [
        { participants: { $all: [participantId1, participantId2], $size: 2 } },
        { participants: { $all: [participantId2, participantId1], $size: 2 } }
      ]
    });

    if (existingConversation) {
      console.log('Found existing conversation:', existingConversation._id);
      return NextResponse.json(
        {
          success: true,
          message: 'Conversation already exists',
          data: existingConversation,
        },
        { status: 200 }
      );
    }

    // If no existing conversation, proceed with user lookup and creation
    let receiverExists = false;
    let receiverUser = null;

    // Try tradesmen database first
    try {
      const tradesmenConn = await connectDB('tradesmen');
      const tradesmenCollection = tradesmenConn.collection('tradesmen');
      const usersCollection = tradesmenConn.collection('users');
      
      // First try to find the tradesman directly
      const tradesman = await tradesmenCollection.findOne({
        $or: [
          { userId: receiverIdString },
          { user: new mongoose.Types.ObjectId(receiverIdString) }
        ]
      });

      if (tradesman) {
        console.log('Found tradesman:', tradesman);
        receiverUser = {
          _id: tradesman.user,
          name: tradesman.name,
          email: tradesman.email
        };
        receiverExists = true;
        receiverIdString = tradesman.userId || tradesman.user.toString();
      } else {
        // If not found as tradesman, try users collection
        const user = await usersCollection.findOne({
          _id: new mongoose.Types.ObjectId(receiverIdString)
        });

        if (user) {
          console.log('Found user in tradesmen database:', user);
          receiverUser = user;
          receiverExists = true;
        }
      }

      // If still not found, try customers database
      if (!receiverExists) {
        const customersConn = await connectDB('customers');
        const customersUsers = customersConn.collection('users');
        
        const customerUser = await customersUsers.findOne({
          _id: new mongoose.Types.ObjectId(receiverIdString)
        });

        if (customerUser) {
          console.log('Found user in customers database:', customerUser);
          receiverUser = customerUser;
          receiverExists = true;
        }
      }
    } catch (error) {
      console.error('Error checking databases:', error);
    }

    if (!receiverExists) {
      return NextResponse.json(
        {
          success: false,
          message: 'Receiver not found'
        },
        { status: 404 }
      );
    }

    // Double-check for existing conversation one more time before creating
    const doubleCheckConversation = await Conversation.findOne({
      $or: [
        { participants: { $all: [participantId1, participantId2], $size: 2 } },
        { participants: { $all: [participantId2, participantId1], $size: 2 } }
      ]
    });

    if (doubleCheckConversation) {
      console.log('Found existing conversation in double-check:', doubleCheckConversation._id);
      return NextResponse.json(
        {
          success: true,
          message: 'Conversation already exists',
          data: doubleCheckConversation,
        },
        { status: 200 }
      );
    }

    // Create new conversation
    const conversation = await Conversation.create({
      participants: [participantId1, participantId2],
      createdAt: new Date(),
      updatedAt: new Date()
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Conversation created successfully',
        data: conversation,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating conversation:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error.message || 'Something went wrong',
        stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

async function deleteAllConversationsHandler(req: NextRequest, authUser: any) {
  try {
    if (!authUser) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Connect to the default database
    await connectDB('default');
    
    // Get models
    const Conversation = await getConversationModel();
    const Message = await getMessageModel();
    
    // Find all conversations where the user is a participant
    const conversations = await Conversation.find({
      participants: authUser.id
    });
    
    // Delete all messages from these conversations
    for (const conversation of conversations) {
      await Message.deleteMany({ conversation: conversation._id });
    }
    
    // Delete all conversations
    await Conversation.deleteMany({
      participants: authUser.id
    });
    
    return NextResponse.json(
      {
        success: true,
        message: 'All conversations and messages deleted successfully'
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error deleting conversations:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to delete conversations' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }
    return await getConversations(req, authUser);
  } catch (error: any) {
    console.error('Error in GET conversations:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to process request' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }
    return await createConversation(req, authUser);
  } catch (error: any) {
    console.error('Error in POST conversations:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to process request' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }
    return await deleteAllConversationsHandler(req, authUser);
  } catch (error: any) {
    console.error('Error in DELETE conversations:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to process request' },
      { status: 500 }
    );
  }
} 