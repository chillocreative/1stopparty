import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';

const DashboardCharts = ({ chartData }) => {
  // Simple bar chart component (in a real app, you'd use a charting library like Recharts)
  const SimpleBarChart = ({ data, title, color = 'blue' }) => {
    if (!data || data.length === 0) {
      return (
        <div className="flex items-center justify-center h-64 text-gray-500">
          No data available
        </div>
      );
    }

    const maxValue = Math.max(...data.map(d => d.total_events || d.net_amount || 0));
    
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <div className="space-y-3">
          {data.slice(0, 6).map((item, index) => (
            <div key={index} className="flex items-center space-x-4">
              <div className="w-16 text-sm text-gray-600 flex-shrink-0">
                {item.month_name?.substring(0, 3) || `Day ${item.day}`}
              </div>
              <div className="flex-1">
                <div className="bg-gray-200 rounded-full h-3 relative overflow-hidden">
                  <div 
                    className={`bg-${color}-500 h-full rounded-full transition-all duration-300`}
                    style={{ 
                      width: `${((item.total_events || Math.abs(item.net_amount) || 0) / maxValue) * 100}%` 
                    }}
                  />
                </div>
              </div>
              <div className="w-12 text-sm font-medium text-gray-900 text-right">
                {item.total_events || item.net_amount?.toFixed(0) || 0}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const RecentActivity = () => {
    const activities = [
      { type: 'meeting', title: 'Monthly Board Meeting', time: '2 hours ago', color: 'blue' },
      { type: 'event', title: 'AMK Sports Tournament', time: '1 day ago', color: 'purple' },
      { type: 'member', title: 'New member added', time: '2 days ago', color: 'green' },
      { type: 'finance', title: 'Expense recorded', time: '3 days ago', color: 'orange' },
    ];

    const getIcon = (type) => {
      switch (type) {
        case 'meeting':
          return (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          );
        case 'event':
          return (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0A2.717 2.717 0 004.5 16c0 .411.095.82.27 1.194l1.726 3.727a2.717 2.717 0 002.538 1.754h5.932a2.717 2.717 0 002.538-1.754l1.726-3.727c.175-.374.27-.783.27-1.194z" />
            </svg>
          );
        case 'member':
          return (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          );
        case 'finance':
          return (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          );
        default:
          return null;
      }
    };

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
        <div className="space-y-3">
          {activities.map((activity, index) => (
            <div key={index} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <div className={`w-8 h-8 bg-${activity.color}-100 text-${activity.color}-600 rounded-lg flex items-center justify-center flex-shrink-0`}>
                {getIcon(activity.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {activity.title}
                </p>
                <p className="text-xs text-gray-500">
                  {activity.time}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Events Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Events</CardTitle>
        </CardHeader>
        <CardContent>
          <SimpleBarChart 
            data={chartData?.events || []} 
            title="Events by Month" 
            color="purple"
          />
        </CardContent>
      </Card>

      {/* Finance Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Financial Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <SimpleBarChart 
            data={chartData?.finances || []} 
            title="Net Amount by Month" 
            color="emerald"
          />
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <RecentActivity />
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardCharts;