import mongoose, { Model } from 'mongoose';
import { IUser } from './User';
import { ITradesman } from './Tradesman';
import connectDB from '@/lib/db';

export interface ITradesmanRating extends mongoose.Document {
  tradesman: mongoose.Types.ObjectId | ITradesman;
  user: mongoose.Types.ObjectId | IUser;
  rating: number;
  createdAt: Date;
  updatedAt: Date;
}

const tradesmanRatingSchema = new mongoose.Schema(
  {
    tradesman: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tradesman',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
  },
  { timestamps: true }
);

// Create a compound unique index to ensure one rating per user per tradesman
tradesmanRatingSchema.index({ tradesman: 1, user: 1 }, { unique: true });

let ratingModel: Model<ITradesmanRating> | null = null;

export async function getTradesmanRatingModel(): Promise<Model<ITradesmanRating>> {
  if (ratingModel) {
    return ratingModel;
  }
  
  const conn = await connectDB('tradesmen');
  
  try {
    if (conn.models.TradesmanRating) {
      ratingModel = conn.models.TradesmanRating;
    } else {
      ratingModel = conn.model<ITradesmanRating>('TradesmanRating', tradesmanRatingSchema);
    }
    return ratingModel;
  } catch (error) {
    ratingModel = conn.model<ITradesmanRating>('TradesmanRating', tradesmanRatingSchema);
    return ratingModel;
  }
}

export default function getDefaultTradesmanRatingModel(): Model<ITradesmanRating> {
  if (!ratingModel) {
    if (mongoose.models.TradesmanRating) {
      ratingModel = mongoose.models.TradesmanRating as Model<ITradesmanRating>;
    } else {
      ratingModel = mongoose.model<ITradesmanRating>('TradesmanRating', tradesmanRatingSchema);
    }
  }
  return ratingModel;
} 