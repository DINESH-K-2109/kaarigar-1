import mongoose, { Connection, Model } from 'mongoose';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/db';

export interface IUser extends mongoose.Document {
  name: string;
  email: string;
  password: string;
  role: 'user' | 'tradesman' | 'admin';
  phone: string;
  city?: string;
  isBanned?: boolean;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(password: string): Promise<boolean>;
}

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email',
      ],
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [6, 'Password should be at least 6 characters long'],
      select: false,
    },
    role: {
      type: String,
      enum: ['user', 'tradesman', 'admin'],
      default: 'user',
    },
    city: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Please provide a phone number'],
      trim: true,
      unique: true,
      match: [
        /^[0-9]{10,15}$/,
        'Please provide a valid phone number (10-15 digits)'
      ],
    },
    isBanned: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

// Create indexes for faster lookup - commenting out to avoid duplicate index warnings
// userSchema.index({ email: 1 });
// userSchema.index({ phone: 1 });

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
  try {
    // If password is already loaded (e.g., through select('+password')), use it directly
    if (this.password) {
      return await bcrypt.compare(password, this.password);
    }
    
    // Otherwise, fetch it from the database
    const user = await (this as any).constructor.findById(this._id).select('+password');
    if (!user || !user.password) {
      return false;
    }
    return await bcrypt.compare(password, user.password);
  } catch (error) {
    console.error('Error comparing password:', error);
    return false;
  }
};

// Cache for model instances
const modelCache: Record<string, Model<IUser>> = {};

/**
 * Get User model based on role - tradesmen, customers, or admin database
 * @param role - The user role to determine which database to use
 */
export async function getUserModel(role?: string): Promise<Model<IUser>> {
  // Use the appropriate database based on role
  let dbType: 'tradesmen' | 'customers' | 'admin' | 'default' = 'default';
  
  if (role === 'tradesman') {
    dbType = 'tradesmen';
  } else if (role === 'user') {
    dbType = 'customers';
  } else if (role === 'admin') {
    dbType = 'admin';
  }

  // Check cache first
  if (modelCache[dbType]) {
    return modelCache[dbType];
  }
  
  // Connect to the appropriate database
  try {
    const conn = await connectDB(dbType);
    console.log(`Connected to ${dbType} database for User model`);
    
    // Create or retrieve model from the connection
    try {
      if (conn.models.User) {
        modelCache[dbType] = conn.models.User;
      } else {
        modelCache[dbType] = conn.model<IUser>('User', userSchema);
      }
      return modelCache[dbType];
    } catch (error) {
      console.error(`Error creating/retrieving User model for ${dbType} database:`, error);
      // If there's an error, try creating the model
      modelCache[dbType] = conn.model<IUser>('User', userSchema);
      return modelCache[dbType];
    }
  } catch (error) {
    console.error(`Failed to connect to ${dbType} database:`, error);
    throw error;
  }
}

// For backward compatibility - use a function to get the default model
let defaultModel: Model<IUser> | null = null;

export default function getDefaultUserModel(): Model<IUser> {
  if (!defaultModel) {
    // Check if the model already exists in mongoose models
    if (mongoose.models.User) {
      defaultModel = mongoose.models.User as Model<IUser>;
    } else {
      // Create a new model if it doesn't exist
      defaultModel = mongoose.model<IUser>('User', userSchema);
    }
  }
  return defaultModel;
} 