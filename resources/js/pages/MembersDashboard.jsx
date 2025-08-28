import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

const MembersDashboard = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUserData();
    fetchAnalytics();
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/user', {
        headers: {
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        credentials: 'same-origin'
      });

      if (response.ok) {
        const userData = await response.json();
        if (userData.success) {
          setUser(userData.data);
        }
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/members/dashboard-analytics', {
        headers: {
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        credentials: 'same-origin'
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setAnalytics(data.data);
        } else {
          setError(data.message || 'Failed to load analytics');
        }
      } else {
        setError('Failed to fetch analytics data');
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setError('Network error while fetching analytics');
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat().format(num);
  };

  const calculatePercentage = (value, total) => {
    return total > 0 ? ((value / total) * 100).toFixed(1) : 0;
  };

  // Simple Chart Component
  const BarChart = ({ data, title, color = "bg-blue-500" }) => {
    const maxValue = Math.max(...Object.values(data));
    
    return (
      <div className="space-y-3">
        <h4 className="font-semibold text-gray-900">{title}</h4>
        <div className="space-y-2">
          {Object.entries(data).map(([label, value]) => (
            <div key={label} className="flex items-center space-x-2">
              <div className="w-20 text-sm text-gray-600 truncate">{label}</div>
              <div className="flex-1 bg-gray-200 rounded-full h-4 relative">
                <div
                  className={`${color} h-4 rounded-full transition-all duration-500`}
                  style={{ width: `${(value / maxValue) * 100}%` }}
                ></div>
              </div>
              <div className="text-sm font-medium text-gray-900 w-12 text-right">{value}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Donut Chart Component (simplified)
  const DonutChart = ({ data, title, colors }) => {
    const total = Object.values(data).reduce((sum, value) => sum + value, 0);
    
    return (
      <div className="space-y-3">
        <h4 className="font-semibold text-gray-900">{title}</h4>
        <div className="space-y-2">
          {Object.entries(data).map(([label, value], index) => (
            <div key={label} className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div
                  className={`w-3 h-3 rounded-full ${colors[index] || 'bg-gray-400'}`}
                ></div>
                <span className="text-sm text-gray-600">{label}</span>
              </div>
              <div className="text-sm font-medium text-gray-900">
                {value} ({calculatePercentage(value, total)}%)
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Line Chart Component (simplified)
  const LineChart = ({ data, title }) => {
    const maxValue = Math.max(...Object.values(data));
    const values = Object.values(data);
    
    return (
      <div className="space-y-3">
        <h4 className="font-semibold text-gray-900">{title}</h4>
        <div className="h-32 relative">
          <div className="absolute inset-0 flex items-end space-x-1">
            {values.map((value, index) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div
                  className="bg-blue-500 w-full rounded-t transition-all duration-500"
                  style={{ 
                    height: `${maxValue > 0 ? (value / maxValue) * 100 : 0}%`,
                    minHeight: value > 0 ? '2px' : '0px'
                  }}
                ></div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex justify-between text-xs text-gray-500">
          {Object.keys(data).map((label) => (
            <span key={label} className="truncate">{label}</span>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <DashboardLayout user={user} currentPath="members-dashboard">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout user={user} currentPath="members-dashboard">
        <div className="space-y-6">
          <h1 className="text-2xl font-bold text-gray-900">Members Dashboard</h1>
          <Card className="p-6">
            <div className="text-center py-12">
              <div className="text-red-600 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Dashboard</h3>
              <p className="text-gray-500 mb-4">{error}</p>
              <Button onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </div>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout user={user} currentPath="members-dashboard">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Members Dashboard</h1>
            <p className="text-gray-600 mt-1">Comprehensive member analytics and insights</p>
          </div>
          <Button onClick={fetchAnalytics} variant="outline">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </Button>
        </div>

        {/* Key Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Members</p>
                <p className="text-2xl font-semibold text-gray-900">{formatNumber(analytics?.total_members || 0)}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Approved</p>
                <p className="text-2xl font-semibold text-gray-900">{formatNumber(analytics?.approved_members || 0)}</p>
                <p className="text-xs text-gray-500">
                  {calculatePercentage(analytics?.approved_members || 0, analytics?.total_members || 0)}% of total
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Pending</p>
                <p className="text-2xl font-semibold text-gray-900">{formatNumber(analytics?.pending_members || 0)}</p>
                <p className="text-xs text-gray-500">
                  {calculatePercentage(analytics?.pending_members || 0, analytics?.total_members || 0)}% of total
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">New This Month</p>
                <p className="text-2xl font-semibold text-gray-900">{formatNumber(analytics?.new_this_month || 0)}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gender Distribution */}
          {analytics?.gender_distribution && Object.keys(analytics.gender_distribution).length > 0 && (
            <Card className="p-6">
              <DonutChart 
                data={analytics.gender_distribution} 
                title="Gender Distribution"
                colors={['bg-blue-500', 'bg-pink-500', 'bg-gray-400']}
              />
            </Card>
          )}

          {/* Age Groups */}
          {analytics?.age_groups && (
            <Card className="p-6">
              <BarChart 
                data={analytics.age_groups} 
                title="Age Distribution"
                color="bg-green-500"
              />
            </Card>
          )}

          {/* Race Distribution */}
          {analytics?.race_distribution && Object.keys(analytics.race_distribution).length > 0 && (
            <Card className="p-6">
              <BarChart 
                data={analytics.race_distribution} 
                title="Race Distribution (Top 10)"
                color="bg-purple-500"
              />
            </Card>
          )}

          {/* Branch Distribution */}
          {analytics?.branch_distribution && Object.keys(analytics.branch_distribution).length > 0 && (
            <Card className="p-6">
              <BarChart 
                data={analytics.branch_distribution} 
                title="Branch Distribution (Top 10)"
                color="bg-orange-500"
              />
            </Card>
          )}

          {/* State Distribution */}
          {analytics?.state_distribution && Object.keys(analytics.state_distribution).length > 0 && (
            <Card className="p-6">
              <BarChart 
                data={analytics.state_distribution} 
                title="State Distribution (Top 10)"
                color="bg-red-500"
              />
            </Card>
          )}

          {/* Monthly Trends */}
          {analytics?.monthly_trends && (
            <Card className="p-6">
              <LineChart 
                data={analytics.monthly_trends} 
                title="Registration Trends (Last 6 Months)"
              />
            </Card>
          )}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Stats */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Statistics</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Approval Rate</span>
                <span className="font-medium">
                  {calculatePercentage(analytics?.approved_members || 0, analytics?.total_members || 0)}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Male Members</span>
                <span className="font-medium">
                  {analytics?.gender_distribution?.M || 0} ({calculatePercentage(analytics?.gender_distribution?.M || 0, analytics?.total_members || 0)}%)
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Female Members</span>
                <span className="font-medium">
                  {analytics?.gender_distribution?.F || 0} ({calculatePercentage(analytics?.gender_distribution?.F || 0, analytics?.total_members || 0)}%)
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Growth This Month</span>
                <span className="font-medium text-green-600">
                  +{analytics?.new_this_month || 0}
                </span>
              </div>
            </div>
          </Card>

          {/* Top Races */}
          {analytics?.race_distribution && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Races</h3>
              <div className="space-y-2">
                {Object.entries(analytics.race_distribution).slice(0, 5).map(([race, count]) => (
                  <div key={race} className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 capitalize">{race}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Top Branches */}
          {analytics?.branch_distribution && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Branches</h3>
              <div className="space-y-2">
                {Object.entries(analytics.branch_distribution).slice(0, 5).map(([branch, count]) => (
                  <div key={branch} className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 capitalize">{branch}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* AI Analysis Integration */}
        <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014.846 21H9.154a3.374 3.374 0 00-2.869-1.509l-.548-.547z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">AI Analysis Ready</h3>
                <p className="text-sm text-gray-600">Get insights about member demographics and engagement strategies</p>
                <div className="flex items-center mt-2 text-xs text-green-600">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Dashboard data optimized for AI analysis
                </div>
              </div>
            </div>
            <Button 
              onClick={() => window.location.href = '/members/ai-analysis'}
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Start AI Analysis
            </Button>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default MembersDashboard;