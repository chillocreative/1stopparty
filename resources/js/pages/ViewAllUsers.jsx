import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';

const ViewAllUsers = () => {
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');

  // Edit modal states
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    ic_number: '',
    phone: '',
    email: '',
    role_id: ''
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editErrors, setEditErrors] = useState({});

  useEffect(() => {
    console.log('ViewAllUsers component mounted, fetching data...'); // Debug log
    fetchUserData();
    fetchUsers();
    fetchRoles();
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

  const fetchUsers = async () => {
    try {
      const response = await fetch('/users/data', {
        headers: {
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        credentials: 'same-origin'
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setUsers(data.data || []);
        } else {
          setError(data.message || 'Failed to fetch users');
        }
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to fetch users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await fetch('/api/roles', {
        headers: {
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        credentials: 'same-origin'
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Roles data received:', data); // Debug log
        if (data.success) {
          console.log('Setting roles:', data.data); // Debug log
          setRoles(data.data || []);
        } else {
          console.error('Failed to fetch roles:', data.message);
          // Fallback to public roles endpoint if admin endpoint fails
          fetchPublicRoles();
        }
      } else {
        console.error('Failed to fetch roles, status:', response.status);
        // Fallback to public roles endpoint if admin endpoint fails
        fetchPublicRoles();
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
      // Fallback to public roles endpoint if admin endpoint fails
      fetchPublicRoles();
    }
  };

  const fetchPublicRoles = async () => {
    try {
      const response = await fetch('/roles', {
        headers: {
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        credentials: 'same-origin'
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Public roles data received:', data); // Debug log
        if (data.success) {
          setRoles(data.data || []);
        } else {
          console.error('Failed to fetch public roles:', data.message);
        }
      } else {
        console.error('Failed to fetch public roles');
      }
    } catch (error) {
      console.error('Error fetching public roles:', error);
    }
  };

  const handleEditUser = (userData) => {
    setEditingUser(userData);
    setEditFormData({
      name: userData.name || '',
      ic_number: userData.ic_number || '',
      phone: userData.phone || '',
      email: userData.email || '',
      role_id: userData.role_id || ''
    });
    setEditErrors({});
    setEditModalOpen(true);
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;

    // For IC number and phone, only allow digits
    if (name === 'ic_number' || name === 'phone') {
      const numericValue = value.replace(/\D/g, '');
      setEditFormData(prev => ({
        ...prev,
        [name]: numericValue
      }));
    } else {
      setEditFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }

    // Clear error when user starts typing
    if (editErrors[name]) {
      setEditErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateEditForm = () => {
    const newErrors = {};

    if (!editFormData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!editFormData.ic_number.trim()) {
      newErrors.ic_number = 'IC Number is required';
    } else if (!/^\d{12}$/.test(editFormData.ic_number)) {
      newErrors.ic_number = 'IC Number must be 12 digits only';
    }

    if (!editFormData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^01[0-9]{8,9}$/.test(editFormData.phone)) {
      newErrors.phone = 'Phone number must be 10-11 digits starting with 01';
    }

    if (editFormData.email && !/\S+@\S+\.\S+/.test(editFormData.email)) {
      newErrors.email = 'Email format is invalid';
    }

    if (!editFormData.role_id) {
      newErrors.role_id = 'Role is required';
    }

    setEditErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();

    if (!validateEditForm()) {
      return;
    }

    setEditLoading(true);

    try {
      const response = await fetch(`/users/${editingUser.id}/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content'),
          'X-Requested-With': 'XMLHttpRequest',
        },
        credentials: 'same-origin',
        body: JSON.stringify(editFormData)
      });

      if (response.ok) {
        await fetchUsers(); // Refresh users list
        setEditModalOpen(false);
        setEditingUser(null);
      } else {
        const data = await response.json();
        if (data.errors) {
          setEditErrors(data.errors);
        } else {
          setEditErrors({ general: data.message || 'Failed to update user' });
        }
      }
    } catch (error) {
      console.error('Error updating user:', error);
      setEditErrors({ general: 'An error occurred while updating the user' });
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to delete ${userName}? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/users/${userId}/delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content'),
          'X-Requested-With': 'XMLHttpRequest',
        },
        credentials: 'same-origin'
      });

      if (response.ok) {
        setUsers(users.filter(u => u.id !== userId));
      } else {
        alert('Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user');
    }
  };

  const filteredUsers = users.filter(userData => {
    const matchesSearch = userData.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      userData.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      userData.ic_number?.includes(searchTerm) ||
      userData.phone?.includes(searchTerm);
    const matchesRole = selectedRole === 'all' || userData.role?.name === selectedRole;
    return matchesSearch && matchesRole;
  });

  if (loading) {
    return (
      <DashboardLayout user={user}>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
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
            <h1 className="text-2xl font-bold text-gray-900">Users Management</h1>
            <p className="text-gray-600">Manage system users and assign roles</p>
          </div>
          <Button
            onClick={() => window.location.href = '/users/create'}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add New User
          </Button>
        </div>

        {/* Filters */}
        <Card className="p-6">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1">
              <Label className="block text-sm font-medium text-gray-700 mb-2">Search Users</Label>
              <Input
                type="text"
                placeholder="Search by name, email, IC, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="w-full md:w-48">
              <Label className="block text-sm font-medium text-gray-700 mb-2">Filter by Role</Label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Roles</option>
                {roles.length > 0 ? (
                  roles.map(role => (
                    <option key={role.id} value={role.name}>{role.name}</option>
                  ))
                ) : (
                  <option disabled>Loading roles...</option>
                )}
              </select>
              {/* Debug info - remove after fixing */}
              {process.env.NODE_ENV === 'development' && (
                <div className="mt-1 text-xs text-gray-500">
                  Roles loaded: {roles.length} | Selected: {selectedRole}
                </div>
              )}
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500 mb-1">Showing Results</p>
              <p className="text-2xl font-bold text-gray-900">
                {filteredUsers.length}
                <span className="text-sm font-normal text-gray-500 ml-1">
                  of {users.length} users
                </span>
              </p>
            </div>
          </div>
        </Card>

        {/* Users Table */}
        {error ? (
          <Card className="p-6">
            <div className="text-center text-red-600">{error}</div>
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Full Name</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IC Number</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                        No users found
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((userData) => (
                      <tr key={userData.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              {userData.profile_image_url ? (
                                <img
                                  src={userData.profile_image_url}
                                  alt={`${userData.name}'s profile`}
                                  className="h-10 w-10 rounded-full object-cover"
                                  onError={(e) => {
                                    // Fallback to initials if image fails to load
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'flex';
                                  }}
                                />
                              ) : null}
                              <div
                                className={`h-10 w-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center ${userData.profile_image_url ? 'hidden' : 'flex'}`}
                              >
                                <span className="text-white font-medium text-sm">
                                  {userData.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{userData.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{userData.email || 'Not provided'}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{userData.ic_number || 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{userData.phone || 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${userData.role?.name === 'Admin' ? 'bg-red-100 text-red-800' :
                            userData.role?.name === 'Bendahari' ? 'bg-green-100 text-green-800' :
                              userData.role?.name === 'Setiausaha' ? 'bg-blue-100 text-blue-800' :
                                userData.role?.name === 'Setiausaha Pengelola' ? 'bg-purple-100 text-purple-800' :
                                  userData.role?.name === 'AJK Cabang' ? 'bg-yellow-100 text-yellow-800' :
                                    userData.role?.name === 'AMK' ? 'bg-orange-100 text-orange-800' :
                                      userData.role?.name === 'Wanita' ? 'bg-pink-100 text-pink-800' :
                                        userData.role?.name === 'Anggota Biasa' ? 'bg-gray-100 text-gray-800' :
                                          'bg-gray-100 text-gray-800'
                            }`}>
                            {userData.role?.name || 'No Role'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditUser(userData)}
                              className="text-blue-600 hover:text-blue-900 border-blue-200 hover:border-blue-300"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteUser(userData.id, userData.name)}
                              className="text-red-600 hover:text-red-900 border-red-200 hover:border-red-300"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {/* Total Users Card */}
          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Total Users</p>
                <p className="text-2xl font-semibold text-gray-900">{users.length}</p>
              </div>
            </div>
          </Card>

          {/* Admin Card */}
          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-100 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Admin</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {users.filter(u => u.role?.name === 'Admin').length}
                </p>
              </div>
            </div>
          </Card>

          {/* Bendahari Card */}
          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Bendahari</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {users.filter(u => u.role?.name === 'Bendahari').length}
                </p>
              </div>
            </div>
          </Card>

          {/* Setiausaha Card */}
          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Setiausaha</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {users.filter(u => u.role?.name === 'Setiausaha').length}
                </p>
              </div>
            </div>
          </Card>

          {/* Setiausaha Pengelola Card */}
          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-100 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Setiausaha Pengelola</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {users.filter(u => u.role?.name === 'Setiausaha Pengelola').length}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Second row for remaining roles */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {/* AMK Card */}
          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-orange-100 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">AMK</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {users.filter(u => u.role?.name === 'AMK').length}
                </p>
              </div>
            </div>
          </Card>

          {/* Wanita Card */}
          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-pink-100 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Wanita</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {users.filter(u => u.role?.name === 'Wanita').length}
                </p>
              </div>
            </div>
          </Card>

          {/* AJK Cabang Card */}
          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-100 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">AJK Cabang</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {users.filter(u => u.role?.name === 'AJK Cabang').length}
                </p>
              </div>
            </div>
          </Card>

          {/* Anggota Biasa Card */}
          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-gray-100 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Anggota Biasa</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {users.filter(u => u.role?.name === 'Anggota Biasa').length}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Edit User Modal */}
      {editModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Edit User</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </Button>
              </div>

              {editErrors.general && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{editErrors.general}</p>
                </div>
              )}

              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="edit-name">Full Name</Label>
                  <Input
                    id="edit-name"
                    name="name"
                    type="text"
                    value={editFormData.name}
                    onChange={handleEditInputChange}
                    className={editErrors.name ? 'border-red-500' : ''}
                  />
                  {editErrors.name && (
                    <p className="mt-1 text-sm text-red-600">{editErrors.name}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="edit-ic">IC Number</Label>
                  <Input
                    id="edit-ic"
                    name="ic_number"
                    type="text"
                    maxLength="12"
                    placeholder="12 digits only"
                    value={editFormData.ic_number}
                    onChange={handleEditInputChange}
                    className={editErrors.ic_number ? 'border-red-500' : ''}
                  />
                  {editErrors.ic_number && (
                    <p className="mt-1 text-sm text-red-600">{editErrors.ic_number}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="edit-phone">Phone Number</Label>
                  <Input
                    id="edit-phone"
                    name="phone"
                    type="text"
                    maxLength="11"
                    placeholder="01XXXXXXXX"
                    value={editFormData.phone}
                    onChange={handleEditInputChange}
                    className={editErrors.phone ? 'border-red-500' : ''}
                  />
                  {editErrors.phone && (
                    <p className="mt-1 text-sm text-red-600">{editErrors.phone}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="edit-email">Email Address</Label>
                  <Input
                    id="edit-email"
                    name="email"
                    type="email"
                    placeholder="Optional"
                    value={editFormData.email}
                    onChange={handleEditInputChange}
                    className={editErrors.email ? 'border-red-500' : ''}
                  />
                  {editErrors.email && (
                    <p className="mt-1 text-sm text-red-600">{editErrors.email}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="edit-role">Role</Label>
                  <select
                    id="edit-role"
                    name="role_id"
                    value={editFormData.role_id}
                    onChange={handleEditInputChange}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${editErrors.role_id ? 'border-red-500' : 'border-gray-300'
                      }`}
                  >
                    <option value="">Select Role</option>
                    {roles.map(role => (
                      <option key={role.id} value={role.id}>{role.name}</option>
                    ))}
                  </select>
                  {editErrors.role_id && (
                    <p className="mt-1 text-sm text-red-600">{editErrors.role_id}</p>
                  )}
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditModalOpen(false)}
                    disabled={editLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={editLoading}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {editLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Updating...
                      </>
                    ) : (
                      'Update User'
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default ViewAllUsers;