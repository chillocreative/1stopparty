import React, { useState, useEffect } from 'react';

const Sidebar = ({ user, currentPath = 'dashboard', onNavigate }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState({});

  // Auto-expand menus with active submenu items
  useEffect(() => {
    const menuItems = getMenuItems(user?.role?.name);
    const newExpandedState = {};

    menuItems.forEach(item => {
      if (item.hasSubmenu && item.submenu) {
        const hasActiveSubmenu = item.submenu.some(sub => 
          currentPath === sub.path || currentPath === sub.id
        );
        if (hasActiveSubmenu) {
          newExpandedState[item.id] = true;
        }
      }
    });

    setExpandedMenus(prev => ({ ...prev, ...newExpandedState }));
  }, [currentPath, user?.role?.name]);

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
        roles: ['Admin', 'Bendahari', 'Setiausaha', 'Setiausaha Pengelola', 'AMK', 'Wanita', 'AJK Cabang', 'Anggota Biasa']
      },
      // Users menu - Admin only
      {
        id: 'users',
        label: 'Users',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M8 7a4 4 0 118 0 4 4 0 01-8 0z" />
          </svg>
        ),
        hasSubmenu: true,
        roles: ['Admin'],
        submenu: [
          {
            id: 'view-all-users',
            label: 'View All Users',
            path: '/users',
            icon: (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
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
          },
          {
            id: 'view-all-roles',
            label: 'Roles',
            path: '/roles',
            icon: (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            )
          }
        ]
      }
    ];

    // Meetings - View access for all, manage access for specific roles
    menuItems.push({
      id: 'meetings',
      label: 'Meetings',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      hasSubmenu: true,
      roles: ['Admin', 'Bendahari', 'Setiausaha', 'Setiausaha Pengelola', 'AMK', 'Wanita', 'AJK Cabang', 'Anggota Biasa'],
      submenu: [
        {
          id: 'view-all-meetings',
          label: 'View All Meetings',
          path: '/meetings',
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v6a2 2 0 002 2h6a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          )
        },
        {
          id: 'create-meeting',
          label: 'Create Meeting',
          path: '/meetings/create',
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          ),
          roles: ['Admin', 'Bendahari', 'Setiausaha', 'Setiausaha Pengelola', 'AMK', 'Wanita']
        },
        {
          id: 'meeting-categories',
          label: 'Category',
          path: '/meeting-categories',
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
          ),
          roles: ['Admin']
        }
      ]
    });

    // Events - View access for all, manage access for specific roles
    menuItems.push({
      id: 'events',
      label: 'Events',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 9l2 2 4-4" />
        </svg>
      ),
      hasSubmenu: true,
      roles: ['Admin', 'Bendahari', 'Setiausaha', 'Setiausaha Pengelola', 'AMK', 'Wanita', 'AJK Cabang', 'Anggota Biasa'],
      submenu: [
        {
          id: 'view-all-events',
          label: 'View All Events',
          path: '/events',
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v6a2 2 0 002 2h6a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          )
        },
        {
          id: 'create-event',
          label: 'Create Event',
          path: '/events/create',
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          ),
          roles: ['Admin', 'Bendahari', 'Setiausaha', 'Setiausaha Pengelola', 'AMK', 'Wanita']
        },
        {
          id: 'event-categories',
          label: 'Event Categories',
          path: '/event-categories',
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
          ),
          roles: ['Admin']
        }
      ]
    });

    // Finances - Only for Admin and Bendahari (positioned above Members)
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
      roles: ['Admin', 'Bendahari', 'Setiausaha', 'Setiausaha Pengelola', 'AMK', 'Wanita', 'AJK Cabang', 'Anggota Biasa']
    });

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
      roles: ['Admin', 'Bendahari', 'Setiausaha', 'Setiausaha Pengelola', 'AMK', 'Wanita', 'AJK Cabang', 'Anggota Biasa']
    });

    // Filter menu items based on user role
    return menuItems.filter(item => item.roles.includes(userRole));
  };

  // Normalize the role name to match the database
  const normalizedRole = user?.role?.name === 'Superadmin' ? 'Admin' : user?.role?.name;
  const menuItems = getMenuItems(normalizedRole || 'Admin');

  // Debug logging - remove after testing
  console.log('Sidebar Debug:', {
    user: user,
    userRole: user?.role,
    normalizedRole: normalizedRole,
    menuItems: menuItems
  });

  const handleMenuClick = (item) => {
    if (item.hasSubmenu) {
      // Toggle submenu
      setExpandedMenus(prev => ({
        ...prev,
        [item.id]: !prev[item.id]
      }));
    } else if (item.path) {
      // Direct navigation to the path
      window.location.href = item.path;
    }
  };

  const handleSubmenuClick = (submenuItem, parentMenuId) => {
    if (submenuItem.path) {
      // Keep parent menu expanded when navigating to submenu item
      setExpandedMenus(prev => ({
        ...prev,
        [parentMenuId]: true
      }));

      // Direct navigation to the path
      window.location.href = submenuItem.path;
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
                {user?.name || 'User'}
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
        {menuItems.map((item) => {
          // Keep submenu open if any submenu item is active
          const isSubmenuActive = item.submenu && item.submenu.some(sub => currentPath === sub.id);
          const isDirectlyActive = currentPath === item.id;
          const shouldBeExpanded = isSubmenuActive || expandedMenus[item.id];

          return (
            <div key={item.id}>
              {/* Main Menu Item */}
              <button
                onClick={() => handleMenuClick(item)}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${isDirectlyActive
                    ? 'bg-gray-100 text-gray-900'
                    : isSubmenuActive
                      ? 'text-gray-900'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
              >
                <span className={`flex-shrink-0 ${isDirectlyActive || isSubmenuActive
                    ? 'text-gray-600'
                    : 'text-gray-500'
                  }`}>
                  {item.icon}
                </span>
                {!isCollapsed && (
                  <>
                    <span className="flex-1 font-medium">{item.label}</span>
                    {item.hasSubmenu && (
                      <svg
                        className={`w-4 h-4 transition-transform ${shouldBeExpanded ? 'rotate-90' : ''}`}
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
              {item.hasSubmenu && !isCollapsed && (shouldBeExpanded) && (
                <div className="ml-8 mt-1 space-y-1">
                  {item.submenu?.filter(submenuItem => 
                    !submenuItem.roles || submenuItem.roles.includes(normalizedRole || 'Admin')
                  ).map((submenuItem) => (
                    <button
                      key={submenuItem.id}
                      onClick={() => handleSubmenuClick(submenuItem, item.id)}
                      className={`w-full flex items-center space-x-2 px-3 py-1.5 rounded-md text-left text-sm transition-colors ${(currentPath === submenuItem.path || currentPath === submenuItem.id)
                          ? 'bg-gray-100 text-gray-900 font-medium'
                          : 'text-gray-600 hover:bg-gray-50'
                        }`}
                    >
                      <span className={`flex-shrink-0 ${(currentPath === submenuItem.path || currentPath === submenuItem.id) ? 'text-gray-600' : 'text-gray-400'}`}>
                        {submenuItem.icon}
                      </span>
                      <span className="font-medium">{submenuItem.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
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