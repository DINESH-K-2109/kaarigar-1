import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, withAuth } from '@/lib/auth';
import { getTradesmanRatingModel } from '@/models/TradesmanRating';

async function handler(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const tradesmanId = params.id;
    const RatingModel = await getTradesmanRatingModel();

    const rating = await RatingModel.findOne({
      tradesman: tradesmanId,
      user: user.id,
    });

    if (!rating) {
      return NextResponse.json({ rating: 0 });
    }

    return NextResponse.json({ rating: rating.rating });
  } catch (error) {
    console.error('Error fetching user rating:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(handler); 