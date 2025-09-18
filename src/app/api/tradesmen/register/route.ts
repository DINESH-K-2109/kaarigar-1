import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { getUserModel, IUser } from '@/models/User';
import { getTradesmanModel } from '@/models/Tradesman';
import { getAuthUser, withAuth } from '@/lib/auth';
import mongoose from 'mongoose';
import { getConversationModel } from '@/models/Conversation';
import { getMessageModel } from '@/models/Message';

// Define a flexible user type to handle different forms of user objects
interface UserWithId {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  password?: string;
  role?: string;
  city?: string;
  phone?: string;
  workingAreas?: { areaName: string; priority: number; }[];
  [key: string]: any;
}

async function handler(req: NextRequest, authUser: any) {
  try {
    const body = await req.json();
    const { 
      name, 
      phone, 
      skills, 
      experience, 
      hourlyRate, 
      city, 
      bio, 
      availability, 
      profileImage,
      workingAreas = [] 
    } = body;
    
    // Validate required fields
    if (!name || !phone || !skills || !experience || !hourlyRate || !city || !bio || !availability) {
      return NextResponse.json(
        { success: false, message: 'All fields are required' },
        { status: 400 }
      );
    }
    
    // Validate phone number format
    const phoneRegex = /^[0-9]{10,15}$/;
    if (!phoneRegex.test(phone)) {
      return NextResponse.json(
        { success: false, message: 'Please enter a valid phone number (10-15 digits)' },
        { status: 400 }
      );
    }
    
    // Connect to customers database first to find the user
    await connectDB('customers');
    const CustomerUserModel = await getUserModel('user');
    
    // Find user in customers database - make sure to select password field
    let user = await CustomerUserModel.findById(authUser.id).select('+password') as UserWithId | null;
    
    // If not found in customers, try tradesmen database
    if (!user) {
      await connectDB('tradesmen');
      const TradesmanUserModel = await getUserModel('tradesman');
      user = await TradesmanUserModel.findById(authUser.id).select('+password') as UserWithId | null;
    }
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }
    
    // Connect to tradesmen database
    await connectDB('tradesmen');
    const TradesmanModel = await getTradesmanModel();
    
    // Check if tradesman profile already exists
    const existingTradesman = await TradesmanModel.findOne({ user: user._id });
    if (existingTradesman) {
      return NextResponse.json(
        { success: false, message: 'Tradesman profile already exists' },
        { status: 409 }
      );
    }
    
    let newUserId: mongoose.Types.ObjectId | undefined;
    
    // If user is in customers database, we need to move them to tradesmen database
    if (user.role !== 'tradesman') {
      // Connect to tradesmen database
      const tradesmenConn = await connectDB('tradesmen');
      
      // Create a new user in tradesmen database with direct collection access
      // This avoids the schema validation issues and password rehashing
      const newTradesmanUserData = {
        name: name || user.name, // Use provided name or fallback to user's name
        email: user.email,
        // Use the existing hashed password to avoid double-hashing
        password: user.password || '',
        role: 'tradesman',
        city: city || user.city || '',
        phone: phone || user.phone || '', // Use provided phone or fallback to user's phone
        workingAreas: workingAreas || [], // Add working areas
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const result = await tradesmenConn.collection('users').insertOne(newTradesmanUserData);
      newUserId = result.insertedId;
      
      // Update conversations and messages to use the new user ID
      if (newUserId) {
        try {
          // Connect to default database where conversations are stored
          await connectDB('default');
          const Conversation = await getConversationModel();
          const Message = await getMessageModel();

          // Update conversation participants
          await Conversation.updateMany(
            { participants: user._id },
            { $set: { "participants.$[elem]": newUserId } },
            { arrayFilters: [{ "elem": user._id }] }
          );

          // Update message senders and receivers
          await Message.updateMany(
            { sender: user._id },
            { $set: { sender: newUserId } }
          );
          await Message.updateMany(
            { receiver: user._id },
            { $set: { receiver: newUserId } }
          );
        } catch (error) {
          console.error('Error updating conversations and messages:', error);
        }

        // Remove from customers database if successful
        await CustomerUserModel.findByIdAndDelete(user._id);
        
        // Update user reference for the tradesman creation
        user = {
          _id: newUserId,
          ...newTradesmanUserData
        } as UserWithId;
      }
    }
    
    // Create tradesman profile with duplicated user information
    const tradesman = await TradesmanModel.create({
      user: user._id,
      userId: user._id.toString(), // Store the user ID as string
      name: name || user.name,     // Use provided name with fallback
      email: user.email,           // Store user's email directly
      phone: phone || user.phone || '',  // Use provided phone with fallback
      skills: typeof skills === 'string' ? [skills] : skills,
      experience,
      hourlyRate,
      city,
      bio,
      availability,
      profileImage,
      workingAreas: workingAreas || [], // Add working areas
    });
    
    return NextResponse.json(
      {
        success: true,
        message: 'Tradesman profile created successfully',
        data: {
          id: tradesman._id ? tradesman._id.toString() : '',
          user: {
            id: user._id ? user._id.toString() : '',
            name: user.name,
            email: user.email,
            role: 'tradesman',
            workingAreas: workingAreas || [], // Include working areas in response
          },
          skills: tradesman.skills,
          experience: tradesman.experience,
          hourlyRate: tradesman.hourlyRate,
          city: tradesman.city,
          bio: tradesman.bio,
          availability: tradesman.availability,
          profileImage: tradesman.profileImage,
          workingAreas: workingAreas || [], // Include working areas in response
        }
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Tradesman registration error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Something went wrong' },
      { status: 500 }
    );
  }
}

export const POST = withAuth(handler); 