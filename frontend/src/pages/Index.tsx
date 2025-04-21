import React, { useState, useEffect } from 'react';
import FileUploadZone from '../components/FileUploadZone';
import ClassificationResult from '../components/ClassificationResult';
import DocumentHistory from '../components/DocumentHistory';
import { Button } from '../components/ui/button';
import { LoadingOverlay } from '../components/ui/loading-overlay';
import { uploadDocument, getDocuments, Document } from '../lib/api';
import { toast } from 'sonner';
import DocumentStats from '../components/DocumentStats';

const Index = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isClassifying, setIsClassifying] = useState(false);
  const [result, setResult] = useState<{ category: string; allScores: Record<string, number> } | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setResult(null);
  };

  const handleClassify = async () => {
    if (!selectedFile) return;

    setIsClassifying(true);
    
    try {
      const response = await uploadDocument(selectedFile);
      
      setResult({
        category: response.classification,
        allScores: response.all_scores || {}
      });
      
      setRefreshKey(prev => prev + 1);
      toast.success('Document classified successfully');
    } catch (error) {
      toast.error('Failed to classify document');
      console.error('Error classifying document:', error);
    } finally {
      setIsClassifying(false);
    }
  };

  return (
    <>
      {isClassifying && <LoadingOverlay message="Classifying document..." />}
      
      <div className="min-h-screen bg-gradient-to-br from-[#E5DEFF] via-[#F1F0FB] to-[#D3E4FD] py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="absolute inset-0 bg-white/30 backdrop-blur-sm rounded-xl -z-10"></div>
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Smart Document Classifier</h1>
            <p className="mt-2 text-gray-600">Upload your document and let AI classify it for you</p>
          </div>

          <div className="space-y-8">
            <FileUploadZone onFileSelect={handleFileSelect} />
            
            {selectedFile && (
              <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                    <p className="text-sm text-gray-500">{(selectedFile.size / 1024).toFixed(2)} KB</p>
                  </div>
                </div>
                <Button 
                  onClick={handleClassify} 
                  disabled={isClassifying}
                >
                  {isClassifying ? 'Classifying...' : 'Classify Document'}
                </Button>
              </div>
            )}

            {result && <ClassificationResult {...result} />}

            <DocumentStats key={`stats-${refreshKey}`} />

            <DocumentHistory key={`history-${refreshKey}`} />
          </div>
        </div>
      </div>
    </>
  );
};

export default Index;