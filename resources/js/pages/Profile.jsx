import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import DashboardLayout from '../components/DashboardLayout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';

const Profile = () => {
    const { user: authUser, updateUserProfile } = useAuth();
    const [user, setUser] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        ic_number: '',
        phone: '',
        profile_image: null
    });
    const [passwordData, setPasswordData] = useState({
        password: '',
        password_confirmation: ''
    });
    const [imagePreview, setImagePreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [errors, setErrors] = useState({});
    const [success, setSuccess] = useState('');

    // Fetch user data on component mount
    useEffect(() => {
        fetchUserData();
    }, []);

    const fetchUserData = async () => {
        try {
            console.log('Starting fetchUserData...');
            setInitialLoading(true);
            const response = await fetch('/api/user', {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'same-origin'
            });
            
            console.log('Response received:', {
                status: response.status,
                statusText: response.statusText,
                ok: response.ok,
                headers: Array.from(response.headers.entries())
            });
            
            if (response.ok) {
                const userData = await response.json();
                console.log('Full API response:', userData);
                const userInfo = userData.data;
                console.log('User info extracted:', userInfo);
                
                if (userInfo) {
                    setUser(userInfo);
                    setFormData({
                        name: userInfo?.name || '',
                        email: userInfo?.email || '',
                        ic_number: userInfo?.ic_number || '',
                        phone: userInfo?.phone || '',
                        profile_image: null
                    });
                    setImagePreview(userInfo?.profile_image_url || null);
                    console.log('Form data set:', {
                        name: userInfo?.name || '',
                        email: userInfo?.email || '',
                        ic_number: userInfo?.ic_number || '',
                        phone: userInfo?.phone || '',
                    });
                } else {
                    console.warn('User info is null or undefined');
                }
            } else {
                console.error('Failed to fetch user data:', response.status, response.statusText);
                // Try to get error details
                const errorData = await response.text();
                console.error('Error response body:', errorData);
            }
        } catch (error) {
            console.error('Network/fetch error:', error);
        } finally {
            console.log('Setting initialLoading to false');
            setInitialLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, files } = e.target;
        
        if (name === 'profile_image' && files && files[0]) {
            const file = files[0];
            
            // Validate file type
            if (!file.type.startsWith('image/')) {
                setErrors(prev => ({
                    ...prev,
                    profile_image: 'Please select a valid image file'
                }));
                return;
            }

            // Validate file size (max 2MB)
            if (file.size > 2 * 1024 * 1024) {
                setErrors(prev => ({
                    ...prev,
                    profile_image: 'Image size must be less than 2MB'
                }));
                return;
            }

            setFormData(prev => ({ ...prev, [name]: file }));

            // Create preview
            const reader = new FileReader();
            reader.onload = (e) => {
                setImagePreview(e.target.result);
            };
            reader.readAsDataURL(file);

            // Clear error
            if (errors.profile_image) {
                setErrors(prev => ({
                    ...prev,
                    profile_image: ''
                }));
            }
            return;
        }

        // For IC number and phone, only allow digits
        if (name === 'ic_number') {
            const numericValue = value.replace(/[^0-9]/g, '');
            if (numericValue.length <= 12) {
                setFormData(prev => ({ ...prev, [name]: numericValue }));
            }
            return;
        }
        
        if (name === 'phone') {
            const numericValue = value.replace(/[^0-9]/g, '');
            if (numericValue.length <= 11 && (!numericValue || numericValue.startsWith('01'))) {
                setFormData(prev => ({ ...prev, [name]: numericValue }));
            }
            return;
        }

        setFormData(prev => ({ ...prev, [name]: value }));

        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordData(prev => ({ ...prev, [name]: value }));
        
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

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setLoading(true);
        setSuccess('');
        setErrors({});

        try {
            const data = new FormData();
            data.append('name', formData.name);
            data.append('email', formData.email);
            data.append('ic_number', formData.ic_number);
            data.append('phone', formData.phone);
            
            if (formData.profile_image) {
                data.append('profile_image', formData.profile_image);
            }

            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

            const response = await fetch('/profile/update', {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': csrfToken,
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'same-origin',
                body: data
            });

            const result = await response.json();

            if (response.ok) {
                setSuccess('Profile updated successfully!');
                setIsEditing(false);
                await fetchUserData(); // Refresh user data
            } else {
                if (result.errors) {
                    setErrors(result.errors);
                } else {
                    setErrors({ general: result.message || 'Failed to update profile' });
                }
            }
        } catch (error) {
            console.error('Update failed:', error);
            setErrors({ general: 'An error occurred while updating your profile' });
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        
        const newErrors = {};

        if (!passwordData.password) {
            newErrors.password = 'New password is required';
        } else if (passwordData.password.length < 8) {
            newErrors.password = 'Password must be at least 8 characters long';
        }

        if (!passwordData.password_confirmation) {
            newErrors.password_confirmation = 'Password confirmation is required';
        } else if (passwordData.password !== passwordData.password_confirmation) {
            newErrors.password_confirmation = 'Passwords do not match';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setPasswordLoading(true);
        setErrors({});

        try {
            const data = new FormData();
            data.append('name', formData.name);
            data.append('email', formData.email);
            data.append('password', passwordData.password);
            data.append('password_confirmation', passwordData.password_confirmation);

            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

            const response = await fetch('/profile/update', {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': csrfToken,
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'same-origin',
                body: data
            });

            const result = await response.json();

            if (response.ok) {
                setSuccess('Password updated successfully!');
                setPasswordData({ password: '', password_confirmation: '' });
            } else {
                if (result.errors) {
                    setErrors(result.errors);
                } else {
                    setErrors({ general: result.message || 'Failed to update password' });
                }
            }
        } catch (error) {
            console.error('Password update failed:', error);
            setErrors({ general: 'An error occurred while updating your password' });
        } finally {
            setPasswordLoading(false);
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        setErrors({});
        setSuccess('');
        // Reset form data to original values
        setFormData({
            name: user?.name || '',
            email: user?.email || '',
            ic_number: user?.ic_number || '',
            phone: user?.phone || '',
            profile_image: null
        });
        setImagePreview(user?.profile_image_url || null);
    };

    if (initialLoading) {
        return (
            <DashboardLayout user={user}>
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading profile...</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout user={user}>
            <div className="space-y-6">
                {/* Debug Information Panel */}
                {process.env.NODE_ENV === 'development' && (
                    <Card className="bg-yellow-50 border-yellow-200">
                        <CardHeader>
                            <CardTitle className="text-sm text-yellow-800">Debug Information</CardTitle>
                        </CardHeader>
                        <CardContent className="text-xs space-y-2 text-yellow-700">
                            <div><strong>Initial Loading:</strong> {initialLoading ? 'true' : 'false'}</div>
                            <div><strong>User object:</strong> {user ? JSON.stringify(user, null, 2) : 'null'}</div>
                            <div><strong>Form Data:</strong> {JSON.stringify(formData, null, 2)}</div>
                            <div><strong>Auth User (from context):</strong> {authUser ? JSON.stringify(authUser, null, 2) : 'null'}</div>
                            <div><strong>Image Preview:</strong> {imagePreview || 'none'}</div>
                        </CardContent>
                    </Card>
                )}
                
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
                        <p className="text-gray-600">Welcome back, {user?.name || 'User'}</p>
                    </div>
                    {/* Debug info - remove in production */}
                    {process.env.NODE_ENV === 'development' && (
                        <div className="text-xs text-gray-500">
                            <div>User: {user?.name}</div>
                            <div>FormData: {formData.name}</div>
                        </div>
                    )}
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
                                <p className="text-sm font-medium text-green-800">{success}</p>
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

                {/* Profile Information Card */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-xl font-semibold">Profile Information</CardTitle>
                                <CardDescription>Update your personal information and profile picture.</CardDescription>
                            </div>
                            {!isEditing && (
                                <Button
                                    onClick={() => setIsEditing(true)}
                                    variant="outline"
                                    className="flex items-center gap-2"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                    Edit
                                </Button>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleUpdateProfile} className="space-y-6">
                            {/* Profile Photo Section */}
                            <div className="flex flex-col items-center space-y-4 pb-6 border-b border-gray-200">
                                <div className="relative">
                                    <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 border-2 border-gray-300">
                                        {imagePreview ? (
                                            <img
                                                src={imagePreview}
                                                alt="Profile preview"
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-blue-500 to-purple-600">
                                                <span className="text-white font-medium text-xl">
                                                    {user?.name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'U'}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    {isEditing && imagePreview && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setImagePreview(null);
                                                setFormData(prev => ({ ...prev, profile_image: null }));
                                            }}
                                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
                                        >
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                                
                                {isEditing && (
                                    <div className="text-center">
                                        <Label htmlFor="profile_image" className="cursor-pointer">
                                            <span className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors">
                                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                                Choose File
                                            </span>
                                            <input
                                                id="profile_image"
                                                name="profile_image"
                                                type="file"
                                                accept="image/*"
                                                onChange={handleInputChange}
                                                className="sr-only"
                                            />
                                        </Label>
                                        <p className="text-xs text-gray-500 mt-1">
                                            PNG, JPG, GIF up to 2MB
                                        </p>
                                        {errors.profile_image && (
                                            <p className="mt-1 text-sm text-red-600">{errors.profile_image}</p>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                                {/* Full Name */}
                                <div>
                                    <Label htmlFor="name">Full Name</Label>
                                    <Input
                                        id="name"
                                        name="name"
                                        type="text"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        disabled={!isEditing}
                                        className={`${!isEditing ? 'bg-gray-50' : ''} ${errors.name ? 'border-red-500 focus:ring-red-500' : ''}`}
                                        placeholder="Enter your full name"
                                    />
                                    {errors.name && (
                                        <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                                    )}
                                </div>

                                {/* Email */}
                                <div>
                                    <Label htmlFor="email">Email Address</Label>
                                    <Input
                                        id="email"
                                        name="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        disabled={!isEditing}
                                        className={`${!isEditing ? 'bg-gray-50' : ''} ${errors.email ? 'border-red-500 focus:ring-red-500' : ''}`}
                                        placeholder="Enter your email"
                                    />
                                    {errors.email && (
                                        <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                                    )}
                                </div>

                                {/* IC Number */}
                                <div>
                                    <Label htmlFor="ic_number">IC Number</Label>
                                    <Input
                                        id="ic_number"
                                        name="ic_number"
                                        type="text"
                                        value={formData.ic_number}
                                        onChange={handleInputChange}
                                        disabled={!isEditing}
                                        className={`${!isEditing ? 'bg-gray-50' : ''} ${errors.ic_number ? 'border-red-500 focus:ring-red-500' : ''}`}
                                        placeholder="Enter IC number (12 digits)"
                                        maxLength={12}
                                    />
                                    <p className="text-xs text-gray-500 mt-1">12 digits only</p>
                                    {errors.ic_number && (
                                        <p className="mt-1 text-sm text-red-600">{errors.ic_number}</p>
                                    )}
                                </div>

                                {/* Phone Number */}
                                <div>
                                    <Label htmlFor="phone">Phone Number</Label>
                                    <Input
                                        id="phone"
                                        name="phone"
                                        type="text"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                        disabled={!isEditing}
                                        className={`${!isEditing ? 'bg-gray-50' : ''} ${errors.phone ? 'border-red-500 focus:ring-red-500' : ''}`}
                                        placeholder="Enter phone number (01XXXXXXXX)"
                                        maxLength={11}
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Must start with 01</p>
                                    {errors.phone && (
                                        <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                                    )}
                                </div>
                            </div>

                            {/* Form Actions */}
                            {isEditing && (
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
                                                Updating...
                                            </>
                                        ) : (
                                            'Update Profile'
                                        )}
                                    </Button>
                                </div>
                            )}
                        </form>
                    </CardContent>
                </Card>

                {/* Change Password Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-xl font-semibold">Change Password</CardTitle>
                        <CardDescription>Update your password to keep your account secure.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handlePasswordSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                                {/* New Password */}
                                <div>
                                    <Label htmlFor="password">New Password</Label>
                                    <Input
                                        id="password"
                                        name="password"
                                        type="password"
                                        value={passwordData.password}
                                        onChange={handlePasswordChange}
                                        className={errors.password ? 'border-red-500 focus:ring-red-500' : ''}
                                        placeholder="Enter new password"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Password must be at least 8 characters long</p>
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
                                        value={passwordData.password_confirmation}
                                        onChange={handlePasswordChange}
                                        className={errors.password_confirmation ? 'border-red-500 focus:ring-red-500' : ''}
                                        placeholder="Confirm new password"
                                    />
                                    {errors.password_confirmation && (
                                        <p className="mt-1 text-sm text-red-600">{errors.password_confirmation}</p>
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-end pt-6 border-t border-gray-200">
                                <Button 
                                    type="submit" 
                                    disabled={passwordLoading || !passwordData.password || !passwordData.password_confirmation}
                                    className="bg-blue-600 hover:bg-blue-700"
                                >
                                    {passwordLoading ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                            Updating Password...
                                        </>
                                    ) : (
                                        'Update Password'
                                    )}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {/* Account Information Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-xl font-semibold">Account Information</CardTitle>
                        <CardDescription>Your account details and role information.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                            <div>
                                <Label className="text-sm font-medium text-gray-700">Role</Label>
                                <div className="mt-2">
                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                        user?.role?.name === 'Admin' ? 'bg-red-100 text-red-800' :
                                        user?.role?.name === 'Bendahari' ? 'bg-green-100 text-green-800' :
                                        user?.role?.name === 'Setiausaha' ? 'bg-blue-100 text-blue-800' :
                                        user?.role?.name === 'Setiausaha Pengelola' ? 'bg-purple-100 text-purple-800' :
                                        user?.role?.name === 'AJK Cabang' ? 'bg-yellow-100 text-yellow-800' :
                                        user?.role?.name === 'AMK' ? 'bg-orange-100 text-orange-800' :
                                        user?.role?.name === 'Wanita' ? 'bg-pink-100 text-pink-800' :
                                        user?.role?.name === 'Anggota Biasa' ? 'bg-gray-100 text-gray-800' :
                                        'bg-gray-100 text-gray-800'
                                    }`}>
                                        {user?.role?.name || 'No role assigned'}
                                    </span>
                                </div>
                                {user?.role?.description && (
                                    <p className="text-xs text-gray-500 mt-2">{user.role.description}</p>
                                )}
                            </div>
                            <div>
                                <Label className="text-sm font-medium text-gray-700">Member Since</Label>
                                <div className="mt-2">
                                    <p className="text-sm text-gray-900 font-medium">
                                        {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        }) : 'Unknown'}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {user?.created_at ? `${Math.floor((new Date() - new Date(user.created_at)) / (1000 * 60 * 60 * 24))} days ago` : ''}
                                    </p>
                                </div>
                            </div>
                            <div>
                                <Label className="text-sm font-medium text-gray-700">Account Status</Label>
                                <div className="mt-2 flex items-center space-x-2">
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    <span className="text-sm text-gray-900 font-medium">Active</span>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">Account is in good standing</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
};

export default Profile;
