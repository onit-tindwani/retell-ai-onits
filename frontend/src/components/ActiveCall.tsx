import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

interface CallStatus {
  status: 'connecting' | 'active' | 'ended';
  duration: number;
  transcript: string[];
}

const ActiveCall: React.FC = () => {
  const { callId } = useParams<{ callId: string }>();
  const navigate = useNavigate();
  const [callStatus, setCallStatus] = useState<CallStatus>({
    status: 'connecting',
    duration: 0,
    transcript: [],
  });

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (callStatus.status === 'active') {
      timer = setInterval(() => {
        setCallStatus((prev) => ({
          ...prev,
          duration: prev.duration + 1,
        }));
      }, 1000);
    }

    return () => {
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [callStatus.status]);

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleEndCall = async () => {
    try {
      await fetch(`/api/calls/${callId}/end`, {
        method: 'POST',
      });
      setCallStatus((prev) => ({ ...prev, status: 'ended' }));
      setTimeout(() => {
        navigate('/history');
      }, 2000);
    } catch (error) {
      console.error('Error ending call:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="text-center">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  {callStatus.status === 'connecting' && 'Connecting...'}
                  {callStatus.status === 'active' && 'Call in Progress'}
                  {callStatus.status === 'ended' && 'Call Ended'}
                </h3>
                {callStatus.status === 'active' && (
                  <p className="mt-2 text-sm text-gray-500">
                    Duration: {formatDuration(callStatus.duration)}
                  </p>
                )}
              </div>

              <div className="mt-6">
                <div className="bg-gray-50 rounded-lg p-4 h-64 overflow-y-auto">
                  {callStatus.transcript.map((message, index) => (
                    <div key={index} className="mb-2">
                      <p className="text-sm text-gray-900">{message}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 flex justify-center">
                {callStatus.status === 'active' && (
                  <button
                    onClick={handleEndCall}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    End Call
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActiveCall; 