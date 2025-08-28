import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Label } from '../components/ui/Label';

const MembersUpload = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  
  // Upload processing states
  const [uploadStep, setUploadStep] = useState('select'); // select, processing, preview, importing, completed
  const [processedData, setProcessedData] = useState(null);
  const [duplicates, setDuplicates] = useState([]);
  const [excludedRows, setExcludedRows] = useState([]);
  const [uploadError, setUploadError] = useState(null);
  const [importResults, setImportResults] = useState(null);
  const [selectedDuplicates, setSelectedDuplicates] = useState([]);

  useEffect(() => {
    fetchUserData();
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
        }
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setUploadError(null);
    }
  };

  // Process uploaded file
  const processUpload = async () => {
    if (!file) return;

    setUploadStep('processing');
    setUploadError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/members/process-upload', {
        method: 'POST',
        body: formData,
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
        credentials: 'same-origin'
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'File processing failed');
      }

      if (result.success) {
        setProcessedData(result.data);
        setDuplicates(result.data.duplicates || []);
        setUploadStep('preview');
      } else {
        throw new Error(result.message || 'Processing failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError(error.message);
      setUploadStep('select');
    }
  };

  // Toggle row exclusion for duplicates
  const toggleRowExclusion = (rowNumber) => {
    setExcludedRows(prev => {
      if (prev.includes(rowNumber)) {
        return prev.filter(row => row !== rowNumber);
      } else {
        return [...prev, rowNumber];
      }
    });
  };

  // Bulk selection handlers for duplicates
  const handleSelectAllDuplicates = (checked) => {
    if (checked) {
      const allDuplicateRows = duplicates.map(duplicate => duplicate.row);
      setSelectedDuplicates(allDuplicateRows);
    } else {
      setSelectedDuplicates([]);
    }
  };

  const handleSelectDuplicate = (rowNumber) => {
    setSelectedDuplicates(prev => {
      if (prev.includes(rowNumber)) {
        return prev.filter(row => row !== rowNumber);
      } else {
        return [...prev, rowNumber];
      }
    });
  };

  const handleBulkExcludeDuplicates = () => {
    setExcludedRows(prev => {
      const newExcluded = [...prev];
      selectedDuplicates.forEach(rowNumber => {
        if (!newExcluded.includes(rowNumber)) {
          newExcluded.push(rowNumber);
        }
      });
      return newExcluded;
    });
    setSelectedDuplicates([]); // Clear selection after excluding
  };

  const handleExcludeAllDuplicates = () => {
    const allDuplicateRows = duplicates.map(duplicate => duplicate.row);
    setExcludedRows(prev => {
      const newExcluded = [...prev];
      allDuplicateRows.forEach(rowNumber => {
        if (!newExcluded.includes(rowNumber)) {
          newExcluded.push(rowNumber);
        }
      });
      return newExcluded;
    });
  };

  // Import members after duplicate resolution
  const importMembers = async () => {
    if (!processedData) return;

    setUploadStep('importing');
    setUploadError(null);

    try {
      const response = await fetch('/api/members/import-members', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
        body: JSON.stringify({
          members_data: processedData.all_data,
          filename: processedData.filename,
          excluded_rows: excludedRows
        }),
        credentials: 'same-origin'
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Import failed');
      }

      if (result.success) {
        setImportResults(result.data);
        setUploadStep('completed');
      } else {
        throw new Error(result.message || 'Import failed');
      }
    } catch (error) {
      console.error('Import error:', error);
      setUploadError(error.message);
      setUploadStep('preview');
    }
  };

  // Reset upload process
  const resetUpload = () => {
    setFile(null);
    setUploadStep('select');
    setProcessedData(null);
    setDuplicates([]);
    setExcludedRows([]);
    setUploadError(null);
    setImportResults(null);
    setSelectedDuplicates([]);
  };

  if (loading) {
    return (
      <DashboardLayout user={user} currentPath="upload-file">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout user={user} currentPath="upload-file">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Upload File</h1>
        </div>

        {/* Upload Area */}
        <Card className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Upload Members File</h3>
          
          <div
            className={`relative border-2 border-dashed rounded-lg p-12 text-center hover:border-gray-400 transition-colors ${
              dragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={handleFileChange}
              accept=".csv,.xlsx,.xls"
            />
            
            <div className="space-y-4">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100">
                <svg className="h-6 w-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              
              <div>
                <p className="text-lg font-medium text-gray-900">
                  Drop files here or click to upload
                </p>
                <p className="text-sm text-gray-500">
                  Supports CSV, Excel files (Max 10MB)
                </p>
              </div>
              
              {file && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <div className="flex items-center">
                    <svg className="h-5 w-5 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="text-sm font-medium text-blue-900">{file.name}</span>
                    <button
                      onClick={() => setFile(null)}
                      className="ml-auto text-blue-500 hover:text-blue-700"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Process File Button - Outside the drag area */}
          {file && (
            <div className="mt-6 flex justify-center">
              <Button 
                onClick={processUpload} 
                disabled={!file || uploadStep === 'processing'}
                className="px-8 py-2"
              >
                {uploadStep === 'processing' ? 'Processing...' : 'Process File'}
              </Button>
            </div>
          )}
        </Card>

        {/* Error Message */}
        {uploadError && (
          <Card className="p-6 border-red-200 bg-red-50">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-red-800 font-medium">Error: {uploadError}</span>
            </div>
          </Card>
        )}

        {/* File Preview & Duplicates */}
        {uploadStep === 'preview' && processedData && (
          <>
            <Card className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">File Analysis Results</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{processedData.total_records}</div>
                  <div className="text-sm text-gray-600">Total Records</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{processedData.valid_records}</div>
                  <div className="text-sm text-gray-600">Valid Records</div>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">{processedData.duplicates_count}</div>
                  <div className="text-sm text-gray-600">Duplicates Found</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{excludedRows.length}</div>
                  <div className="text-sm text-gray-600">Excluded</div>
                </div>
              </div>
            </Card>

            {/* Duplicates Handling */}
            {duplicates.length > 0 && (
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Duplicate Entries ({duplicates.length})
                  </h3>
                  <button
                    onClick={handleExcludeAllDuplicates}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Exclude All
                  </button>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  The following records have duplicates based on Name, IC Number, or Phone Number. 
                  Select which rows to exclude from import:
                </p>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {duplicates.map((duplicate, index) => (
                    <div key={index} className="border rounded-lg p-4 border-gray-200">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">Row {duplicate.row}</div>
                          <div className="text-sm text-gray-600 mt-1">
                            <div><strong>Name:</strong> {duplicate.data.name}</div>
                            <div><strong>IC:</strong> {duplicate.data.ic_no}</div>
                            <div><strong>Phone:</strong> {duplicate.data.phone}</div>
                          </div>
                          {duplicate.database_duplicates.length > 0 && (
                            <div className="mt-2 text-sm text-red-600">
                              <strong>Database matches:</strong> {duplicate.database_duplicates.length}
                            </div>
                          )}
                          {duplicate.import_duplicates.length > 0 && (
                            <div className="mt-1 text-sm text-orange-600">
                              <strong>Import file matches:</strong> {duplicate.import_duplicates.length}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center space-x-3">
                          {/* Individual exclude checkbox */}
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={excludedRows.includes(duplicate.row)}
                              onChange={() => toggleRowExclusion(duplicate.row)}
                              className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded mr-2"
                            />
                            <span className="text-sm text-gray-600">Exclude</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Sample Data Preview */}
            <Card className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Sample Data Preview</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IC Number</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {processedData.sample_data.map((member, index) => (
                      <tr key={index}>
                        <td className="px-4 py-2 text-sm text-gray-900">{member.name}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{member.ic_no}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{member.phone}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{member.email || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Import Actions */}
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Ready to Import</h3>
                  <p className="text-sm text-gray-600">
                    {processedData.valid_records - excludedRows.length} records will be imported
                  </p>
                </div>
                <div className="flex space-x-4">
                  <Button variant="outline" onClick={resetUpload}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={importMembers}
                    disabled={processedData.valid_records - excludedRows.length === 0}
                  >
                    Import Members
                  </Button>
                </div>
              </div>
            </Card>
          </>
        )}

        {/* Import Progress */}
        {uploadStep === 'importing' && (
          <Card className="p-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Importing Members</h3>
              <p className="text-sm text-gray-600">Please wait while we process your data...</p>
            </div>
          </Card>
        )}

        {/* Import Results */}
        {uploadStep === 'completed' && importResults && (
          <>
            <Card className="p-6 border-green-200 bg-green-50">
              <div className="flex items-center mb-4">
                <svg className="h-6 w-6 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-lg font-medium text-green-800">Import Completed!</h3>
              </div>
              
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-white p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{importResults.successful}</div>
                  <div className="text-sm text-gray-600">Successfully Imported</div>
                </div>
                <div className="bg-white p-4 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{importResults.failed}</div>
                  <div className="text-sm text-gray-600">Failed</div>
                </div>
                <div className="bg-white p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{importResults.total_processed}</div>
                  <div className="text-sm text-gray-600">Total Processed</div>
                </div>
              </div>

              {importResults.errors && importResults.errors.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-medium text-red-800 mb-2">Import Errors:</h4>
                  <div className="bg-white rounded-lg p-3 max-h-32 overflow-y-auto">
                    {importResults.errors.map((error, index) => (
                      <div key={index} className="text-sm text-red-700 mb-1">
                        Row {error.row}: {error.error}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex space-x-4">
                <Button onClick={resetUpload}>
                  Upload Another File
                </Button>
                <Button variant="outline" onClick={() => window.location.href = '/members/view-all'}>
                  View All Members
                </Button>
              </div>
            </Card>
          </>
        )}

        {/* Instructions - only show on initial step */}
        {uploadStep === 'select' && (
          <Card className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Upload Instructions</h3>
            <div className="prose max-w-none">
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start">
                  <span className="flex-shrink-0 w-5 h-5 text-blue-500 mr-2 mt-0.5">•</span>
                  <span>Supported file formats: CSV, Excel (.xlsx, .xls)</span>
                </li>
                <li className="flex items-start">
                  <span className="flex-shrink-0 w-5 h-5 text-blue-500 mr-2 mt-0.5">•</span>
                  <span>Maximum file size: 10MB</span>
                </li>
                <li className="flex items-start">
                  <span className="flex-shrink-0 w-5 h-5 text-blue-500 mr-2 mt-0.5">•</span>
                  <span>Required columns: Name, IC Number, Phone (supports both English and Malay headers)</span>
                </li>
                <li className="flex items-start">
                  <span className="flex-shrink-0 w-5 h-5 text-blue-500 mr-2 mt-0.5">•</span>
                  <span>System will automatically detect and flag duplicate entries</span>
                </li>
                <li className="flex items-start">
                  <span className="flex-shrink-0 w-5 h-5 text-blue-500 mr-2 mt-0.5">•</span>
                  <span>Duplicates are detected by matching Name, IC Number, or Phone Number</span>
                </li>
              </ul>
            </div>
          </Card>
        )}

        {/* Template Download - only show on initial step */}
        {uploadStep === 'select' && (
          <Card className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Supported Column Headers</h3>
            <p className="text-sm text-gray-600 mb-4">
              The system supports both English and Malay column headers. Here are the recognized formats:
            </p>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">English Headers</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Name, Full Name, Member Name</li>
                  <li>• IC, NRIC, IC Number, Identity Card</li>
                  <li>• Phone, Mobile, Phone Number</li>
                  <li>• Email, Email Address</li>
                  <li>• Address, Home Address</li>
                  <li>• City, Town</li>
                  <li>• State, Postcode</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Malay Headers</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Nama</li>
                  <li>• Kad Pengenalan, No IC</li>
                  <li>• Telefon, No Telefon</li>
                  <li>• Emel</li>
                  <li>• Alamat</li>
                  <li>• Bandar</li>
                  <li>• Negeri, Poskod</li>
                </ul>
              </div>
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default MembersUpload;