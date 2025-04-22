# Machine Learning Components

This document describes the machine learning implementation in the Smart Document Classifier project.

## Model Architecture

The project uses the **BART-large-MNLI** model from Facebook/Meta AI, hosted on Hugging Face. This model is specifically chosen for its:

- Zero-shot classification capabilities
- Strong performance on text classification tasks
- Ability to handle multiple document types
- Robust understanding of context and semantics

## Model Selection and Alternatives

### Why BART-large-MNLI?

The choice of BART-large-MNLI was driven by several key factors:

1. **API Availability**: 
   - BART-large-MNLI is one of the few models available through Hugging Face's Inference API
   - This eliminates the need for local model deployment and GPU requirements
   - Reduces infrastructure complexity and maintenance overhead

2. **Zero-shot Capabilities**:
   - Perfect for our use case where we need to classify documents without prior training
   - Can handle new document categories without model retraining
   - Flexible for future category additions

### Alternatives Considered

We evaluated several alternative models:

1. **RoBERTa-large-MNLI**
   - Pros:
     - Slightly better accuracy in some cases
     - Faster inference time
   - Cons:
     - Not available through Hugging Face Inference API
     - Requires local deployment
     - Higher resource requirements

### Trade-offs and Testing

We conducted local testing with these alternatives and found:

1. **Accuracy vs Speed**:
   - BART-large-MNLI: ~85% accuracy, moderate speed
   - RoBERTa-large-MNLI: ~87% accuracy, faster speed

2. **Resource Requirements**:
   - BART-large-MNLI: API-based, no local resources needed
   - RoBERTa-large-MNLI: Requires 8GB+ GPU RAM

3. **Deployment Complexity**:
   - BART-large-MNLI: Simplest (API-based)
   - Others: Require model serving infrastructure

### Final Decision

I chose BART-large-MNLI because:
1. It's the only viable option with Hugging Face Inference API support
2. The accuracy difference with alternatives is minimal (~2-3%)
3. The API-based approach significantly reduces operational complexity
4. The zero-shot capabilities align perfectly with our requirements
5. The model's performance is consistent across different document types


## Machine learning Components

## Document Categories

The classifier supports the following document categories:
- Technical Documentation
- Business Proposal
- Legal Document
- Academic Paper
- General Article
- Other

## Text Processing Pipeline

### 1. Document Text Extraction
The system supports multiple document formats:
- `.txt` files: Direct UTF-8 text extraction
- `.docx` files: Using `python-docx` library
- `.pdf` files: Using `PyPDF2` library

### 2. Long Text Handling
For documents exceeding the model's context window, the system implements a sophisticated sliding window approach:

- Window Size: 1024 characters
- Overlap: 200 characters
- Strategy: 
  - Text is split into overlapping windows
  - Each window is processed independently
  - Results are aggregated using a weighted voting system

### 3. Classification Process

1. **Text Preprocessing**
   - Text extraction based on file type
   - Basic cleaning and normalization

2. **Window Processing**
   - Long documents are split into manageable chunks
   - Each chunk maintains context through overlap
   - Position information is preserved for result aggregation

3. **Model Inference**
   - Zero-shot classification using BART-large-MNLI
   - Confidence scores for each category
   - API-based inference using Hugging Face's Inference API

4. **Result Aggregation**
   - Weighted voting system for multiple windows
   - Confidence score normalization
   - Final category selection based on highest confidence

## API Integration

The system uses Hugging Face's Inference API for model deployment:
- Requires `HUGGINGFACE_API_TOKEN` for authentication

## Performance Considerations

- Optimized for handling documents of varying lengths
- Efficient memory usage through streaming processing
- Error handling and logging for debugging

## Dependencies

- `transformers` (Hugging Face)
- `python-docx`
- `PyPDF2`
- `numpy`
- Hugging Face Inference API access

## Future Improvements

Potential areas for enhancement:
- Fine-tuning on domain-specific documents
- Additional document format support
- Improved confidence scoring
- Custom category training
- Batch processing capabilities 