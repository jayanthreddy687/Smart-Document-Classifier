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

  useEffect(() => {
    fetchDocuments();
  }, [currentPage]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const response = await getDocuments(currentPage);
      setDocuments(response.documents);
      setTotalPages(response.totalPages);
      setError(null);
    } catch (err) {
      setError('Failed to fetch documents');
      console.error('Error fetching documents:', err);
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
          {documents.length === 0 ? (
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

          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-700">
              Page {currentPage} of {totalPages}
            </p>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(prev => prev - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(prev => prev + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DocumentHistory;
