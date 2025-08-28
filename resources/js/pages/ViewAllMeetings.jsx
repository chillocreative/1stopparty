import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

const ViewAllMeetings = () => {
    const [user, setUser] = useState(null);
    const [meetings, setMeetings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [sortField, setSortField] = useState('date');
    const [sortDirection, setSortDirection] = useState('desc');

    useEffect(() => {
        fetchUserData();
        fetchMeetings();
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
                const data = await response.json();
                setUser(data.data);
            }
        } catch (error) {
            console.error('Error fetching user data:', error);
        }
    };

    const fetchMeetings = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/meetings', {
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'same-origin'
            });

            if (response.ok) {
                const data = await response.json();
                setMeetings(data.data || []);
            } else {
                throw new Error('Failed to fetch meetings');
            }
        } catch (error) {
            console.error('Error fetching meetings:', error);
            setError('Failed to load meetings');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (meetingId) => {
        if (!confirm('Are you sure you want to delete this meeting?')) return;

        try {
            const response = await fetch(`/api/meetings/${meetingId}`, {
                method: 'DELETE',
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content'),
                },
                credentials: 'same-origin'
            });

            if (response.ok) {
                setMeetings(meetings.filter(meeting => meeting.id !== meetingId));
            } else {
                throw new Error('Failed to delete meeting');
            }
        } catch (error) {
            console.error('Error deleting meeting:', error);
            alert('Failed to delete meeting');
        }
    };

    const handleEdit = (meetingId) => {
        window.location.href = `/meetings/edit/${meetingId}`;
    };

    const handleViewFile = (fileUrl) => {
        if (fileUrl) {
            // Check if URL is valid and accessible
            const link = document.createElement('a');
            link.href = fileUrl;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';

            // For better user experience, try to open in new tab
            try {
                window.open(fileUrl, '_blank', 'noopener,noreferrer');
            } catch (error) {
                console.error('Error opening file:', error);
                // Fallback: direct navigation
                link.click();
            }
        } else {
            alert('No file available to view.');
        }
    };

    const handleDownloadFile = (fileUrl, fileName) => {
        if (fileUrl) {
            // Create a temporary link element for download
            const link = document.createElement('a');
            link.href = fileUrl;
            link.download = fileName || 'meeting_file'; // Use provided filename or default
            link.style.display = 'none';

            // Add to document, click, and remove
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } else {
            alert('No file available to download.');
        }
    };

    const getSortIcon = (field) => {
        if (sortField !== field) {
            return (
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                </svg>
            );
        }

        return sortDirection === 'asc' ? (
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4l9 16 9-16H3z" />
            </svg>
        ) : (
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 20l-9-16-9 16h18z" />
            </svg>
        );
    };

    const handleSort = (field) => {
        if (sortField === field) {
            // Same field, toggle direction
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            // New field, default to ascending
            setSortField(field);
            setSortDirection('asc');
        }
        setCurrentPage(1); // Reset to first page when sorting
    };

    const sortMeetings = (meetings) => {
        return [...meetings].sort((a, b) => {
            let aValue = a[sortField];
            let bValue = b[sortField];

            // Handle different field types
            if (sortField === 'date') {
                aValue = new Date(aValue);
                bValue = new Date(bValue);
            } else if (sortField === 'time') {
                // Handle null/N/A times
                if (!aValue || aValue === 'N/A') aValue = '';
                if (!bValue || bValue === 'N/A') bValue = '';
            } else if (sortField === 'title') {
                aValue = (aValue || '').toLowerCase();
                bValue = (bValue || '').toLowerCase();
            } else if (sortField === 'category') {
                // Handle category sorting
                aValue = a.category ? a.category.name.toLowerCase() : '';
                bValue = b.category ? b.category.name.toLowerCase() : '';
            }

            if (aValue < bValue) {
                return sortDirection === 'asc' ? -1 : 1;
            }
            if (aValue > bValue) {
                return sortDirection === 'asc' ? 1 : -1;
            }
            return 0;
        });
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const formatTime = (timeString) => {
        if (!timeString) return 'N/A';
        return new Date(`1970-01-01T${timeString}`).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    // Filter meetings based on search term
    const filteredMeetings = meetings.filter(meeting =>
        meeting.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        meeting.date?.includes(searchTerm) ||
        meeting.time?.includes(searchTerm) ||
        meeting.category?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Sort filtered meetings
    const sortedMeetings = sortMeetings(filteredMeetings);

    // Pagination
    const totalPages = Math.ceil(sortedMeetings.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedMeetings = sortedMeetings.slice(startIndex, startIndex + itemsPerPage);

    if (loading) {
        return (
            <DashboardLayout user={user}>
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading meetings...</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout user={user}>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">All Meetings</h1>
                        <p className="text-gray-600">Manage and view all meetings</p>
                    </div>
                    <Button
                        onClick={() => window.location.href = '/meetings/create'}
                        className="bg-blue-600 hover:bg-blue-700"
                    >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Create Meeting
                    </Button>
                </div>

                {/* Search and Filters */}
                <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
                    <div className="flex items-center space-x-3 flex-1">
                        <div className="relative flex-1 min-w-0 sm:max-w-lg lg:max-w-xl">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <Input
                                placeholder="Search meetings by title, date, time, or category..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 w-full"
                            />
                        </div>
                        {searchTerm && (
                            <Button
                                onClick={() => setSearchTerm('')}
                                variant="outline"
                                size="sm"
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </Button>
                        )}
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button
                            onClick={fetchMeetings}
                            variant="outline"
                            size="sm"
                            className="flex items-center space-x-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            <span className="hidden sm:inline">Refresh</span>
                        </Button>
                    </div>
                </div>

                {/* Meetings Table */}
                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                            <div>
                                <CardTitle className="text-lg">Meetings List</CardTitle>
                                <CardDescription className="flex flex-wrap items-center gap-2 mt-1">
                                    <span>
                                        {sortedMeetings.length} meeting{sortedMeetings.length !== 1 ? 's' : ''}
                                        {searchTerm ? ` matching "${searchTerm}"` : ' total'}
                                    </span>
                                    {searchTerm && (
                                        <button
                                            onClick={() => setSearchTerm('')}
                                            className="text-blue-600 hover:text-blue-700 text-sm underline"
                                        >
                                            Clear search
                                        </button>
                                    )}
                                </CardDescription>
                            </div>
                            <div className="text-sm text-gray-500 sm:text-right">
                                <div className="flex items-center space-x-1">
                                    <span className="hidden sm:inline">Sorted by</span>
                                    <span className="font-medium capitalize">{sortField}</span>
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        {sortDirection === 'asc' ? (
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4l9 16 9-16H3z" />
                                        ) : (
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 20l-9-16-9 16h18z" />
                                        )}
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        {error && (
                            <div className="p-6 text-center text-red-600">
                                <p>{error}</p>
                            </div>
                        )}

                        {!error && sortedMeetings.length === 0 ? (
                            <div className="p-12 text-center">
                                {searchTerm ? (
                                    <>
                                        <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                        <h3 className="text-lg font-medium text-gray-900 mb-2">No meetings match your search</h3>
                                        <p className="text-gray-600 mb-4">Try adjusting your search terms or browse all meetings.</p>
                                        <div className="flex justify-center space-x-3">
                                            <Button
                                                onClick={() => setSearchTerm('')}
                                                variant="outline"
                                            >
                                                Clear Search
                                            </Button>
                                            <Button
                                                onClick={() => window.location.href = '/meetings/create'}
                                                className="bg-blue-600 hover:bg-blue-700"
                                            >
                                                Create Meeting
                                            </Button>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        <h3 className="text-lg font-medium text-gray-900 mb-2">No meetings found</h3>
                                        <p className="text-gray-600 mb-4">Get started by creating your first meeting.</p>
                                        <Button
                                            onClick={() => window.location.href = '/meetings/create'}
                                            className="bg-blue-600 hover:bg-blue-700"
                                        >
                                            Create Meeting
                                        </Button>
                                    </>
                                )}
                            </div>
                        ) : (
                            <>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-50 border-b border-gray-200">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    <button
                                                        className="flex items-center space-x-1 hover:text-gray-700 focus:outline-none"
                                                        onClick={() => handleSort('title')}
                                                    >
                                                        <span>Title</span>
                                                        {getSortIcon('title')}
                                                    </button>
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    <button
                                                        className="flex items-center space-x-1 hover:text-gray-700 focus:outline-none"
                                                        onClick={() => handleSort('date')}
                                                    >
                                                        <span>Date</span>
                                                        {getSortIcon('date')}
                                                    </button>
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    <button
                                                        className="flex items-center space-x-1 hover:text-gray-700 focus:outline-none"
                                                        onClick={() => handleSort('time')}
                                                    >
                                                        <span>Time</span>
                                                        {getSortIcon('time')}
                                                    </button>
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    <button
                                                        className="flex items-center space-x-1 hover:text-gray-700 focus:outline-none"
                                                        onClick={() => handleSort('category')}
                                                    >
                                                        <span>Category</span>
                                                        {getSortIcon('category')}
                                                    </button>
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Uploaded File
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {paginatedMeetings.map((meeting) => (
                                                <tr key={meeting.id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {meeting.title || 'Untitled Meeting'}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-900">
                                                            {formatDate(meeting.date)}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-900">
                                                            {formatTime(meeting.time)}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-900">
                                                            {meeting.category ? (
                                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                                    {meeting.category.name}
                                                                </span>
                                                            ) : (
                                                                <span className="text-gray-400 text-xs">No category</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {meeting.minit_mesyuarat_file_url ? (
                                                            <Button
                                                                onClick={() => handleViewFile(meeting.minit_mesyuarat_file_url)}
                                                                variant="outline"
                                                                size="sm"
                                                                className="text-blue-600 hover:text-blue-700 p-2"
                                                                title="View file"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                                </svg>
                                                            </Button>
                                                        ) : (
                                                            <span className="text-sm text-gray-400">No file</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center space-x-2">
                                                            <Button
                                                                onClick={() => handleEdit(meeting.id)}
                                                                variant="outline"
                                                                size="sm"
                                                                className="text-blue-600 hover:text-blue-700 p-2"
                                                                title="Edit meeting"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                                </svg>
                                                            </Button>
                                                            <Button
                                                                onClick={() => {
                                                                    console.log('Download button clicked', meeting.title, meeting.minit_mesyuarat_file_url);
                                                                    if (meeting.minit_mesyuarat_file_url) {
                                                                        handleDownloadFile(meeting.minit_mesyuarat_file_url, meeting.title + '_meeting_file');
                                                                    } else {
                                                                        alert('No file available for download');
                                                                    }
                                                                }}
                                                                variant="outline"
                                                                size="sm"
                                                                disabled={!meeting.minit_mesyuarat_file_url}
                                                                className={
                                                                    meeting.minit_mesyuarat_file_url
                                                                        ? "text-green-600 hover:text-green-700 border-green-200 hover:border-green-300 p-2"
                                                                        : "text-gray-400 border-gray-200 cursor-not-allowed p-2"
                                                                }
                                                                title={meeting.minit_mesyuarat_file_url ? "Download file" : "No file available"}
                                                            >
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                                </svg>
                                                            </Button>
                                                            <Button
                                                                onClick={() => handleDelete(meeting.id)}
                                                                variant="outline"
                                                                size="sm"
                                                                className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300 p-2"
                                                                title="Delete meeting"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                </svg>
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Pagination */}
                                {totalPages > 1 && (
                                    <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                                        <div className="text-sm text-gray-700">
                                            Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, sortedMeetings.length)} of {sortedMeetings.length} meetings
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Button
                                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                                disabled={currentPage === 1}
                                                variant="outline"
                                                size="sm"
                                            >
                                                Previous
                                            </Button>
                                            <span className="text-sm text-gray-700">
                                                Page {currentPage} of {totalPages}
                                            </span>
                                            <Button
                                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                                disabled={currentPage === totalPages}
                                                variant="outline"
                                                size="sm"
                                            >
                                                Next
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
};

export default ViewAllMeetings;
