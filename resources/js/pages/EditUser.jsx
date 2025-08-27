import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';

const EditUser = () => {
  const [user, setUser] = useState(null);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userLoading, setUserLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    role_id: ''
  });
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchUserData();
    fetchRoles();
    fetchAllUsers();
    
    // Check if user ID is in URL (for direct access)
    const urlParts = window.location.pathname.split('/');
    if (urlParts[2] === 'edit' && urlParts[3]) {
      setSelectedUserId(parseInt(urlParts[3]));
    }
  }, []);

  useEffect(() => {
    if (selectedUserId && allUsers.length > 0) {
      loadUserData(selectedUserId);
    }
  }, [selectedUserId, allUsers]);

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/user');
      if (response.ok) {
        const userData = await response.json();
        setUser(userData.data);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await fetch('/api/roles');
      if (response.ok) {
        const data = await response.json();
        setRoles(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const data = await response.json();
        setAllUsers(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setUserLoading(false);
    }
  };

  const loadUserData = async (userId) => {
    try {
      const response = await fetch(`/api/users/${userId}`);
      if (response.ok) {
        const data = await response.json();
        const userData = data.data;
        setFormData({
          name: userData.name || '',
          email: userData.email || '',
          password: '',
          password_confirmation: '',
          role_id: userData.role_id || ''
        });
      } else {
        setErrors({ general: 'User not found' });
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      setErrors({ general: 'Failed to load user data' });
    }
  };

  const handleUserSelect = (userId) => {
    setSelectedUserId(userId);
    setErrors({});
    setSuccess(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    // Password is optional for editing
    if (formData.password && formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (formData.password && !formData.password_confirmation) {
      newErrors.password_confirmation = 'Password confirmation is required when setting new password';
    } else if (formData.password && formData.password !== formData.password_confirmation) {
      newErrors.password_confirmation = 'Passwords do not match';
    }

    if (!formData.role_id) {
      newErrors.role_id = 'Role is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedUserId) {
      setErrors({ general: 'Please select a user to edit' });
      return;
    }

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const submitData = { ...formData };
      
      // Remove password fields if not provided
      if (!submitData.password) {
        delete submitData.password;
        delete submitData.password_confirmation;
      }

      const response = await fetch(`/api/users/${selectedUserId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content'),
        },
        body: JSON.stringify(submitData)
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setErrors({});
        
        // Update the users list
        fetchAllUsers();
        
        // Clear password fields
        setFormData(prev => ({
          ...prev,
          password: '',
          password_confirmation: ''
        }));
      } else {
        if (data.errors) {
          setErrors(data.errors);
        } else {
          setErrors({ general: data.message || 'Failed to update user' });
        }
      }
    } catch (error) {
      console.error('Error updating user:', error);
      setErrors({ general: 'An error occurred while updating the user' });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    window.location.href = '/users';
  };

  const selectedUser = allUsers.find(u => u.id === selectedUserId);

  return (
    <DashboardLayout user={user}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit User</h1>
            <p className="text-gray-600">Update user information and roles</p>
          </div>
          <Button 
            variant="outline"
            onClick={handleCancel}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Users
          </Button>
        </div>

        {/* User Selection */}
        <Card className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Select User to Edit</h3>
          {userLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {allUsers.map((userData) => (
                <div
                  key={userData.id}
                  onClick={() => handleUserSelect(userData.id)}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedUserId === userData.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-medium text-sm">
                          {userData.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{userData.name}</p>
                      <p className="text-sm text-gray-500 truncate">{userData.email}</p>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 mt-1">
                        {userData.role?.name || 'No Role'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {selectedUser && (
          <>
            {/* Success Message */}
            {success && (
              <Card className="p-4 bg-green-50 border-green-200">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-green-800">
                      User updated successfully!
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {/* General Error */}
            {errors.general && (
              <Card className="p-4 bg-red-50 border-red-200">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-red-800">{errors.general}</p>
                  </div>
                </div>
              </Card>
            )}

            {/* Edit User Form */}
            <Card className="p-6">
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Editing: {selectedUser.name}
                </h3>
                <p className="text-sm text-gray-600">Update the information below to modify this user's account</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Name */}
                  <div>
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      value={formData.name}
                      onChange={handleInputChange}
                      className={errors.name ? 'border-red-500 focus:ring-red-500' : ''}
                      placeholder="Enter full name"
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={errors.email ? 'border-red-500 focus:ring-red-500' : ''}
                      placeholder="Enter email address"
                    />
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                    )}
                  </div>

                  {/* Password */}
                  <div>
                    <Label htmlFor="password">New Password</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className={errors.password ? 'border-red-500 focus:ring-red-500' : ''}
                      placeholder="Leave blank to keep current password"
                    />
                    {errors.password && (
                      <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <Label htmlFor="password_confirmation">Confirm New Password</Label>
                    <Input
                      id="password_confirmation"
                      name="password_confirmation"
                      type="password"
                      value={formData.password_confirmation}
                      onChange={handleInputChange}
                      className={errors.password_confirmation ? 'border-red-500 focus:ring-red-500' : ''}
                      placeholder="Confirm new password"
                    />
                    {errors.password_confirmation && (
                      <p className="mt-1 text-sm text-red-600">{errors.password_confirmation}</p>
                    )}
                  </div>

                  {/* Role */}
                  <div className="md:col-span-2">
                    <Label htmlFor="role_id">User Role *</Label>
                    <select
                      id="role_id"
                      name="role_id"
                      value={formData.role_id}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.role_id ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Select a role</option>
                      {roles.map(role => (
                        <option key={role.id} value={role.id}>{role.name}</option>
                      ))}
                    </select>
                    {errors.role_id && (
                      <p className="mt-1 text-sm text-red-600">{errors.role_id}</p>
                    )}
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Updating...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Update User
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default EditUser;