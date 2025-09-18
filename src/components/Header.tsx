'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Image from 'next/image';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const { user, logout, isAuthenticated } = useAuth();
  
  return (
    <header className="sticky top-0 z-40 glass-effect">
      <div className="max-w-7xl mx-auto">
        <div className="mx-4 sm:mx-6 lg:mx-8">
          <div className="flex justify-between h-20">
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-2 group">
                <span className="heading-primary text-2xl lg:text-3xl group-hover:opacity-90 transition-opacity">
                  KAARIGAR
                </span>
              </Link>
              <nav className="hidden sm:ml-10 sm:flex sm:space-x-8 items-center">
                <Link href="/" className="nav-link shine-effect">
                  Home
                </Link>
                <Link href="/search" className="nav-link shine-effect">
                  Find Tradesmen
                </Link>
                {(!user || user.role !== 'tradesman') && (
                  <Link href="/tradesmen/register" className="nav-link shine-effect">
                    Register as Tradesman
                  </Link>
                )}
                {isAuthenticated && (
                  <Link href="/dashboard/messages" className="nav-link shine-effect">
                    Messages
                  </Link>
                )}
              </nav>
            </div>

            <div className="hidden sm:flex sm:items-center sm:space-x-3">
              {isAuthenticated ? (
                <div className="flex items-center space-x-6">
                  <Link
                    href="/help"
                    className="text-secondary-600 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:text-primary-600 shine-effect"
                  >
                    Help
                  </Link>
                  <div className="relative">
                    <button
                      type="button"
                      className="gradient-border flex rounded-xl transition-all duration-200 hover:scale-105 focus:outline-none"
                      onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                    >
                      <span className="sr-only">Open user menu</span>
                      <div className="gradient-bg h-10 w-10 rounded-[10px] flex items-center justify-center text-white font-semibold text-lg shadow-soft">
                        {user?.name.charAt(0)}
                      </div>
                    </button>
                    {isProfileMenuOpen && (
                      <div className="absolute right-0 top-full mt-3 w-64 rounded-xl bg-white py-2 shadow-soft-xl ring-1 ring-black/5 focus:outline-none z-50">
                        <div className="px-4 py-3 border-b border-gray-100">
                          <p className="text-sm text-secondary-600">Signed in as</p>
                          <p className="text-sm font-semibold text-primary-600 truncate">
                            {user?.name}
                          </p>
                        </div>
                        <Link
                          href="/profile"
                          className="block px-4 py-2.5 text-sm text-secondary-700 hover:bg-gray-50 transition-colors duration-200 shine-effect"
                          onClick={() => setIsProfileMenuOpen(false)}
                        >
                          Your Profile
                        </Link>
                        <button
                          onClick={() => {
                            logout();
                            setIsProfileMenuOpen(false);
                          }}
                          className="block w-full text-left px-4 py-2.5 text-sm text-secondary-700 hover:bg-gray-50 transition-colors duration-200 shine-effect"
                        >
                          Sign out
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-4">
                  <Link
                    href="/help"
                    className="text-secondary-600 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 hover:text-primary-600 shine-effect"
                  >
                    Help
                  </Link>
                  <Link href="/auth/signup" className="btn-primary shine-effect">
                    Sign up
                  </Link>
                  <Link href="/auth/login" className="btn-secondary shine-effect">
                    Login
                  </Link>
                </div>
              )}
            </div>

            <div className="flex items-center sm:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-lg text-secondary-400 transition-colors duration-200 hover:text-secondary-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
              >
                <span className="sr-only">Open main menu</span>
                {!isMenuOpen ? (
                  <svg
                    className="block h-6 w-6"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                ) : (
                  <svg
                    className="block h-6 w-6"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {isMenuOpen && (
          <div className="sm:hidden border-t border-gray-100">
            <nav className="px-2 py-3">
              <Link href="/" className="mobile-nav-link shine-effect">
                Home
              </Link>
              <Link href="/search" className="mobile-nav-link shine-effect">
                Find Tradesmen
              </Link>
              {(!user || user.role !== 'tradesman') && (
                <Link href="/tradesmen/register" className="mobile-nav-link shine-effect">
                  Register as Tradesman
                </Link>
              )}
              {isAuthenticated ? (
                <>
                  <Link href="/dashboard/messages" className="mobile-nav-link shine-effect">
                    Messages
                  </Link>
                  <Link href="/profile" className="mobile-nav-link shine-effect">
                    Profile
                  </Link>
                  <button
                    onClick={logout}
                    className="mobile-nav-link shine-effect"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link href="/auth/login" className="mobile-nav-link shine-effect">
                    Login
                  </Link>
                  <div className="px-4 py-3">
                    <Link href="/auth/signup" className="btn-primary w-full shine-effect">
                      Sign up
                    </Link>
                  </div>
                </>
              )}
              <Link href="/help" className="mobile-nav-link shine-effect">
                Help
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header; 