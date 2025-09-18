import React from 'react';
import Link from 'next/link';

interface WorkingArea {
  areaName: string;
  priority: number;
}

interface Tradesman {
  _id: string;
  user: {
    _id: string;
    name: string;
    city?: string;
    workingAreas?: WorkingArea[];
  };
  rating: number;
  totalReviews: number;
  hourlyRate: number;
  skills: string[];
  bio: string;
}

interface Props {
  tradesman: Tradesman;
}

const TradesmanCard: React.FC<Props> = ({ tradesman }) => {
  const workingAreas = tradesman.user.workingAreas || [];
  const topAreas = workingAreas.slice(0, 2);

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-xl font-semibold">
            {tradesman.user.name.charAt(0)}
          </div>
        </div>
        
        <div className="ml-4 flex-1">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              {tradesman.user.name}
            </h3>
            <div className="flex items-center">
              <span className="text-yellow-400 mr-1">★</span>
              <span className="font-medium">{tradesman.rating.toFixed(1)}</span>
              <span className="text-gray-500 text-sm ml-1">
                ({tradesman.totalReviews} reviews)
              </span>
            </div>
          </div>
          
          <p className="text-gray-600 mt-1">{tradesman.user.city}</p>
          <p className="text-primary-600 font-medium mt-1">₹{tradesman.hourlyRate}/hour</p>
          
          <div className="mt-3">
            <h4 className="text-sm font-medium text-gray-700 mb-1">Skills</h4>
            <div className="flex flex-wrap gap-2">
              {tradesman.skills.map((skill, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {workingAreas.length > 0 && (
            <div className="mt-3">
              <h4 className="text-sm font-medium text-gray-700 mb-1">Service Areas</h4>
              <div className="flex items-center gap-2">
                {topAreas.map((area, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-50 text-primary-700"
                  >
                    {area.areaName}
                  </span>
                ))}
                {workingAreas.length > 2 && (
                  <span className="text-xs text-gray-500">
                    +{workingAreas.length - 2} more
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="mt-4">
            <p className="text-gray-600 text-sm line-clamp-2">{tradesman.bio}</p>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <Link
              href={`/tradesmen/${tradesman._id}`}
              className="text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              View Profile
            </Link>
            <button
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Contact
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TradesmanCard; 