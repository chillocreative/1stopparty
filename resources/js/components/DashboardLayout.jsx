import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import ViewAllUsers from '../pages/ViewAllUsers';
import CreateUser from '../pages/CreateUser';
import EditUser from '../pages/EditUser';

const DashboardLayout = ({ children, user }) => {
  const [currentPath, setCurrentPath] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Detect current path from URL
  useEffect(() => {
    const detectCurrentPath = () => {
      const pathname = window.location.pathname;
      if (pathname === '/dashboard' || pathname === '/') {
        setCurrentPath('dashboard');
      } else if (pathname === '/users') {
        setCurrentPath('view-all-users');
      } else if (pathname === '/users/create') {
        setCurrentPath('create-user');
      } else if (pathname.startsWith('/users/edit/')) {
        setCurrentPath('create-user'); // Use same as create for menu highlighting
      } else if (pathname === '/roles') {
        setCurrentPath('view-all-roles');
      } else if (pathname === '/profile') {
        setCurrentPath('profile');
      } else if (pathname === '/meetings') {
        setCurrentPath('view-all-meetings');
      } else if (pathname === '/meetings/create') {
        setCurrentPath('create-meeting');
      } else if (pathname.startsWith('/meetings/edit/')) {
        setCurrentPath('create-meeting'); // Use same as create for menu highlighting
      } else if (pathname === '/meeting-categories') {
        setCurrentPath('meeting-categories');
      } else if (pathname === '/events') {
        setCurrentPath('view-all-events');
      } else if (pathname === '/events/create') {
        setCurrentPath('create-event');
      } else if (pathname === '/event-categories') {
        setCurrentPath('event-categories');
      } else if (pathname === '/members') {
        setCurrentPath('members');
      } else if (pathname === '/finances') {
        setCurrentPath('finances');
      } else {
        setCurrentPath('dashboard');
      }
    };

    detectCurrentPath();

    // Listen for navigation changes
    window.addEventListener('popstate', detectCurrentPath);
    return () => window.removeEventListener('popstate', detectCurrentPath);
  }, []);

  const handleNavigation = (path, route) => {
    setCurrentPath(path);
    setIsMobileMenuOpen(false);

    if (path === 'logout') {
      // Handle logout logic here
      window.location.href = '/logout';
      return;
    }

    // For now, just update the path
    // In a real app, you'd use React Router or similar
    console.log(`Navigating to: ${route}`);
  };

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMobileMenuOpen && !event.target.closest('.mobile-menu')) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobileMenuOpen]);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <Sidebar
          user={user}
          currentPath={currentPath}
          onNavigate={handleNavigation}
        />
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" />
          <div className="mobile-menu relative flex flex-col w-64 bg-white">
            <Sidebar
              user={user}
              currentPath={currentPath}
              onNavigate={handleNavigation}
            />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              {/* Page Title */}
              <div>
                <h1 className="text-2xl font-bold text-gray-900 capitalize">
                  {currentPath}
                </h1>
                <p className="text-sm text-gray-500">
                  Welcome back, {user?.name || 'User'}
                </p>
              </div>
            </div>

            {/* Top Bar Actions */}
            <div className="flex items-center space-x-4">
              {/* User Profile */}
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-medium text-sm">
                    {user?.name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'U'}
                  </span>
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-gray-900">
                    {user?.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {user?.role?.name}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <div className="p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;