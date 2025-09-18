'use client';

import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <Link href="/" className="heading-primary font-bold text-2xl">
              KAARIGAR
            </Link>
            <p className="mt-4 text-gray-600 max-w-md">
              Connecting skilled tradesmen with customers who need their services. Find reliable professionals for all your needs.
            </p>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
              Quick Links
            </h3>
            <ul className="mt-4 space-y-3">
              <li>
                <Link href="/search" className="text-gray-600 hover:text-primary-600 transition-colors duration-200">
                  Find Tradesmen
                </Link>
              </li>
              <li>
                <Link href="/tradesmen/register" className="text-gray-600 hover:text-primary-600 transition-colors duration-200">
                  Register as Tradesman
                </Link>
              </li>
              <li>
                <Link href="/help" className="text-gray-600 hover:text-primary-600 transition-colors duration-200">
                  Help Center
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
              Contact
            </h3>
            <ul className="mt-4 space-y-3 text-gray-600">
              <li>Email: dineshksahu2109@gmail.com</li>
              <li>Phone: +91 9817677742</li>
              <li>Address: Kaarigar Pvt. Ltd., GJUS&T, Hisar</li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t border-gray-100">
          <p className="text-center text-gray-500 text-sm">
            © {new Date().getFullYear()} Kaarigar. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
} 