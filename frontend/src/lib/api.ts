const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export interface Document {
  id: number;
  filename: string;
  classification: string;
  confidence: number;
  upload_timestamp: string;
  all_scores?: Record<string, number>;
  s3_url: string;
}

export interface DocumentStats {
  classification: string;
  confidence: number;
  upload_timestamp: string;
}

export const getCategories = async (): Promise<string[]> => {
  const response = await fetch(`${API_BASE_URL}/categories/`);

  if (!response.ok) {
    throw new Error('Failed to fetch categories');
  }

  return response.json();
};

export const uploadDocument = async (file: File): Promise<Document> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/upload/`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to upload document');
  }

  return response.json();
};

export async function getDocuments(page: number = 1, limit: number = 10): Promise<{ documents: Document[]; totalPages: number }> {
  const response = await fetch(`${API_BASE_URL}/documents/?page=${page}&limit=${limit}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch documents');
  }
  
  return response.json();
}

export async function getDownloadUrl(documentId: number): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/documents/${documentId}/download`);
  
  if (!response.ok) {
    throw new Error('Failed to get download URL');
  }
  
  const data = await response.json();
  return data.download_url;
}

export async function getDocumentStats(): Promise<DocumentStats[]> {
  const response = await fetch(`${API_BASE_URL}/documents/stats`);
  if (!response.ok) {
    throw new Error('Failed to fetch document statistics');
  }
  const data = await response.json();
  return data.data;
} 