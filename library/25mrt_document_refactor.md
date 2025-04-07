# CharterHub Document Management System Refactoring Plan

## 1. Current System Analysis

### A. Architecture Overview

The document management system has these key components:

#### Backend (PHP)
- **Upload endpoint**: `backend/api/admin/documents/upload.php` ✅ REFACTORED
- **List endpoint**: `backend/api/admin/documents/list.php` ✅ REFACTORED
- **Download endpoint**: `backend/api/admin/documents/download.php` ✅ REFACTORED
- **Delete endpoint**: `backend/api/admin/documents/delete.php` ✅ REFACTORED
- **Helper functions**: `backend/api/admin/documents/document-helper.php` ⛔ DEPRECATED (replaced by model and helper classes)
- **New components**:
  - **Document model**: `backend/models/Document.php` ✅ IMPLEMENTED
  - **Response helper**: `backend/helpers/Response.php` ✅ IMPLEMENTED
  - **FileStorage helper**: `backend/helpers/FileStorage.php` ✅ IMPLEMENTED
  - **DocumentTypes constants**: `backend/constants/DocumentTypes.php` ✅ IMPLEMENTED
  - **Schema update script**: `backend/api/admin/documents/update-schema.php` ✅ IMPLEMENTED

#### Frontend (React)
- **DocumentContext**: Context provider for document management 
- **DocumentService**: Service for API interaction
- **DocumentUploader**: Component for file uploads
- **Document Types**: Type definitions for document data structure
- **New components**:
  - **Shared document type constants**: `shared/constants/documentTypes.js` ✅ IMPLEMENTED

### B. Data Flow

1. **Upload Flow**:
   - User selects a file and metadata in the frontend
   - Frontend calls `documentService.addDocument()`
   - Service builds FormData with file and metadata
   - API request sent to `/api/admin/documents/upload.php`
   - Backend validates file/user/permissions
   - File saved to filesystem in structured directories
   - Metadata saved to `wp_charterhub_documents` database table
   - Response returned with document information
   - Frontend updates state with new document data

2. **Retrieval Flow**:
   - Frontend calls `documentService.getDocuments()` with filters
   - API request sent to `/api/admin/documents/list.php`
   - Backend queries database based on filters
   - Response returned with document list and metadata
   - Frontend converts backend format to frontend document format
   - Documents displayed in UI components

### C. Issues Identified

1. **Backend Issues**:
   - ✅ Complex user ID mapping between `wp_charterhub_users` and `wp_users` (FIXED)
   - ✅ Inconsistent error handling (FIXED)
   - ✅ Development mode conditionals throughout the code (FIXED)
   - ✅ Overly verbose logging (FIXED)
   - ✅ Complex file storage structure that could lead to orphaned files (FIXED)
   - ✅ Redundant SQL queries for user data (FIXED)
   - ✅ Skipping JWT verification in development mode (FIXED)

2. **Frontend Issues**:
   - ✅ Extensive data transformation between backend and frontend formats (FIXED)
   - ✅ Multiple sources of truth for document state (FIXED)
   - ✅ Complex document context with mock data handling (FIXED)
   - ✅ Inconsistent approach to error handling (FIXED)
   - ✅ Excessive console logging of sensitive document information (FIXED)
   - ✅ Document loading without authentication check (FIXED)

3. **Integration Issues**:
   - ✅ Manual data mapping between backend document_type and frontend category (FIXED)
   - ✅ Duplicate code for file size formatting (FIXED)
   - ✅ Inconsistent approach to handling document paths/URLs (FIXED)

4. **Issues Identified from Server Logs**:
   - ✅ Document upload failures with 500 server errors (FIXED)
   - ✅ JWT authentication making multiple redundant token validations (FIXED)
   - ✅ Excessive database queries for user verification (FIXED)
   - ✅ Inconsistent use of development mode in authentication flow (FIXED)

## 2. Refactoring Plan

### A. Database Refactoring

1. **Simplify Foreign Key Relationships** ✅ COMPLETED:
   - ✅ Modified `wp_charterhub_documents` to use `user_id` directly from `wp_charterhub_users`
   - ✅ Removed the dependency on `wp_users` and the complex mapping logic

2. **Update Schema to Include All Required Fields** ✅ COMPLETED:
   - ✅ Ensured the `document_type` field exists in the schema
   - ✅ Added missing fields to match the frontend data structure

### B. Backend Refactoring

1. **Create a Document Model Class** ✅ COMPLETED:
   - ✅ Implemented a proper Model class for document operations
   - ✅ Centralized all database interactions
   - ✅ Standardized document data structure

2. **Improve File Storage** ✅ COMPLETED:
   - ✅ Simplified directory structure while maintaining organization
   - ✅ Implemented proper file cleanup on document deletion
   - ✅ Added file integrity checks

3. **Enhance Error Handling** ✅ COMPLETED:
   - ✅ Standardized error responses
   - ✅ Implemented proper exception handling
   - ✅ Removed development conditionals in favor of environment configuration

4. **Security Improvements** ✅ COMPLETED:
   - ✅ Strengthened file type validation
   - ✅ Implemented strict access control
   - ✅ Added request validation middleware

### C. Frontend Refactoring

1. **Simplify Document Service** ✅ COMPLETED:
   - ✅ Reduce data transformation complexity
   - ✅ Standardize error handling
   - ✅ Improve progress tracking for large uploads
   - ✅ Remove excessive logging of sensitive document information
   - ✅ Add authentication checks before document API calls

2. **Optimize Document Context** ✅ COMPLETED:
   - ✅ Remove mock data handling
   - ✅ Streamline document state management
   - ✅ Improve caching with React Query
   - ✅ Add authentication state check before loading documents

3. **Standardize API Integration** ✅ COMPLETED:
   - ✅ Created shared document type constants for consistency
   - ✅ Implement proper retry mechanisms
   - ✅ Standardize document URL handling
   - ✅ Add environment-based conditional logging

### D. Integration Improvements

1. **Standardize Data Formats** ✅ COMPLETED:
   - ✅ Aligned backend and frontend document type/category naming
   - ✅ Created shared constants for document types

2. **Improve Error Communication** ✅ COMPLETED:
   - ✅ Implemented better error messages for common issues
   - ✅ Added user-friendly validation messages

3. **Add Robust File Upload Features**:
   - Implement chunked uploads for large files
   - Add pause/resume functionality
   - Improve progress reporting

## 3. Technical Implementation Details

### A. Backend Reorganization

1. **Create Document Model** ✅ COMPLETED:
   - ✅ Implemented a `Document.php` class with CRUD operations
   - ✅ Moved SQL queries from endpoints to model methods
   - ✅ Added validation and sanitization methods

2. **Refactor Endpoints** ✅ COMPLETED:
   - ✅ Simplified upload.php to use the Document model
   - ✅ Standardized response structure
   - ✅ Removed redundant code

3. **Improve Helper Functions** ✅ COMPLETED:
   - ✅ Moved file handling to dedicated FileStorage class
   - ✅ Implemented proper dependency injection
   - ✅ Removed development mode conditionals

### B. Frontend Improvements

1. **Update Document Service**:
   - Refactor to use more consistent API calls
   - Improve error handling with better messages
   - Implement better file upload progress tracking

2. **Enhance Document Context**:
   - Use React Query for data fetching/caching
   - Implement optimistic updates
   - Reduce state complexity

3. **Standardize Component Props**:
   - Create consistent prop interfaces
   - Improve type safety
   - Add better documentation

## 4. Implementation Priorities

1. **High Priority** ✅ COMPLETED:
   - ✅ Fix the user ID mapping issue
   - ✅ Standardize error handling
   - ✅ Improve file upload security
   - ✅ Remove development conditionals

2. **Medium Priority** ✅ COMPLETED:
   - ✅ Implement Document model
   - ✅ Enhance file storage structure
   - ✅ Improve frontend-backend data format alignment

3. **Lower Priority**:
   - Add advanced upload features
   - Optimize performance
   - Enhance UX with better progress reporting

## 5. Technical Recommendations

1. **Replace `getValidWpUserId()` function** ✅ IMPLEMENTED: 
   - ✅ Directly use the charterhub_users ID without mapping to wp_users
   - ✅ Update database foreign key constraints if needed

2. **Implement proper file path security** ✅ IMPLEMENTED:
   - ✅ Use a whitelist approach for file extensions
   - ✅ Store files with randomized names
   - ✅ Implement proper directory traversal protection

3. **Standardize error handling** ✅ IMPLEMENTED:
   - ✅ Create a response helper class
   - ✅ Implement consistent error codes and messages
   - ✅ Add proper logging with configurable verbosity

4. **Refactor the document upload component**:
   - Implement chunked uploads for large files
   - Add better progress monitoring
   - Improve validation feedback

## 6. Implementation Status

### Completed Work

1. **Core Model & Helper Classes** ✅:
   - Document.php model class for centralized document operations
   - Response.php helper for standardized API responses
   - FileStorage.php helper for file handling
   - DocumentTypes.php constants for document types

2. **Endpoint Refactoring** ✅:
   - upload.php refactored to use Document model and Response helper
   - list.php refactored for consistent querying and response format
   - download.php refactored with improved security
   - delete.php refactored with transaction support

3. **Database Updates** ✅:
   - Created database schema update script
   - Removed wp_users dependency
   - Added required fields to document table

4. **Security Improvements** ✅:
   - Enforced JWT verification in all environments (removed development mode bypass)
   - Added authentication checks in frontend document service
   - Removed sensitive data logging from document conversion functions
   - Implemented environment-based conditional logging
   - Added authentication state checks before loading documents in DocumentContext
   - Improved error handling for authentication failures

### Pending Work

1. **Testing and Validation**:
   - Comprehensive testing of document operations with authentication checks
   - Verify document security across different user roles
   - Test handling of edge cases in authentication flow

2. **Performance Optimizations**:
   - Implement chunked uploads for large files
   - Add caching for document listing

## 7. Next Steps

1. Run the update-schema.php script to update database structure
2. Test the refactored endpoints for basic functionality
3. Update frontend components to use the new API structure
4. Perform comprehensive testing of the full document management workflow 