import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';

const ViewAllMeetings = () => {
    const [meetings, setMeetings] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(20);
    const [sortField, setSortField] = useState('date');
    const [sortDirection, setSortDirection] = useState('desc');

    useEffect(() => {
        fetchMeetings();
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const response = await fetch('/api/meeting-categories', {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
            });

            if (response.ok) {
                const data = await response.json();
                setCategories(data.data || data || []);
            }
        } catch (err) {
            console.error('Error fetching categories:', err);
        }
    };

    const fetchMeetings = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/meetings', {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
            });

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('Please log in to view meetings');
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('API Response:', data);
            setMeetings(data.data || []);
            setError(null);
        } catch (err) {
            console.error('Error fetching meetings:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (timeString) => {
        if (!timeString) return '';

        const [hours, minutes] = timeString.split(':');
        const hour24 = parseInt(hours, 10);
        const minute = parseInt(minutes, 10);

        const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
        const ampm = hour24 >= 12 ? 'PM' : 'AM';

        const formattedMinutes = minute.toString().padStart(2, '0');

        return `${hour12}.${formattedMinutes}${ampm}`;
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';

        const date = new Date(dateString);
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();

        return `${day}/${month}/${year}`;
    };

    const handleDelete = async (meetingId, meetingTitle) => {
        if (!confirm(`Are you sure you want to delete "${meetingTitle}"?`)) {
            return;
        }

        try {
            const response = await fetch(`/api/meetings/${meetingId}`, {
                method: 'DELETE',
                credentials: 'include',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            alert(result.message || 'Meeting deleted successfully');
            fetchMeetings();
        } catch (err) {
            console.error('Error deleting meeting:', err);
            alert('Failed to delete meeting: ' + err.message);
        }
    };

    // Sorting function
    const handleSort = (field) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
        setCurrentPage(1); // Reset to first page when sorting
    };

    // Filter and sort meetings
    const filteredMeetings = meetings.filter(meeting => {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = !searchTerm || (
            meeting.title?.toLowerCase().includes(searchLower) ||
            meeting.date?.includes(searchTerm) ||
            meeting.time?.includes(searchTerm) ||
            meeting.category?.name?.toLowerCase().includes(searchLower)
        );

        const matchesCategory = !selectedCategory || meeting.category?.id?.toString() === selectedCategory;

        return matchesSearch && matchesCategory;
    }).sort((a, b) => {
        let aValue, bValue;
        
        switch (sortField) {
            case 'title':
                aValue = a.title?.toLowerCase() || '';
                bValue = b.title?.toLowerCase() || '';
                break;
            case 'category':
                aValue = a.category?.name?.toLowerCase() || '';
                bValue = b.category?.name?.toLowerCase() || '';
                break;
            case 'date':
                aValue = new Date(a.date);
                bValue = new Date(b.date);
                break;
            default:
                return 0;
        }

        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
        return 0;
    });

    // Pagination logic
    const totalItems = filteredMeetings.length;
    const totalPages = itemsPerPage === 'all' ? 1 : Math.ceil(totalItems / itemsPerPage);
    
    const paginatedMeetings = itemsPerPage === 'all' 
        ? filteredMeetings 
        : filteredMeetings.slice(
            (currentPage - 1) * itemsPerPage,
            currentPage * itemsPerPage
        );

    // Reset to first page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, selectedCategory]);

    // Pagination handlers
    const handleItemsPerPageChange = (value) => {
        setItemsPerPage(value === 'all' ? 'all' : parseInt(value));
        setCurrentPage(1);
    };

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    if (loading) {
        return (
            <DashboardLayout title="Meetings">
                <div className="flex items-center justify-center h-64">
                    <div className="text-lg text-gray-600">Loading meetings...</div>
                </div>
            </DashboardLayout>
        );
    }

    if (error) {
        return (
            <DashboardLayout title="Meetings">
                <Card>
                    <CardContent className="p-6">
                        <div className="text-center text-red-600">
                            <p className="text-lg font-medium">Error loading meetings</p>
                            <p className="text-sm mt-2">{error}</p>
                            <Button
                                onClick={fetchMeetings}
                                className="mt-4"
                                variant="outline"
                            >
                                Try Again
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout title="Meetings">
            <div className="space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">All Meetings</h2>
                        <p className="text-sm text-gray-600 mt-1">
                            Total: {filteredMeetings.length} meeting{filteredMeetings.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                    <div className="flex space-x-3">
                        <Button
                            onClick={() => window.location.href = '/meetings/create'}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Create Meeting
                        </Button>
                        <Button
                            onClick={() => window.location.href = '/meeting-categories'}
                            variant="outline"
                        >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                            </svg>
                            Categories
                        </Button>
                    </div>
                </div>

                {/* Search and Filter */}
                <Card>
                    <CardContent className="pt-8 pb-6 px-6">
                        <div className="flex flex-col sm:flex-row gap-6">
                            {/* Search Meetings */}
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-3">Search Meetings</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Search by title, date, time, or category..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                    />
                                    <svg className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                            </div>

                            {/* Filter by Category */}
                            <div className="sm:w-64">
                                <label className="block text-sm font-medium text-gray-700 mb-3">Filter by Category</label>
                                <select
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                >
                                    <option value="">All Categories</option>
                                    {categories.map((category) => (
                                        <option key={category.id} value={category.id.toString()}>
                                            {category.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Items Per Page */}
                            <div className="sm:w-32">
                                <label className="block text-sm font-medium text-gray-700 mb-3">Show</label>
                                <select
                                    value={itemsPerPage}
                                    onChange={(e) => handleItemsPerPageChange(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                >
                                    <option value={20}>20</option>
                                    <option value={50}>50</option>
                                    <option value="all">All</option>
                                </select>
                            </div>

                            {/* Showing Results */}
                            <div className="sm:w-48 flex flex-col justify-end">
                                <div className="text-right">
                                    <div className="text-sm text-gray-500 mb-2">
                                        {itemsPerPage === 'all' 
                                            ? 'All Results'
                                            : `Page ${currentPage} of ${totalPages}`
                                        }
                                    </div>
                                    <div className="text-lg font-semibold text-gray-900">
                                        {itemsPerPage === 'all' 
                                            ? filteredMeetings.length
                                            : `${Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)}-${Math.min(currentPage * itemsPerPage, totalItems)} of ${totalItems}`
                                        }{' '}
                                        <span className="text-sm font-normal text-gray-500">
                                            meeting{totalItems !== 1 ? 's' : ''}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Meetings Table */}
                <Card>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto pt-4">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th 
                                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                                            onClick={() => handleSort('title')}
                                        >
                                            <div className="flex items-center space-x-1">
                                                <span>Title</span>
                                                <div className="flex flex-col">
                                                    <svg className={`w-3 h-3 ${sortField === 'title' && sortDirection === 'asc' ? 'text-gray-900' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                                                    </svg>
                                                    <svg className={`w-3 h-3 ${sortField === 'title' && sortDirection === 'desc' ? 'text-gray-900' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                                    </svg>
                                                </div>
                                            </div>
                                        </th>
                                        <th 
                                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                                            onClick={() => handleSort('category')}
                                        >
                                            <div className="flex items-center space-x-1">
                                                <span>Category</span>
                                                <div className="flex flex-col">
                                                    <svg className={`w-3 h-3 ${sortField === 'category' && sortDirection === 'asc' ? 'text-gray-900' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                                                    </svg>
                                                    <svg className={`w-3 h-3 ${sortField === 'category' && sortDirection === 'desc' ? 'text-gray-900' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                                    </svg>
                                                </div>
                                            </div>
                                        </th>
                                        <th 
                                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                                            onClick={() => handleSort('date')}
                                        >
                                            <div className="flex items-center space-x-1">
                                                <span>Date/Time</span>
                                                <div className="flex flex-col">
                                                    <svg className={`w-3 h-3 ${sortField === 'date' && sortDirection === 'asc' ? 'text-gray-900' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                                                    </svg>
                                                    <svg className={`w-3 h-3 ${sortField === 'date' && sortDirection === 'desc' ? 'text-gray-900' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                                    </svg>
                                                </div>
                                            </div>
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            File
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {paginatedMeetings.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                                                {searchTerm ? 'No meetings found matching your search.' : 'No meetings found. Create your first meeting!'}
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedMeetings.map((meeting) => (
                                            <tr key={meeting.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900">{meeting.title}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {meeting.category ? (
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                            {meeting.category.name}
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                            No category
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    <div>{formatDate(meeting.date)}</div>
                                                    <div className="text-gray-500">{formatTime(meeting.time)}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex flex-col space-y-1">
                                                        {meeting.minit_mesyuarat_file_url ? (
                                                            <button
                                                                onClick={() => window.open(meeting.minit_mesyuarat_file_url, '_blank')}
                                                                className="text-blue-600 hover:text-blue-800 text-sm text-left underline"
                                                            >
                                                                Minit Mesyuarat
                                                            </button>
                                                        ) : null}
                                                        
                                                        {meeting.penyata_kewangan_file_url ? (
                                                            <button
                                                                onClick={() => window.open(meeting.penyata_kewangan_file_url, '_blank')}
                                                                className="text-blue-600 hover:text-blue-800 text-sm text-left underline"
                                                            >
                                                                Penyata Kewangan
                                                            </button>
                                                        ) : null}
                                                        
                                                        {meeting.aktiviti_file_url ? (
                                                            <button
                                                                onClick={() => window.open(meeting.aktiviti_file_url, '_blank')}
                                                                className="text-blue-600 hover:text-blue-800 text-sm text-left underline"
                                                            >
                                                                Aktiviti
                                                            </button>
                                                        ) : null}
                                                        
                                                        {!meeting.minit_mesyuarat_file_url && !meeting.penyata_kewangan_file_url && !meeting.aktiviti_file_url && (
                                                            <span className="text-sm text-gray-400">No files</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                                    <button
                                                        onClick={() => window.location.href = `/meetings/edit/${meeting.id}`}
                                                        className="text-blue-600 hover:text-blue-900 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                                                        title="Edit meeting"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(meeting.id, meeting.title)}
                                                        className="text-red-600 hover:text-red-900 p-2 rounded-lg hover:bg-red-50 transition-colors"
                                                        title="Delete meeting"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {/* Pagination */}
                {itemsPerPage !== 'all' && totalPages > 1 && (
                    <Card>
                        <CardContent className="py-6">
                            <div className="flex items-center justify-between">
                                <div className="text-sm text-gray-700">
                                    Showing{' '}
                                    <span className="font-medium">
                                        {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)}
                                    </span>{' '}
                                    to{' '}
                                    <span className="font-medium">
                                        {Math.min(currentPage * itemsPerPage, totalItems)}
                                    </span>{' '}
                                    of{' '}
                                    <span className="font-medium">{totalItems}</span>{' '}
                                    results
                                </div>

                                <div className="flex items-center space-x-2">
                                    {/* Previous Button */}
                                    <button
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        disabled={currentPage === 1}
                                        className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Previous
                                    </button>

                                    {/* Page Numbers */}
                                    <div className="flex items-center space-x-1">
                                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                            let pageNumber;
                                            if (totalPages <= 5) {
                                                pageNumber = i + 1;
                                            } else if (currentPage <= 3) {
                                                pageNumber = i + 1;
                                            } else if (currentPage >= totalPages - 2) {
                                                pageNumber = totalPages - 4 + i;
                                            } else {
                                                pageNumber = currentPage - 2 + i;
                                            }

                                            return (
                                                <button
                                                    key={pageNumber}
                                                    onClick={() => handlePageChange(pageNumber)}
                                                    className={`px-3 py-2 text-sm font-medium border rounded-md ${
                                                        currentPage === pageNumber
                                                            ? 'bg-blue-600 text-white border-blue-600'
                                                            : 'text-gray-700 bg-white border-gray-300 hover:bg-gray-50'
                                                    }`}
                                                >
                                                    {pageNumber}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {/* Next Button */}
                                    <button
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                        className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </DashboardLayout>
    );
};

export default ViewAllMeetings;
