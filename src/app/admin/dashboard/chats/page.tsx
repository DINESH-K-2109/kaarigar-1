'use client';

import { useState, useEffect } from 'react';
import MainLayout from '@/components/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

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

export default function AdminChats() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Ensure admin authentication
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== 'admin')) {
      window.location.href = '/auth/admin/login?redirect=/admin/dashboard/chats';
    }
  }, [isLoading, isAuthenticated, user]);

  // Fetch all conversations
  useEffect(() => {
    const fetchConversations = async () => {
      if (!isAuthenticated || user?.role !== 'admin') return;
      
      try {
        setLoading(true);
        const response = await fetch('/api/admin/conversations', {
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch conversations');
        }

        const data = await response.json();
        setConversations(data.data);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch conversations');
      } finally {
        setLoading(false);
      }
    };

    if (!isLoading) {
      fetchConversations();
    }
  }, [isLoading, isAuthenticated, user]);

  const handleDeleteConversation = async (conversationId: string) => {
    if (!confirm('Are you sure you want to delete this conversation? This will permanently delete all messages for all users.')) {
      return;
    }

    try {
      const response = await fetch('/api/admin/conversations', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ conversationId })
      });

      if (!response.ok) {
        throw new Error('Failed to delete conversation');
      }

      // Remove the conversation from the list
      setConversations(conversations.filter(c => c._id !== conversationId));
    } catch (err: any) {
      setError(err.message || 'Failed to delete conversation');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h1 className="text-xl font-semibold text-gray-900">Chat Management</h1>
            </div>

            {error && (
              <div className="p-4 bg-red-50 text-red-700">
                <p>{error}</p>
              </div>
            )}

            {conversations.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                No conversations found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Participants
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Last Message
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Last Updated
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {conversations.map((conversation) => (
                      <tr key={conversation._id}>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            {conversation.participants.map((participant) => (
                              <div key={participant._id} className="text-sm">
                                <span className="font-medium text-gray-900">
                                  {participant.name}
                                </span>
                                <span className="text-gray-500">
                                  {' '}({participant.role})
                                </span>
                                <br />
                                <span className="text-gray-500">{participant.email}</span>
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 line-clamp-2">
                            {conversation.lastMessage || 'No messages'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {formatDate(conversation.updatedAt)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleDeleteConversation(conversation._id)}
                            className="text-red-600 hover:text-red-900 text-sm font-medium"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
} 