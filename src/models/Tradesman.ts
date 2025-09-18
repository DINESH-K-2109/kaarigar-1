import mongoose, { Model } from 'mongoose';
import { IUser } from './User';
import connectDB from '@/lib/db';

interface WorkingArea {
  areaName: string;
  priority: number;
}

export interface ITradesman extends mongoose.Document {
  user: mongoose.Types.ObjectId | IUser;
  userId: string;  // Store the actual user ID for easy lookup
  name: string;    // Duplicate user name for quick access
  email: string;   // Duplicate user email for quick access
  phone: string;   // Duplicate user phone for quick access
  skills: string[];
  experience: number;
  hourlyRate: number;
  city: string;
  bio: string;
  availability: string;
  rating: number;
  totalReviews: number;
  profileImage?: string;
  workingAreas: WorkingArea[];
  createdAt: Date;
  updatedAt: Date;
}

const tradesmanSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    skills: {
      type: [String],
      required: [true, 'Please provide at least one skill'],
    },
    experience: {
      type: Number,
      required: [true, 'Please provide years of experience'],
      min: [0, 'Experience cannot be negative'],
    },
    hourlyRate: {
      type: Number,
      required: [true, 'Please provide your hourly rate'],
      min: [0, 'Hourly rate cannot be negative'],
    },
    city: {
      type: String,
      required: [true, 'Please provide your city'],
      trim: true,
    },
    bio: {
      type: String,
      required: [true, 'Please provide a short bio'],
      trim: true,
      maxlength: [500, 'Bio cannot be more than 500 characters'],
    },
    availability: {
      type: String,
      required: [true, 'Please provide your availability'],
      trim: true,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalReviews: {
      type: Number,
      default: 0,
    },
    profileImage: {
      type: String,
    },
    workingAreas: {
      type: [{
        areaName: {
          type: String,
          required: true,
          trim: true
        },
        priority: {
          type: Number,
          required: true,
          default: 0
        }
      }],
      default: []
    },
  },
  { timestamps: true }
);

// Create a compound index for efficient searching
tradesmanSchema.index({ city: 1, skills: 1 });
tradesmanSchema.index({ userId: 1 }, { unique: true });
tradesmanSchema.index({ 'workingAreas.areaName': 1 }); // Add index for working areas

// Model cache
let tradesmanModel: Model<ITradesman> | null = null;

/**
 * Get Tradesman model from the tradesmen database
 */
export async function getTradesmanModel(): Promise<Model<ITradesman>> {
  // Return cached model if available
  if (tradesmanModel) {
    return tradesmanModel;
  }
  
  // Connect to the tradesmen database
  const conn = await connectDB('tradesmen');
  
  // Create or retrieve model from the connection
  try {
    if (conn.models.Tradesman) {
      tradesmanModel = conn.models.Tradesman;
    } else {
      tradesmanModel = conn.model<ITradesman>('Tradesman', tradesmanSchema);
    }
    return tradesmanModel;
  } catch (error) {
    // If there's an error, try creating the model
    tradesmanModel = conn.model<ITradesman>('Tradesman', tradesmanSchema);
    return tradesmanModel;
  }
}

// For backward compatibility - use a function to get the default model
let defaultModel: Model<ITradesman> | null = null;

export default function getDefaultTradesmanModel(): Model<ITradesman> {
  if (!defaultModel) {
    // Check if the model already exists in mongoose models
    if (mongoose.models.Tradesman) {
      defaultModel = mongoose.models.Tradesman as Model<ITradesman>;
    } else {
      // Create a new model if it doesn't exist
      defaultModel = mongoose.model<ITradesman>('Tradesman', tradesmanSchema);
    }
  }
  return defaultModel;
} 