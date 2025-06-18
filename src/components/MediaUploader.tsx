import React, { useState, useRef } from 'react';
import { Upload, File, X, Image, Music, Video, Loader2, Check, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';

interface MediaUploaderProps {
  onUploadComplete?: (url: string, fileType: string, fileName: string) => void;
  acceptedTypes?: string;
  maxSizeMB?: number;
  bucketName?: string;
  className?: string;
  label?: string;
}

export const MediaUploader: React.FC<MediaUploaderProps> = ({
  onUploadComplete,
  acceptedTypes = 'audio/*,video/*,image/*',
  maxSizeMB = 50,
  bucketName = 'media-uploads',
  className,
  label = 'Upload Media'
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<{
    name: string;
    type: string;
    size: number;
    url: string;
  } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelection(e.target.files[0]);
    }
  };

  const handleFileSelection = (file: File) => {
    setError(null);
    
    // Check file type
    const fileType = file.type;
    const isAccepted = acceptedTypes.split(',').some(type => {
      if (type.endsWith('/*')) {
        const mainType = type.split('/')[0];
        return fileType.startsWith(`${mainType}/`);
      }
      return type === fileType;
    });
    
    if (!isAccepted) {
      setError(`File type not accepted. Please upload ${acceptedTypes.replace(/\*/g, '')}`);
      return;
    }
    
    // Check file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSizeMB) {
      setError(`File size exceeds the maximum limit of ${maxSizeMB}MB`);
      return;
    }
    
    uploadFile(file);
  };

  const getFileTypeIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) {
      return <Image className="w-8 h-8 text-blue-500" />;
    } else if (fileType.startsWith('audio/')) {
      return <Music className="w-8 h-8 text-purple-500" />;
    } else if (fileType.startsWith('video/')) {
      return <Video className="w-8 h-8 text-red-500" />;
    } else {
      return <File className="w-8 h-8 text-gray-500" />;
    }
  };

  const uploadFile = async (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      // Create a unique file name
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `${fileName}`;
      
      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (error) throw error;
      
      // Get public URL
      const { data: urlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);
      
      setUploadedFile({
        name: file.name,
        type: file.type,
        size: file.size,
        url: urlData.publicUrl
      });
      
      toast.success('File uploaded successfully');
      
      if (onUploadComplete) {
        onUploadComplete(urlData.publicUrl, file.type, file.name);
      }
    } catch (error) {
      console.error('Upload error:', error);
      setError('Failed to upload file. Please try again.');
      toast.error('Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const resetUpload = () => {
    setUploadedFile(null);
    setError(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} bytes`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden ${className}`}>
      <div className="p-4">
        {error && (
          <div className="bg-red-50 p-3 rounded-lg mb-4 flex items-start">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 mr-2" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}
        
        {!uploadedFile ? (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              isDragging 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-blue-400'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={acceptedTypes}
              onChange={handleFileChange}
              className="hidden"
            />
            
            <div className="flex flex-col items-center justify-center">
              <Upload className="w-12 h-12 text-blue-500 mb-4" />
              
              <h3 className="text-lg font-medium text-gray-900 mb-1">{label}</h3>
              
              <p className="text-sm text-gray-500 mb-4">
                Drag and drop or click to browse
              </p>
              
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
              >
                {isUploading ? (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Uploading... {uploadProgress}%</span>
                  </div>
                ) : (
                  'Select File'
                )}
              </button>
              
              <p className="text-xs text-gray-500 mt-4">
                Accepted formats: {acceptedTypes.replace(/\*/g, 'all')} (Max: {maxSizeMB}MB)
              </p>
            </div>
          </div>
        ) : (
          <div className="border rounded-lg p-4">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                {getFileTypeIcon(uploadedFile.type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-gray-900 truncate">{uploadedFile.name}</h4>
                <p className="text-xs text-gray-500">{formatFileSize(uploadedFile.size)}</p>
                <div className="flex items-center mt-1">
                  <Check className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-xs text-green-600">Upload complete</span>
                </div>
              </div>
              
              <button
                onClick={resetUpload}
                className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};