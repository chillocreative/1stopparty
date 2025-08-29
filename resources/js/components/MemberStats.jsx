import React from 'react';
import { Card, CardContent } from './ui/Card';

const MemberStats = ({ stats }) => {
  // Calculate percentages for bar charts
  const calculatePercentage = (value, total) => {
    if (total === 0) return 0;
    return Math.round((value / total) * 100);
  };

  // Get max value for bar chart scaling
  const getMaxValue = (data) => {
    if (!data || Object.keys(data).length === 0) return 1;
    return Math.max(...Object.values(data));
  };

  // Bar chart colors for race
  const raceColors = [
    'bg-purple-500',
    'bg-blue-500',
    'bg-green-500',
    'bg-yellow-500',
    'bg-red-500',
    'bg-indigo-500',
    'bg-pink-500',
    'bg-teal-500'
  ];

  // Bar chart colors for ranting
  const rantingColors = [
    'bg-emerald-500',
    'bg-cyan-500',
    'bg-amber-500',
    'bg-violet-500',
    'bg-rose-500',
    'bg-orange-500',
    'bg-lime-500',
    'bg-sky-500'
  ];

  const totalMembers = stats?.total_members || 0;
  const maleMembers = stats?.male_members || 0;
  const femaleMembers = stats?.female_members || 0;

  return (
    <div className="space-y-6 mb-8">
      {/* Total Members Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="hover:shadow-md transition-all duration-200 border border-blue-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-lg font-medium text-gray-600 mb-2">Total Members</p>
                <p className="text-4xl font-bold text-gray-900">
                  {totalMembers.toLocaleString()}
                </p>
              </div>
              <div className="w-16 h-16 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Male/Female Combined Card */}
        <Card className="hover:shadow-md transition-all duration-200 border border-purple-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-lg font-medium text-gray-600">Gender Distribution</p>
              <div className="w-16 h-16 bg-purple-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mx-auto mb-2">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <p className="text-2xl font-bold text-gray-900">{maleMembers}</p>
                <p className="text-sm text-gray-600">Male</p>
                <p className="text-xs text-blue-600">{calculatePercentage(maleMembers, totalMembers)}%</p>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-pink-100 rounded-lg mx-auto mb-2">
                  <svg className="w-6 h-6 text-pink-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <p className="text-2xl font-bold text-gray-900">{femaleMembers}</p>
                <p className="text-sm text-gray-600">Female</p>
                <p className="text-xs text-pink-600">{calculatePercentage(femaleMembers, totalMembers)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Race (Bangsa) Bar Chart */}
      {stats?.race_breakdown && Object.keys(stats.race_breakdown).length > 0 && (
        <Card className="hover:shadow-md transition-all duration-200 border border-gray-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Race (Bangsa) Distribution</h3>
              <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
            
            <div className="space-y-4">
              {Object.entries(stats.race_breakdown)
                .sort(([,a], [,b]) => b - a) // Sort by count descending
                .map(([race, count], index) => {
                  const maxValue = getMaxValue(stats.race_breakdown);
                  const percentage = (count / maxValue) * 100;
                  const color = raceColors[index % raceColors.length];
                  
                  return (
                    <div key={race} className="flex items-center space-x-4">
                      <div className="w-24 text-sm font-medium text-gray-700 truncate" title={race}>
                        {race}
                      </div>
                      <div className="flex-1">
                        <div className="w-full bg-gray-200 rounded-full h-6 relative">
                          <div 
                            className={`${color} h-6 rounded-full transition-all duration-500 ease-out`}
                            style={{ width: `${percentage}%` }}
                          ></div>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-sm font-medium text-white mix-blend-difference">
                              {count}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="w-12 text-sm text-gray-600">
                        {calculatePercentage(count, totalMembers)}%
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ranting Bar Chart */}
      {stats?.branch_breakdown && Object.keys(stats.branch_breakdown).length > 0 && (
        <Card className="hover:shadow-md transition-all duration-200 border border-gray-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Ranting (Branch) Distribution</h3>
              <div className="w-12 h-12 bg-emerald-50 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            </div>
            
            <div className="space-y-4">
              {Object.entries(stats.branch_breakdown)
                .sort(([,a], [,b]) => b - a) // Sort by count descending
                .map(([branch, count], index) => {
                  const maxValue = getMaxValue(stats.branch_breakdown);
                  const percentage = (count / maxValue) * 100;
                  const color = rantingColors[index % rantingColors.length];
                  
                  return (
                    <div key={branch} className="flex items-center space-x-4">
                      <div className="w-24 text-sm font-medium text-gray-700 truncate" title={branch}>
                        {branch}
                      </div>
                      <div className="flex-1">
                        <div className="w-full bg-gray-200 rounded-full h-6 relative">
                          <div 
                            className={`${color} h-6 rounded-full transition-all duration-500 ease-out`}
                            style={{ width: `${percentage}%` }}
                          ></div>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-sm font-medium text-white mix-blend-difference">
                              {count}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="w-12 text-sm text-gray-600">
                        {calculatePercentage(count, totalMembers)}%
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No data message */}
      {(!stats?.race_breakdown || Object.keys(stats.race_breakdown).length === 0) && 
       (!stats?.branch_breakdown || Object.keys(stats.branch_breakdown).length === 0) && (
        <div className="text-center py-8">
          <div className="text-gray-500 mb-2">
            <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 48 48">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M34 40h10v-4a6 6 0 00-10.712-3.714M34 40H14m20 0v-4a6 6 0 00-4-5.659m0 0a8 8 0 10-12 0m12 0v4a6 6 0 00-4 5.659M14 40H4v-4a6 6 0 014-5.659M14 40v-4a6 6 0 014-5.659" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900">No demographic data available</h3>
          <p className="text-sm text-gray-500 mt-1">Race and branch information will appear here when members are added with this data.</p>
        </div>
      )}
    </div>
  );
};

export default MemberStats;