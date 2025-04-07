# CharterHub Document Management System - Updated Refactoring Plan

## Issues Identified from Logs

Based on the server logs, I've identified these specific issues:

1. **Document Upload Failures**:
   - 500 server errors are occurring during document uploads
   - Log shows attempts to upload are failing with errors
   - Development mode is being used inconsistently for authentication

2. **JWT Authentication Handling**:
   - Multiple token validations happen for the same request
   - Excessive database queries for token validation
   - Redundant user data fetching in authentication flow

3. **User ID Mapping Issues**:
   - Complex mapping between `wp_charterhub_users` and `wp_users` as suspected
   - Multiple queries for user information are inefficient 

## Completed Work

1. **Created Core Backend Components**:
   - Created Document model class for centralized document operations
   - Implemented Response helper for standardized API responses
   - Created FileStorage class for improved file handling
   - Added DocumentTypes constants for consistency

## Next Steps (Refined)

### 1. First Endpoint to Refactor: upload.php

This is the most critical endpoint with the most issues. Let's refactor it first:

```php
<?php
/**
 * Document Upload Endpoint (Refactored)
 * 
 * Uses the Document model and standardized responses
 */

// Include necessary files
require_once __DIR__ . '/../../../auth/global-cors.php';
require_once __DIR__ . '/../../../models/Document.php';
require_once __DIR__ . '/../../../helpers/Response.php';
require_once __DIR__ . '/../../../constants/DocumentTypes.php';
require_once __DIR__ . '/../../../db-config.php';

// Define CHARTERHUB_LOADED for global CORS
define('CHARTERHUB_LOADED', true);

// Apply CORS for the endpoint
apply_global_cors(['POST', 'OPTIONS']);

// Handle preflight request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

// Check request method
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::methodNotAllowed();
}

try {
    // Verify JWT token and get user info
    $userPayload = get_authenticated_user(true, ['admin']);
    if (!$userPayload) {
        Response::authError('Unauthorized access');
    }

    // Validate inputs
    $userId = isset($_POST['user_id']) ? intval($_POST['user_id']) : 0;
    if (!$userId) {
        Response::validationError(['user_id' => 'User ID is required']);
    }

    $documentType = isset($_POST['document_type']) ? $_POST['document_type'] : null;
    if (!$documentType || !DocumentTypes::isValid($documentType)) {
        $validTypesStr = implode(', ', DocumentTypes::getAllTypes());
        Response::validationError([
            'document_type' => 'Valid document type is required. Allowed types: ' . $validTypesStr
        ]);
    }

    // Check if file was uploaded
    if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
        $errorMessage = 'No file uploaded';
        if (isset($_FILES['file'])) {
            switch ($_FILES['file']['error']) {
                case UPLOAD_ERR_INI_SIZE:
                case UPLOAD_ERR_FORM_SIZE:
                    $errorMessage = 'File is too large';
                    break;
                case UPLOAD_ERR_PARTIAL:
                    $errorMessage = 'File was only partially uploaded';
                    break;
                case UPLOAD_ERR_NO_FILE:
                    $errorMessage = 'No file was uploaded';
                    break;
                default:
                    $errorMessage = 'Unknown upload error: ' . $_FILES['file']['error'];
                    break;
            }
        }
        Response::validationError(['file' => $errorMessage]);
    }

    // Get optional parameters
    $notes = isset($_POST['notes']) ? $_POST['notes'] : '';
    $bookingId = isset($_POST['booking_id']) ? intval($_POST['booking_id']) : null;

    // Get database connection
    $pdo = get_db_connection_from_config();
    
    // Get user information for the uploaded_by field
    $stmt = $pdo->prepare("SELECT first_name, last_name FROM wp_charterhub_users WHERE id = ?");
    $stmt->execute([$userId]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$user) {
        Response::notFound('User not found');
    }
    
    $uploaderName = $user['first_name'] . ' ' . $user['last_name'];

    // Create and populate document model
    $document = new Document($pdo);
    $document->fromArray([
        'document_type' => $documentType,
        'notes' => $notes,
        'booking_id' => $bookingId,
        'uploaded_by' => $uploaderName,
        'user_id' => $userId,
        'visibility' => 'private'
    ]);

    // Process file upload
    $filePath = $document->handleFileUpload($_FILES['file']);
    if (!$filePath) {
        Response::serverError('Failed to upload file');
    }

    // Save document to database
    if (!$document->save()) {
        Response::serverError('Failed to save document to database');
    }

    // Return success response
    Response::success(
        $document->toArray(),
        201,
        'Document uploaded successfully'
    );

} catch (Exception $e) {
    Response::serverError('Error uploading document', $e);
}
```

### 2. Second Endpoint to Refactor: list.php

Next, we'll refactor the list endpoint:

```php
<?php
/**
 * Document List Endpoint (Refactored)
 * 
 * Uses the Document model and standardized responses
 */

// Include necessary files
require_once __DIR__ . '/../../../auth/global-cors.php';
require_once __DIR__ . '/../../../models/Document.php';
require_once __DIR__ . '/../../../helpers/Response.php';
require_once __DIR__ . '/../../../constants/DocumentTypes.php';
require_once __DIR__ . '/../../../db-config.php';

// Define CHARTERHUB_LOADED for global CORS
define('CHARTERHUB_LOADED', true);

// Apply CORS for the endpoint
apply_global_cors(['GET', 'OPTIONS']);

// Handle preflight request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

// Check request method
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    Response::methodNotAllowed();
}

try {
    // Verify JWT token and get user info
    $userPayload = get_authenticated_user(true, ['admin']);
    if (!$userPayload) {
        Response::authError('Unauthorized access');
    }

    // Get filter parameters
    $userId = isset($_GET['user_id']) ? intval($_GET['user_id']) : null;
    $bookingId = isset($_GET['booking_id']) ? intval($_GET['booking_id']) : null;
    $documentType = isset($_GET['document_type']) ? $_GET['document_type'] : null;
    $page = isset($_GET['page']) ? intval($_GET['page']) : 1;
    $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 20;
    
    // Validate limit (max 100)
    if ($limit > 100) {
        $limit = 100;
    }
    
    // Calculate offset
    $offset = ($page - 1) * $limit;
    
    // Prepare criteria for filtering
    $criteria = [];
    if ($userId) {
        $criteria['user_id'] = $userId;
    }
    if ($bookingId) {
        $criteria['booking_id'] = $bookingId;
    }
    if ($documentType && DocumentTypes::isValid($documentType)) {
        $criteria['document_type'] = $documentType;
    }
    
    // Get database connection
    $pdo = get_db_connection_from_config();
    
    // Create document model
    $document = new Document($pdo);
    
    // Get documents based on criteria
    $result = $document->findByCriteria($criteria, $limit, $offset);
    
    // Format results for response
    $documents = [];
    foreach ($result['documents'] as $doc) {
        $documents[] = $doc->toArray();
    }
    
    // Send success response
    Response::success([
        'documents' => $documents,
        'pagination' => $result['pagination']
    ]);
    
} catch (Exception $e) {
    Response::serverError('Error retrieving documents', $e);
}
```

### 3. Third Endpoint to Refactor: download.php

```php
<?php
/**
 * Document Download Endpoint (Refactored)
 * 
 * Uses the Document model and standardized responses
 */

// Include necessary files
require_once __DIR__ . '/../../../auth/global-cors.php';
require_once __DIR__ . '/../../../models/Document.php';
require_once __DIR__ . '/../../../helpers/Response.php';
require_once __DIR__ . '/../../../db-config.php';

// Define CHARTERHUB_LOADED for global CORS
define('CHARTERHUB_LOADED', true);

// Apply CORS for the endpoint
apply_global_cors(['GET', 'OPTIONS']);

// Handle preflight request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

// Check request method
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    Response::methodNotAllowed();
}

try {
    // Verify JWT token and get user info
    $userPayload = get_authenticated_user(true, ['admin']);
    if (!$userPayload) {
        Response::authError('Unauthorized access');
    }

    // Get document ID
    $documentId = isset($_GET['id']) ? intval($_GET['id']) : 0;
    if (!$documentId) {
        Response::validationError(['id' => 'Document ID is required']);
    }
    
    // Get database connection
    $pdo = get_db_connection_from_config();
    
    // Create document model and find document
    $document = new Document($pdo);
    $document = $document->findById($documentId);
    
    if (!$document) {
        Response::notFound('Document not found');
    }
    
    // Get document data
    $documentData = $document->toArray(false);
    
    // Get file path
    $filePath = __DIR__ . '/../../../../' . $documentData['file_path'];
    
    // Check if file exists
    if (!file_exists($filePath)) {
        Response::notFound('Document file not found');
    }
    
    // Set appropriate headers for download
    header('Content-Type: ' . $documentData['file_type']);
    header('Content-Disposition: inline; filename="' . $documentData['title'] . '"');
    header('Content-Length: ' . filesize($filePath));
    header('Cache-Control: private, max-age=0, must-revalidate');
    header('Pragma: public');
    
    // Clear output buffer
    ob_clean();
    flush();
    
    // Output file and exit
    readfile($filePath);
    exit;
    
} catch (Exception $e) {
    Response::serverError('Error downloading document', $e);
}
```

### 4. Fourth Endpoint to Refactor: delete.php

```php
<?php
/**
 * Document Delete Endpoint (Refactored)
 * 
 * Uses the Document model and standardized responses
 */

// Include necessary files
require_once __DIR__ . '/../../../auth/global-cors.php';
require_once __DIR__ . '/../../../models/Document.php';
require_once __DIR__ . '/../../../helpers/Response.php';
require_once __DIR__ . '/../../../db-config.php';

// Define CHARTERHUB_LOADED for global CORS
define('CHARTERHUB_LOADED', true);

// Apply CORS for the endpoint
apply_global_cors(['POST', 'DELETE', 'OPTIONS']);

// Handle preflight request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

// Check request method
if ($_SERVER['REQUEST_METHOD'] !== 'POST' && $_SERVER['REQUEST_METHOD'] !== 'DELETE') {
    Response::methodNotAllowed();
}

try {
    // Verify JWT token and get user info
    $userPayload = get_authenticated_user(true, ['admin']);
    if (!$userPayload) {
        Response::authError('Unauthorized access');
    }

    // Get document ID from post or JSON body
    $documentId = 0;
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $documentId = isset($_POST['document_id']) ? intval($_POST['document_id']) : 0;
    } else {
        // For DELETE method, try to parse JSON body
        $json = file_get_contents('php://input');
        $data = json_decode($json, true);
        $documentId = isset($data['document_id']) ? intval($data['document_id']) : 0;
    }
    
    if (!$documentId) {
        Response::validationError(['document_id' => 'Document ID is required']);
    }
    
    // Get database connection
    $pdo = get_db_connection_from_config();
    
    // Create document model and find document
    $document = new Document($pdo);
    $document = $document->findById($documentId);
    
    if (!$document) {
        Response::notFound('Document not found');
    }
    
    // Delete document
    if (!$document->delete()) {
        Response::serverError('Failed to delete document');
    }
    
    // Return success response
    Response::success([], 200, 'Document deleted successfully');
    
} catch (Exception $e) {
    Response::serverError('Error deleting document', $e);
}
```

### 5. Database Update

We should modify the database to remove foreign key constraints that require wp_users. This will eliminate the need for the complex user ID mapping logic.

```sql
ALTER TABLE wp_charterhub_documents
DROP FOREIGN KEY wp_charterhub_documents_ibfk_1;

ALTER TABLE wp_charterhub_documents
ADD CONSTRAINT wp_charterhub_documents_ibfk_1
FOREIGN KEY (user_id) REFERENCES wp_charterhub_users(id)
ON DELETE CASCADE;

-- Ensure all required columns exist
ALTER TABLE wp_charterhub_documents
ADD COLUMN IF NOT EXISTS document_type VARCHAR(50) NOT NULL DEFAULT 'other',
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS booking_id INT NULL,
ADD COLUMN IF NOT EXISTS uploaded_by VARCHAR(255);
```

### 6. Prioritized Implementation Plan

1. **Immediate Action**: Refactor upload.php endpoint
2. **Second Priority**: Update database schema to remove wp_users dependency
3. **Third Priority**: Refactor list.php endpoint
4. **Fourth Priority**: Refactor download.php endpoint
5. **Fifth Priority**: Refactor delete.php endpoint
6. **Last Phase**: Frontend integration with the new API structure

## Testing Strategy

1. **Unit Testing**:
   - Test each refactored endpoint independently
   - Verify database operations are working correctly
   - Validate error handling and edge cases

2. **Integration Testing**:
   - Test full document lifecycle (upload, list, download, delete)
   - Test with various document types and sizes
   - Test error conditions and recovery

3. **Performance Testing**:
   - Measure improvement in query performance
   - Check for reduced database calls
   - Verify large file upload handling 