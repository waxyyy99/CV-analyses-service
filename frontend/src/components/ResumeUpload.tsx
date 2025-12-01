import { useState } from 'react';
import { Upload, FileText } from 'lucide-react';

interface ResumeUploadProps {
  onAnalyze: (file: File) => void;
  isAnalyzing: boolean;
}

export function ResumeUpload({ onAnalyze, isAnalyzing }: ResumeUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      const file = files[0];
      if (file.type === 'application/pdf' || file.type === 'text/plain') {
        setSelectedFile(file);
      } else {
        alert('Only PDF and text files are allowed');
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      setSelectedFile(files[0]);
    }
  };

  const handleAnalyze = () => {
    if (selectedFile) {
      onAnalyze(selectedFile);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
          dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'
        } ${isAnalyzing ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-700 mb-2">Upload Your Resume</h3>
        <p className="text-gray-600 mb-4">Drag and drop your PDF or text file, or click to select</p>

        <label className="inline-block">
          <input
            type="file"
            accept=".pdf,.txt"
            onChange={handleFileChange}
            disabled={isAnalyzing}
            className="hidden"
          />
          <span className="bg-blue-600 text-white px-6 py-2 rounded-lg cursor-pointer hover:bg-blue-700 inline-block">
            Select File
          </span>
        </label>
      </div>

      {selectedFile && (
        <div className="mt-6 bg-white rounded-lg p-6 shadow">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="w-6 h-6 text-blue-600" />
            <div>
              <p className="font-semibold text-gray-800">{selectedFile.name}</p>
              <p className="text-sm text-gray-600">{(selectedFile.size / 1024).toFixed(2)} KB</p>
            </div>
          </div>

          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50"
          >
            {isAnalyzing ? 'Analyzing...' : 'Analyze Resume'}
          </button>
        </div>
      )}
    </div>
  );
}
