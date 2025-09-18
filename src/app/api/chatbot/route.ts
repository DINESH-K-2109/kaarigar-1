import { NextResponse } from 'next/server';
import { ChatbotService } from '@/lib/chatbot-service';

const chatbot = new ChatbotService();

export async function POST(req: Request) {
  try {
    const { query, tradesmanId } = await req.json();

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    const response = await chatbot.handleQuery(query, tradesmanId);
    
    return NextResponse.json({ response });
  } catch (error) {
    console.error('Chatbot API error:', error);
    return NextResponse.json(
      { error: 'Failed to process query' },
      { status: 500 }
    );
  }
} 