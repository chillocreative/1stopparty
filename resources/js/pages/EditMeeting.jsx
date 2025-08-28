import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';

const EditMeeting = () => {
    const [user, setUser] = useState(null);
    const [meetingId, setMeetingId] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        category_id: '',
        date: '',
        time: '',
        minit_mesyuarat_file: null,
        penyata_kewangan_file: null,
        aktiviti_file: null
    });
    const [existingFiles, setExistingFiles] = useState({
        minit_mesyuarat_file: null,
        penyata_kewangan_file: null,
        aktiviti_file: null
    });
    const [filePreview, setFilePreview] = useState({
        minit_mesyuarat_file: null,
        penyata_kewangan_file: null,
        aktiviti_file: null
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});
    const [success, setSuccess] = useState('');
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        fetchUserData();
        fetchCategories();

        // Get meeting ID from URL
        const pathname = window.location.pathname;
        const match = pathname.match(/\/meetings\/edit\/(\d+)/);
        if (match) {
            const id = parseInt(match[1]);
            setMeetingId(id);
            fetchMeeting(id);
        }
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

    const fetchCategories = async () => {
        try {
            const response = await fetch('/api/meeting-categories', {
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                setCategories(data.data || []);
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const fetchMeeting = async (id) => {
        try {
            setLoading(true);
            const response = await fetch(`/api/meetings/${id}`, {
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'same-origin'
            });

            if (response.ok) {
                const data = await response.json();
                const meeting = data.data;

                setFormData({
                    title: meeting.title || '',
                    category_id: meeting.category_id || '',
                    date: meeting.date || '',
                    time: meeting.time || '',
                    minit_mesyuarat_file: null,
                    penyata_kewangan_file: null,
                    aktiviti_file: null
                });

                // Set existing files
                const existingFilesData = {};
                if (meeting.minit_mesyuarat_file_url) {
                    existingFilesData.minit_mesyuarat_file = {
                        url: meeting.minit_mesyuarat_file_url,
                        name: meeting.minit_mesyuarat_file ? meeting.minit_mesyuarat_file.split('/').pop() : 'Minit Mesyuarat'
                    };
                }
                if (meeting.penyata_kewangan_file_url) {
                    existingFilesData.penyata_kewangan_file = {
                        url: meeting.penyata_kewangan_file_url,
                        name: meeting.penyata_kewangan_file ? meeting.penyata_kewangan_file.split('/').pop() : 'Penyata Kewangan'
                    };
                }
                if (meeting.aktiviti_file_url) {
                    existingFilesData.aktiviti_file = {
                        url: meeting.aktiviti_file_url,
                        name: meeting.aktiviti_file ? meeting.aktiviti_file.split('/').pop() : 'Aktiviti'
                    };
                }
                setExistingFiles(existingFilesData);
            } else {
                throw new Error('Failed to fetch meeting');
            }
        } catch (error) {
            console.error('Error fetching meeting:', error);
            setErrors({ general: 'Failed to load meeting data' });
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, files } = e.target;

        // Handle file uploads for all three types
        if ((name === 'minit_mesyuarat_file' || name === 'penyata_kewangan_file' || name === 'aktiviti_file') && files && files[0]) {
            const file = files[0];

            // Validate file type (allow PDF, DOC, DOCX, and XLSX files)
            const allowedTypes = [
                'application/pdf',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'application/vnd.ms-excel'
            ];

            if (!allowedTypes.includes(file.type)) {
                setErrors(prev => ({
                    ...prev,
                    [name]: 'Please select a valid document file (PDF, DOC, DOCX, XLSX)'
                }));
                return;
            }

            // Validate file size (max 10MB)
            if (file.size > 10 * 1024 * 1024) {
                setErrors(prev => ({
                    ...prev,
                    [name]: 'File size must be less than 10MB'
                }));
                return;
            }

            setFormData(prev => ({ ...prev, [name]: file }));
            setFilePreview(prev => ({
                ...prev,
                [name]: {
                    name: file.name,
                    size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
                    type: file.type
                }
            }));

            // Clear error if file is valid
            if (errors[name]) {
                setErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors[name];
                    return newErrors;
                });
            }
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));

            // Clear error for this field
            if (errors[name]) {
                setErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors[name];
                    return newErrors;
                });
            }
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.title.trim()) {
            newErrors.title = 'Meeting title is required';
        }

        if (!formData.date) {
            newErrors.date = 'Meeting date is required';
        }

        if (!formData.time) {
            newErrors.time = 'Meeting time is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setSaving(true);
        setSuccess('');
        setErrors({});

        try {
            const submitData = new FormData();
            submitData.append('title', formData.title);
            submitData.append('category_id', formData.category_id);
            submitData.append('date', formData.date);
            submitData.append('time', formData.time);
            submitData.append('_method', 'PUT');

            if (formData.minit_mesyuarat_file) {
                submitData.append('minit_mesyuarat_file', formData.minit_mesyuarat_file);
            }
            if (formData.penyata_kewangan_file) {
                submitData.append('penyata_kewangan_file', formData.penyata_kewangan_file);
            }
            if (formData.aktiviti_file) {
                submitData.append('aktiviti_file', formData.aktiviti_file);
            }

            const response = await fetch(`/api/meetings/${meetingId}`, {
                method: 'POST', // Using POST with _method override for file uploads
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content'),
                },
                credentials: 'same-origin',
                body: submitData
            });

            if (response.ok) {
                const data = await response.json();
                setSuccess('Meeting updated successfully!');

                // Redirect to meetings list after a delay
                setTimeout(() => {
                    window.location.href = '/meetings';
                }, 2000);
            } else {
                const errorData = await response.json();
                if (errorData.errors) {
                    setErrors(errorData.errors);
                } else {
                    throw new Error(errorData.message || 'Failed to update meeting');
                }
            }
        } catch (error) {
            console.error('Error updating meeting:', error);
            setErrors({ general: 'Failed to update meeting. Please try again.' });
        } finally {
            setSaving(false);
        }
    };

    const removeNewFile = (fileType) => {
        setFormData(prev => ({ ...prev, [fileType]: null }));
        setFilePreview(prev => ({
            ...prev,
            [fileType]: null
        }));

        // Reset file input
        const fileInput = document.getElementById(fileType);
        if (fileInput) {
            fileInput.value = '';
        }
    };

    const handleViewExistingFile = (fileType) => {
        if (existingFiles[fileType]?.url) {
            window.open(existingFiles[fileType].url, '_blank');
        }
    };

    // Reusable file upload component for edit
    const FileUploadSection = ({ fileType, label, description }) => (
        <div className="space-y-2">
            {/* Existing File Display */}
            {existingFiles[fileType] && !filePreview[fileType] && (
                <div className="space-y-2">
                    <Label>Current {label}</Label>
                    <div className="border rounded-lg p-4 bg-gray-50">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <div>
                                    <p className="text-sm font-medium text-gray-900">{existingFiles[fileType].name}</p>
                                    <p className="text-xs text-gray-500">Current file</p>
                                </div>
                            </div>
                            <Button
                                type="button"
                                onClick={() => handleViewExistingFile(fileType)}
                                variant="outline"
                                size="sm"
                            >
                                View File
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* New File Upload */}
            <Label htmlFor={fileType}>
                {existingFiles[fileType] ? `Replace ${label}` : `Upload ${label}`}
            </Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                {filePreview[fileType] ? (
                    <div className="space-y-3">
                        <div className="flex items-center justify-center">
                            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-900">{filePreview[fileType].name}</p>
                            <p className="text-xs text-gray-500">{filePreview[fileType].size}</p>
                        </div>
                        <Button
                            type="button"
                            onClick={() => removeNewFile(fileType)}
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                        >
                            Remove New File
                        </Button>
                    </div>
                ) : (
                    <>
                        <div className="flex items-center justify-center mb-3">
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                        </div>
                        <div className="space-y-2">
                            <p className="text-sm text-gray-600">
                                <span className="font-medium">Click to upload</span> or drag and drop
                            </p>
                            <p className="text-xs text-gray-500">
                                PDF, DOC, DOCX, XLSX up to 10MB
                            </p>
                        </div>
                        <input
                            id={fileType}
                            name={fileType}
                            type="file"
                            onChange={handleInputChange}
                            accept=".pdf,.doc,.docx,.xlsx"
                            className="hidden"
                        />
                        <Button
                            type="button"
                            onClick={() => document.getElementById(fileType).click()}
                            variant="outline"
                            className="mt-3"
                        >
                            Choose New File
                        </Button>
                    </>
                )}
            </div>
            {errors[fileType] && (
                <p className="text-sm text-red-600">{errors[fileType]}</p>
            )}
            <p className="text-sm text-gray-500">
                {description}
            </p>
        </div>
    );

    if (loading) {
        return (
            <DashboardLayout user={user}>
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading meeting...</p>
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
                        <h1 className="text-2xl font-bold text-gray-900">Edit Meeting</h1>
                        <p className="text-gray-600">Update meeting information and upload new files</p>
                    </div>
                    <Button
                        onClick={() => window.location.href = '/meetings'}
                        variant="outline"
                    >
                        Back to Meetings
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
                                <p className="text-sm font-medium text-green-800">{success}</p>
                            </div>
                        </div>
                    </Card>
                )}

                {/* General Error Message */}
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

                {/* Edit Meeting Form */}
                <Card>
                    <CardHeader>
                        <CardTitle>Meeting Details</CardTitle>
                        <CardDescription>Update the meeting information below</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Meeting Title */}
                            <div className="space-y-2">
                                <Label htmlFor="title">Meeting Title *</Label>
                                <Input
                                    id="title"
                                    name="title"
                                    type="text"
                                    value={formData.title}
                                    onChange={handleInputChange}
                                    placeholder="Enter meeting title"
                                    className={errors.title ? 'border-red-500' : ''}
                                />
                                {errors.title && (
                                    <p className="text-sm text-red-600">{errors.title}</p>
                                )}
                            </div>

                            {/* Meeting Category */}
                            <div className="space-y-2">
                                <Label htmlFor="category_id">Meeting Category</Label>
                                <select
                                    id="category_id"
                                    name="category_id"
                                    value={formData.category_id}
                                    onChange={handleInputChange}
                                    className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${errors.category_id ? 'border-red-500' : ''}`}
                                >
                                    <option value="">Select a category</option>
                                    {categories.map((category) => (
                                        <option key={category.id} value={category.id}>
                                            {category.name}
                                        </option>
                                    ))}
                                </select>
                                {errors.category_id && (
                                    <p className="text-sm text-red-600">{errors.category_id}</p>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Meeting Date */}
                                <div className="space-y-2">
                                    <Label htmlFor="date">Meeting Date *</Label>
                                    <Input
                                        id="date"
                                        name="date"
                                        type="date"
                                        value={formData.date}
                                        onChange={handleInputChange}
                                        className={errors.date ? 'border-red-500' : ''}
                                    />
                                    {errors.date && (
                                        <p className="text-sm text-red-600">{errors.date}</p>
                                    )}
                                </div>

                                {/* Meeting Time */}
                                <div className="space-y-2">
                                    <Label htmlFor="time">Meeting Time *</Label>
                                    <Input
                                        id="time"
                                        name="time"
                                        type="time"
                                        value={formData.time}
                                        onChange={handleInputChange}
                                        className={errors.time ? 'border-red-500' : ''}
                                    />
                                    {errors.time && (
                                        <p className="text-sm text-red-600">{errors.time}</p>
                                    )}
                                </div>
                            </div>

                            {/* File Upload Sections */}
                            <FileUploadSection
                                fileType="minit_mesyuarat_file"
                                label="Minit Mesyuarat"
                                description="Upload the meeting minutes document (optional)"
                            />

                            <FileUploadSection
                                fileType="penyata_kewangan_file"
                                label="Penyata Kewangan"
                                description="Upload the financial statement document (optional)"
                            />

                            <FileUploadSection
                                fileType="aktiviti_file"
                                label="Aktiviti"
                                description="Upload the activity report document (optional)"
                            />

                            {/* Submit Button */}
                            <div className="flex items-center justify-end space-x-4">
                                <Button
                                    type="button"
                                    onClick={() => window.location.href = '/meetings'}
                                    variant="outline"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={saving}
                                    className="bg-blue-600 hover:bg-blue-700"
                                >
                                    {saving ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                            Updating Meeting...
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                            </svg>
                                            Update Meeting
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

export default EditMeeting;
