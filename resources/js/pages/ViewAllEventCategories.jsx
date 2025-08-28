import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';

const ViewAllEventCategories = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        color: '#3B82F6'
    });
    const [formLoading, setFormLoading] = useState(false);
    const [formErrors, setFormErrors] = useState({});

    // Fetch categories on component mount
    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/event-categories', {
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
                    throw new Error('Please log in to view event categories');
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            setCategories(data);
            setError(null);
        } catch (err) {
            console.error('Error fetching event categories:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            color: '#3B82F6'
        });
        setFormErrors({});
        setSelectedCategory(null);
    };

    const openCreateModal = () => {
        resetForm();
        setShowCreateModal(true);
    };

    const openEditModal = (category) => {
        setFormData({
            name: category.name,
            description: category.description || '',
            color: category.color
        });
        setFormErrors({});
        setSelectedCategory(category);
        setShowEditModal(true);
    };

    const closeModals = () => {
        setShowCreateModal(false);
        setShowEditModal(false);
        resetForm();
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Clear error for this field
        if (formErrors[name]) {
            setFormErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Category name is required';
        }

        if (!formData.color.match(/^#[0-9A-Fa-f]{6}$/)) {
            newErrors.color = 'Please enter a valid hex color code';
        }

        setFormErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleCreate = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setFormLoading(true);

        try {
            const response = await fetch('/api/event-categories', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify(formData),
            });

            const result = await response.json();

            if (!response.ok) {
                if (result.errors) {
                    setFormErrors(result.errors);
                } else {
                    throw new Error(result.error || `HTTP error! status: ${response.status}`);
                }
                return;
            }

            alert('Event category created successfully!');
            fetchCategories();
            closeModals();
        } catch (err) {
            console.error('Error creating category:', err);
            alert('Failed to create category: ' + err.message);
        } finally {
            setFormLoading(false);
        }
    };

    const handleEdit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setFormLoading(true);

        try {
            const response = await fetch(`/api/event-categories/${selectedCategory.id}`, {
                method: 'PUT',
                credentials: 'include',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify(formData),
            });

            const result = await response.json();

            if (!response.ok) {
                if (result.errors) {
                    setFormErrors(result.errors);
                } else {
                    throw new Error(result.error || `HTTP error! status: ${response.status}`);
                }
                return;
            }

            alert('Event category updated successfully!');
            fetchCategories();
            closeModals();
        } catch (err) {
            console.error('Error updating category:', err);
            alert('Failed to update category: ' + err.message);
        } finally {
            setFormLoading(false);
        }
    };

    const handleDelete = async (categoryId, categoryName) => {
        if (!confirm(`Are you sure you want to delete "${categoryName}"?\n\nNote: This action cannot be undone and may affect existing events.`)) {
            return;
        }

        try {
            const response = await fetch(`/api/event-categories/${categoryId}`, {
                method: 'DELETE',
                credentials: 'include',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || `HTTP error! status: ${response.status}`);
            }

            alert(result.message || 'Event category deleted successfully');
            fetchCategories();
        } catch (err) {
            console.error('Error deleting category:', err);
            alert('Failed to delete category: ' + err.message);
        }
    };

    const colorPresets = [
        '#3B82F6', // Blue
        '#10B981', // Green
        '#F59E0B', // Yellow
        '#EF4444', // Red
        '#8B5CF6', // Purple
        '#EC4899', // Pink
        '#06B6D4', // Cyan
        '#84CC16', // Lime
        '#F97316', // Orange
        '#6366F1', // Indigo
    ];

    if (loading) {
        return (
            <DashboardLayout title="Event Categories">
                <div className="flex items-center justify-center h-64">
                    <div className="text-lg text-gray-600">Loading event categories...</div>
                </div>
            </DashboardLayout>
        );
    }

    if (error) {
        return (
            <DashboardLayout title="Event Categories">
                <Card>
                    <CardContent className="p-6">
                        <div className="text-center text-red-600">
                            <p className="text-lg font-medium">Error loading event categories</p>
                            <p className="text-sm mt-2">{error}</p>
                            <Button
                                onClick={fetchCategories}
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

    const CategoryForm = ({ isEdit = false }) => (
        <form onSubmit={isEdit ? handleEdit : handleCreate} className="space-y-4">
            {/* Name */}
            <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Category Name *
                </label>
                <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${formErrors.name ? 'border-red-500' : 'border-gray-300'
                        }`}
                    placeholder="e.g. Program Cabang"
                />
                {formErrors.name && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.name}</p>
                )}
            </div>

            {/* Description */}
            <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                </label>
                <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Optional description for this category"
                />
                {formErrors.description && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.description}</p>
                )}
            </div>

            {/* Color */}
            <div>
                <label htmlFor="color" className="block text-sm font-medium text-gray-700 mb-1">
                    Color *
                </label>
                <div className="flex items-center space-x-2">
                    <input
                        type="color"
                        id="color"
                        name="color"
                        value={formData.color}
                        onChange={handleInputChange}
                        className="w-12 h-10 border border-gray-300 rounded-lg cursor-pointer"
                    />
                    <input
                        type="text"
                        value={formData.color}
                        onChange={handleInputChange}
                        name="color"
                        className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${formErrors.color ? 'border-red-500' : 'border-gray-300'
                            }`}
                        placeholder="#3B82F6"
                    />
                </div>

                {/* Color Presets */}
                <div className="mt-2">
                    <p className="text-xs text-gray-500 mb-2">Quick colors:</p>
                    <div className="flex flex-wrap gap-2">
                        {colorPresets.map((color) => (
                            <button
                                key={color}
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, color }))}
                                className={`w-6 h-6 rounded-full border-2 ${formData.color === color ? 'border-gray-800' : 'border-gray-300'
                                    }`}
                                style={{ backgroundColor: color }}
                                title={color}
                            />
                        ))}
                    </div>
                </div>

                {formErrors.color && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.color}</p>
                )}
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-4">
                <Button
                    type="button"
                    onClick={closeModals}
                    variant="outline"
                    disabled={formLoading}
                >
                    Cancel
                </Button>
                <Button
                    type="submit"
                    disabled={formLoading}
                    className="bg-green-600 hover:bg-green-700"
                >
                    {formLoading ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            {isEdit ? 'Updating...' : 'Creating...'}
                        </>
                    ) : (
                        isEdit ? 'Update Category' : 'Create Category'
                    )}
                </Button>
            </div>
        </form>
    );

    return (
        <DashboardLayout title="Event Categories">
            <div className="space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Event Categories</h2>
                        <p className="text-sm text-gray-600 mt-1">
                            Manage categories for organizing events
                        </p>
                    </div>
                    <Button
                        onClick={openCreateModal}
                        className="bg-green-600 hover:bg-green-700"
                    >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Add Category
                    </Button>
                </div>

                {/* Categories Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
                    {categories.length === 0 ? (
                        <Card className="col-span-full">
                            <CardContent className="p-12 text-center text-gray-500">
                                <svg className="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                </svg>
                                <p className="text-lg font-medium">No event categories found</p>
                                <p className="text-sm mt-1">Create your first event category to get started.</p>
                            </CardContent>
                        </Card>
                    ) : (
                        categories.map((category) => (
                            <Card key={category.id}>
                                <CardContent className="pt-8 pb-6 px-6">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center space-x-3">
                                            <div
                                                className="w-4 h-4 rounded-full flex-shrink-0"
                                                style={{ backgroundColor: category.color }}
                                            />
                                            <h3 className="font-medium text-gray-900">{category.name}</h3>
                                        </div>
                                    </div>

                                    {category.description && (
                                        <p className="text-sm text-gray-600 mb-4">{category.description}</p>
                                    )}

                                    <div className="flex items-center justify-between text-sm text-gray-500">
                                        <span>Color: {category.color}</span>
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={() => openEditModal(category)}
                                                className="text-blue-600 hover:text-blue-900 p-1 rounded"
                                                title="Edit category"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => handleDelete(category.id, category.name)}
                                                className="text-red-600 hover:text-red-900 p-1 rounded"
                                                title="Delete category"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-md shadow-lg rounded-md bg-white">
                        <div className="mt-3">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Event Category</h3>
                            <CategoryForm isEdit={false} />
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {showEditModal && selectedCategory && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-md shadow-lg rounded-md bg-white">
                        <div className="mt-3">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Event Category</h3>
                            <CategoryForm isEdit={true} />
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
};

export default ViewAllEventCategories;
