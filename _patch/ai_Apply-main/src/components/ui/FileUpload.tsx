import React, { useState } from 'react';
import { CheckCircle, Upload } from 'lucide-react';

interface FileUploadProps {
  onUpload: (file: File) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onUpload }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      setFile(droppedFile);
      onUpload(droppedFile);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      onUpload(selectedFile);
    }
  };

  return (
    <div
      className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors duration-200 ${isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50'}`}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleChange} accept=".pdf,.docx" />
      <div className="flex flex-col items-center gap-3 pointer-events-none">
        <div className="p-3 bg-indigo-100 rounded-full text-indigo-600">
          <Upload size={24} />
        </div>
        {file ? (
          <div className="flex flex-col items-center">
            <span className="font-medium text-gray-900">{file.name}</span>
            <span className="text-sm text-green-600 mt-1 flex items-center gap-1">
              <CheckCircle size={14} /> Prêt à analyser
            </span>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-600 font-medium">
              Glissez votre CV ici ou <span className="text-indigo-600">parcourez</span>
            </p>
            <p className="text-xs text-gray-400">PDF, DOCX jusqu'à 10MB</p>
          </>
        )}
      </div>
    </div>
  );
};

export default FileUpload;
