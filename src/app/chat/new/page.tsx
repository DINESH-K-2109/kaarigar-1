'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import MainLayout from '@/components/MainLayout';

export default function NewChat() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading, isAuthenticated } = useAuth();
  const [error, setError] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const tradesmanId = searchParams.get('tradesman');
  const [redirected, setRedirected] = useState(false);
  const [hasInitiated, setHasInitiated] = useState(false);
  const apiCallInProgress = useRef(false);

  const checkAndCreateConversation = useCallback(async () => {
    if (!tradesmanId || !user || apiCallInProgress.current) {
      return;
    }
    
    // Set the API call flag to prevent duplicate calls
    apiCallInProgress.current = true;
    
    try {
      setIsCreating(true);
      
      // First check if a conversation already exists
      const checkResponse = await fetch('/api/conversations', {
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      if (checkResponse.ok) {
        const { data: conversations } = await checkResponse.json();
        
        // Look for an existing conversation with this tradesman
        const existingConversation = conversations.find((conv: any) => 
          conv.participants.some((p: any) => p._id === tradesmanId)
        );
        
        if (existingConversation) {
          // Redirect to existing conversation
          window.location.href = `/dashboard/messages/${existingConversation._id}`;
          return;
        }
      }
      
      // If no existing conversation, create a new one
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        credentials: 'include',
        body: JSON.stringify({
          receiverId: tradesmanId,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create conversation');
      }
      
      // Redirect to the conversation using window.location for a full page refresh
      window.location.href = `/dashboard/messages/${data.data._id}`;
    } catch (err: any) {
      console.error('Error with conversation:', err);
      setError(err.message || 'Failed to create conversation');
      setIsCreating(false);
      apiCallInProgress.current = false;
    }
  }, [tradesmanId, user]);

  useEffect(() => {
    // If already redirected or has initiated the process, don't do anything
    if (redirected || hasInitiated || isCreating || apiCallInProgress.current) return;
    
    // Wait for auth to be checked
    if (isLoading) return;

    // If not authenticated and we have a tradesman ID, redirect to login
    if (!isAuthenticated && tradesmanId) {
      setRedirected(true);
      const currentUrl = `/chat/new?tradesman=${tradesmanId}`;
      const loginUrl = `/auth/login?redirect=${encodeURIComponent(currentUrl)}`;
      window.location.href = loginUrl;
      return;
    }

    // Prevent attempting to create a conversation with yourself
    if (user && tradesmanId && user.id === tradesmanId) {
      setError("You cannot start a conversation with yourself");
      return;
    }

    // If authenticated and we have a tradesman ID, check for existing conversation first
    if (isAuthenticated && tradesmanId && user && user.id !== tradesmanId) {
      setHasInitiated(true);
      checkAndCreateConversation();
    } else if (!tradesmanId) {
      setError('Tradesman ID is missing');
    }
  }, [
    isLoading,
    isAuthenticated,
    tradesmanId,
    user,
    redirected,
    hasInitiated,
    isCreating,
    checkAndCreateConversation
  ]);

  if (error) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-gray-50 flex justify-center items-center">
          <div className="bg-white p-8 rounded-lg shadow-sm max-w-md w-full">
            <div className="text-red-600 mb-4">{error}</div>
            <button
              onClick={() => router.back()}
              className="w-full inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Go Back
            </button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        <span className="ml-3 text-gray-700">
          {isCreating ? 'Creating conversation...' : 'Loading...'}
        </span>
      </div>
    </MainLayout>
  );
} 