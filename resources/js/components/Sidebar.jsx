import React, { useState } from 'react';

const Sidebar = ({ user, currentPath = 'dashboard', onNavigate }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState({});

  // Define menu items based on roles from ROLES.md
  const getMenuItems = (userRole) => {
    const menuItems = [
      {
        id: 'dashboard',
        label: 'Dashboard',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z" />
          </svg>
        ),
        path: '/dashboard',
        roles: ['Admin', 'Anggota Cabang', 'Bendahari', 'Setiausaha', 'Setiausaha Pengelola', 'AMK', 'Wanita']
      }
    ];

    // Admin - Users with submenu
    if (userRole === 'Admin') {
      menuItems.push(
        {
          id: 'users',
          label: 'Users',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
          ),
          hasSubmenu: true,
          roles: ['Admin'],
          submenu: [
            {
              id: 'view-users',
              label: 'View Users',
              path: '/users',
              icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )
            },
            {
              id: 'create-user',
              label: 'Create User',
              path: '/users/create',
              icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              )
            }
          ]
        }
      );
    }

    // Meetings - View access for all, manage access for specific roles
    menuItems.push({
      id: 'meetings',
      label: 'Meetings',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      path: '/meetings',
      roles: ['Admin', 'Anggota Cabang', 'Bendahari', 'Setiausaha', 'Setiausaha Pengelola', 'AMK', 'Wanita']
    });

    // Events - View access for all, manage access for specific roles
    menuItems.push({
      id: 'events',
      label: 'Events',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0A2.717 2.717 0 004.5 16c0 .411.095.82.27 1.194l1.726 3.727a2.717 2.717 0 002.538 1.754h5.932a2.717 2.717 0 002.538-1.754l1.726-3.727c.175-.374.27-.783.27-1.194z" />
        </svg>
      ),
      path: '/events',
      roles: ['Admin', 'Anggota Cabang', 'Bendahari', 'Setiausaha', 'Setiausaha Pengelola', 'AMK', 'Wanita']
    });

    // Members - View access for all, manage access for specific roles
    menuItems.push({
      id: 'members',
      label: 'Members',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      path: '/members',
      roles: ['Admin', 'Anggota Cabang', 'Bendahari', 'Setiausaha', 'Setiausaha Pengelola', 'AMK', 'Wanita']
    });

    // Finances - Only for Admin and Bendahari
    if (['Admin', 'Bendahari'].includes(userRole)) {
      menuItems.push({
        id: 'finances',
        label: 'Finances',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
          </svg>
        ),
        path: '/finances',
        roles: ['Admin', 'Bendahari']
      });
    }

    // Profile - All users (moved to bottom)
    menuItems.push({
      id: 'profile',
      label: 'Profile',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      path: '/profile',
      roles: ['Admin', 'Anggota Cabang', 'Bendahari', 'Setiausaha', 'Setiausaha Pengelola', 'AMK', 'Wanita']
    });

    // Filter menu items based on user role
    return menuItems.filter(item => item.roles.includes(userRole));
  };

  // Normalize the role name to match the database
  const normalizedRole = user?.role?.name === 'Superadmin' ? 'Admin' : user?.role?.name;
  const menuItems = getMenuItems(normalizedRole || 'Anggota Cabang');

  const handleMenuClick = (item) => {
    if (item.hasSubmenu) {
      // Toggle submenu
      setExpandedMenus(prev => ({
        ...prev,
        [item.id]: !prev[item.id]
      }));
    } else if (onNavigate && item.path) {
      onNavigate(item.id, item.path);
    }
  };

  const handleSubmenuClick = (submenuItem) => {
    if (onNavigate && submenuItem.path) {
      onNavigate(submenuItem.id, submenuItem.path);
    }
  };

  return (
    <div className={`bg-white border-r border-gray-200 transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'} flex flex-col h-full`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">1SP</span>
              </div>
              <span className="font-semibold text-gray-900">1 Stop Party</span>
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isCollapsed ? "M9 5l7 7-7 7" : "M15 19l-7-7 7-7"} />
            </svg>
          </button>
        </div>
      </div>

      {/* User Info */}
      {!isCollapsed && (
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white font-medium text-sm">
                {user?.name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.name || 'User Name'}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {user?.role?.name || 'Role'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Menu */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => (
          <div key={item.id}>
            {/* Main Menu Item */}
            <button
              onClick={() => handleMenuClick(item)}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                currentPath === item.id || (item.submenu && item.submenu.some(sub => currentPath === sub.id))
                  ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className={`flex-shrink-0 ${
                currentPath === item.id || (item.submenu && item.submenu.some(sub => currentPath === sub.id)) 
                  ? 'text-blue-600' 
                  : 'text-gray-500'
              }`}>
                {item.icon}
              </span>
              {!isCollapsed && (
                <>
                  <span className="flex-1 font-medium">{item.label}</span>
                  {item.hasSubmenu && (
                    <svg
                      className={`w-4 h-4 transition-transform ${expandedMenus[item.id] ? 'rotate-90' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </>
              )}
            </button>

            {/* Submenu Items */}
            {item.hasSubmenu && !isCollapsed && expandedMenus[item.id] && (
              <div className="ml-8 mt-1 space-y-1">
                {item.submenu?.map((submenuItem) => (
                  <button
                    key={submenuItem.id}
                    onClick={() => handleSubmenuClick(submenuItem)}
                    className={`w-full flex items-center space-x-2 px-3 py-1.5 rounded-md text-left text-sm transition-colors ${
                      currentPath === submenuItem.id
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <span className={`flex-shrink-0 ${currentPath === submenuItem.id ? 'text-blue-600' : 'text-gray-400'}`}>
                      {submenuItem.icon}
                    </span>
                    <span className="font-medium">{submenuItem.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <button
          className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors ${isCollapsed ? 'justify-center' : ''
            }`}
          onClick={async () => {
            try {
              const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

              const response = await fetch('/logout', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Accept': 'application/json',
                  'X-CSRF-TOKEN': csrfToken,
                },
              });

              if (response.ok) {
                // Logout successful - redirect to login page
                window.location.href = '/';
              }
            } catch (error) {
              console.error('Logout error:', error);
              // Even if there's an error, redirect to login page
              window.location.href = '/';
            }
          }}
        >
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          {!isCollapsed && <span className="font-medium">Sign Out</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;