import requests
import docx
import PyPDF2
from typing import Dict, Any, Optional, List, Tuple
import io
import logging
import os
from dotenv import load_dotenv
from config import settings
import numpy as np
from collections import Counter
from requests.exceptions import RequestException, Timeout, ConnectionError

# Configure logging
logger = logging.getLogger(__name__)

class DocumentClassifier:
    def __init__(self, api_token: Optional[str] = None, model_name: str = "facebook/bart-large-mnli"):
        """
        Initialize the document classifier with Hugging Face Inference API.
        
        Args:
            api_token: Hugging Face API token. If not provided, will use the one from settings
            model_name: Name of the Hugging Face model to use
        """
        self.api_token = api_token or settings.HUGGINGFACE_API_TOKEN
        if not self.api_token:
            raise ValueError("Hugging Face API token is required. Please provide it or set HUGGINGFACE_API_TOKEN in your .env file.")
        
        self.api_url = f"https://api-inference.huggingface.co/models/{model_name}"
        self.headers = {"Authorization": f"Bearer {self.api_token}"}
        
        # Predefined categories
        self._categories = [
            "Technical Documentation",
            "Business Proposal",
            "Legal Document",
            "Academic Paper",
            "General Article",
            "Other"
        ]
        logger.info(f"Initialized DocumentClassifier with model: {model_name}")

    @property
    def categories(self) -> List[str]:
        """Get the list of available categories."""
        return self._categories.copy()

    def extract_text_from_file(self, file_content: bytes, file_type: str) -> str:
        """
        Extract text content from different file types.
        
        Args:
            file_content: Raw bytes of the file
            file_type: File extension (e.g., '.txt', '.pdf', '.docx')
            
        Returns:
            Extracted text as string
            
        Raises:
            ValueError: If file type is not supported
            IOError: If file content cannot be read
        """
        try:
            if file_type.lower() == '.txt':
                try:
                    return file_content.decode('utf-8')
                except UnicodeDecodeError:
                    logger.error("Failed to decode text file as UTF-8")
                    raise IOError("Failed to read text file. Please ensure it is UTF-8 encoded.")
            
            elif file_type.lower() == '.docx':
                try:
                    doc_stream = io.BytesIO(file_content)
                    doc = docx.Document(doc_stream)
                    return ' '.join([paragraph.text for paragraph in doc.paragraphs])
                except Exception as e:
                    logger.error(f"Error reading DOCX file: {str(e)}")
                    raise IOError("Failed to read DOCX file. Please ensure it is a valid Word document.")
            
            elif file_type.lower() == '.pdf':
                try:
                    pdf_stream = io.BytesIO(file_content)
                    pdf_reader = PyPDF2.PdfReader(pdf_stream)
                    if len(pdf_reader.pages) == 0:
                        raise ValueError("PDF file is empty")
                    text = ''
                    for page in pdf_reader.pages:
                        text += page.extract_text() + ' '
                    if not text.strip():
                        raise ValueError("No text content found in PDF")
                    return text.strip()
                except Exception as e:
                    logger.error(f"Error reading PDF file: {str(e)}")
                    raise IOError("Failed to read PDF file. Please ensure it is a valid PDF document.")
            
            else:
                raise ValueError(f"Unsupported file type: {file_type}. Supported types are: .txt, .docx, .pdf")
        except Exception as e:
            logger.error(f"Error extracting text from file: {str(e)}")
            raise

    def create_sliding_windows(self, text: str, window_size: int = 1024, overlap: int = 200) -> List[Tuple[str, int, int]]:
        """
        Split text into overlapping windows with position information.
        
        Args:
            text: Text to split
            window_size: Maximum size of each window
            overlap: Number of characters to overlap between windows
            
        Returns:
            List of tuples containing (window_text, start_pos, end_pos)
        """
        words = text.split()
        windows = []
        current_window = []
        current_length = 0
        start_pos = 0
        
        for i, word in enumerate(words):
            word_length = len(word) + 1  # +1 for space
            if current_length + word_length > window_size:
                # Add current window to windows list with position info
                window_text = ' '.join(current_window)
                end_pos = start_pos + len(window_text)
                windows.append((window_text, start_pos, end_pos))
                
                # Calculate overlap
                overlap_words = []
                overlap_length = 0
                overlap_start = len(current_window) - 1
                
                while overlap_start >= 0 and overlap_length < overlap:
                    word = current_window[overlap_start]
                    if overlap_length + len(word) + 1 > overlap:
                        break
                    overlap_words.insert(0, word)
                    overlap_length += len(word) + 1
                    overlap_start -= 1
                
                current_window = overlap_words
                current_length = overlap_length
                start_pos = end_pos - overlap_length
            
            current_window.append(word)
            current_length += word_length
        
        # Add the last window if it's not empty
        if current_window:
            window_text = ' '.join(current_window)
            end_pos = start_pos + len(window_text)
            windows.append((window_text, start_pos, end_pos))
        
        return windows

    def query_api(self, text: str) -> Dict[str, Any]:
        """
        Query the Hugging Face Inference API.
        
        Args:
            text: Text to classify
            
        Returns:
            API response as dictionary
            
        Raises:
            RequestException: If API request fails
            ValueError: If response is invalid
        """
        try:
            if not text.strip():
                raise ValueError("Empty text provided for classification")

            payload = {
                "inputs": text,
                "parameters": {
                    "candidate_labels": self._categories
                }
            }
            
            response = requests.post(
                self.api_url, 
                headers=self.headers, 
                json=payload,
                timeout=30  # 30 second timeout
            )
            response.raise_for_status()
            
            result = response.json()
            if not isinstance(result, list) or len(result) == 0:
                raise ValueError("Invalid response format from Hugging Face API")
                
            return result
            
        except Timeout:
            logger.error("Timeout while querying Hugging Face API")
            raise RequestException("Classification request timed out. Please try again.")
        except ConnectionError:
            logger.error("Connection error while querying Hugging Face API")
            raise RequestException("Failed to connect to classification service. Please check your internet connection.")
        except requests.exceptions.HTTPError as e:
            if e.response.status_code == 401:
                logger.error("Authentication failed with Hugging Face API")
                raise ValueError("Authentication failed. Please check your API token.")
            elif e.response.status_code == 429:
                logger.error("Rate limit exceeded for Hugging Face API")
                raise RequestException("Rate limit exceeded. Please try again later.")
            else:
                logger.error(f"HTTP error while querying Hugging Face API: {str(e)}")
                raise RequestException(f"Classification service error: {str(e)}")
        except Exception as e:
            logger.error(f"Error querying Hugging Face API: {str(e)}")
            raise

    def aggregate_results(self, window_results: List[Tuple[Dict[str, Any], int, int]]) -> Dict[str, Any]:
        """
        Aggregate results from multiple windows using a weighted voting system.
        
        Args:
            window_results: List of tuples containing (result, start_pos, end_pos)
            
        Returns:
            Aggregated classification result with detailed statistics
        """
        # Initialize score tracking
        category_scores = {category: [] for category in self._categories}
        category_weights = {category: [] for category in self._categories}
        
        # Process each window's results
        for result, start_pos, end_pos in window_results:
            window_length = end_pos - start_pos
            
            # Calculate window weight based on length and position
            # Windows in the middle of the document get higher weights
            position_weight = 1.0 - abs(start_pos - (window_results[-1][2] / 2)) / (window_results[-1][2] / 2)
            length_weight = window_length / max(r[2] - r[1] for r in window_results)
            window_weight = (position_weight + length_weight) / 2
            
            # Store scores and weights for each category
            for label, score in zip(result['labels'], result['scores']):
                category_scores[label].append(score)
                category_weights[label].append(window_weight)
        
        # Calculate weighted statistics for each category
        category_stats = {}
        for category in self._categories:
            scores = np.array(category_scores[category])
            weights = np.array(category_weights[category])
            
            if len(scores) > 0:
                # Weighted mean
                weighted_mean = np.average(scores, weights=weights)
                
                # Weighted median
                sorted_idx = np.argsort(scores)
                sorted_weights = weights[sorted_idx]
                cumsum = np.cumsum(sorted_weights)
                median_idx = np.searchsorted(cumsum, cumsum[-1] / 2)
                weighted_median = scores[sorted_idx[median_idx]]
                
                # Confidence interval
                q25_idx = np.searchsorted(cumsum, cumsum[-1] * 0.25)
                q75_idx = np.searchsorted(cumsum, cumsum[-1] * 0.75)
                q25 = scores[sorted_idx[q25_idx]]
                q75 = scores[sorted_idx[q75_idx]]
                
                category_stats[category] = {
                    'weighted_mean': weighted_mean,
                    'weighted_median': weighted_median,
                    'confidence_interval': {
                        'lower': q25,
                        'upper': q75,
                        'range': q75 - q25
                    },
                    'num_windows': len(scores),
                    'std_dev': np.std(scores) if len(scores) > 1 else 0
                }
            else:
                category_stats[category] = {
                    'weighted_mean': 0,
                    'weighted_median': 0,
                    'confidence_interval': {'lower': 0, 'upper': 0, 'range': 0},
                    'num_windows': 0,
                    'std_dev': 0
                }
        
        # Find the best category using weighted median
        best_category = max(
            category_stats.items(),
            key=lambda x: x[1]['weighted_median']
        )
        
        return {
            'category': best_category[0],
            'confidence': best_category[1]['weighted_median'],
            'all_scores': {cat: stats['weighted_median'] for cat, stats in category_stats.items()},
            'statistics': category_stats,
            'raw_result': window_results
        }

    def classify_document(self, text: str) -> Dict[str, Any]:
        """
        Classify the document text using the Hugging Face Inference API.
        
        Args:
            text: Text content to classify
            
        Returns:
            Dictionary containing classification results
        """
        try:
            # Split text into windows with position information
            windows = self.create_sliding_windows(text)
            logger.info(f"Split document into {len(windows)} windows")
            
            # Classify each window and store results with position info
            window_results = []
            for window_text, start_pos, end_pos in windows:
                result = self.query_api(window_text)
                window_results.append((result, start_pos, end_pos))
            
            # Aggregate results using weighted voting
            final_result = self.aggregate_results(window_results)
            return final_result
            
        except Exception as e:
            logger.error(f"Error classifying document: {str(e)}")
            raise

    def process_document(self, file_content: bytes, file_type: str) -> Dict[str, Any]:
        """
        Process the document and return detailed classification results.
        
        Args:
            file_content: Raw bytes of the file
            file_type: File extension
            
        Returns:
            Dictionary containing classification results
            
        Raises:
            ValueError: If file type is not supported or content is invalid
            IOError: If file cannot be read
            RequestException: If classification service fails
        """
        try:
            # Extract text from the document
            text = self.extract_text_from_file(file_content, file_type)
            
            # Classify the text
            results = self.classify_document(text)
            
            return results
            
        except Exception as e:
            logger.error(f"Error processing document: {str(e)}")
            raise 