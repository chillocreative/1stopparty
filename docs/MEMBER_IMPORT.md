# Member Import Documentation

## Overview
The Member module includes functionality to import member data from CSV and Excel files.

## CSV Import
CSV import is supported out-of-the-box. The system can handle various column header formats.

### Supported Headers (case-insensitive):
- **Name**: name, full name, member name, nama
- **IC Number**: ic_no, ic, nric, ic number, no ic, identity card
- **Phone**: phone, phone number, mobile, telefon, no telefon
- **Email**: email, email address, e-mail, emel (optional field)

### CSV Format Example:
```csv
name,ic_no,phone,email
"John Doe","901234567890","0123456789","john.doe@example.com"
"Jane Smith","851234567891","0187654321","jane.smith@example.com"
"Ahmad bin Abdullah","751234567892","0156789012",""
```

## Excel Import
For Excel file support, you need to install the PhpSpreadsheet library:

```bash
composer require phpoffice/phpspreadsheet
```

After installation, the controller will automatically support .xlsx and .xls files.

## API Endpoint

### Import Members
- **Method**: POST
- **URL**: `/api/members/import`
- **Content-Type**: `multipart/form-data`

#### Parameters:
- `file` (required): CSV/XLS/XLSX file (max 5MB)
- `uploaded_by` (required): User ID who is performing the import

#### Response Format:
```json
{
  "success": true,
  "message": "Import completed successfully",
  "data": {
    "total_rows": 100,
    "successful": 95,
    "failed": 5,
    "errors": [
      {
        "row": 12,
        "errors": ["The ic no has already been taken."]
      }
    ],
    "created_members": ["John Doe", "Jane Smith", "..."]
  }
}
```

## Validation Rules
- **name**: required, string
- **ic_no**: required, string, unique in members table
- **phone**: required, string
- **email**: optional, must be valid email format if provided

## Error Handling
The import process validates each row individually. If a row fails validation:
- The error is logged with the row number
- Processing continues with the next row
- A detailed error report is returned

Common errors:
- Duplicate IC numbers
- Invalid email formats
- Missing required fields
- Malformed CSV structure

## File Size Limits
- Maximum file size: 5MB
- Recommended: Process files in smaller batches for better performance

## Template File
A sample CSV template is available at `storage/app/templates/members_import_template.csv`.