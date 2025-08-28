import React, { useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { Label } from '../components/ui/Label';
import { Input } from '../components/ui/Input';

const UploadFinanceFiles = () => {
    const [file, setFile] = useState(null);
    const [month, setMonth] = useState('');
    const [year, setYear] = useState(new Date().getFullYear());
    const [uploading, setUploading] = useState(false);
    const [preview, setPreview] = useState(null);
    const [error, setError] = useState('');

    const months = [
        { value: 1, label: 'Januari' },
        { value: 2, label: 'Februari' },
        { value: 3, label: 'Mac' },
        { value: 4, label: 'April' },
        { value: 5, label: 'Mei' },
        { value: 6, label: 'Jun' },
        { value: 7, label: 'Julai' },
        { value: 8, label: 'Ogos' },
        { value: 9, label: 'September' },
        { value: 10, label: 'Oktober' },
        { value: 11, label: 'November' },
        { value: 12, label: 'Disember' }
    ];

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 10 }, (_, i) => currentYear - i);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            if (selectedFile.type !== 'application/pdf') {
                setError('Please select a PDF file only');
                setFile(null);
                return;
            }
            if (selectedFile.size > 10 * 1024 * 1024) { // 10MB limit
                setError('File size must be less than 10MB');
                setFile(null);
                return;
            }
            setFile(selectedFile);
            setError('');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!file || !month || !year) {
            setError('Please fill in all fields');
            return;
        }

        setUploading(true);
        setError('');

        const formData = new FormData();
        formData.append('file', file);
        formData.append('month', month);
        formData.append('year', year);

        try {
            const response = await fetch('/api/finances/upload-pdf', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: formData
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || `HTTP error! status: ${response.status}`);
            }

            // Show preview of extracted data
            setPreview(data.data);
            alert('PDF uploaded and processed successfully!');
            
            // Reset form after successful upload
            setTimeout(() => {
                setFile(null);
                setMonth('');
                setYear(new Date().getFullYear());
                setPreview(null);
                // Reset file input
                const fileInput = document.getElementById('pdf-file');
                if (fileInput) fileInput.value = '';
            }, 3000);
            
        } catch (err) {
            console.error('Error uploading PDF:', err);
            setError(err.message || 'Failed to upload PDF');
        } finally {
            setUploading(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('ms-MY', {
            style: 'currency',
            currency: 'MYR'
        }).format(amount);
    };

    return (
        <DashboardLayout title="Upload Finance Files">
            <div className="space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Upload Financial Statement</h2>
                        <p className="text-sm text-gray-600 mt-1">
                            Upload PDF financial statements to extract and store data
                        </p>
                    </div>
                    <Button
                        onClick={() => window.location.href = '/finances'}
                        variant="outline"
                    >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Back to Finances
                    </Button>
                </div>

                {/* Upload Form */}
                <Card>
                    <CardContent className="p-6">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Month and Year Selection */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <Label htmlFor="month" className="text-sm font-medium text-gray-700 mb-2">
                                        Month <span className="text-red-500">*</span>
                                    </Label>
                                    <select
                                        id="month"
                                        value={month}
                                        onChange={(e) => setMonth(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        required
                                    >
                                        <option value="">Select Month</option>
                                        {months.map(m => (
                                            <option key={m.value} value={m.value}>
                                                {m.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <Label htmlFor="year" className="text-sm font-medium text-gray-700 mb-2">
                                        Year <span className="text-red-500">*</span>
                                    </Label>
                                    <select
                                        id="year"
                                        value={year}
                                        onChange={(e) => setYear(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        required
                                    >
                                        {years.map(y => (
                                            <option key={y} value={y}>
                                                {y}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Title Preview */}
                            {month && year && (
                                <div className="bg-blue-50 p-4 rounded-md">
                                    <p className="text-sm font-medium text-blue-900">
                                        Title Preview:
                                    </p>
                                    <p className="text-sm text-blue-800 mt-1">
                                        PENYATA KEWANGAN KEADILAN CABANG KEPALA BATAS BULAN {months.find(m => m.value == month)?.label.toUpperCase()} {year}
                                    </p>
                                </div>
                            )}

                            {/* File Upload */}
                            <div>
                                <Label htmlFor="pdf-file" className="text-sm font-medium text-gray-700 mb-2">
                                    PDF File <span className="text-red-500">*</span>
                                </Label>
                                <div className="mt-2">
                                    <div className="flex items-center justify-center w-full">
                                        <label htmlFor="pdf-file" className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                                            {file ? (
                                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                    <svg className="w-10 h-10 mb-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    <p className="mb-2 text-sm text-gray-700">
                                                        <span className="font-semibold">{file.name}</span>
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {(file.size / 1024 / 1024).toFixed(2)} MB
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                    <svg className="w-10 h-10 mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                                    </svg>
                                                    <p className="mb-2 text-sm text-gray-500">
                                                        <span className="font-semibold">Click to upload</span> or drag and drop
                                                    </p>
                                                    <p className="text-xs text-gray-500">PDF files only (MAX. 10MB)</p>
                                                </div>
                                            )}
                                            <input
                                                id="pdf-file"
                                                type="file"
                                                accept=".pdf,application/pdf"
                                                onChange={handleFileChange}
                                                className="hidden"
                                                required
                                            />
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {/* Error Message */}
                            {error && (
                                <div className="bg-red-50 p-4 rounded-md">
                                    <p className="text-sm text-red-800">{error}</p>
                                </div>
                            )}

                            {/* Submit Button */}
                            <div className="flex justify-end">
                                <Button
                                    type="submit"
                                    disabled={uploading || !file || !month || !year}
                                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
                                >
                                    {uploading ? (
                                        <>
                                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Processing PDF...
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                            </svg>
                                            Upload and Process PDF
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>

                        {/* Preview of Extracted Data */}
                        {preview && (
                            <div className="mt-8 pt-8 border-t">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Extracted Data Preview</h3>
                                <div className="bg-gray-50 p-6 rounded-lg">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <p className="text-sm text-gray-600">Title:</p>
                                            <p className="text-sm font-medium text-gray-900 mt-1">{preview.title}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600">Period:</p>
                                            <p className="text-sm font-medium text-gray-900 mt-1">
                                                {months.find(m => m.value == preview.month)?.label} {preview.year}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600">Jumlah Wang Masuk:</p>
                                            <p className="text-lg font-bold text-green-600 mt-1">
                                                {formatCurrency(preview.wang_masuk)}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600">Jumlah Wang Keluar:</p>
                                            <p className="text-lg font-bold text-red-600 mt-1">
                                                {formatCurrency(preview.wang_keluar)}
                                            </p>
                                        </div>
                                        <div className="md:col-span-2">
                                            <p className="text-sm text-gray-600">Baki:</p>
                                            <p className={`text-xl font-bold mt-1 ${preview.baki >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                                                {formatCurrency(preview.baki)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Instructions */}
                <Card>
                    <CardContent className="p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            <svg className="w-5 h-5 inline mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Instructions
                        </h3>
                        <ul className="space-y-2 text-sm text-gray-600">
                            <li className="flex items-start">
                                <span className="text-blue-600 mr-2">•</span>
                                <span>Select the month and year for the financial statement you're uploading</span>
                            </li>
                            <li className="flex items-start">
                                <span className="text-blue-600 mr-2">•</span>
                                <span>Upload only PDF format files with a maximum size of 10MB</span>
                            </li>
                            <li className="flex items-start">
                                <span className="text-blue-600 mr-2">•</span>
                                <span>The system will automatically extract "JUMLAH KESELURUHAN" for Wang Masuk and Wang Keluar</span>
                            </li>
                            <li className="flex items-start">
                                <span className="text-blue-600 mr-2">•</span>
                                <span>The title will be generated as: PENYATA KEWANGAN KEADILAN CABANG KEPALA BATAS BULAN [MONTH] [YEAR]</span>
                            </li>
                            <li className="flex items-start">
                                <span className="text-blue-600 mr-2">•</span>
                                <span>Baki (balance) will be calculated automatically as: Wang Masuk - Wang Keluar</span>
                            </li>
                            <li className="flex items-start">
                                <span className="text-blue-600 mr-2">•</span>
                                <span>You can only upload one financial statement per month/year combination</span>
                            </li>
                        </ul>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
};

export default UploadFinanceFiles;