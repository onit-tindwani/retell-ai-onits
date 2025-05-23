import React, { useState, useEffect } from 'react';

interface BillingInfo {
  plan: 'free' | 'pro' | 'enterprise';
  usage: {
    calls: number;
    minutes: number;
    storage: number;
  };
  limits: {
    calls: number;
    minutes: number;
    storage: number;
  };
  nextBillingDate: string;
  amount: number;
}

const API_URL = process.env.REACT_APP_API_URL;

const Billing: React.FC = () => {
  const [billingInfo, setBillingInfo] = useState<BillingInfo>({
    plan: 'free',
    usage: {
      calls: 0,
      minutes: 0,
      storage: 0,
    },
    limits: {
      calls: 100,
      minutes: 1000,
      storage: 10,
    },
    nextBillingDate: '',
    amount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBillingInfo = async () => {
      try {
        const response = await fetch(`${API_URL}/api/billing`);
        if (!response.ok) {
          throw new Error('Failed to fetch billing info');
        }
        const data = await response.json();
        setBillingInfo(data);
      } catch (error) {
        console.error('Error fetching billing info:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBillingInfo();
  }, []);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 GB';
    const gb = bytes / (1024 * 1024 * 1024);
    return `${gb.toFixed(2)} GB`;
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
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
                Billing & Usage
              </h3>
              <div className="mt-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">
                        Current Plan
                      </h4>
                      <p className="mt-1 text-sm text-gray-500">
                        {billingInfo.plan.charAt(0).toUpperCase() +
                          billingInfo.plan.slice(1)}
                      </p>
                    </div>
                    <div className="text-right">
                      <h4 className="text-sm font-medium text-gray-900">
                        Next Billing Date
                      </h4>
                      <p className="mt-1 text-sm text-gray-500">
                        {new Date(billingInfo.nextBillingDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-500">Calls</span>
                        <span className="text-gray-900">
                          {billingInfo.usage.calls} / {billingInfo.limits.calls}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-primary-600 h-2 rounded-full"
                          style={{
                            width: `${
                              (billingInfo.usage.calls /
                                billingInfo.limits.calls) *
                              100
                            }%`,
                          }}
                        ></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-500">Minutes</span>
                        <span className="text-gray-900">
                          {billingInfo.usage.minutes} / {billingInfo.limits.minutes}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-primary-600 h-2 rounded-full"
                          style={{
                            width: `${
                              (billingInfo.usage.minutes /
                                billingInfo.limits.minutes) *
                              100
                            }%`,
                          }}
                        ></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-500">Storage</span>
                        <span className="text-gray-900">
                          {formatBytes(billingInfo.usage.storage)} /{' '}
                          {formatBytes(billingInfo.limits.storage)}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-primary-600 h-2 rounded-full"
                          style={{
                            width: `${
                              (billingInfo.usage.storage /
                                billingInfo.limits.storage) *
                              100
                            }%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <h4 className="text-sm font-medium text-gray-900">
                        Current Balance
                      </h4>
                      <p className="text-lg font-medium text-gray-900">
                        {formatCurrency(billingInfo.amount)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Billing; 