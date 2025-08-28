import React, { useState, useEffect } from 'react';
import DashboardLayout from './DashboardLayout';
import { Card } from './ui/Card';

const MeetingsLayout = ({ children, user, activeMenuItem = 'view-all-meetings' }) => {
    const [currentPath, setCurrentPath] = useState(activeMenuItem);

    useEffect(() => {
        setCurrentPath(activeMenuItem);
    }, [activeMenuItem]);

    const menuItems = [
        {
            id: 'view-all-meetings',
            label: 'View All Meetings',
            path: '/meetings',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v6a2 2 0 002 2h6a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
            ),
            roles: ['Admin', 'Bendahari', 'Setiausaha', 'Setiausaha Pengelola', 'AMK', 'Wanita', 'AJK Cabang', 'Anggota Biasa']
        },
        {
            id: 'create-meeting',
            label: 'Create Meeting',
            path: '/meetings/create',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
            ),
            roles: ['Admin', 'Bendahari', 'Setiausaha', 'Setiausaha Pengelola', 'AMK', 'Wanita']
        }
    ];

    // Filter menu items based on user role
    const filteredMenuItems = menuItems.filter(item => {
        if (!item.roles) return true;
        return user?.role?.name && item.roles.includes(user.role.name);
    });

    const handleMenuClick = (menuItem) => {
        if (menuItem.path) {
            window.location.href = menuItem.path;
        }
    };

    return (
        <DashboardLayout user={user}>
            <div className="flex h-full -m-4 sm:-m-6 lg:-m-8">
                {/* Side Menu */}
                <div className="w-64 bg-white border-r border-gray-200 flex-shrink-0">
                    {/* Header */}
                    <div className="p-6 border-b border-gray-200">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">Meetings</h2>
                                <p className="text-sm text-gray-500">Manage meetings</p>
                            </div>
                        </div>
                    </div>

                    {/* Navigation Menu */}
                    <nav className="p-4 space-y-2">
                        {filteredMenuItems.map((item) => {
                            const isActive = currentPath === item.id;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => handleMenuClick(item)}
                                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all duration-200 ${isActive
                                            ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm'
                                            : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900 border border-transparent'
                                        }`}
                                >
                                    <span className={`flex-shrink-0 ${isActive ? 'text-blue-600' : 'text-gray-500'}`}>
                                        {item.icon}
                                    </span>
                                    <span className={`font-medium ${isActive ? 'text-blue-700' : 'text-gray-700'}`}>
                                        {item.label}
                                    </span>
                                </button>
                            );
                        })}
                    </nav>

                    {/* Footer Info */}
                    <div className="absolute bottom-4 left-4 right-4">
                        <Card className="p-4 bg-gray-50 border-gray-200">
                            <div className="flex items-center space-x-2">
                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p className="text-xs text-gray-600">
                                    Meetings Module
                                </p>
                            </div>
                        </Card>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
                    {children}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default MeetingsLayout;
