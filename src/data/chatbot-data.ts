interface ChatbotResponse {
  id: string;
  category: string;
  question: string;
  answer: string;
  suggestedQuestions?: string[];
  keywords: string[];
}

interface TradesmanQuery {
  type: string;
  keywords: string[];
}

// FAQ responses
export const chatbotData: ChatbotResponse[] = [
  {
    id: 'general-1',
    category: 'General',
    question: 'What is Kaarigar?',
    answer: 'Kaarigar is a platform that connects skilled tradesmen with customers who need their services. We help you find reliable professionals for your home improvement and repair needs.',
    suggestedQuestions: [
      'How do I find a tradesman?',
      'How do I register as a tradesman?',
      'Is Kaarigar free to use?'
    ],
    keywords: ['what', 'kaarigar', 'about', 'platform', 'introduction']
  },
  {
    id: 'registration-1',
    category: 'Registration',
    question: 'How do I register as a tradesman?',
    answer: 'To register as a tradesman, click on the "Register as Tradesman" button in the navigation menu. Fill out your details, including your skills, experience, and working areas. Once submitted, our team will review your application.',
    suggestedQuestions: [
      'What documents do I need to register?',
      'How long does verification take?',
      'What areas can I work in?'
    ],
    keywords: ['register', 'signup', 'become', 'tradesman', 'join']
  },
  {
    id: 'customer-1',
    category: 'Customer Support',
    question: 'How do I find a tradesman?',
    answer: 'You can find a tradesman by using our search feature. Enter your location and the type of service you need. Browse through the available tradesmen, check their ratings, reviews, and choose the one that best fits your requirements.',
    suggestedQuestions: [
      'How do I contact a tradesman?',
      'Can I see tradesman reviews?',
      'How do I book a service?'
    ],
    keywords: ['find', 'search', 'look', 'tradesman', 'service']
  },
  {
    id: 'payment-1',
    category: 'Payments',
    question: 'How does payment work?',
    answer: 'Payments are handled securely through our platform. You can pay using various methods including credit/debit cards and digital wallets. Payment is only released to the tradesman after you confirm the job is completed satisfactorily.',
    suggestedQuestions: [
      'What payment methods are accepted?',
      'Is there a booking fee?',
      'How do refunds work?'
    ],
    keywords: ['payment', 'pay', 'cost', 'fee', 'money']
  },
  {
    id: 'safety-1',
    category: 'Safety & Security',
    question: 'Are tradesmen verified?',
    answer: 'Yes, all tradesmen on our platform go through a verification process. We check their identity, qualifications, and work experience. We also maintain a rating system based on customer feedback to ensure quality service.',
    suggestedQuestions: [
      'What safety measures are in place?',
      'How do you verify tradesmen?',
      'Can I report a problem?'
    ],
    keywords: ['verify', 'safe', 'security', 'check', 'trusted']
  },
  {
    id: 'booking-1',
    category: 'Booking',
    question: 'How do I book a service?',
    answer: 'To book a service, first find a suitable tradesman through our search. Click on their profile, check their availability, and click "Book Now". Fill in the job details and your preferred time slot. The tradesman will confirm the booking.',
    suggestedQuestions: [
      'Can I cancel a booking?',
      'How do I reschedule?',
      'What happens after booking?'
    ],
    keywords: ['book', 'schedule', 'appointment', 'service', 'booking']
  },
  {
    id: 'support-1',
    category: 'Support',
    question: 'How do I contact customer support?',
    answer: 'You can contact our customer support team through multiple channels: this chat interface, email at support@kaarigar.com, or through our help center. For urgent matters, please use the emergency contact number provided in your booking.',
    suggestedQuestions: [
      'What are support hours?',
      'How do I report an issue?',
      'Can I get a refund?'
    ],
    keywords: ['contact', 'support', 'help', 'assistance', 'customer service']
  }
];

// Common user queries
export const userQueries: ChatbotResponse[] = [
  {
    keywords: ['contact', 'support', 'help'],
    response: "Our support team is available 24/7. You can: 1. Email us at dineshksahu2109@gmail.com 2. Use the chat feature 3. Call us at 1800-KAARIGAR"
  },
  {
    keywords: ['profile', 'account', 'update', 'edit'],
    response: "To update your profile: 1. Click on your profile picture 2. Select 'Edit Profile' 3. Update your information 4. Click 'Save Changes'"
  },
  {
    keywords: ['forgot', 'password', 'reset'],
    response: "To reset your password: 1. Click 'Forgot Password' on the login page 2. Enter your email 3. Follow the instructions sent to your email"
  }
];

// Tradesman query patterns
export const tradesmanQueryPatterns: TradesmanQuery[] = [
  {
    type: "skills",
    keywords: ['what', 'services', 'provide', 'work', 'do']
  },
  {
    type: "experience",
    keywords: ['experience', 'how long', 'years']
  },
  {
    type: "rating",
    keywords: ['rating', 'reviews', 'feedback']
  },
  {
    type: "availability",
    keywords: ['available', 'when', 'timing', 'schedule']
  },
  {
    type: "location",
    keywords: ['where', 'location', 'area', 'city']
  }
];

// Helper function to find best matching response
export function findBestResponse(query: string): string {
  const words = query.toLowerCase().split(' ');
  let bestMatch = {
    response: "I'm sorry, I couldn't understand your question. Please try rephrasing or contact our support team for assistance.",
    matchCount: 0
  };

  // Check FAQ responses
  [...chatbotData, ...userQueries].forEach(item => {
    const matchCount = item.keywords.filter(keyword => 
      words.includes(keyword.toLowerCase())
    ).length;

    if (matchCount > bestMatch.matchCount) {
      bestMatch = {
        response: item.response,
        matchCount
      };
    }
  });

  return bestMatch.response;
}

// Helper function to check if query is about a tradesman
export function isTradesmanQuery(query: string): boolean {
  const words = query.toLowerCase().split(' ');
  return tradesmanQueryPatterns.some(pattern => 
    pattern.keywords.some(keyword => words.includes(keyword.toLowerCase()))
  );
}

// Helper function to get tradesman query type
export function getTradesmanQueryType(query: string): string | null {
  const words = query.toLowerCase().split(' ');
  const matchedPattern = tradesmanQueryPatterns.find(pattern => 
    pattern.keywords.some(keyword => words.includes(keyword.toLowerCase()))
  );
  return matchedPattern?.type || null;
}

export interface FeedbackData {
  responseId: string;
  isHelpful: boolean;
  comment?: string;
}

export const defaultResponse = {
  answer: "I'm sorry, I couldn't find a specific answer to your question. Would you like to speak with our customer support team?",
  suggestedQuestions: [
    'How do I contact customer support?',
    'What is Kaarigar?',
    'How do I find a tradesman?'
  ]
}; 