# Smart Document Classifier

A modern web application for Smart document classification.

## Live Demo

You can try the application at: [Smart Document Classifier](https://smart-document-classifier-5c6xty9yw-jayanthreddys-projects.vercel.app/)

> **Note**: The deployed version runs on a free tier and has limitations:
> - May not work with large files due to computation resource constraints
> - For testing with large files, please clone the repository and follow the installation steps below
> - The free tier has limited API calls and processing power


## Demo

![Smart Document Classifier Demo](working.gif)


## Project Structure

```
.
├── frontend/           # React + TypeScript frontend
├── backend/           # Flask backend
└── Dataset/          # Training and test datasets
```


## Prerequisites

Before you begin, ensure you have the following installed:

1. **Python 3.8 or higher**
   ```bash
   python --version
   ```
   If not installed, download from [python.org](https://python.org)

2. **Node.js 16 or higher**
   ```bash
   node --version
   ```
   If not installed, download from [nodejs.org](https://nodejs.org)

3. **PostgreSQL Database**
   - Install PostgreSQL from [postgresql.org](https://postgresql.org)
   - Or use [Neon](https://neon.tech) - a serverless Postgres database
   - Create a new database for the project

4. **Git**
   ```bash
   git --version
   ```
   If not installed, download from [git-scm.com](https://git-scm.com)

## Detailed Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd Smart-Document-Classifier
```

### 2. Backend Setup

1. **Create and activate virtual environment**
   ```bash
   # Windows
   python -m venv venv
   .\venv\Scripts\activate

   # Linux/Mac
   python3 -m venv venv
   source venv/bin/activate
   ```

2. **Install dependencies**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

3. **Set up environment variables**
   Create a `.env` file in the backend directory:
   ```
   #DATABASE settings
   # You can get this from Neon dashboard after creating a project
   DATABASE_URL=postgresql://username:password@localhost:5432/dbname

   # AWS settings
   AWS_ACCESS_KEY_ID=your_aws_access_key
   AWS_SECRET_ACCESS_KEY=your_aws_secret_key
   AWS_BUCKET_NAME=your_s3_bucket_name
   AWS_REGION=your_aws_region

   #HUGGING Face
   HUGGINGFACE_API_TOKEN=your_huggingface_token
   ```

4. **Initialize the database**
   ```bash
   # Make sure you're in the backend directory
   flask db upgrade
   ```

5. **Start the backend server**
   ```bash
   flask run
   ```
   The backend will be available at `http://localhost:5000`

### 3. Frontend Setup

1. **Install dependencies**
   ```bash
   cd frontend
   npm install
   # or
   yarn install
   ```

2. **Start the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```
   The frontend will be available at `http://localhost:8080`

## Configuration Details

### Database Configuration
- The application uses PostgreSQL
- You can use either:
  - Local PostgreSQL installation
  - Neon (serverless PostgreSQL)
- Database URL format: `postgresql://username:password@host:port/dbname`

### AWS Configuration
- Required for document storage
- Create an S3 bucket for document storage
- Set up IAM user with appropriate permissions
- Configure CORS on the S3 bucket

### Hugging Face Configuration
- Required for ML model inference
- Get API token from [Hugging Face](https://huggingface.co)
- The token needs inference API access

## API Documentation

The Smart Document Classifier provides a RESTful API for document classification and management.

### Base URL
```
http://localhost:5000
```

### Authentication
Currently, the API does not require authentication. However, it requires valid environment variables for AWS and Hugging Face services.

### Endpoints

#### 1. Get Document Categories
Retrieves the list of available document categories.

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