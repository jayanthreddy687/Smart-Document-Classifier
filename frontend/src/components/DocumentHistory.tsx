import React, { useState, useEffect } from 'react';
import { FileText } from 'lucide-react';
import { getDocuments, getDownloadUrl, Document } from '../lib/api';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "./ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Badge } from "./ui/badge";
import DocumentStats from './DocumentStats';

const DocumentHistory = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;

  useEffect(() => {
    fetchDocuments();
  }, [currentPage]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Validate page number
      if (currentPage < 1) {
        setCurrentPage(1);
        return;
      }

      const response = await getDocuments(currentPage);
      
      // Validate response data
      if (!response || !Array.isArray(response.documents)) {
        throw new Error('Invalid response format');
      }

      setDocuments(response.documents);
      setTotalPages(response.totalPages);
      
      // Reset retry count on success
      setRetryCount(0);
    } catch (err: any) {
      let errorMessage = 'Failed to fetch documents';
      
      if (err.message.includes('network')) {
        errorMessage = 'Network error. Please check your connection.';
      } else if (err.message.includes('timeout')) {
        errorMessage = 'Request timed out. Please try again.';
      } else if (err.message.includes('Invalid response format')) {
        errorMessage = 'Server returned invalid data. Please try again later.';
      }

      setError(errorMessage);
      console.error('Error fetching documents:', err);

      // Implement retry logic
      if (retryCount < MAX_RETRIES) {
        setRetryCount(prev => prev + 1);
        setTimeout(() => fetchDocuments(), 2000 * retryCount); // Exponential backoff
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (documentId: number, filename: string) => {
    try {
      const downloadUrl = await getDownloadUrl(documentId);
      window.open(downloadUrl, '_blank');
    } catch (err) {
      toast.error('Failed to download document');
      console.error('Error downloading document:', err);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch (e) {
      return 'Invalid Date';
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) {
      toast.error('Invalid page number');
      return;
    }
    setCurrentPage(newPage);
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading...</div>;
  }

  if (error) {
    return <div className="text-red-500 p-4">{error}</div>;
  }

  return (
    <div className="space-y-6">
      
      <Card className="bg-white/50 backdrop-blur-sm border border-purple-100">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Document History</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
              <span className="ml-2">Loading documents...</span>
            </div>
          ) : error ? (
            <div className="text-center p-4">
              <div className="text-red-500 mb-2">{error}</div>
              {retryCount < MAX_RETRIES ? (
                <p className="text-sm text-gray-500">Retrying... ({retryCount}/{MAX_RETRIES})</p>
              ) : (
                <button
                  onClick={() => {
                    setRetryCount(0);
                    fetchDocuments();
                  }}
                  className="text-purple-600 hover:text-purple-800 underline"
                >
                  Try again
                </button>
              )}
            </div>
          ) : documents.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No documents found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Filename</TableHead>
                  <TableHead>Classification</TableHead>
                  <TableHead>Confidence</TableHead>
                  <TableHead>Upload Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((doc) => (
                  <TableRow key={doc.filename}>
                    <TableCell className="font-medium">
                      <button
                        onClick={() => handleDownload(doc.id, doc.filename)}
                        className="flex items-center gap-2 text-blue-600 hover:text-blue-800 hover:underline focus:outline-none"
                      >
                        <FileText className="h-4 w-4 text-gray-500 flex-shrink-0" />
                        <span className="truncate">{doc.filename}</span>
                      </button>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {doc.classification}
                      </Badge>
                    </TableCell>
                    <TableCell>{doc.confidence}%</TableCell>
                    <TableCell>{formatDate(doc.upload_timestamp)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {!error && documents.length > 0 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-gray-700">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex space-x-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DocumentHistory;
