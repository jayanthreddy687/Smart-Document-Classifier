# Smart Document Classifier API Documentation

## Overview

This document provides detailed information about the RESTful API endpoints available in the Smart Document Classifier application. The API enables document upload, classification, and basic document management through a set of well-defined endpoints.

## Architecture

### System Components

1. **Frontend (React + TypeScript)**
   - Built with Vite
   - Uses React Query for data fetching
   - Implements responsive UI with Tailwind CSS
   - Communicates with backend via REST API

2. **Backend (Flask)**
   - RESTful API server
   - Handles file uploads and document processing
   - Integrates with external services (AWS S3, Hugging Face)
   - Manages database operations

3. **Database (PostgreSQL)**
   - Stores document metadata and classification results
   - Uses SQLAlchemy ORM for database operations
   - Supports both local and cloud deployments (e.g., Neon)

4. **External Services**
   - AWS S3: Document storage
   - Hugging Face: ML model inference
   - Vercel: Frontend deployment
   - Render: Backend deployment

### Data Flow

1. **Document Upload Flow**
   ```
   Client -> Frontend -> Backend API -> AWS S3
                                -> ML Classifier -> Hugging Face API
                                -> Database
   ```

2. **Document Retrieval Flow**
   ```
   Client -> Frontend -> Backend API -> Database
                                -> AWS S3 (for downloads)
   ```

### Database Schema

#### Documents Table
```sql
CREATE TABLE documents (
    id INTEGER PRIMARY KEY,
    filename VARCHAR NOT NULL,
    content TEXT,
    classification VARCHAR NOT NULL,
    confidence FLOAT NOT NULL,
    upload_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    s3_url VARCHAR NOT NULL
);
```

**Fields**:
- `id`: Unique identifier (auto-incrementing)
- `filename`: Original document filename
- `content`: Extracted text content (optional)
- `classification`: Document category
- `confidence`: Classification confidence score
- `upload_timestamp`: Document upload time
- `s3_url`: AWS S3 storage URL

### ML Pipeline

1. **Document Processing**
   - Supports multiple file formats (PDF, DOCX, TXT)
   - Text extraction and preprocessing
   - Chunking for large documents

2. **Classification**
   - Uses BART-large-MNLI model
   - Zero-shot classification approach
   - Confidence score calculation
   - Multi-category scoring

3. **Storage**
   - Documents stored in AWS S3
   - Metadata stored in PostgreSQL
   - Pre-signed URLs for secure access

## Table of Contents

- [Base URL and Authentication](#base-url-and-authentication)
- [API Endpoints](#api-endpoints)
  - [Document Categories](#document-categories)
  - [Document Upload and Classification](#document-upload-and-classification)
  - [Document Retrieval](#document-retrieval)
  - [Document Statistics](#document-statistics)
- [Error Handling](#error-handling)
- [Examples](#examples)

## Base URL and Authentication

### Base URL
```
http://localhost:5000
```

### Authentication
Currently, the API does not require authentication. However, it requires valid environment variables for:
- AWS S3 (for document storage)
- Hugging Face (for ML model inference)

## API Endpoints

### Document Categories

#### Get Available Categories
Retrieves the list of document categories supported by the classifier.

```
GET /categories/
```

**Response**
```json
{
  "categories": [
    "Technical Documentation",
    "Business Proposal",
    "Legal Document",
    "Academic Paper",
    "General Article",
    "Other"
  ]
}
```

**Status Codes**
- 200: Success
- 500: Server error

### Document Upload and Classification

#### Upload and Classify Document
Uploads a document and returns its classification results.

```
POST /upload/
```

**Request**
- Content-Type: multipart/form-data
- Body:
  - file: The document file (supported formats: .txt, .docx, .pdf)

**Response**
```json
{
  "id": 1,
  "filename": "example.pdf",
  "classification": "Technical Documentation",
  "confidence": 92.0,
  "upload_timestamp": "2023-04-21T12:34:56Z",
  "s3_url": "https://your-bucket.s3.amazonaws.com/documents/1234567890_example.pdf",
  "all_scores": {
    "Technical Documentation": 0.92,
    "Business Proposal": 0.05,
    "Legal Document": 0.01,
    "Academic Paper": 0.01,
    "General Article": 0.01,
    "Other": 0.00
  }
}
```

**Response Fields**
- `id`: Unique identifier for the document
- `filename`: Original filename
- `classification`: Predicted document category
- `confidence`: Classification confidence score (0-100)
- `upload_timestamp`: ISO format timestamp
- `s3_url`: URL to the document in S3 storage
- `all_scores`: Confidence scores for all possible categories

**Status Codes**
- 201: Success
- 400: Invalid file or file type
- 500: Server error

### Document Retrieval

#### List Documents
Retrieves a paginated list of uploaded and classified documents.

```
GET /documents/
```

**Query Parameters**
- page: Page number (default: 1)
- limit: Number of items per page (default: 10)

**Response**
```json
{
  "documents": [
    {
      "id": 1,
      "filename": "example.pdf",
      "classification": "Technical Documentation",
      "confidence": 92.0,
      "upload_timestamp": "2023-04-21T12:34:56.789Z",
      "s3_url": "https://your-bucket.s3.amazonaws.com/documents/1234567890_example.pdf"
    }
  ],
  "totalPages": 5
}
```

**Response Fields**
- `documents`: Array of document objects
  - `id`: Unique identifier
  - `filename`: Original filename
  - `classification`: Document category
  - `confidence`: Classification confidence (0-100)
  - `upload_timestamp`: ISO format timestamp
  - `s3_url`: URL to the document in S3 storage
- `totalPages`: Total number of pages available

**Status Codes**
- 200: Success
- 500: Server error

#### Get Document Download URL
Retrieves a pre-signed URL for downloading a specific document.

```
GET /documents/{document_id}/download
```

**Response**
```json
{
  "download_url": "https://your-bucket.s3.amazonaws.com/documents/1234567890_example.pdf?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=..."
}
```

**Status Codes**
- 200: Success
- 404: Document not found
- 500: Server error

### Document Statistics

#### Get Document Statistics
Retrieves statistics about uploaded documents. Currently returns individual document statistics, with plans to include aggregated statistics in future versions.

```
GET /documents/stats
```

**Current Response**
```json
{
  "status": "success",
  "data": [
    {
      "classification": "Technical Documentation",
      "confidence": 92.0,
      "upload_timestamp": "2023-04-21T12:34:56.789Z"
    },
    {
      "classification": "Legal Document",
      "confidence": 88.5,
      "upload_timestamp": "2023-04-21T13:45:67.123Z"
    }
  ]
}
```

**Response Fields**
- `classification`: The document category
- `confidence`: Classification confidence score (0-100)
- `upload_timestamp`: ISO format timestamp of document upload

**Status Codes**
- 200: Success
- 500: Server error

**Note**: Future versions will include aggregated statistics such as:
- Total documents per category
- Average confidence per category
- Upload trends over time
- Most common document types

## Error Handling

The application implements a comprehensive error handling system:

### Backend Error Handling
- Global error handler for consistent error responses
- Detailed error logging with timestamps and context
- Specific error types for different failure scenarios:
  - Document processing errors
  - File validation errors
  - Database errors
  - Authentication errors
  - System errors

### Frontend Error Handling
- User-friendly error messages
- Toast notifications for immediate feedback
- Network error handling
- File validation feedback
- Loading states and progress indicators

### API Error Response Format
```json
{
  "error": "Error message",
  "error_type": "ERROR_TYPE",
  "details": "Additional error details",
  "timestamp": "2024-02-14T12:00:00Z"
}
```

Common error types:
- `DOCUMENT_PROCESSING_ERROR`: Issues during document classification
- `FILE_VALIDATION_ERROR`: Invalid file type or size
- `DATABASE_ERROR`: Database operation failures
- `AUTHENTICATION_ERROR`: Authentication/authorization issues
- `SYSTEM_ERROR`: Unexpected system errors
- `RATE_LIMIT_ERROR`: Too many requests