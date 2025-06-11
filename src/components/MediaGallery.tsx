import React, { useState, useEffect } from 'react';
import { Image, Music, Video, File, Trash, Download, ExternalLink, Search, Filter, X } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { MediaPlayer } from './MediaPlayer';
import { VideoPlayer } from './VideoPlayer';
import { AudioPlayer } from './AudioPlayer';

interface MediaItem {
  id: string;
  name: string;
  type: string;
  url: string;
  size: number;
  created_at: string;
  metadata?: Record<string, any>;
}

interface MediaGalleryProps {
  bucketName?: string;
  title?: string;
  className?: string;
  onSelect?: (media: MediaItem) => void;
  selectable?: boolean;
}

export const MediaGallery: React.FC<MediaGalleryProps> = ({
  bucketName = 'media-uploads',
  title = 'Media Gallery',
  className,
  onSelect,
  selectable = false
}) => {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  
  useEffect(() => {
    loadMedia();
  }, [bucketName]);

  const loadMedia = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.storage
        .from(bucketName)
        .list();
      
      if (error) throw error;
      
      // Get URLs for each file
      const mediaItems: MediaItem[] = [];
      
      for (const item of data || []) {
        if (item.name.startsWith('.')) continue; // Skip hidden files
        
        const { data: urlData } = supabase.storage
          .from(bucketName)
          .getPublicUrl(item.name);
        
        const fileType = getFileType(item.name);
        
        mediaItems.push({
          id: item.id,
          name: item.name,
          type: fileType,
          url: urlData.publicUrl,
          size: item.metadata?.size || 0,
          created_at: item.created_at || new Date().toISOString(),
          metadata: item.metadata
        });
      }
      
      setMediaItems(mediaItems.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ));
    } catch (error) {
      console.error('Error loading media:', error);
      setError('Failed to load media. Please try again.');
      toast.error('Failed to load media');
    } finally {
      setIsLoading(false);
    }
  };

  const getFileType = (fileName: string): string => {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    
    const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
    const audioExts = ['mp3', 'wav', 'ogg', 'aac', 'm4a', 'webm'];
    const videoExts = ['mp4', 'webm', 'mov', 'avi', 'mkv'];
    
    if (imageExts.includes(ext)) return 'image';
    if (audioExts.includes(ext)) return 'audio';
    if (videoExts.includes(ext)) return 'video';
    
    return 'document';
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <Image className="w-6 h-6 text-blue-500" />;
      case 'audio':
        return <Music className="w-6 h-6 text-purple-500" />;
      case 'video':
        return <Video className="w-6 h-6 text-red-500" />;
      default:
        return <File className="w-6 h-6 text-gray-500" />;
    }
  };

  const handleDelete = async (item: MediaItem) => {
    if (!confirm(`Are you sure you want to delete ${item.name}?`)) return;
    
    try {
      const { error } = await supabase.storage
        .from(bucketName)
        .remove([item.name]);
      
      if (error) throw error;
      
      setMediaItems(prev => prev.filter(i => i.id !== item.id));
      
      if (selectedMedia?.id === item.id) {
        setSelectedMedia(null);
      }
      
      toast.success('File deleted successfully');
    } catch (error) {
      console.error('Error deleting file:', error);
      toast.error('Failed to delete file');
    }
  };

  const handleDownload = (item: MediaItem) => {
    const link = document.createElement('a');
    link.href = item.url;
    link.download = item.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSelect = (item: MediaItem) => {
    setSelectedMedia(item);
    
    if (onSelect && selectable) {
      onSelect(item);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} bytes`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const filteredItems = mediaItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType ? item.type === selectedType : true;
    return matchesSearch && matchesType;
  });

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden ${className}`}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          <button
            onClick={loadMedia}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search media..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={() => setSelectedType(selectedType === 'image' ? null : 'image')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1 ${
                selectedType === 'image' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Image className="w-4 h-4" />
              <span>Images</span>
            </button>
            
            <button
              onClick={() => setSelectedType(selectedType === 'audio' ? null : 'audio')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1 ${
                selectedType === 'audio' 
                  ? 'bg-purple-100 text-purple-700' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Music className="w-4 h-4" />
              <span>Audio</span>
            </button>
            
            <button
              onClick={() => setSelectedType(selectedType === 'video' ? null : 'video')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1 ${
                selectedType === 'video' 
                  ? 'bg-red-100 text-red-700' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Video className="w-4 h-4" />
              <span>Video</span>
            </button>
            
            {selectedType && (
              <button
                onClick={() => setSelectedType(null)}
                className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm flex items-center space-x-1"
              >
                <X className="w-4 h-4" />
                <span>Clear</span>
              </button>
            )}
          </div>
        </div>
        
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 p-4 rounded-lg text-red-700">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 mr-2" />
              <div>
                <p className="font-medium">{error}</p>
                <button
                  onClick={loadMedia}
                  className="mt-2 text-sm text-red-600 hover:text-red-800"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <File className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No media found</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm 
                ? `No results for "${searchTerm}"` 
                : selectedType
                  ? `No ${selectedType} files found` 
                  : 'No media files have been uploaded yet'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className={`border rounded-lg overflow-hidden hover:shadow-md transition-shadow ${
                  selectedMedia?.id === item.id ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-200'
                }`}
              >
                <div 
                  className="cursor-pointer"
                  onClick={() => handleSelect(item)}
                >
                  {item.type === 'image' && (
                    <div className="h-40 bg-gray-100">
                      <img 
                        src={item.url} 
                        alt={item.name} 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=Image+Error';
                        }}
                      />
                    </div>
                  )}
                  
                  {item.type === 'video' && (
                    <div className="h-40 bg-gray-900 flex items-center justify-center relative">
                      <Video className="w-12 h-12 text-white opacity-70" />
                      <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                        Video
                      </div>
                    </div>
                  )}
                  
                  {item.type === 'audio' && (
                    <div className="h-40 bg-gradient-to-r from-purple-100 to-blue-100 flex items-center justify-center">
                      <Music className="w-12 h-12 text-purple-500" />
                    </div>
                  )}
                  
                  {item.type === 'document' && (
                    <div className="h-40 bg-gray-100 flex items-center justify-center">
                      <File className="w-12 h-12 text-gray-500" />
                    </div>
                  )}
                </div>
                
                <div className="p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-1">
                        {getFileIcon(item.type)}
                        <h3 className="text-sm font-medium text-gray-900 truncate">{item.name}</h3>
                      </div>
                      <p className="text-xs text-gray-500">{formatFileSize(item.size)}</p>
                    </div>
                    
                    <div className="flex space-x-1">
                      <button
                        onClick={() => handleDownload(item)}
                        className="p-1 text-gray-500 hover:text-blue-500 hover:bg-blue-50 rounded-full transition-colors"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={() => window.open(item.url, '_blank')}
                        className="p-1 text-gray-500 hover:text-blue-500 hover:bg-blue-50 rounded-full transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={() => handleDelete(item)}
                        className="p-1 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {selectedMedia && (
          <div className="mt-6 border-t border-gray-200 pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-900">Preview</h3>
              <button
                onClick={() => setSelectedMedia(null)}
                className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {selectedMedia.type === 'image' && (
              <div className="rounded-lg overflow-hidden">
                <img 
                  src={selectedMedia.url} 
                  alt={selectedMedia.name} 
                  className="max-w-full h-auto"
                />
              </div>
            )}
            
            {selectedMedia.type === 'video' && (
              <VideoPlayer 
                src={selectedMedia.url} 
                title={selectedMedia.name}
              />
            )}
            
            {selectedMedia.type === 'audio' && (
              <AudioPlayer 
                src={selectedMedia.url} 
                title={selectedMedia.name}
              />
            )}
            
            {selectedMedia.type === 'document' && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <File className="w-8 h-8 text-gray-500" />
                  <div>
                    <h4 className="font-medium text-gray-900">{selectedMedia.name}</h4>
                    <p className="text-sm text-gray-500">{formatFileSize(selectedMedia.size)}</p>
                  </div>
                </div>
                <div className="mt-4 flex justify-center">
                  <a
                    href={selectedMedia.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Open Document
                  </a>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Add missing RefreshCw and AlertCircle components
const RefreshCw = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
    <path d="M21 3v5h-5" />
    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
    <path d="M3 21v-5h5" />
  </svg>
);

const AlertCircle = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);