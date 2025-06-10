import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Brain, 
  Upload, 
  FileText, 
  Trash, 
  Plus, 
  Search, 
  Loader2, 
  CheckCircle, 
  AlertTriangle,
  Database,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';

interface AIContextManagerProps {
  onClose: () => void;
}

interface ContentItem {
  id: string;
  contentType: string;
  contentId: string;
  content: string;
  metadata: Record<string, any>;
  createdAt: Date;
}

export const AIContextManager: React.FC<AIContextManagerProps> = ({ onClose }) => {
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [contentType, setContentType] = useState('document');
  const [contentText, setContentText] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadContentItems();
  }, []);

  const loadContentItems = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('ai_embeddings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const items: ContentItem[] = (data || []).map(item => ({
        id: item.id,
        contentType: item.content_type,
        contentId: item.content_id,
        content: item.content,
        metadata: item.metadata,
        createdAt: new Date(item.created_at)
      }));
      
      setContentItems(items);
    } catch (error) {
      console.error('Error loading content items:', error);
      toast.error('Failed to load content items');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const uploadFile = async () => {
    if (!selectedFile) return;
    
    try {
      setIsUploading(true);
      
      // Read file content
      const text = await readFileAsText(selectedFile);
      
      // Call the edge function to process and store the content
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('Authentication required');
      }
      
      const response = await fetch(`${supabase.supabaseUrl}/functions/v1/process-content`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: text,
          contentType: 'document',
          contentId: selectedFile.name,
          metadata: {
            fileName: selectedFile.name,
            fileSize: selectedFile.size,
            fileType: selectedFile.type,
            uploadDate: new Date().toISOString()
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to process content: ${response.statusText}`);
      }
      
      toast.success('File uploaded and processed successfully');
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // Reload content items
      loadContentItems();
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Failed to upload file');
    } finally {
      setIsUploading(false);
    }
  };

  const addContent = async () => {
    if (!contentText.trim()) {
      toast.error('Content cannot be empty');
      return;
    }
    
    try {
      setIsUploading(true);
      
      // Call the edge function to process and store the content
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('Authentication required');
      }
      
      const contentId = `manual-${Date.now()}`;
      
      const response = await fetch(`${supabase.supabaseUrl}/functions/v1/process-content`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: contentText,
          contentType,
          contentId,
          metadata: {
            source: 'manual',
            addedDate: new Date().toISOString()
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to process content: ${response.statusText}`);
      }
      
      toast.success('Content added successfully');
      setContentText('');
      setShowAddForm(false);
      
      // Reload content items
      loadContentItems();
    } catch (error) {
      console.error('Error adding content:', error);
      toast.error('Failed to add content');
    } finally {
      setIsUploading(false);
    }
  };

  const deleteContent = async (id: string) => {
    if (!confirm('Are you sure you want to delete this content?')) return;
    
    try {
      const { error } = await supabase
        .from('ai_embeddings')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Content deleted successfully');
      
      // Update local state
      setContentItems(prev => prev.filter(item => item.id !== id));
    } catch (error) {
      console.error('Error deleting content:', error);
      toast.error('Failed to delete content');
    }
  };

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'document':
        return <FileText className="w-5 h-5 text-blue-500" />;
      case 'note':
        return <FileText className="w-5 h-5 text-green-500" />;
      case 'reference':
        return <FileText className="w-5 h-5 text-purple-500" />;
      default:
        return <FileText className="w-5 h-5 text-gray-500" />;
    }
  };

  const filteredItems = contentItems.filter(item => 
    item.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.contentType.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.contentId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col"
      >
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Brain className="w-6 h-6 text-blue-500" />
              <h2 className="text-xl font-semibold text-gray-900">AI Knowledge Base Manager</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        <div className="p-6 flex-1 overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="relative flex-1 max-w-lg">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search knowledge base..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowAddForm(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                <span>Add Content</span>
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Upload className="w-5 h-5" />
                <span>Upload File</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.md,.csv,.json"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          </div>
          
          {selectedFile && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-100 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <FileText className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="font-medium text-blue-900">{selectedFile.name}</p>
                  <p className="text-sm text-blue-700">{(selectedFile.size / 1024).toFixed(2)} KB</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setSelectedFile(null)}
                  className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full transition-colors"
                >
                  <Trash className="w-5 h-5" />
                </button>
                <button
                  onClick={uploadFile}
                  disabled={isUploading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {isUploading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    'Process File'
                  )}
                </button>
              </div>
            </div>
          )}
          
          {showAddForm && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-gray-900">Add New Content</h3>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Content Type
                  </label>
                  <select
                    value={contentType}
                    onChange={(e) => setContentType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="document">Document</option>
                    <option value="note">Note</option>
                    <option value="reference">Reference</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Content
                  </label>
                  <textarea
                    value={contentText}
                    onChange={(e) => setContentText(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={8}
                    placeholder="Enter content to add to the AI knowledge base..."
                  />
                </div>
                
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => setShowAddForm(false)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={addContent}
                    disabled={isUploading || !contentText.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {isUploading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      'Add Content'
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <Database className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No content found</h3>
              <p className="text-gray-500 mb-4">
                {searchTerm 
                  ? `No results for "${searchTerm}"` 
                  : 'Add content to your AI knowledge base to enhance responses'}
              </p>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => setShowAddForm(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add Content
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Upload File
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      {getContentTypeIcon(item.contentType)}
                      <div>
                        <h4 className="font-medium text-gray-900">{item.contentId}</h4>
                        <p className="text-sm text-gray-500">
                          Added on {item.createdAt.toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteContent(item.id)}
                      className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full transition-colors"
                    >
                      <Trash className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg max-h-32 overflow-y-auto">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {item.content.length > 300 
                        ? `${item.content.substring(0, 300)}...` 
                        : item.content}
                    </p>
                  </div>
                  
                  <div className="mt-3 flex items-center space-x-2">
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                      {item.contentType}
                    </span>
                    {item.metadata?.fileType && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                        {item.metadata.fileType}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="p-6 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              {contentItems.length} items in knowledge base
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};