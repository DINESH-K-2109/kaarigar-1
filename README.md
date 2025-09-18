# KAARIGAR

Kaarigar is a platform connecting skilled tradesmen with users seeking their services. Tradesmen can register with their skills, and users can search for tradesmen based on skills and location.

## Features

- **User Authentication**: Sign up, login, and logout functionality
- **Tradesman Registration**: Tradesmen can create profiles with skills, experience, rates, etc.
- **Search Functionality**: Search for tradesmen based on skills and city
- **Messaging System**: Users can chat with tradesmen to discuss work and rates
- **Responsive Design**: Works on mobile, tablet, and desktop

## Tech Stack

- **Frontend**: Next.js, React, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (JSON Web Tokens)

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- MongoDB

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/kaarigar.git
cd kaarigar
```

2. Install dependencies
```bash
npm install
```

3. Create a `.env.local` file in the root directory with the following variables:
```
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

4. Run the development server
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
kaarigar/
├── src/
│   ├── app/              # Next.js App Router
│   │   ├── api/          # API Routes
│   │   ├── auth/         # Authentication pages
│   │   ├── dashboard/    # Dashboard pages
│   │   ├── search/       # Search page
│   │   ├── tradesmen/    # Tradesman pages
│   │   └── ...
│   ├── components/       # Reusable React components
│   ├── lib/              # Utility functions
│   └── models/           # Database models
├── public/               # Static files
└── ...
```

## API Routes

- **Authentication**
  - `POST /api/auth/register` - Register a new user
  - `POST /api/auth/login` - Login a user
  - `GET /api/auth/logout` - Logout a user

- **Tradesmen**
  - `GET /api/tradesmen` - Get all tradesmen or search by criteria
  - `POST /api/tradesmen/register` - Register as a tradesman
  - `GET /api/tradesmen/:id` - Get a specific tradesman

- **Conversations**
  - `GET /api/conversations` - Get all conversations
  - `POST /api/conversations` - Create a new conversation
  - `GET /api/conversations/:id/messages` - Get messages for a conversation
  - `POST /api/conversations/:id/messages` - Send a message in a conversation

## License

This project is licensed under the MIT License. 