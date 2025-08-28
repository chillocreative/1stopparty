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
    const [editableData, setEditableData] = useState(null);
    const [saving, setSaving] = useState(false);
    const [step, setStep] = useState(1); // 1: Upload, 2: Preview/Edit, 3: Success
    const [originalFileData, setOriginalFileData] = useState(null); // Store original file for saving

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
    // Create years from 2030 down to current year minus 10 years
    const maxYear = Math.max(2030, currentYear);
    const minYear = currentYear - 10;
    const years = Array.from({ length: maxYear - minYear + 1 }, (_, i) => maxYear - i);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            const allowedTypes = [
                'application/pdf',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
                'application/vnd.ms-excel' // .xls
            ];
            
            if (!allowedTypes.includes(selectedFile.type)) {
                setError('Please select a PDF, XLSX, or XLS file only');
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
            
            // Store file data for later saving
            const reader = new FileReader();
            reader.onload = function(e) {
                const base64Data = e.target.result.split(',')[1]; // Remove data:type;base64, prefix
                setOriginalFileData({
                    data: base64Data,
                    name: selectedFile.name,
                    type: selectedFile.type
                });
            };
            reader.readAsDataURL(selectedFile);
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
            const response = await fetch('/api/finances/parse-file', {
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

            // Set editable data and move to preview step
            setEditableData({
                title: data.data.title,
                month: parseInt(month),
                year: parseInt(year),
                wang_masuk: data.data.wang_masuk,
                wang_keluar: data.data.wang_keluar,
                baki: data.data.baki,
                details: data.data.details
            });
            setStep(2);
            
        } catch (err) {
            console.error('Error parsing file:', err);
            setError(err.message || 'Failed to parse file');
        } finally {
            setUploading(false);
        }
    };

    const handleSaveData = async () => {
        if (!editableData) {
            setError('No data to save');
            return;
        }

        setSaving(true);
        setError('');

        try {
            // Include original file data for saving
            const dataToSave = {
                ...editableData,
                file_data: originalFileData?.data || null,
                file_name: originalFileData?.name || null,
                file_type: originalFileData?.type || null
            };

            const response = await fetch('/api/finances/save-data', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify(dataToSave)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || `HTTP error! status: ${response.status}`);
            }

            setStep(3);
            alert('Finance data saved successfully!');
            
        } catch (err) {
            console.error('Error saving data:', err);
            setError(err.message || 'Failed to save data');
        } finally {
            setSaving(false);
        }
    };

    const handleReset = () => {
        setFile(null);
        setMonth('');
        setYear(new Date().getFullYear());
        setEditableData(null);
        setPreview(null);
        setError('');
        setStep(1);
        setOriginalFileData(null);
        // Reset file input
        const fileInput = document.getElementById('pdf-file');
        if (fileInput) fileInput.value = '';
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

                {/* Upload Form - Step 1 */}
                {step === 1 && (
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
                                                    <p className="text-xs text-gray-500">PDF, XLSX, or XLS files only (MAX. 10MB)</p>
                                                </div>
                                            )}
                                            <input
                                                id="pdf-file"
                                                type="file"
                                                accept=".pdf,.xlsx,.xls,application/pdf,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
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
                                            Parse File
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                        </CardContent>
                    </Card>
                )}

                {/* Step 2: Preview and Edit Extracted Data */}
                {step === 2 && editableData && (
                    <Card>
                        <CardContent className="p-6">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-lg font-semibold text-gray-900">Review and Edit Financial Data</h3>
                                    <Button
                                        onClick={handleReset}
                                        variant="outline"
                                        size="sm"
                                    >
                                        Start Over
                                    </Button>
                                </div>
                                
                                <div className="space-y-6">
                                    {/* Title Field */}
                                    <div>
                                        <Label htmlFor="edit-title" className="text-sm font-medium text-gray-700 mb-2">
                                            Title
                                        </Label>
                                        <Input
                                            id="edit-title"
                                            value={editableData.title}
                                            onChange={(e) => setEditableData(prev => ({ ...prev, title: e.target.value }))}
                                            className="w-full"
                                        />
                                    </div>

                                    {/* Financial Values */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div>
                                            <Label htmlFor="edit-wang-masuk" className="text-sm font-medium text-gray-700 mb-2">
                                                Wang Masuk (RM)
                                            </Label>
                                            <Input
                                                id="edit-wang-masuk"
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={editableData.wang_masuk}
                                                onChange={(e) => {
                                                    const wangMasuk = parseFloat(e.target.value) || 0;
                                                    setEditableData(prev => ({
                                                        ...prev,
                                                        wang_masuk: wangMasuk,
                                                        baki: wangMasuk - prev.wang_keluar
                                                    }));
                                                }}
                                                className="w-full"
                                            />
                                        </div>

                                        <div>
                                            <Label htmlFor="edit-wang-keluar" className="text-sm font-medium text-gray-700 mb-2">
                                                Wang Keluar (RM)
                                            </Label>
                                            <Input
                                                id="edit-wang-keluar"
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={editableData.wang_keluar}
                                                onChange={(e) => {
                                                    const wangKeluar = parseFloat(e.target.value) || 0;
                                                    setEditableData(prev => ({
                                                        ...prev,
                                                        wang_keluar: wangKeluar,
                                                        baki: prev.wang_masuk - wangKeluar
                                                    }));
                                                }}
                                                className="w-full"
                                            />
                                        </div>

                                        <div>
                                            <Label htmlFor="edit-baki" className="text-sm font-medium text-gray-700 mb-2">
                                                Baki (RM)
                                            </Label>
                                            <Input
                                                id="edit-baki"
                                                type="number"
                                                step="0.01"
                                                value={editableData.baki}
                                                onChange={(e) => setEditableData(prev => ({ ...prev, baki: parseFloat(e.target.value) || 0 }))}
                                                className="w-full"
                                            />
                                        </div>
                                    </div>

                                    {/* Summary Display */}
                                    <div className="bg-blue-50 p-6 rounded-lg">
                                        <h4 className="font-semibold text-blue-900 mb-4">Financial Summary</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div className="text-center">
                                                <p className="text-sm text-blue-700">Wang Masuk</p>
                                                <p className="text-xl font-bold text-green-600">
                                                    {formatCurrency(editableData.wang_masuk)}
                                                </p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-sm text-blue-700">Wang Keluar</p>
                                                <p className="text-xl font-bold text-red-600">
                                                    {formatCurrency(editableData.wang_keluar)}
                                                </p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-sm text-blue-700">Baki</p>
                                                <p className={`text-2xl font-bold ${editableData.baki >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                                                    {formatCurrency(editableData.baki)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex justify-end space-x-4">
                                        <Button
                                            onClick={() => setStep(1)}
                                            variant="outline"
                                        >
                                            Back to Upload
                                        </Button>
                                        <Button
                                            onClick={handleSaveData}
                                            disabled={saving}
                                            className="bg-green-600 hover:bg-green-700"
                                        >
                                            {saving ? (
                                                <>
                                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    Saving...
                                                </>
                                            ) : (
                                                <>
                                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                                    </svg>
                                                    Save to Finances
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                        </CardContent>
                    </Card>
                )}

                {/* Step 3: Success Message */}
                {step === 3 && (
                    <Card>
                        <CardContent className="p-6">
                                <div className="bg-green-50 p-6 rounded-lg text-center">
                                    <svg className="w-16 h-16 mx-auto text-green-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <h3 className="text-lg font-semibold text-green-900 mb-2">Success!</h3>
                                    <p className="text-green-800 mb-6">Your financial data has been saved successfully and is now available in View Finances.</p>
                                    <div className="space-x-4">
                                        <Button
                                            onClick={handleReset}
                                            variant="outline"
                                            className="border-green-300 text-green-700 hover:bg-green-100"
                                        >
                                            Upload Another File
                                        </Button>
                                        <Button
                                            onClick={() => window.location.href = '/finances'}
                                            className="bg-green-600 hover:bg-green-700"
                                        >
                                            View Finances
                                        </Button>
                                    </div>
                                </div>
                        </CardContent>
                    </Card>
                )}

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
                                <span>Upload PDF, XLSX, or XLS files with a maximum size of 10MB</span>
                            </li>
                            <li className="flex items-start">
                                <span className="text-blue-600 mr-2">•</span>
                                <span>The system will parse the file and extract Wang Masuk, Wang Keluar, and Baki</span>
                            </li>
                            <li className="flex items-start">
                                <span className="text-blue-600 mr-2">•</span>
                                <span>Review and edit the extracted values before saving to ensure accuracy</span>
                            </li>
                            <li className="flex items-start">
                                <span className="text-blue-600 mr-2">•</span>
                                <span>The title will be auto-generated as: PENYATA KEWANGAN KEADILAN CABANG KEPALA BATAS BULAN [MONTH] [YEAR]</span>
                            </li>
                            <li className="flex items-start">
                                <span className="text-blue-600 mr-2">•</span>
                                <span>Baki will be automatically calculated based on Wang Masuk - Wang Keluar</span>
                            </li>
                            <li className="flex items-start">
                                <span className="text-blue-600 mr-2">•</span>
                                <span>Click "Save to Finances" only after verifying all values are correct</span>
                            </li>
                        </ul>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
};

export default UploadFinanceFiles;