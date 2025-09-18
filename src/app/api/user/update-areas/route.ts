import { NextRequest, NextResponse } from 'next/server';
import { getSession } from 'next-auth/react';
import connectDB from '@/lib/db';
import { withAuth } from '@/lib/auth';
import mongoose from 'mongoose';

async function handler(req: NextRequest, authUser: any) {
  if (req.method !== 'POST') {
    return NextResponse.json(
      { success: false, message: 'Method not allowed' },
      { status: 405 }
    );
  }

  try {
    const body = await req.json();
    const { areas } = body;

    // Determine which database the user is in based on role
    let userDb = '';
    let userFound = false;

    // Try updating in tradesmen database first since this is for tradesman
    try {
      const conn = await connectDB('tradesmen');
      const collection = conn.collection('users');
      const objectId = new mongoose.Types.ObjectId(authUser.id);
      
      const result = await collection.updateOne(
        { _id: objectId },
        { 
          $set: { 
            workingAreas: areas,
            updatedAt: new Date()
          } 
        }
      );
      
      if (result.matchedCount > 0) {
        userDb = 'tradesmen';
        userFound = true;
      }
    } catch (error) {
      console.error('Error updating in tradesmen database:', error);
    }

    // If not found in tradesmen, try customers database
    if (!userFound) {
      try {
        const conn = await connectDB('customers');
        const collection = conn.collection('users');
        const objectId = new mongoose.Types.ObjectId(authUser.id);
        
        const result = await collection.updateOne(
          { _id: objectId },
          { 
            $set: { 
              workingAreas: areas,
              updatedAt: new Date()
            } 
          }
        );
        
        if (result.matchedCount > 0) {
          userDb = 'customers';
          userFound = true;
        }
      } catch (error) {
        console.error('Error updating in customers database:', error);
      }
    }

    if (!userFound) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { 
        success: true, 
        message: 'Working areas updated successfully',
        dbType: userDb
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Working areas update error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Something went wrong' },
      { status: 500 }
    );
  }
}

export const POST = withAuth(handler); 