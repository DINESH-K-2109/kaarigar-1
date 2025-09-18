import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { getUserModel, IUser } from '@/models/User';
import { signJwtToken } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

// Get admin key from different possible sources
const getAdminKey = () => {
  // Try different environment variable sources
  const key = process.env.ADMIN_REGISTRATION_KEY || 
              process.env.NEXT_PUBLIC_ADMIN_REGISTRATION_KEY ||
              'dineshksahu9817677742'; // Fallback to hardcoded key if env vars fail
              
  console.log('Admin key details:', {
    keyExists: !!key,
    keyLength: key?.length,
    keyValue: key // Temporarily log the actual key for debugging
  });
  return key;
};

const ADMIN_REGISTRATION_KEY = getAdminKey();

// Add debugging logs
console.log('Environment variables loaded:');
console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'Set' : 'Not set');
console.log('MONGODB_URI_ADMIN:', process.env.MONGODB_URI_ADMIN ? 'Set' : 'Not set');
console.log('ADMIN_REGISTRATION_KEY:', process.env.ADMIN_REGISTRATION_KEY ? 'Set' : 'Not set');

if (!ADMIN_REGISTRATION_KEY) {
  console.error('ADMIN_REGISTRATION_KEY is not defined in environment variables');
}

export async function POST(req: NextRequest) {
  let conn;
  try {
    const body = await req.json();
    const { name, email, password, phone, adminKey } = body;
    
    // Debug logging
    console.log('Request details:', {
      nameProvided: !!name,
      emailProvided: !!email,
      phoneProvided: !!phone,
      adminKeyProvided: !!adminKey,
      adminKeyLength: adminKey?.length,
      adminKeyValue: adminKey // Temporarily log the actual key for debugging
    });
    
    // Validate required fields
    if (!name || !email || !password || !phone || !adminKey) {
      return NextResponse.json(
        { success: false, message: 'All fields are required' },
        { status: 400 }
      );
    }

    // Clean and normalize the keys for comparison
    const cleanKey = (key: string) => key.trim().replace(/\s+/g, '');
    const normalizedInputKey = cleanKey(adminKey);
    const normalizedExpectedKey = cleanKey(ADMIN_REGISTRATION_KEY || '');

    console.log('Key comparison details:', {
      inputKeyLength: normalizedInputKey.length,
      expectedKeyLength: normalizedExpectedKey.length,
      inputKey: normalizedInputKey,
      expectedKey: normalizedExpectedKey,
      matches: normalizedInputKey === normalizedExpectedKey,
      charByCharComparison: Array.from(normalizedInputKey).map((char, i) => ({
        position: i,
        inputChar: char,
        expectedChar: normalizedExpectedKey[i],
        matches: char === normalizedExpectedKey[i]
      }))
    });

    // Verify admin registration key
    if (!ADMIN_REGISTRATION_KEY || normalizedInputKey !== normalizedExpectedKey) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid admin registration key',
          debug: {
            keyProvided: normalizedInputKey,
            envKeyExists: !!ADMIN_REGISTRATION_KEY,
            keyMatch: normalizedInputKey === normalizedExpectedKey
          }
        },
        { status: 403 }
      );
    }
    
    // Validate phone number format
    const phoneRegex = /^[0-9]{10,15}$/;
    if (!phoneRegex.test(phone)) {
      return NextResponse.json(
        { success: false, message: 'Please provide a valid phone number (10-15 digits)' },
        { status: 400 }
      );
    }

    // Connect to admin database
    try {
      conn = await connectDB('admin');
      console.log('Connected to admin database successfully');
    } catch (dbError) {
      console.error('Database connection error:', dbError);
      return NextResponse.json(
        { success: false, message: 'Database connection failed' },
        { status: 500 }
      );
    }

    const User = await getUserModel('admin');
    
    // Check if admin already exists with this email
    const existingUserEmail = await User.findOne({ email });
    if (existingUserEmail) {
      return NextResponse.json(
        { success: false, message: 'Admin already exists with this email' },
        { status: 409 }
      );
    }
    
    // Check if admin already exists with this phone number
    const existingUserPhone = await User.findOne({ phone });
    if (existingUserPhone) {
      return NextResponse.json(
        { success: false, message: 'Admin already exists with this phone number' },
        { status: 409 }
      );
    }

    // Hash password before saving
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new admin user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      phone,
      role: 'admin'
    }) as IUser & { _id: mongoose.Types.ObjectId };

    // Generate JWT token
    const token = signJwtToken({ 
      id: user._id.toString(),
      email: user.email,
      role: user.role
    });

    // Create response with cookie
    const response = NextResponse.json({
      success: true,
      message: 'Admin account created successfully',
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        dbType: 'admin'
      }
    }, { status: 201 });

    // Set the token in cookie
    response.cookies.set({
      name: 'token',
      value: token,
      httpOnly: true,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;

  } catch (error: any) {
    console.error('Admin registration error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to create admin account. Please try again.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
} 