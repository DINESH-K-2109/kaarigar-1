import React from 'react';
import MainLayout from '@/components/MainLayout';

const HelpPage = () => (
  <MainLayout>
    <div className="max-w-3xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6 text-primary-700">Help & Tutorial</h1>
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Step-by-Step Guide: How to Use KAARIGAR</h2>
        <ol className="list-decimal list-inside space-y-4 text-lg">
          <li>
            <strong>Sign Up:</strong> <br />
            Click the <b>Sign up</b> button in the top right. Fill in your name, email, phone, and password to create your account.
          </li>
          <li>
            <strong>Login:</strong> <br />
            After signing up, click <b>Login</b> and enter your credentials to access your dashboard.
          </li>
          <li>
            <strong>Find Tradesmen:</strong> <br />
            Use the <b>Find Tradesmen</b> link in the navigation to search for professionals by skill or city. You can view their profiles and ratings.
          </li>
          <li>
            <strong>Start a Conversation:</strong> <br />
            Click on a tradesman's profile and use the <b>Messages</b> feature to chat and discuss your requirements in real time.
          </li>
          <li>
            <strong>Register as Tradesman:</strong> <br />
            If you are a tradesman, click <b>Register as Tradesman</b> in the navigation. Fill out your professional details to offer your services on the platform.
          </li>
          <li>
            <strong>Manage Your Profile:</strong> <br />
            Access your profile from the user menu. Here you can update your name, city, and change your password.
          </li>
          <li>
            <strong>Logout:</strong> <br />
            Click the profile icon and select <b>Sign out</b> to securely log out of your account.
          </li>
        </ol>
      </section>
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Frequently Asked Questions</h2>
        <div className="mb-4">
          <h3 className="font-semibold">How do I become a tradesman?</h3>
          <p>Sign up as a user, then click "Register as Tradesman" in the navigation bar and fill out your professional details.</p>
        </div>
        <div className="mb-4">
          <h3 className="font-semibold">How do I contact a tradesman?</h3>
          <p>Use the "Find Tradesmen" page to search and then click on a tradesman's profile to start a conversation.</p>
        </div>
        <div className="mb-4">
          <h3 className="font-semibold">Is my data secure?</h3>
          <p>Yes, your data is securely stored and only visible to you and the platform administrators.</p>
        </div>
        <div className="mb-4">
          <h3 className="font-semibold">I forgot my password. What should I do?</h3>
          <p>Go to your profile page and use the "Change Password" section to reset your password.</p>
        </div>
      </section>
      <section>
        <h2 className="text-xl font-semibold mb-2">Need More Help?</h2>
        <p>If you have any other questions or need support, please contact us at <a href="mailto:dineshksahu2109@gmail.com" className="text-primary-600 underline">dineshksahu2109@gmail.com</a>.</p>
      </section>
    </div>
  </MainLayout>
);

export default HelpPage; 