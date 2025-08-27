import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';

const CreateUser = () => {
  const [user, setUser] = useState(null);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    ic_number: '',
    phone: '',
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
        setUser(userData.data);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
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
        setRoles(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // For IC number and phone, only allow digits
    if (name === 'ic_number' || name === 'phone') {
      const numericValue = value.replace(/[^0-9]/g, '');
      if (name === 'phone' && numericValue && !numericValue.startsWith('01')) {
        return; // Don't update if phone doesn't start with 01
      }
      setFormData(prev => ({
        ...prev,
        [name]: numericValue
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }

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

    if (!formData.ic_number.trim()) {
      newErrors.ic_number = 'IC Number is required';
    } else if (!/^\d{12}$/.test(formData.ic_number)) {
      newErrors.ic_number = 'IC Number must be exactly 12 digits';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^01\d{8,9}$/.test(formData.phone)) {
      newErrors.phone = 'Phone number must start with 01 and be 10-11 digits';
    }

    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (!formData.password_confirmation) {
      newErrors.password_confirmation = 'Password confirmation is required';
    } else if (formData.password !== formData.password_confirmation) {
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

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/users/store', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content'),
          'X-Requested-With': 'XMLHttpRequest',
        },
        credentials: 'same-origin',
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setFormData({
          name: '',
          ic_number: '',
          phone: '',
          email: '',
          password: '',
          password_confirmation: '',
          role_id: ''
        });
        setErrors({});

        // Show success message for 2 seconds then redirect
        setTimeout(() => {
          window.location.href = '/users';
        }, 2000);
      } else {
        if (data.errors) {
          setErrors(data.errors);
        } else {
          setErrors({ general: data.message || 'Failed to create user' });
        }
      }
    } catch (error) {
      console.error('Error creating user:', error);
      setErrors({ general: 'An error occurred while creating the user' });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    window.location.href = '/users';
  };

  return (
    <DashboardLayout user={user}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create New User</h1>
            <p className="text-gray-600">Add a new user to the system</p>
          </div>
          <Button
            variant="outline"
            onClick={handleCancel}
            className="flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Users
          </Button>
        </div>

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
                  User created successfully! Redirecting to users list...
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

        {/* Create User Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold">User Details</CardTitle>
            <CardDescription>Enter the new user's information</CardDescription>
          </CardHeader>
          <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                  {/* Name */}
                  <div className="lg:col-span-3">
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

                  {/* IC Number */}
                  <div>
                    <Label htmlFor="ic_number">IC Number *</Label>
                    <Input
                      id="ic_number"
                      name="ic_number"
                      type="text"
                      value={formData.ic_number}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, '');
                        if (value.length <= 12) {
                          handleInputChange({
                            target: { name: 'ic_number', value }
                          });
                        }
                      }}
                      className={errors.ic_number ? 'border-red-500 focus:ring-red-500' : ''}
                      placeholder="12 digits only (e.g., 990101140123)"
                      maxLength={12}
                    />
                    {errors.ic_number && (
                      <p className="mt-1 text-sm text-red-600">{errors.ic_number}</p>
                    )}
                  </div>

                  {/* Phone */}
                  <div>
                    <Label htmlFor="phone">Handphone Number *</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="text"
                      value={formData.phone}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, '');
                        if (value.length <= 11 && (!value || value.startsWith('01'))) {
                          handleInputChange({
                            target: { name: 'phone', value }
                          });
                        }
                      }}
                      className={errors.phone ? 'border-red-500 focus:ring-red-500' : ''}
                      placeholder="10-11 digits only (e.g., 0123456789)"
                      maxLength={11}
                    />
                    {errors.phone && (
                      <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div className="lg:col-span-1">
                    <Label htmlFor="email">Email Address (if any)</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={errors.email ? 'border-red-500 focus:ring-red-500' : ''}
                      placeholder="Enter email address (optional)"
                    />
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                    )}
                  </div>

                  {/* Password */}
                  <div>
                    <Label htmlFor="password">Password *</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className={errors.password ? 'border-red-500 focus:ring-red-500' : ''}
                      placeholder="Create a password (min. 8 characters)"
                    />
                    {errors.password && (
                      <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <Label htmlFor="password_confirmation">Confirm Password *</Label>
                    <Input
                      id="password_confirmation"
                      name="password_confirmation"
                      type="password"
                      value={formData.password_confirmation}
                      onChange={handleInputChange}
                      className={errors.password_confirmation ? 'border-red-500 focus:ring-red-500' : ''}
                      placeholder="Confirm your password"
                    />
                    {errors.password_confirmation && (
                      <p className="mt-1 text-sm text-red-600">{errors.password_confirmation}</p>
                    )}
                  </div>

                  {/* Role */}
                  <div className="lg:col-span-3">
                    <Label htmlFor="role_id">User Role *</Label>
                    <select
                      id="role_id"
                      name="role_id"
                      value={formData.role_id}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.role_id ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'
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
                <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
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
                        Creating...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Create User
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
      </div>
    </DashboardLayout>
  );
};

export default CreateUser;
