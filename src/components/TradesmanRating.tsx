'use client';

import { useState, useEffect } from 'react';
import { FaStar } from 'react-icons/fa';
import { useAuth } from '@/contexts/AuthContext';

interface TradesmanRatingProps {
  tradesmanId: string;
  currentRating: number;
}

export default function TradesmanRating({ tradesmanId, currentRating }: TradesmanRatingProps) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [userRating, setUserRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    // Fetch user's existing rating if they're logged in
    const fetchUserRating = async () => {
      if (user?.id) {
        try {
          const response = await fetch(`/api/ratings/${tradesmanId}/user`);
          if (response.ok) {
            const data = await response.json();
            if (data.rating) {
              setRating(data.rating);
              setUserRating(data.rating);
            }
          }
        } catch (error) {
          console.error('Error fetching user rating:', error);
        }
      }
    };

    fetchUserRating();
  }, [tradesmanId, user?.id]);

  const handleRating = async (value: number) => {
    if (!user) {
      alert('Please log in to rate this tradesman');
      return;
    }

    if (isSubmitting) return;

    // If the user clicks the same star they already rated, do nothing
    if (value === userRating) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/ratings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tradesmanId,
          rating: value,
        }),
      });

      if (response.ok) {
        setRating(value);
        setUserRating(value);
        // Optionally refresh the page or update the UI
        window.location.reload();
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to submit rating');
      }
    } catch (error) {
      console.error('Error submitting rating:', error);
      alert('Failed to submit rating');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            className={`text-2xl transition-colors ${
              userRating
                ? star <= userRating
                  ? 'text-yellow-400'
                  : 'text-gray-300'
                : star <= (hover || rating)
                ? 'text-yellow-400'
                : 'text-gray-300'
            } hover:scale-110`}
            onClick={() => handleRating(star)}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            disabled={isSubmitting}
          >
            <FaStar />
          </button>
        ))}
      </div>
      <p className="text-sm text-gray-600">
        {userRating
          ? 'Click a different star to update your rating'
          : 'Click to rate this tradesman'}
      </p>
      <p className="text-sm font-medium">
        Current Rating: {currentRating.toFixed(1)} / 5
      </p>
    </div>
  );
} 