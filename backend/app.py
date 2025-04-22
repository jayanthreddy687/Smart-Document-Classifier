from flask import Flask, request, jsonify
from flask_cors import CORS
import boto3
from datetime import datetime, UTC
import os
from werkzeug.utils import secure_filename
from botocore.exceptions import ClientError
import io
import logging
from sqlalchemy.exc import SQLAlchemyError
from werkzeug.exceptions import HTTPException

from database import db, Document
from config import settings
from ml_classifier import DocumentClassifier

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Configure database
app.config['SQLALCHEMY_DATABASE_URI'] = settings.get_database_url()
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize database
db.init_app(app)

# Create tables (run this only once)
with app.app_context():
    db.create_all()

# Initialize ML classifier
classifier = DocumentClassifier()

# Initialize S3 client with error handling
try:
    s3_client = boto3.client(
        's3',
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        region_name=settings.AWS_REGION
    )
    # Test the connection
    s3_client.list_buckets()
except ClientError as e:
    logger.error(f"Error connecting to AWS S3: {str(e)}")
    raise

# Global error handlers
@app.errorhandler(HTTPException)
def handle_http_error(error):
    """Handle HTTP exceptions."""
    response = {
        'error': error.description,
        'status_code': error.code
    }
    return jsonify(response), error.code

@app.errorhandler(SQLAlchemyError)
def handle_db_error(error):
    """Handle database errors."""
    logger.error(f"Database error: {str(error)}")
    return jsonify({'error': 'Database error occurred'}), 500

@app.errorhandler(Exception)
def handle_generic_error(error):
    """Handle all other exceptions."""
    logger.error(f"Unexpected error: {str(error)}")
    return jsonify({'error': 'An unexpected error occurred'}), 500

@app.route('/categories/', methods=['GET'])
def get_categories():
    """Get the list of available document categories."""
    try:
        categories = classifier.categories
        return jsonify(categories), 200
    except Exception as e:
        error_message = str(e)
        logger.error(f"Error getting categories: {error_message}")
        return jsonify({'error': error_message}), 500


@app.route('/upload/', methods=['POST'])
def upload_document():
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400

    # Validate file type
    allowed_types = ['.txt', '.docx', '.pdf']
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in allowed_types:
        return jsonify({'error': f'File type not allowed. Supported types: {", ".join(allowed_types)}'}), 400

    # Validate file size (e.g., 10MB limit)
    if len(file.read()) > 10 * 1024 * 1024:  # 10MB in bytes
        return jsonify({'error': 'File size too large. Maximum size is 10MB'}), 400
    file.seek(0)  # Reset file pointer

    try:
        # Read file content
        file_content = file.read()

        # Upload to S3
        s3_key = f"documents/{datetime.now(UTC).timestamp()}_{secure_filename(file.filename)}"
        logger.info(f"Attempting to upload to S3: {s3_key}")

        # Create a new BytesIO object for S3 upload
        file_for_s3 = io.BytesIO(file_content)
        s3_client.upload_fileobj(
            file_for_s3,
            settings.AWS_BUCKET_NAME,
            s3_key
        )
        s3_url = f"https://{settings.AWS_BUCKET_NAME}.s3.amazonaws.com/{s3_key}"
        logger.info(f"Successfully uploaded to S3: {s3_url}")

        # Classify document using ML
        classification = classifier.process_document(
            file_content,
            file_ext
        )
        logger.info(
            f"Classification: {classification['category']}, Confidence: {classification['confidence']}")

        # Create document record
        document = Document(
            filename=secure_filename(file.filename),
            content="",  # You might want to store the extracted text here
            classification=classification['category'],
            confidence=classification['confidence'],
            s3_url=s3_url
        )
        db.session.add(document)
        db.session.commit()

        # Include all_scores in the response
        response_data = document.to_dict()
        response_data['all_scores'] = classification['all_scores']
        return jsonify(response_data), 201

    except ClientError as e:
        error_message = str(e)
        logger.error(f"AWS S3 Error: {error_message}")
        return jsonify({'error': f'AWS S3 Error: {error_message}'}), 500
    except SQLAlchemyError as e:
        db.session.rollback()
        logger.error(f"Database error: {str(e)}")
        return jsonify({'error': 'Failed to save document to database'}), 500
    except Exception as e:
        error_message = str(e)
        logger.error(f"Error: {error_message}")
        return jsonify({'error': error_message}), 500


@app.route('/documents/<int:document_id>/download', methods=['GET'])
def get_download_url(document_id):
    try:
        # Get document from database
        document = Document.query.get_or_404(document_id)
        
        # Extract the S3 key from the URL
        s3_key = document.s3_url.split('.com/')[-1]
        
        # Generate pre-signed URL valid for 60 seconds
        presigned_url = s3_client.generate_presigned_url(
            'get_object',
            Params={
                'Bucket': settings.AWS_BUCKET_NAME,
                'Key': s3_key
            },
            ExpiresIn=60
        )
        
        return jsonify({
            'download_url': presigned_url
        }), 200
        
    except ClientError as e:
        error_message = str(e)
        logger.error(f"AWS S3 Error generating download URL: {error_message}")
        return jsonify({'error': f'AWS S3 Error: {error_message}'}), 500
    except Exception as e:
        error_message = str(e)
        logger.error(f"Error generating download URL: {error_message}")
        return jsonify({'error': error_message}), 500


@app.route('/documents/', methods=['GET'])
def get_documents():
    try:
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 10))
        
        # Validate pagination parameters
        if page < 1:
            return jsonify({'error': 'Page number must be greater than 0'}), 400
        if limit < 1 or limit > 100:
            return jsonify({'error': 'Limit must be between 1 and 100'}), 400
        
        # Calculate skip value for pagination
        skip = (page - 1) * limit
        
        # Get total count of documents
        total_documents = Document.query.count()
        total_pages = (total_documents + limit - 1) // limit  # Ceiling division
        
        # Get documents from database with pagination
        documents = Document.query.order_by(Document.upload_timestamp.desc()).offset(skip).limit(limit).all()
        
        # Convert documents to JSON format
        documents_json = [{
            'id': doc.id,
            'filename': doc.filename,
            'classification': doc.classification,
            'confidence': round(doc.confidence * 100, 2),
            'upload_timestamp': doc.upload_timestamp.strftime('%Y-%m-%dT%H:%M:%S.%fZ'),
            's3_url': doc.s3_url
        } for doc in documents]
        
        return jsonify({
            'documents': documents_json,
            'totalPages': total_pages
        }), 200
        
    except ValueError as e:
        error_message = str(e)
        logger.error(f"Invalid pagination parameters: {error_message}")
        return jsonify({'error': error_message}), 400
    except SQLAlchemyError as e:
        db.session.rollback()
        logger.error(f"Database error getting documents: {str(e)}")
        return jsonify({'error': 'Failed to retrieve documents from database'}), 500
    except Exception as e:
        error_message = str(e)
        logger.error(f"Error getting documents: {error_message}")
        return jsonify({'error': error_message}), 500


@app.route('/documents/stats', methods=['GET'])
def get_documents_stats():
    try:
        # Get all documents for statistics
        documents = Document.query.all()
        
        documents_stats = [{
            'classification': doc.classification,
            'confidence': round(doc.confidence * 100, 2),
            'upload_timestamp': doc.upload_timestamp.strftime('%Y-%m-%dT%H:%M:%S.%fZ')
        } for doc in documents]
        
        return jsonify({
            'status': 'success',
            'data': documents_stats
        }), 200
        
    except SQLAlchemyError as e:
        db.session.rollback()
        logger.error(f"Database error fetching document stats: {str(e)}")
        return jsonify({'error': 'Failed to retrieve document statistics from database'}), 500
    except Exception as e:
        error_message = str(e)
        logger.error(f"Error fetching document stats: {error_message}")
        return jsonify({'error': error_message}), 500


if __name__ == '__main__':
    app.run()
