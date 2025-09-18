import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, withAuth } from '@/lib/auth';
import { getTradesmanModel } from '@/models/Tradesman';
import { getTradesmanRatingModel } from '@/models/TradesmanRating';

async function handler(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { tradesmanId, rating } = await req.json();

    if (!tradesmanId || !rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { message: 'Invalid rating data' },
        { status: 400 }
      );
    }

    const TradesmanModel = await getTradesmanModel();
    const RatingModel = await getTradesmanRatingModel();

    // Check if tradesman exists
    const tradesman = await TradesmanModel.findById(tradesmanId);
    if (!tradesman) {
      return NextResponse.json(
        { message: 'Tradesman not found' },
        { status: 404 }
      );
    }

    // Check if user has already rated this tradesman
    let existingRating = await RatingModel.findOne({
      tradesman: tradesmanId,
      user: user.id,
    });

    let newRating;
    if (existingRating) {
      // Update existing rating
      existingRating.rating = rating;
      existingRating.updatedAt = new Date();
      newRating = await existingRating.save();
    } else {
      // Create new rating
      newRating = await RatingModel.create({
        tradesman: tradesmanId,
        user: user.id,
        rating,
      });
    }

    // Update tradesman's average rating
    const allRatings = await RatingModel.find({ tradesman: tradesmanId });
    const totalRating = allRatings.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = totalRating / allRatings.length;

    await TradesmanModel.findByIdAndUpdate(tradesmanId, {
      rating: averageRating,
      totalReviews: allRatings.length,
    });

    return NextResponse.json(newRating);
  } catch (error) {
    console.error('Error submitting rating:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const POST = withAuth(handler); 