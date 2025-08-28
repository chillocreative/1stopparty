import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import DashboardStats from '../components/DashboardStats';
import DashboardCharts from '../components/DashboardCharts';

const Dashboard = () => {
  console.log('Dashboard component function called');
  
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({});
  const [chartData, setChartData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('Dashboard component mounted, fetching data...');
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      console.log('Starting dashboard data fetch...');
      setLoading(true);

      // Get user data from session or API
      const userResponse = await fetch('/api/user', {
        headers: {
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        credentials: 'same-origin'
      });
      if (userResponse.ok) {
        const userData = await userResponse.json();
        if (userData.success) {
          setUser(userData.data);
        } else {
          console.error('User API response error:', userData.message);
        }
      } else {
        console.error('User API fetch failed:', userResponse.status);
        // Continue with dashboard even if user fetch fails
      }

      // Fetch dashboard stats
      const statsResponse = await fetch('/api/dashboard/cards', {
        headers: {
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        credentials: 'same-origin'
      });
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        if (statsData.success) {
          setStats(statsData.data);
        } else {
          console.error('Dashboard stats API response error:', statsData.message);
          setStats({}); // Set empty stats to prevent component crash
        }
      } else {
        console.error('Dashboard stats API fetch failed:', statsResponse.status);
        setStats({}); // Set empty stats to prevent component crash
      }

      // Fetch chart data
      const chartsResponse = await fetch('/api/dashboard/charts', {
        headers: {
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        credentials: 'same-origin'
      });
      if (chartsResponse.ok) {
        const chartsData = await chartsResponse.json();
        if (chartsData.success) {
          setChartData(chartsData.data);
        } else {
          console.error('Dashboard charts API response error:', chartsData.message);
          setChartData({}); // Set empty chart data to prevent component crash
        }
      } else {
        console.error('Dashboard charts API fetch failed:', chartsResponse.status);
        setChartData({}); // Set empty chart data to prevent component crash
      }

      // Original API calls (commented out for testing)
      /*
      // Get user data from session or API
      const userResponse = await fetch('/api/user', {
        headers: {
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        credentials: 'same-origin'
      });
      if (userResponse.ok) {
        const userData = await userResponse.json();
        if (userData.success) {
          setUser(userData.data);
        } else {
          console.error('User API response error:', userData.message);
        }
      } else {
        console.error('User API fetch failed:', userResponse.status);
        // Continue with dashboard even if user fetch fails
      }

      // Fetch dashboard stats
      const statsResponse = await fetch('/api/dashboard/cards', {
        headers: {
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        credentials: 'same-origin'
      });
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        if (statsData.success) {
          setStats(statsData.data);
        } else {
          console.error('Dashboard stats API response error:', statsData.message);
          setStats({}); // Set empty stats to prevent component crash
        }
      } else {
        console.error('Dashboard stats API fetch failed:', statsResponse.status);
        setStats({}); // Set empty stats to prevent component crash
      }

      // Fetch chart data
      const chartsResponse = await fetch('/api/dashboard/charts', {
        headers: {
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        credentials: 'same-origin'
      });
      if (chartsResponse.ok) {
        const chartsData = await chartsResponse.json();
        if (chartsData.success) {
          setChartData(chartsData.data);
        } else {
          console.error('Dashboard charts API response error:', chartsData.message);
          setChartData({}); // Set empty chart data to prevent component crash
        }
      } else {
        console.error('Dashboard charts API fetch failed:', chartsResponse.status);
        setChartData({}); // Set empty chart data to prevent component crash
      }
      */

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data');
    } finally {
      console.log('Dashboard data fetch completed, setting loading to false');
      setLoading(false);
    }
  };

  console.log('Dashboard render - loading:', loading, 'error:', error, 'user:', user, 'stats:', stats);

  if (loading) {
    return (
      <DashboardLayout user={user}>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout user={user}>
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4 mx-auto">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Dashboard</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout user={user}>
      <div className="space-y-6">
        {/* Stats Cards */}
        <DashboardStats stats={stats} />

        {/* Charts and Activity */}
        <DashboardCharts chartData={chartData} />
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;