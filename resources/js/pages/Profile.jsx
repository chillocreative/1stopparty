import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import DashboardLayout from '../components/DashboardLayout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';

const Profile = () => {
    console.log('Profile component rendering');
    const { user: authUser, updateUserProfile } = useAuth();
    const [user, setUser] = useState(null);
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
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);

    // Fetch user data on component mount
    useEffect(() => {
        fetchUserData();
    }, []);

    const fetchUserData = async () => {
        try {
            setInitialLoading(true);
            const response = await fetch('/api/user', {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'same-origin'
            });
            if (response.ok) {
                const userData = await response.json();
                const userInfo = userData.data;
                setUser(userInfo);
                setFormData({
                    name: userInfo?.name || '',
                    email: userInfo?.email || '',
                    ic_number: userInfo?.ic_number || '',
                    phone: userInfo?.phone || '',
                    profile_image: null
                });
                setPreview(userInfo?.profile_image || null);
            } else {
                console.error('Failed to fetch user data:', response.status, response.statusText);
            }
        } catch (error) {
            console.error('Error fetching user data:', error);
        } finally {
            setInitialLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value, files } = e.target;
        if (name === 'profile_image' && files[0]) {
            setFormData(prev => ({ ...prev, [name]: files[0] }));
            setPreview(URL.createObjectURL(files[0]));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const data = new FormData();
            data.append('name', formData.name);
            data.append('email', formData.email);
            data.append('ic_number', formData.ic_number);
            data.append('phone', formData.phone);
            if (formData.profile_image) {
                data.append('profile_image', formData.profile_image);
            }

            // Get CSRF token
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

            if (response.ok) {
                const result = await response.json();
                alert('Profile updated successfully');
                // Refresh user data
                await fetchUserData();
            } else {
                const error = await response.json();
                throw new Error(error.message || 'Failed to update profile');
            }
        } catch (error) {
            console.error('Update failed:', error);
            alert('Failed to update profile: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        setPasswordLoading(true);

        // Validate password fields
        if (!passwordData.password) {
            alert('Please enter a new password');
            setPasswordLoading(false);
            return;
        }

        if (passwordData.password !== passwordData.password_confirmation) {
            alert('Passwords do not match');
            setPasswordLoading(false);
            return;
        }

        if (passwordData.password.length < 8) {
            alert('Password must be at least 8 characters long');
            setPasswordLoading(false);
            return;
        }

        try {
            const data = new FormData();
            data.append('name', formData.name);
            data.append('email', formData.email);
            data.append('password', passwordData.password);
            data.append('password_confirmation', passwordData.password_confirmation);

            // Get CSRF token
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

            if (response.ok) {
                const result = await response.json();
                alert('Password updated successfully');
                // Clear password fields
                setPasswordData({
                    password: '',
                    password_confirmation: ''
                });
            } else {
                const error = await response.json();
                throw new Error(error.message || 'Failed to update password');
            }
        } catch (error) {
            console.error('Password update failed:', error);
            alert('Failed to update password: ' + error.message);
        } finally {
            setPasswordLoading(false);
        }
    };

    if (initialLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading profile...</p>
                </div>
            </div>
        );
    }

    return (
        <DashboardLayout user={user}>
            <div className="space-y-6">
                <div>
                    <h3 className="text-2xl font-semibold text-gray-900">Profile Settings</h3>
                    <p className="text-gray-600">Manage your account settings and preferences.</p>
                </div>

                <div className="grid gap-6">
                    {/* Profile Information Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Profile Information</CardTitle>
                            <CardDescription>
                                Update your personal information and profile picture.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Profile Image */}
                                <div className="flex items-center space-x-6">
                                    <div className="shrink-0">
                                        {preview ? (
                                            <img
                                                className="h-20 w-20 object-cover rounded-full border-2 border-gray-200"
                                                src={preview}
                                                alt="Profile"
                                            />
                                        ) : (
                                            <div className="h-20 w-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center border-2 border-gray-200">
                                                <span className="text-white font-medium text-xl">
                                                    {user?.name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'U'}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <Label htmlFor="profile_image" className="block text-sm font-medium mb-2">
                                            Profile Photo
                                        </Label>
                                        <input
                                            id="profile_image"
                                            type="file"
                                            name="profile_image"
                                            onChange={handleChange}
                                            className="block w-full text-sm text-gray-500
                                                file:mr-4 file:py-2 file:px-4
                                                file:rounded-md file:border file:border-gray-300
                                                file:text-sm file:font-medium file:bg-gray-50
                                                file:text-gray-700 hover:file:bg-gray-100
                                                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            accept="image/*"
                                        />
                                        <p className="mt-1 text-xs text-gray-500">PNG, JPG, GIF up to 2MB</p>
                                    </div>
                                </div>

                                {/* Personal Information */}
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Full Name</Label>
                                        <Input
                                            id="name"
                                            name="name"
                                            type="text"
                                            value={formData.name}
                                            onChange={handleChange}
                                            placeholder="Enter your full name"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email Address</Label>
                                        <Input
                                            id="email"
                                            name="email"
                                            type="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            placeholder="Enter your email"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Additional Info */}
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="ic_number">IC Number</Label>
                                        <Input
                                            id="ic_number"
                                            name="ic_number"
                                            type="text"
                                            value={formData.ic_number}
                                            onChange={(e) => {
                                                const value = e.target.value.replace(/[^0-9]/g, '');
                                                if (value.length <= 12) {
                                                    handleChange({
                                                        target: { name: 'ic_number', value }
                                                    });
                                                }
                                            }}
                                            placeholder="Enter IC number (12 digits)"
                                            maxLength={12}
                                        />
                                        <p className="text-xs text-gray-500">12 digits only</p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="phone">Phone Number</Label>
                                        <Input
                                            id="phone"
                                            name="phone"
                                            type="text"
                                            value={formData.phone}
                                            onChange={(e) => {
                                                const value = e.target.value.replace(/[^0-9]/g, '');
                                                if (value.length <= 11 && (!value || value.startsWith('01'))) {
                                                    handleChange({
                                                        target: { name: 'phone', value }
                                                    });
                                                }
                                            }}
                                            placeholder="Enter phone number (01XXXXXXXX)"
                                            maxLength={11}
                                        />
                                        <p className="text-xs text-gray-500">Must start with 01</p>
                                    </div>
                                </div>

                                <div className="pt-4">
                                    <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                                        {loading ? 'Updating...' : 'Update Profile'}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Change Password Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Change Password</CardTitle>
                            <CardDescription>
                                Update your password to keep your account secure.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handlePasswordSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="password">New Password</Label>
                                    <Input
                                        id="password"
                                        name="password"
                                        type="password"
                                        value={passwordData.password}
                                        onChange={handlePasswordChange}
                                        placeholder="Enter new password"
                                        required
                                    />
                                    <p className="text-xs text-gray-500">Password must be at least 8 characters long</p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="password_confirmation">Confirm New Password</Label>
                                    <Input
                                        id="password_confirmation"
                                        name="password_confirmation"
                                        type="password"
                                        value={passwordData.password_confirmation}
                                        onChange={handlePasswordChange}
                                        placeholder="Confirm new password"
                                        required
                                    />
                                </div>

                                <div className="pt-4">
                                    <Button 
                                        type="submit" 
                                        disabled={passwordLoading || !passwordData.password || !passwordData.password_confirmation}
                                        className="w-full sm:w-auto"
                                    >
                                        {passwordLoading ? 'Changing Password...' : 'Change Password'}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Account Information Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Account Information</CardTitle>
                            <CardDescription>
                                Your account details and role information.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                <div className="space-y-2">
                                    <Label>Role</Label>
                                    <div className="flex items-center space-x-2">
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
                                        <p className="text-xs text-gray-500">{user.role.description}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label>Member Since</Label>
                                    <p className="text-sm text-gray-900 font-medium">
                                        {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        }) : 'Unknown'}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {user?.created_at ? `${Math.floor((new Date() - new Date(user.created_at)) / (1000 * 60 * 60 * 24))} days ago` : ''}
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <Label>Account Status</Label>
                                    <div className="flex items-center space-x-2">
                                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                        <span className="text-sm text-gray-900 font-medium">Active</span>
                                    </div>
                                    <p className="text-xs text-gray-500">Account is in good standing</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default Profile;
