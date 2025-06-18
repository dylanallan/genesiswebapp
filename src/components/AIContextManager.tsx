import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Brain, Upload, FileText, Trash, Plus, Search, Loader2, Database, RefreshCw, X, MemoryStick as Memory } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<'knowledge' | 'memory'>('knowledge');
  const [conversationMemory, setConversationMemory] = useState<{
    id: string;
    sessionId: string;
    messages: number;
    lastActive: Date;
  }[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (activeTab === 'knowledge') {
      loadContentItems();
    } else {
      loadConversationMemory();
    }
  }, [activeTab]);

  const loadContentItems = async () => {
    try {
      setIsLoading(true);
      
      // Get content items from the database
      const { data, error } = await supabase
        .from('ai_embeddings')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Convert to ContentItem format
      const items: ContentItem[] = data?.map(item => ({
        id: item.id,
        contentType: item.content_type,
        contentId: item.content_id,
        content: item.content,
        metadata: item.metadata || {},
        createdAt: new Date(item.created_at)
      })) || [];
      
      setContentItems(items);
    } catch (error) {
      console.error('Error loading content items:', error);
      toast.error('Failed to load knowledge base');
      
      // Fallback to mock data if database query fails
      const mockItems: ContentItem[] = [
        {
          id: '1',
          contentType: 'document',
          contentId: 'business-automation-guide.txt',
          content: 'Business automation is the technology-enabled automation of complex business processes. It can streamline a business for simplicity, achieve digital transformation, increase service quality, improve service delivery or contain costs.',
          metadata: {
            fileName: 'business-automation-guide.txt',
            fileSize: 1024,
            fileType: 'text/plain',
            uploadDate: new Date().toISOString()
          },
          createdAt: new Date()
        },
        {
          id: '2',
          contentType: 'note',
          contentId: 'cultural-heritage-notes',
          content: 'Cultural heritage is the legacy of physical artifacts and intangible attributes of a group or society that is inherited from past generations. It includes tangible culture (such as buildings, monuments, landscapes, books, works of art, and artifacts), intangible culture (such as folklore, traditions, language, and knowledge), and natural heritage (including culturally significant landscapes, and biodiversity).',
          metadata: {
            source: 'manual',
            addedDate: new Date().toISOString()
          },
          createdAt: new Date(Date.now() - 86400000)
        }
      ];
      
      setContentItems(mockItems);
    } finally {
      setIsLoading(false);
    }
  };

  const loadConversationMemory = async () => {
    try {
      setIsLoading(true);
      
      // Get conversation sessions from the database
      const { data, error } = await supabase
        .from('ai_conversation_history')
        .select('session_id, created_at')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Group by session_id
      const sessionMap = new Map<string, { count: number, lastActive: Date }>();
      
      data?.forEach(item => {
        if (!sessionMap.has(item.session_id)) {
          sessionMap.set(item.session_id, { count: 0, lastActive: new Date(item.created_at) });
        }
        
        const session = sessionMap.get(item.session_id)!;
        session.count++;
        
        // Update last active if this message is more recent
        const messageDate = new Date(item.created_at);
        if (messageDate > session.lastActive) {
          session.lastActive = messageDate;
        }
      });
      
      // Convert to array
      const memory = Array.from(sessionMap.entries()).map(([sessionId, info]) => ({
        id: crypto.randomUUID(),
        sessionId,
        messages: info.count,
        lastActive: info.lastActive
      }));
      
      setConversationMemory(memory);
    } catch (error) {
      console.error('Error loading conversation memory:', error);
      toast.error('Failed to load conversation memory');
      
      // Fallback to empty array
      setConversationMemory([]);
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

  const readFileContent = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          resolve(event.target.result as string);
        } else {
          reject(new Error('Failed to read file'));
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    });
  };

  const uploadFile = async () => {
    if (!selectedFile) return;
    
    try {
      setIsUploading(true);
      
      // Read file content
      const content = await readFileContent(selectedFile);
      
      // Process content through the edge function
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('Authentication required');
      }
      
      // Try to use the edge function if available
      try {
        const response = await fetch(`${supabase.supabaseUrl}/functions/v1/process-content`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content,
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
          throw new Error(`Processing error: ${response.status} ${response.statusText}`);
        }
        
        const result = await response.json();
        toast.success(`File processed into ${result.chunks} chunks`);
      } catch (edgeFunctionError) {
        console.error('Edge function error:', edgeFunctionError);
        
        // Fallback: Store directly in the database
        const { error } = await supabase
          .from('ai_embeddings')
          .insert({
            user_id: (await supabase.auth.getUser()).data.user?.id,
            content_type: 'document',
            content_id: selectedFile.name,
            content: content.substring(0, 10000), // Limit content size
            embedding: null, // No embedding in fallback mode
            metadata: {
              fileName: selectedFile.name,
              fileSize: selectedFile.size,
              fileType: selectedFile.type,
              uploadDate: new Date().toISOString()
            }
          });
        
        if (error) throw error;
      }
      
      // Add to local state
      const newItem: ContentItem = {
        id: crypto.randomUUID(),
        contentType: 'document',
        contentId: selectedFile.name,
        content: content.substring(0, 300) + '...',
        metadata: {
          fileName: selectedFile.name,
          fileSize: selectedFile.size,
          fileType: selectedFile.type,
          uploadDate: new Date().toISOString()
        },
        createdAt: new Date()
      };
      
      setContentItems(prev => [newItem, ...prev]);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      toast.success('File uploaded and processed successfully');
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
      
      // Process content through the edge function
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('Authentication required');
      }
      
      const contentId = `manual-${Date.now()}`;
      
      // Try to use the edge function if available
      try {
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
          throw new Error(`Processing error: ${response.status} ${response.statusText}`);
        }
        
        const result = await response.json();
        toast.success(`Content processed into ${result.chunks} chunks`);
      } catch (edgeFunctionError) {
        console.error('Edge function error:', edgeFunctionError);
        
        // Fallback: Store directly in the database
        const { error } = await supabase
          .from('ai_embeddings')
          .insert({
            user_id: (await supabase.auth.getUser()).data.user?.id,
            content_type: contentType,
            content_id: contentId,
            content: contentText,
            embedding: null, // No embedding in fallback mode
            metadata: {
              source: 'manual',
              addedDate: new Date().toISOString()
            }
          });
        
        if (error) throw error;
      }
      
      // Add to local state
      const newItem: ContentItem = {
        id: crypto.randomUUID(),
        contentType,
        contentId,
        content: contentText,
        metadata: {
          source: 'manual',
          addedDate: new Date().toISOString()
        },
        createdAt: new Date()
      };
      
      setContentItems(prev => [newItem, ...prev]);
      setContentText('');
      setShowAddForm(false);
      
      toast.success('Content added successfully');
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
      // Delete from database
      const { error } = await supabase
        .from('ai_embeddings')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      // Update local state
      setContentItems(prev => prev.filter(item => item.id !== id));
      toast.success('Content deleted successfully');
    } catch (error) {
      console.error('Error deleting content:', error);
      toast.error('Failed to delete content');
    }
  };

  const deleteMemory = async (sessionId: string) => {
    if (!confirm('Are you sure you want to delete this conversation memory?')) return;
    
    try {
      // Delete from database
      const { error } = await supabase
        .from('ai_conversation_history')
        .delete()
        .eq('session_id', sessionId);
      
      if (error) throw error;
      
      // Update local state
      setConversationMemory(prev => prev.filter(item => item.sessionId !== sessionId));
      toast.success('Conversation memory deleted successfully');
    } catch (error) {
      console.error('Error deleting memory:', error);
      toast.error('Failed to delete memory');
    }
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
              <h2 className="text-xl font-semibold text-gray-900">AI Context Manager</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <div className="flex space-x-4 mt-4">
            <button
              onClick={() => setActiveTab('knowledge')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'knowledge'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Database className="w-5 h-5" />
                <span>Knowledge Base</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('memory')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'memory'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Memory className="w-5 h-5" />
                <span>Conversation Memory</span>
              </div>
            </button>
          </div>
        </div>
        
        <div className="p-6 flex-1 overflow-y-auto">
          {activeTab === 'knowledge' ? (
            <>
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
                      <X className="w-5 h-5" />
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
            </>
          ) : (
            <>
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-medium text-gray-900">Conversation Memory</h3>
                <p className="text-sm text-gray-500">
                  The AI assistant uses these memories to maintain context across conversations
                </p>
              </div>
              
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
                </div>
              ) : conversationMemory.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <Memory className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No conversation memory found</h3>
                  <p className="text-gray-500 mb-4">
                    Start a conversation with the AI assistant to create memories
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {conversationMemory.map((memory) => (
                    <div
                      key={memory.id}
                      className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          <Memory className="w-5 h-5 text-blue-500" />
                          <div>
                            <h4 className="font-medium text-gray-900">Session {memory.sessionId.substring(0, 8)}...</h4>
                            <p className="text-sm text-gray-500">
                              Last active on {memory.lastActive.toLocaleDateString()} at {memory.lastActive.toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => deleteMemory(memory.sessionId)}
                          className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full transition-colors"
                        >
                          <Trash className="w-5 h-5" />
                        </button>
                      </div>
                      
                      <div className="mt-3 flex items-center justify-between">
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                          {memory.messages} messages
                        </span>
                        <button
                          onClick={() => {
                            // View memory details (in a real implementation)
                            toast.info('Memory details view not implemented in this demo');
                          }}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
        
        <div className="p-6 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              {activeTab === 'knowledge' 
                ? `${contentItems.length} items in knowledge base`
                : `${conversationMemory.length} conversation memories`}
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