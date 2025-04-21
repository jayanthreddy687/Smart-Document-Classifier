import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload } from 'lucide-react';
import { toast } from 'sonner';

interface FileUploadZoneProps {
  onFileSelect: (file: File) => void;
}

const FileUploadZone = ({ onFileSelect }: FileUploadZoneProps) => {
  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    if (acceptedFiles.length > 0) {
      onFileSelect(acceptedFiles[0]);
    }
    
    if (rejectedFiles.length > 0) {
      const fileType = rejectedFiles[0].file.type || 'unknown';
      const fileName = rejectedFiles[0].file.name;
      toast.error(`Unsupported file type: ${fileName} (${fileType})`, {
        description: "Please upload PDF, DOCX, or TXT files only."
      });
    }
  }, [onFileSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.txt'],
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxFiles: 1
  });

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer
        ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'}`}
    >
      <input {...getInputProps()} />
      <Upload className="mx-auto h-12 w-12 text-gray-400" />
      <p className="mt-4 text-lg font-medium text-gray-900">
        {isDragActive ? "Drop your document here" : "Drag & drop your document here"}
      </p>
      <p className="mt-2 text-sm text-gray-500">
        Supports PDF, DOCX, and TXT files
      </p>
    </div>
  );
};

export default FileUploadZone;
