'use client';

import { useState, useRef, useEffect } from 'react';
import { chatbotData, FeedbackData, defaultResponse } from '@/data/chatbot-data';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  suggestedQuestions?: string[];
  responseId?: string;
  showFeedback?: boolean;
  feedback?: FeedbackData;
}

export default function ChatbotSupport() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      text: 'Hello! How can I help you today?',
      isUser: false,
      suggestedQuestions: ['What is Kaarigar?', 'How do I find a tradesman?', 'How do I register?']
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const findBestMatch = (input: string) => {
    const inputLower = input.toLowerCase();
    let bestMatch = null;
    let maxMatchCount = 0;

    for (const response of chatbotData) {
      const matchCount = response.keywords.filter((keyword: string) => 
        inputLower.includes(keyword.toLowerCase())
      ).length;

      if (matchCount > maxMatchCount) {
        maxMatchCount = matchCount;
        bestMatch = response;
      }
    }

    return maxMatchCount > 0 ? bestMatch : null;
  };

  const handleSuggestedQuestionClick = (question: string) => {
    handleSubmit(question);
  };

  const handleFeedback = (messageId: string, responseId: string, isHelpful: boolean) => {
    setMessages(prevMessages => 
      prevMessages.map(msg => 
        msg.id === messageId
          ? {
              ...msg,
              feedback: {
                responseId,
                isHelpful,
                comment: ''
              }
            }
          : msg
      )
    );
  };

  const handleSubmit = async (input: string = inputValue) => {
    if (!input.trim()) return;

    // Add user message
    const userMessageId = Date.now().toString();
    setMessages(prev => [...prev, { id: userMessageId, text: input, isUser: true }]);
    setInputValue('');
    setIsTyping(true);

    // Simulate typing delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Find best match
    const match = findBestMatch(input);
    const botMessageId = (Date.now() + 1).toString();

    if (match) {
      setMessages(prev => [...prev, {
        id: botMessageId,
        text: match.answer,
        isUser: false,
        suggestedQuestions: match.suggestedQuestions,
        responseId: match.id,
        showFeedback: true
      }]);
    } else {
      setMessages(prev => [...prev, {
        id: botMessageId,
        text: defaultResponse.answer,
        isUser: false,
        suggestedQuestions: defaultResponse.suggestedQuestions
      }]);
    }

    setIsTyping(false);
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-blue-500 text-white p-4 rounded-t-lg">
        <h2 className="text-xl font-semibold">Kaarigar Support</h2>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-lg p-3 ${
              message.isUser ? 'bg-blue-500 text-white' : 'bg-white shadow-md'
            }`}>
              <p>{message.text}</p>
              
              {/* Suggested Questions */}
              {!message.isUser && message.suggestedQuestions && (
                <div className="mt-3 space-y-2">
                  {message.suggestedQuestions.map((question, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestedQuestionClick(question)}
                      className="block w-full text-left text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-1 rounded"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              )}

              {/* Feedback Buttons */}
              {!message.isUser && message.showFeedback && !message.feedback && (
                <div className="mt-3 flex space-x-2 text-sm">
                  <span className="text-gray-600">Was this helpful?</span>
                  <button
                    onClick={() => handleFeedback(message.id, message.responseId!, true)}
                    className="text-green-600 hover:text-green-800"
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => handleFeedback(message.id, message.responseId!, false)}
                    className="text-red-600 hover:text-red-800"
                  >
                    No
                  </button>
                </div>
              )}

              {/* Feedback Response */}
              {message.feedback && (
                <div className="mt-2 text-sm text-gray-600">
                  Thank you for your feedback!
                </div>
              )}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-200 rounded-lg p-3">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-100"></div>
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-200"></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t">
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="flex space-x-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
} 