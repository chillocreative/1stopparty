import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';

const ViewFinances = () => {
    const [finances, setFinances] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [expandedRow, setExpandedRow] = useState(null);

    useEffect(() => {
        fetchFinances();
    }, []);

    const fetchFinances = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/finances', {
                method: 'GET',
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

            const data = await response.json();
            setFinances(data.data || []);
            setError(null);
        } catch (err) {
            console.error('Error fetching finances:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('ms-MY', {
            style: 'currency',
            currency: 'MYR'
        }).format(amount);
    };

    const getMonthName = (month) => {
        const months = [
            'Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun',
            'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember'
        ];
        return months[month - 1] || '';
    };

    const handleEdit = (finance) => {
        setEditingId(finance.id);
        setEditForm({
            title: finance.title,
            wang_masuk: finance.wang_masuk,
            wang_keluar: finance.wang_keluar,
            baki: finance.baki
        });
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditForm({});
    };

    const handleSaveEdit = async (id) => {
        try {
            const response = await fetch(`/api/finances/${id}`, {
                method: 'PUT',
                credentials: 'include',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify(editForm)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            alert(result.message || 'Finance record updated successfully');
            setEditingId(null);
            setEditForm({});
            fetchFinances();
        } catch (err) {
            console.error('Error updating finance:', err);
            alert('Failed to update finance: ' + err.message);
        }
    };

    const handleDelete = async (id, title) => {
        if (!confirm(`Are you sure you want to delete the finance record for "${title}"?`)) {
            return;
        }

        try {
            const response = await fetch(`/api/finances/${id}`, {
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
            alert(result.message || 'Finance record deleted successfully');
            fetchFinances();
        } catch (err) {
            console.error('Error deleting finance:', err);
            alert('Failed to delete finance: ' + err.message);
        }
    };

    const handleViewFile = (fileUrl) => {
        if (fileUrl) {
            window.open(fileUrl, '_blank');
        } else {
            alert('No file available for this record');
        }
    };

    if (loading) {
        return (
            <DashboardLayout title="View Finances">
                <div className="flex items-center justify-center h-64">
                    <div className="text-lg text-gray-600">Loading finances...</div>
                </div>
            </DashboardLayout>
        );
    }

    if (error) {
        return (
            <DashboardLayout title="View Finances">
                <Card>
                    <CardContent className="p-6">
                        <div className="text-center text-red-600">
                            <p className="text-lg font-medium">Error loading finances</p>
                            <p className="text-sm mt-2">{error}</p>
                            <Button
                                onClick={fetchFinances}
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
        <DashboardLayout title="View Finances">
            <div className="space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Financial Records</h2>
                        <p className="text-sm text-gray-600 mt-1">
                            Total Records: {finances.length}
                        </p>
                    </div>
                    <Button
                        onClick={() => window.location.href = '/finances/upload'}
                        className="bg-green-600 hover:bg-green-700"
                    >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        Upload PDF
                    </Button>
                </div>

                {/* Finance Table */}
                <Card>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Bulan/Tahun
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Penyata Kewangan
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Jumlah Wang Masuk
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Jumlah Wang Keluar
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Baki
                                        </th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {finances.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                                                No financial records found. Upload your first PDF file!
                                            </td>
                                        </tr>
                                    ) : (
                                        finances.map((finance) => (
                                            <React.Fragment key={finance.id}>
                                                <tr className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {getMonthName(finance.month)} {finance.year}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {editingId === finance.id ? (
                                                            <input
                                                                type="text"
                                                                value={editForm.title}
                                                                onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                                                                className="w-full px-2 py-1 border rounded"
                                                            />
                                                        ) : (
                                                            <div className="text-sm text-gray-900 max-w-md truncate">
                                                                {finance.title}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                                        {editingId === finance.id ? (
                                                            <input
                                                                type="number"
                                                                value={editForm.wang_masuk}
                                                                onChange={(e) => {
                                                                    const value = parseFloat(e.target.value) || 0;
                                                                    setEditForm({
                                                                        ...editForm, 
                                                                        wang_masuk: value,
                                                                        baki: value - editForm.wang_keluar
                                                                    });
                                                                }}
                                                                className="w-32 px-2 py-1 border rounded text-right"
                                                                step="0.01"
                                                            />
                                                        ) : (
                                                            <div className="text-sm font-medium text-green-600">
                                                                {formatCurrency(finance.wang_masuk)}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                                        {editingId === finance.id ? (
                                                            <input
                                                                type="number"
                                                                value={editForm.wang_keluar}
                                                                onChange={(e) => {
                                                                    const value = parseFloat(e.target.value) || 0;
                                                                    setEditForm({
                                                                        ...editForm, 
                                                                        wang_keluar: value,
                                                                        baki: editForm.wang_masuk - value
                                                                    });
                                                                }}
                                                                className="w-32 px-2 py-1 border rounded text-right"
                                                                step="0.01"
                                                            />
                                                        ) : (
                                                            <div className="text-sm font-medium text-red-600">
                                                                {formatCurrency(finance.wang_keluar)}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                                        {editingId === finance.id ? (
                                                            <input
                                                                type="number"
                                                                value={editForm.baki}
                                                                onChange={(e) => setEditForm({...editForm, baki: parseFloat(e.target.value) || 0})}
                                                                className="w-32 px-2 py-1 border rounded text-right"
                                                                step="0.01"
                                                            />
                                                        ) : (
                                                            <div className={`text-sm font-bold ${finance.baki >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                                                                {formatCurrency(finance.baki)}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                                        {editingId === finance.id ? (
                                                            <div className="flex justify-center space-x-2">
                                                                <button
                                                                    onClick={() => handleSaveEdit(finance.id)}
                                                                    className="text-green-600 hover:text-green-900 p-2"
                                                                    title="Save"
                                                                >
                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                                                    </svg>
                                                                </button>
                                                                <button
                                                                    onClick={handleCancelEdit}
                                                                    className="text-gray-600 hover:text-gray-900 p-2"
                                                                    title="Cancel"
                                                                >
                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                                                    </svg>
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <div className="flex justify-center space-x-1">
                                                                <button
                                                                    onClick={() => handleViewFile(finance.file_url)}
                                                                    className="text-blue-600 hover:text-blue-900 p-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                                                                    title="View PDF"
                                                                >
                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 616 0z" />
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                                    </svg>
                                                                </button>
                                                                <button
                                                                    onClick={() => setExpandedRow(expandedRow === finance.id ? null : finance.id)}
                                                                    className="text-purple-600 hover:text-purple-900 p-1.5 rounded-lg hover:bg-purple-50 transition-colors"
                                                                    title="View Details"
                                                                >
                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                                                    </svg>
                                                                </button>
                                                                <button
                                                                    onClick={() => handleEdit(finance)}
                                                                    className="text-yellow-600 hover:text-yellow-900 p-1.5 rounded-lg hover:bg-yellow-50 transition-colors"
                                                                    title="Edit"
                                                                >
                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                                    </svg>
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDelete(finance.id, finance.title)}
                                                                    className="text-red-600 hover:text-red-900 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                                                                    title="Delete"
                                                                >
                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                    </svg>
                                                                </button>
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                                {expandedRow === finance.id && finance.details && (
                                                    <tr>
                                                        <td colSpan="6" className="px-6 py-4 bg-gray-50">
                                                            <div className="space-y-4">
                                                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                                                    {/* Income Items */}
                                                                    <div>
                                                                        <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                                                                            <svg className="w-4 h-4 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                                                            </svg>
                                                                            Wang Masuk/Peruntukan
                                                                        </h4>
                                                                        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                                                                            {finance.details.income_items && finance.details.income_items.length > 0 ? (
                                                                                <div className="divide-y divide-gray-100">
                                                                                    {finance.details.income_items.map((item, idx) => (
                                                                                        <div key={idx} className="p-3 hover:bg-green-50">
                                                                                            <div className="flex justify-between items-start">
                                                                                                <div className="flex-1">
                                                                                                    <p className="text-xs text-gray-500 mb-1">{item.date}</p>
                                                                                                    <p className="text-sm text-gray-900">{item.description}</p>
                                                                                                </div>
                                                                                                <span className="text-sm font-medium text-green-600 ml-4">
                                                                                                    {formatCurrency(item.amount)}
                                                                                                </span>
                                                                                            </div>
                                                                                        </div>
                                                                                    ))}
                                                                                </div>
                                                                            ) : (
                                                                                <p className="p-3 text-sm text-gray-500">No detailed income items available</p>
                                                                            )}
                                                                        </div>
                                                                    </div>

                                                                    {/* Expense Items */}
                                                                    <div>
                                                                        <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                                                                            <svg className="w-4 h-4 mr-2 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 12H6" />
                                                                            </svg>
                                                                            Wang Keluar/Perbelanjaan
                                                                        </h4>
                                                                        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                                                                            {finance.details.expense_items && finance.details.expense_items.length > 0 ? (
                                                                                <div className="divide-y divide-gray-100">
                                                                                    {finance.details.expense_items.map((item, idx) => (
                                                                                        <div key={idx} className="p-3 hover:bg-red-50">
                                                                                            <div className="flex justify-between items-start">
                                                                                                <div className="flex-1">
                                                                                                    <p className="text-xs text-gray-500 mb-1">{item.date}</p>
                                                                                                    <p className="text-sm text-gray-900">{item.description}</p>
                                                                                                </div>
                                                                                                <span className="text-sm font-medium text-red-600 ml-4">
                                                                                                    {formatCurrency(item.amount)}
                                                                                                </span>
                                                                                            </div>
                                                                                        </div>
                                                                                    ))}
                                                                                </div>
                                                                            ) : (
                                                                                <p className="p-3 text-sm text-gray-500">No detailed expense items available</p>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {/* Summary */}
                                                                {finance.details.summary && (
                                                                    <div className="mt-4 pt-4 border-t">
                                                                        <h4 className="text-sm font-medium text-gray-900 mb-3">Summary</h4>
                                                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                                            <div className="text-center p-3 bg-white rounded-lg border">
                                                                                <p className="text-xs text-gray-500">Baki Di Tangan</p>
                                                                                <p className="text-sm font-medium text-blue-600">
                                                                                    {formatCurrency(finance.details.summary.baki_di_tangan || 0)}
                                                                                </p>
                                                                            </div>
                                                                            <div className="text-center p-3 bg-white rounded-lg border">
                                                                                <p className="text-xs text-gray-500">Baki Di Bank</p>
                                                                                <p className="text-sm font-medium text-blue-600">
                                                                                    {formatCurrency(finance.details.summary.baki_di_bank || 0)}
                                                                                </p>
                                                                            </div>
                                                                            <div className="text-center p-3 bg-white rounded-lg border">
                                                                                <p className="text-xs text-gray-500">Jumlah Baki</p>
                                                                                <p className="text-sm font-medium text-blue-600">
                                                                                    {formatCurrency(finance.details.summary.jumlah_baki || finance.baki)}
                                                                                </p>
                                                                            </div>
                                                                            <div className="text-center p-3 bg-white rounded-lg border">
                                                                                <p className="text-xs text-gray-500">Net Result</p>
                                                                                <p className={`text-sm font-bold ${(finance.wang_masuk - finance.wang_keluar) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                                                    {formatCurrency(finance.wang_masuk - finance.wang_keluar)}
                                                                                </p>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
};

export default ViewFinances;