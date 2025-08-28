import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';

const ViewAllEvents = () => {
    const [user, setUser] = useState(null);
    const [events, setEvents] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [showEventModal, setShowEventModal] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(20);
    const [sortField, setSortField] = useState('date');
    const [sortDirection, setSortDirection] = useState('desc');
    const [selectedItems, setSelectedItems] = useState(new Set());
    const [showBulkActions, setShowBulkActions] = useState(false);

    // Fetch user, events and categories on component mount
    useEffect(() => {
        fetchUserData();
        fetchEvents();
        fetchCategories();
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
                } else {
                    console.error('Failed to fetch user data:', userData.message);
                }
            }
        } catch (error) {
            console.error('Error fetching user data:', error);
        }
    };

    const fetchCategories = async () => {
        try {
            const response = await fetch('/api/event-categories', {
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
                setCategories(data);
            }
        } catch (err) {
            console.error('Error fetching categories:', err);
        }
    };

    const fetchEvents = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/events', {
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
                    throw new Error('Please log in to view events');
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            setEvents(data);
            setError(null);
        } catch (err) {
            console.error('Error fetching events:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Format time to 9.00PM format
    const formatTime = (timeString) => {
        if (!timeString) return '';

        // Parse the time string (assumes format like "09:00" or "09:00:00")
        const [hours, minutes] = timeString.split(':');
        const hour24 = parseInt(hours, 10);
        const minute = parseInt(minutes, 10);

        // Convert to 12-hour format
        const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
        const ampm = hour24 >= 12 ? 'PM' : 'AM';

        // Format with leading zero for minutes
        const formattedMinutes = minute.toString().padStart(2, '0');

        return `${hour12}.${formattedMinutes}${ampm}`;
    };

    // Format date to dd/mm/yyyy format
    const formatDate = (dateString) => {
        if (!dateString) return '';

        const date = new Date(dateString);
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();

        return `${day}/${month}/${year}`;
    };


    // Handle delete
    const handleDelete = async (eventId, eventTitle) => {
        if (!confirm(`Are you sure you want to delete "${eventTitle}"?`)) {
            return;
        }

        try {
            const response = await fetch(`/api/events/${eventId}`, {
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
            alert(result.message || 'Event deleted successfully');
            fetchEvents(); // Refresh the list
        } catch (err) {
            console.error('Error deleting event:', err);
            alert('Failed to delete event: ' + err.message);
        }
    };

    // View event details
    const viewEvent = (event) => {
        setSelectedEvent(event);
        setShowEventModal(true);
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

    // Bulk action handlers
    const handleSelectAll = (checked) => {
        if (checked) {
            const allIds = new Set(paginatedEvents.map(event => event.id));
            setSelectedItems(allIds);
        } else {
            setSelectedItems(new Set());
        }
    };

    const handleSelectItem = (id, checked) => {
        const newSelection = new Set(selectedItems);
        if (checked) {
            newSelection.add(id);
        } else {
            newSelection.delete(id);
        }
        setSelectedItems(newSelection);
        setShowBulkActions(newSelection.size > 0);
    };

    const handleBulkDelete = async () => {
        if (!confirm(`Are you sure you want to delete ${selectedItems.size} selected events?`)) {
            return;
        }

        try {
            const deletePromises = Array.from(selectedItems).map(id =>
                fetch(`/api/events/${id}`, {
                    method: 'DELETE',
                    credentials: 'include',
                    headers: {
                        'Accept': 'application/json',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    }
                })
            );

            await Promise.all(deletePromises);
            await fetchEvents(); // Refresh the list
            setSelectedItems(new Set());
            setShowBulkActions(false);
        } catch (error) {
            console.error('Error deleting events:', error);
            alert('Failed to delete some events. Please try again.');
        }
    };

    // Filter and sort events
    const filteredEvents = events.filter(event => {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = !searchTerm || (
            event.title?.toLowerCase().includes(searchLower) ||
            event.description?.toLowerCase().includes(searchLower) ||
            event.location?.toLowerCase().includes(searchLower) ||
            event.category?.name?.toLowerCase().includes(searchLower) ||
            event.created_by?.name?.toLowerCase().includes(searchLower)
        );

        const matchesCategory = !selectedCategory || event.category?.id?.toString() === selectedCategory;

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
            case 'created_by':
                aValue = a.created_by?.name?.toLowerCase() || '';
                bValue = b.created_by?.name?.toLowerCase() || '';
                break;
            default:
                return 0;
        }

        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
        return 0;
    });

    // Pagination logic
    const totalItems = filteredEvents.length;
    const totalPages = itemsPerPage === 'all' ? 1 : Math.ceil(totalItems / itemsPerPage);
    
    const paginatedEvents = itemsPerPage === 'all' 
        ? filteredEvents 
        : filteredEvents.slice(
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
            <DashboardLayout user={user} title="Events">
                <div className="flex items-center justify-center h-64">
                    <div className="text-lg text-gray-600">Loading events...</div>
                </div>
            </DashboardLayout>
        );
    }

    if (error) {
        return (
            <DashboardLayout user={user} title="Events">
                <Card>
                    <CardContent className="p-6">
                        <div className="text-center text-red-600">
                            <p className="text-lg font-medium">Error loading events</p>
                            <p className="text-sm mt-2">{error}</p>
                            <Button
                                onClick={fetchEvents}
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
        <DashboardLayout user={user} title="Events">
            <div className="space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">All Events</h2>
                        <p className="text-sm text-gray-600 mt-1">
                            Total: {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                    <div className="flex space-x-3">
                        <Button
                            onClick={() => window.location.href = '/events/create'}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Create Event
                        </Button>
                        <Button
                            onClick={() => window.location.href = '/event-categories'}
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
                            {/* Search Events */}
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-3">Search Events</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Search by title, description, location, or creator..."
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
                                    <option value={10}>10</option>
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
                                            ? filteredEvents.length
                                            : `${Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)}-${Math.min(currentPage * itemsPerPage, totalItems)} of ${totalItems}`
                                        }{' '}
                                        <span className="text-sm font-normal text-gray-500">
                                            event{totalItems !== 1 ? 's' : ''}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Bulk Actions */}
                {selectedItems.size > 0 && (
                    <Card>
                        <CardContent className="py-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                    <span className="text-sm text-gray-600">
                                        {selectedItems.size} item{selectedItems.size !== 1 ? 's' : ''} selected
                                    </span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Button
                                        onClick={handleBulkDelete}
                                        className="bg-red-600 hover:bg-red-700 text-white"
                                        size="sm"
                                    >
                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                        Delete Selected
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Events Table */}
                <Card>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto pt-4">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left">
                                            <input
                                                type="checkbox"
                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                                checked={selectedItems.size > 0 && selectedItems.size === paginatedEvents.length}
                                                onChange={(e) => handleSelectAll(e.target.checked)}
                                            />
                                        </th>
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
                                            Location
                                        </th>
                                        <th 
                                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                                            onClick={() => handleSort('created_by')}
                                        >
                                            <div className="flex items-center space-x-1">
                                                <span>Created By</span>
                                                <div className="flex flex-col">
                                                    <svg className={`w-3 h-3 ${sortField === 'created_by' && sortDirection === 'asc' ? 'text-gray-900' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                                                    </svg>
                                                    <svg className={`w-3 h-3 ${sortField === 'created_by' && sortDirection === 'desc' ? 'text-gray-900' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                                    </svg>
                                                </div>
                                            </div>
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {paginatedEvents.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                                                {searchTerm ? 'No events found matching your search.' : 'No events found. Create your first event!'}
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedEvents.map((event) => (
                                            <tr key={event.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <input
                                                        type="checkbox"
                                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                                        checked={selectedItems.has(event.id)}
                                                        onChange={(e) => handleSelectItem(event.id, e.target.checked)}
                                                    />
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900">{event.title}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {event.category ? (
                                                        <span
                                                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white"
                                                            style={{ backgroundColor: event.category.color }}
                                                        >
                                                            {event.category.name}
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                            No category
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    <div>{formatDate(event.event_date)}</div>
                                                    <div className="text-gray-500">{formatTime(event.event_time)}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {event.location}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {event.created_by?.name || 'Unknown'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                                    <button
                                                        onClick={() => viewEvent(event)}
                                                        className="text-blue-600 hover:text-blue-900 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                                                        title="View event"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={() => window.location.href = `/events/edit/${event.id}`}
                                                        className="text-blue-600 hover:text-blue-900 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                                                        title="Edit event"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(event.id, event.title)}
                                                        className="text-red-600 hover:text-red-900 p-2 rounded-lg hover:bg-red-50 transition-colors"
                                                        title="Delete event"
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

            {/* Event Details Modal */}
            {showEventModal && selectedEvent && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
                        <div className="mt-3">
                            {/* Modal Header */}
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-medium text-gray-900">{selectedEvent.title}</h3>
                                <button
                                    onClick={() => setShowEventModal(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            {/* Modal Content */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                    <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
                                        {selectedEvent.description}
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                                        <p className="text-sm text-gray-900">
                                            {formatDate(selectedEvent.event_date)}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                                        <p className="text-sm text-gray-900">{formatTime(selectedEvent.event_time)}</p>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                                    <p className="text-sm text-gray-900">{selectedEvent.location}</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                    {selectedEvent.category ? (
                                        <span
                                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white"
                                            style={{ backgroundColor: selectedEvent.category.color }}
                                        >
                                            {selectedEvent.category.name}
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                            No category
                                        </span>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Created By</label>
                                    <p className="text-sm text-gray-900">{selectedEvent.created_by?.name || 'Unknown'}</p>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="flex justify-end mt-6 space-x-3">
                                <Button
                                    onClick={() => setShowEventModal(false)}
                                    variant="outline"
                                >
                                    Close
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
};

export default ViewAllEvents;
