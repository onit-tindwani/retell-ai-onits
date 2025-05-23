import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

interface Call {
  id: string;
  phoneNumber: string;
  duration: number;
  status: 'completed' | 'failed' | 'missed';
  timestamp: string;
  transcript: string;
}

const CallHistory: React.FC = () => {
  const [calls, setCalls] = useState<Call[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const API_URL = process.env.REACT_APP_API_URL;

  useEffect(() => {
    const fetchCalls = async () => {
      try {
        const response = await fetch(`${API_URL}/api/calls`);
        if (!response.ok) {
          throw new Error('Failed to fetch calls');
        }
        const data = await response.json();
        setCalls(data);
      } catch (error) {
        console.error('Error fetching calls:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCalls();
  }, [API_URL]);

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (timestamp: string): string => {
    return new Date(timestamp).toLocaleString();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Call History
              </h3>
              <div className="mt-6">
                <div className="flow-root">
                  <ul className="-my-5 divide-y divide-gray-200">
                    {calls.map((call) => (
                      <li key={call.id} className="py-4">
                        <div className="flex items-center space-x-4">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {call.phoneNumber}
                            </p>
                            <p className="text-sm text-gray-500">
                              {formatDate(call.timestamp)}
                            </p>
                          </div>
                          <div className="flex-shrink-0">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                call.status === 'completed'
                                  ? 'bg-green-100 text-green-800'
                                  : call.status === 'failed'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}
                            >
                              {call.status}
                            </span>
                          </div>
                          <div className="flex-shrink-0 text-sm text-gray-500">
                            {formatDuration(call.duration)}
                          </div>
                          <div className="flex-shrink-0">
                            <Link
                              to={`/active-call/${call.id}`}
                              className="text-primary-600 hover:text-primary-900"
                            >
                              View Details
                            </Link>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CallHistory; 