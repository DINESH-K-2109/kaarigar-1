'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import MainLayout from '@/components/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import TradesmanRating from '@/components/TradesmanRating';

interface Tradesman {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
    city?: string;
    workingAreas?: { areaName: string; priority: number; }[];
  };
  skills: string[];
  experience: number;
  hourlyRate: number;
  city: string;
  bio: string;
  availability: string;
  rating: number;
  totalReviews: number;
  profileImage?: string;
}

export default function TradesmanDetail() {
  const params = useParams() as { id: string };
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const [tradesman, setTradesman] = useState<Tradesman | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [debugInfo, setDebugInfo] = useState(null);
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    const fetchTradesman = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/tradesmen/${params.id}`, {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to load tradesman details');
        }

        setTradesman(data.data);
        console.log('Tradesman data:', data.data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTradesman();
  }, [params.id]);

  const handleContact = () => {
    if (!tradesman || isNavigating) return;
    
    // If not authenticated, redirect to login with this page as the redirect target
    if (!isAuthenticated) {
      const currentUrl = `/tradesmen/${params.id}`;
      window.location.href = `/auth/login?redirect=${encodeURIComponent(currentUrl)}`;
      return;
    }
    
    // Check if user is trying to message themselves
    if (user && user.id === tradesman.user._id) {
      setError("You cannot start a conversation with yourself");
      return;
    }
    
    // Set navigation flag to prevent double clicks
    setIsNavigating(true);
    
    // If authenticated, proceed to chat with the tradesman's USER id (not the tradesman model id)
    const chatUrl = `/chat/new?tradesman=${tradesman.user._id}`;
    window.location.href = chatUrl;
  };

  if (loading || authLoading) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-gray-50 flex justify-center items-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
          <span className="ml-3 text-gray-700">Loading...</span>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
          <div className="bg-red-50 text-red-700 p-4 rounded-md max-w-md w-full text-center">
            <h2 className="text-lg font-medium mb-2">Error</h2>
            <p>{error}</p>
            <button
              onClick={() => router.back()}
              className="mt-4 text-primary-600 hover:text-primary-800 font-medium"
            >
              Go Back
            </button>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!tradesman) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center">
          <div className="text-center p-6 bg-white rounded-lg shadow-sm max-w-md">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Tradesman Not Found
            </h2>
            <p className="text-gray-500 mb-4">
              The tradesman you are looking for does not exist or has been removed.
            </p>
            <Link
              href="/search"
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
            >
              Back to Search
            </Link>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="bg-gray-50 py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6 md:p-8">
              <div className="md:flex">
                <div className="md:flex-shrink-0 mb-6 md:mb-0 md:mr-6">
                  <div className="h-40 w-40 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden mx-auto">
                    {tradesman.profileImage ? (
                      <Image
                        src={tradesman.profileImage}
                        alt={tradesman.user.name}
                        width={160}
                        height={160}
                        className="object-cover"
                      />
                    ) : (
                      <span className="text-6xl text-gray-500">
                        {tradesman.user.name.charAt(0)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="md:flex-1">
                  <div className="flex flex-wrap items-center justify-between mb-4">
                    <h1 className="text-3xl font-bold text-gray-900">
                      {tradesman.user.name}
                    </h1>
                    <div className="flex items-center text-yellow-400 mt-2 md:mt-0">
                      <span className="text-2xl mr-1">★</span>
                      <span className="text-xl font-medium">{tradesman.rating.toFixed(1)}</span>
                      <span className="text-gray-500 text-sm ml-1">
                        ({tradesman.totalReviews} reviews)
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-4 mb-6">
                    <TradesmanRating
                      tradesmanId={tradesman._id}
                      currentRating={tradesman.rating}
                    />
                  </div>
                  
                  <div className="mb-6">
                    <p className="text-gray-500">
                      <span className="text-gray-800 font-medium">Location:</span>{' '}
                      {tradesman.city}
                    </p>
                    {tradesman.user.phone && (
                      <p className="text-gray-500">
                        <span className="text-gray-800 font-medium">Phone:</span>{' '}
                        {tradesman.user.phone}
                      </p>
                    )}
                    <p className="text-gray-500">
                      <span className="text-gray-800 font-medium">Experience:</span>{' '}
                      {tradesman.experience} years
                    </p>
                    <p className="text-gray-500">
                      <span className="text-gray-800 font-medium">Hourly Rate:</span>{' '}
                      ₹{tradesman.hourlyRate}/hour
                    </p>
                    <p className="text-gray-500">
                      <span className="text-gray-800 font-medium">Availability:</span>{' '}
                      {tradesman.availability}
                    </p>
                    
                    {/* Working Areas Section */}
                    {tradesman.user.workingAreas && tradesman.user.workingAreas.length > 0 && (
                      <div className="mt-4">
                        <p className="text-gray-800 font-medium mb-2">Working Areas:</p>
                        <div className="flex flex-wrap gap-2">
                          {tradesman.user.workingAreas.map((area, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-50 text-primary-700"
                            >
                              {area.areaName}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mb-6">
                    {tradesman.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-50 text-blue-700"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                  
                  <div className="mb-6">
                    <h3 className="text-gray-800 font-medium mb-2">About</h3>
                    <p className="text-gray-600">{tradesman.bio}</p>
                  </div>

                    <button
                      onClick={handleContact}
                    disabled={isNavigating}
                    className="w-full sm:w-auto flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                    >
                    {isNavigating ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-3"></div>
                        Connecting...
                      </>
                    ) : (
                      'Contact'
                    )}
                    </button>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-4 text-center">
            <Link
              href="/search"
              className="inline-flex items-center text-primary-600 hover:text-primary-800"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Search Results
            </Link>
          </div>
        </div>
      </div>
    </MainLayout>
  );
} 