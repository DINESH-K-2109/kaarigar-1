'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/MainLayout';
import { useAuth } from '@/contexts/AuthContext';

interface Conversation {
  _id: string;
  participants: {
    _id: string;
    name: string;
    email: string;
    role: string;
  }[];
  lastMessage?: string;
  updatedAt: string;
}

export default function Messages() {
  const router = useRouter();
  const { user, isLoading, isAuthenticated } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [participantNames, setParticipantNames] = useState<Record<string, string>>({});
  const [isDeleting, setIsDeleting] = useState(false);

  // Ensure authentication
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      window.location.href = '/auth/login?redirect=/dashboard/messages';
    }
  }, [isLoading, isAuthenticated]);

  // Lookup tradesman name by ID
  const lookupTradesmanName = async (userId: string) => {
    try {
      // First try the tradesman API
      const response = await fetch(`/api/tradesmen?userId=${userId}`, {
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data && data.data.length > 0) {
          return data.data[0].name;
        }
      }

      // If not found, try the direct lookup
      const fallbackResponse = await fetch(`/api/tradesmen/lookup?id=${userId}`, {
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });

      if (fallbackResponse.ok) {
        const fallbackData = await fallbackResponse.json();
        if (fallbackData.success && fallbackData.name) {
          return fallbackData.name;
        }
      }

      return null;
    } catch (error) {
      console.error("Error looking up tradesman name:", error);
      return null;
    }
  };

  useEffect(() => {
    const fetchConversations = async () => {
      if (!isAuthenticated) return;
      
      try {
        setLoading(true);
        const response = await fetch('/api/conversations', {
          credentials: 'include',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to load conversations');
        }

        setConversations(data.data);

        // Lookup names for all conversations with "Unknown User"
        const namesMap: Record<string, string> = {};
        
        for (const conversation of data.data) {
          if (!user) continue;
          
          const otherParticipant = conversation.participants.find(
            (p: any) => p._id !== user.id
          );
          
          if (otherParticipant && (!otherParticipant.name || otherParticipant.name === 'Unknown User')) {
            const name = await lookupTradesmanName(otherParticipant._id);
            if (name) {
              namesMap[otherParticipant._id] = name;
            }
          }
        }
        
        setParticipantNames(namesMap);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (!isLoading) {
      fetchConversations();
    }
  }, [isLoading, isAuthenticated, user]);

  const getOtherParticipant = (conversation: Conversation) => {
    if (!user || !conversation.participants || conversation.participants.length === 0) {
      return { name: 'Unknown User', email: '', role: 'unknown' };
    }
    
    // Find the participant that is not the current user
    const otherUser = conversation.participants.find(
      participant => participant && participant._id !== user.id
    );
    
    // If no other participant is found, return a default
    if (!otherUser) {
      return { name: 'Unknown User', email: '', role: 'unknown' };
    }
    
    // Format the display name based on role
    const displayName = `${otherUser.name} (${otherUser.role === 'tradesman' ? 'Tradesman' : 'User'})`;
    
    return {
      ...otherUser,
      name: displayName
    };
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleCleanAllConversations = async () => {
    if (!confirm('Are you sure you want to delete all conversations? This action cannot be undone.')) {
      return;
    }

    try {
      setIsDeleting(true);
      const response = await fetch('/api/conversations', {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete conversations');
      }

      // Clear the conversations from state
      setConversations([]);
      
    } catch (err: any) {
      setError(err.message || 'Failed to delete conversations');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading || (loading && isAuthenticated)) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-gray-50 flex justify-center items-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
          <span className="ml-3 text-gray-700">Loading...</span>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h1 className="text-xl font-semibold text-gray-900">Messages</h1>
            </div>

            {error && (
              <div className="p-4 bg-red-50 text-red-700">
                <p>{error}</p>
              </div>
            )}

            {conversations.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-gray-500">You don't have any conversations yet.</p>
                <Link
                  href="/search"
                  className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
                >
                  Find Tradesmen
                </Link>
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {conversations.map((conversation) => {
                  const otherParticipant = getOtherParticipant(conversation);
                  return (
                    <li key={conversation._id} className="hover:bg-gray-50">
                      <div className="flex items-center justify-between px-6 py-4">
                        <Link
                          href={`/dashboard/messages/${conversation._id}`}
                          className="flex-1"
                        >
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                              <span className="text-primary-700 font-medium">
                                {otherParticipant.name.charAt(0)}
                              </span>
                            </div>
                            <div className="ml-3">
                              <p className="text-sm font-medium text-gray-900">
                                {otherParticipant.name}
                              </p>
                              <p className="text-sm text-gray-500 line-clamp-1">
                                {conversation.lastMessage || 'Start a conversation...'}
                              </p>
                            </div>
                          </div>
                        </Link>
                        <div className="flex items-center">
                          <span className="text-xs text-gray-500 mr-4">
                            {formatDate(conversation.updatedAt)}
                          </span>
                          <button
                            onClick={async (e) => {
                              e.preventDefault();
                              if (!confirm('Are you sure you want to delete this conversation from your view?')) {
                                return;
                              }
                              try {
                                const response = await fetch(`/api/conversations/${conversation._id}/delete`, {
                                  method: 'POST',
                                  credentials: 'include'
                                });
                                if (!response.ok) {
                                  throw new Error('Failed to delete conversation');
                                }
                                // Remove the conversation from the list
                                setConversations(conversations.filter(c => c._id !== conversation._id));
                              } catch (err: any) {
                                setError(err.message || 'Failed to delete conversation');
                              }
                            }}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
} 