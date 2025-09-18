import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { getUserModel, IUser } from '@/models/User';
import { signJwtToken } from '@/lib/auth';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { identifier, password } = body;
    
    console.log('Login attempt:', {
      identifierProvided: !!identifier,
      passwordProvided: !!password,
      isEmail: identifier?.includes('@'),
      passwordLength: password?.length
    });
    
    // Validate required fields
    if (!identifier || !password) {
      return NextResponse.json(
        { success: false, message: 'Email/phone and password are required' },
        { status: 400 }
      );
    }
    
    // Check if identifier is email or phone number
    const isEmail = identifier.includes('@');
    
    // Validate phone format if not email
    if (!isEmail) {
      const phoneRegex = /^[0-9]{10,15}$/;
      if (!phoneRegex.test(identifier)) {
        return NextResponse.json(
          { success: false, message: 'Invalid phone number format' },
          { status: 400 }
        );
      }
    }
    
    // Connect to admin database
    const conn = await connectDB('admin');
    const User = await getUserModel('admin');
    
    // Create query based on identifier type
    const query = isEmail 
      ? { email: identifier.toLowerCase() } 
      : { phone: identifier };

    console.log('Searching admin with query:', query);
    
    // Find admin user
    const user = await User.findOne(query).select('+password') as (IUser & { _id: mongoose.Types.ObjectId }) | null;
    
    if (!user) {
      console.log('Admin user not found');
      return NextResponse.json(
        { success: false, message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Log user details for debugging
    console.log('Admin user found:', {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      hasPassword: !!user.password,
      passwordLength: user.password?.length
    });

    // Check if user is banned
    if (user.isBanned) {
      console.log('Banned admin attempted to login:', user.email);
      return NextResponse.json(
        { success: false, message: 'Your account has been banned. Please contact support.' },
        { status: 403 }
      );
    }

    // Verify it's an admin account
    if (user.role !== 'admin') {
      console.log('Account is not an admin account');
      return NextResponse.json(
        { success: false, message: 'Account is not an admin account' },
        { status: 403 }
      );
    }

    // Compare password directly using bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log('Password validation:', { 
      isValid: isPasswordValid,
      inputPasswordLength: password.length,
      storedHashLength: user.password.length
    });

    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = signJwtToken({
      id: user._id.toString(),
      email: user.email,
      role: user.role
    });

    // Create response with cookie
    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        dbType: 'admin'
      }
    });

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
    console.error('Admin login error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Login failed' },
      { status: 500 }
    );
  }
} 