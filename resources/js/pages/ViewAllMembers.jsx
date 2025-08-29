import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import MemberStats from '../components/MemberStats';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';

const ViewAllMembers = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState([]);
  const [stats, setStats] = useState(null);
  const [pagination, setPagination] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    gender: ''
  });
  const [sortBy, setSortBy] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    fetchUserData();
  }, []);

  useEffect(() => {
    if (user) {
      fetchMembers();
    }
  }, [user, searchTerm, filters, sortBy, sortDirection]);

  // Debounce search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (user) fetchMembers();
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

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
        }
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async (page = 1) => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: '15',
        sort_by: sortBy,
        sort_direction: sortDirection,
        ...(searchTerm && { search: searchTerm }),
        ...(filters.gender && { gender: filters.gender })
      });

      const response = await fetch(`/api/members?${params}`, {
        headers: {
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        credentials: 'same-origin'
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setMembers(data.data);
          setStats(data.stats);
          setPagination(data.meta);
        }
      }
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  };

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDirection('asc');
    }
  };

  const handleSelectMember = (memberId) => {
    setSelectedMembers(prev => {
      if (prev.includes(memberId)) {
        return prev.filter(id => id !== memberId);
      } else {
        return [...prev, memberId];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedMembers.length === members.length) {
      setSelectedMembers([]);
    } else {
      setSelectedMembers(members.map(member => member.id));
    }
  };

  const handleDeleteSelected = async () => {
    try {
      const response = await fetch('/api/members/delete-duplicates', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify({
          member_ids: selectedMembers
        }),
        credentials: 'same-origin'
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setSelectedMembers([]);
          setShowDeleteModal(false);
          fetchMembers();
        }
      }
    } catch (error) {
      console.error('Error deleting members:', error);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-MY');
  };

  const formatPhone = (phone) => {
    if (!phone) return '-';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10 && cleaned.startsWith('0')) {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}${cleaned.slice(6)}`;
    }
    return phone;
  };

  if (loading) {
    return (
      <DashboardLayout user={user} currentPath="view-all-members">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout user={user} currentPath="view-all-members">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">View All Members</h1>
          <div className="flex space-x-3">
            <Button variant="outline" onClick={() => window.location.href = '/members/upload-file'}>
              Upload Members
            </Button>
            {selectedMembers.length > 0 && (
              <Button variant="destructive" onClick={() => setShowDeleteModal(true)}>
                Delete Selected ({selectedMembers.length})
              </Button>
            )}
          </div>
        </div>

        {/* Statistics Cards */}
        {stats && <MemberStats stats={stats} />}

        {/* Search and Filter */}
        <Card className="p-6">
          <div className="flex flex-col sm:flex-row gap-6">
            {/* Search Members */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-3">Search</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by name, IC, phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
                <svg className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* Filter by Gender */}
            <div className="sm:w-64">
              <label className="block text-sm font-medium text-gray-700 mb-3">Gender</label>
              <select
                value={filters.gender}
                onChange={(e) => setFilters({...filters, gender: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="">All Genders</option>
                <option value="M">Male</option>
                <option value="F">Female</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Members Table */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedMembers.length === members.length && members.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NO ANGGOTA</th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center">
                      NAMA
                      {sortBy === 'name' && (
                        <svg className={`ml-1 h-4 w-4 ${sortDirection === 'asc' ? 'transform rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">KAD PENGENALAN</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">BANGSA</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">JANTINA</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">MOBILE NUMBER</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ALAMAT</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">RANTING</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {members.length > 0 ? (
                  members.map((member) => (
                    <tr key={member.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedMembers.includes(member.id)}
                          onChange={() => handleSelectMember(member.id)}
                          className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{member.member_no || '-'}</td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{member.name}</div>
                        {member.age && (
                          <div className="text-xs text-gray-500">Age: {member.age}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{member.ic_no}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{member.race || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {member.gender ? (
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            member.gender === 'M' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800'
                          }`}>
                            {member.gender === 'M' ? 'Male' : 'Female'}
                          </span>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatPhone(member.phone)}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div>{member.address || '-'}</div>
                        {member.address_2 && (
                          <div className="text-xs text-gray-500">{member.address_2}</div>
                        )}
                        {(member.city || member.state) && (
                          <div className="text-xs text-gray-500">
                            {member.city ? `${member.city}${member.state ? `, ${member.state}` : ''}` : member.state}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{member.branch || '-'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="9" className="px-6 py-12 text-center">
                      <div className="text-gray-500">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No members found</h3>
                        <p className="mt-1 text-sm text-gray-500">
                          {searchTerm || Object.values(filters).some(Boolean) ? 
                            'Try adjusting your search or filters.' : 
                            'Get started by uploading your first member file.'}
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Pagination */}
        {pagination && pagination.total > 0 && (
          <Card className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {((pagination.current_page - 1) * pagination.per_page) + 1} to {Math.min(pagination.current_page * pagination.per_page, pagination.total)} of {pagination.total} results
              </div>
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => fetchMembers(pagination.current_page - 1)}
                  disabled={pagination.current_page <= 1}
                >
                  Previous
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => fetchMembers(pagination.current_page + 1)}
                  disabled={pagination.current_page >= pagination.last_page}
                >
                  Next
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="max-w-lg mx-4 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Delete Members</h3>
              <p className="text-sm text-gray-600 mb-4">
                Are you sure you want to delete {selectedMembers.length} selected member(s)? This action cannot be undone.
              </p>
              <div className="flex space-x-3">
                <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleDeleteSelected}>
                  Delete
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ViewAllMembers;