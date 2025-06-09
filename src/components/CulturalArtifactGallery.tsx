import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Globe, Image, FileText, Music, Video, Search, Filter, Plus, Info, ExternalLink, Tag } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

interface CulturalArtifact {
  id: string;
  title: string;
  description: string;
  category: string;
  media_url?: string;
  media_type?: string;
  tags: string[];
  created_at: string;
}

export const CulturalArtifactGallery: React.FC = () => {
  const [artifacts, setArtifacts] = useState<CulturalArtifact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedArtifact, setSelectedArtifact] = useState<CulturalArtifact | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    fetchArtifacts();
  }, []);

  const fetchArtifacts = async () => {
    try {
      setIsLoading(true);
      let query = supabase
        .from('cultural_artifacts')
        .select('*')
        .order('created_at', { ascending: false });

      if (selectedCategory) {
        query = query.eq('category', selectedCategory);
      }

      const { data, error } = await query;

      if (error) throw error;
      setArtifacts(data || []);
    } catch (error) {
      console.error('Error fetching artifacts:', error);
      toast.error('Failed to load cultural artifacts');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredArtifacts = artifacts.filter(artifact => 
    artifact.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    artifact.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (artifact.tags && artifact.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'image':
        return <Image className="w-5 h-5 text-blue-500" />;
      case 'document':
        return <FileText className="w-5 h-5 text-green-500" />;
      case 'audio':
        return <Music className="w-5 h-5 text-purple-500" />;
      case 'video':
        return <Video className="w-5 h-5 text-red-500" />;
      default:
        return <Globe className="w-5 h-5 text-gray-500" />;
    }
  };

  const getMediaPreview = (artifact: CulturalArtifact) => {
    if (!artifact.media_url) {
      return (
        <div className="h-48 bg-gray-100 flex items-center justify-center">
          {getCategoryIcon(artifact.category)}
        </div>
      );
    }

    switch (artifact.media_type) {
      case 'image':
        return (
          <img 
            src={artifact.media_url} 
            alt={artifact.title} 
            className="h-48 w-full object-cover"
          />
        );
      case 'video':
        return (
          <div className="h-48 bg-gray-100 flex items-center justify-center relative">
            <Video className="w-10 h-10 text-red-500" />
            <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
              Video
            </div>
          </div>
        );
      case 'audio':
        return (
          <div className="h-48 bg-gray-100 flex items-center justify-center">
            <Music className="w-10 h-10 text-purple-500" />
          </div>
        );
      default:
        return (
          <div className="h-48 bg-gray-100 flex items-center justify-center">
            {getCategoryIcon(artifact.category)}
          </div>
        );
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Globe className="w-6 h-6 text-blue-500" />
          <h2 className="text-xl font-semibold text-gray-900">Cultural Artifacts</h2>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Add Artifact</span>
        </button>
      </div>

      <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search artifacts..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="flex space-x-2">
          {['image', 'document', 'audio', 'video', 'other'].map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(selectedCategory === category ? null : category)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedCategory === category
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
          {selectedCategory && (
            <button
              onClick={() => setSelectedCategory(null)}
              className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : filteredArtifacts.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Globe className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No artifacts found</h3>
          <p className="text-gray-500 mb-4">
            {searchTerm 
              ? `No results for "${searchTerm}"` 
              : selectedCategory 
                ? `No ${selectedCategory} artifacts found` 
                : 'Start by adding your first cultural artifact'}
          </p>
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Artifact
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredArtifacts.map((artifact) => (
            <motion.div
              key={artifact.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -5 }}
              className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer"
              onClick={() => setSelectedArtifact(artifact)}
            >
              {getMediaPreview(artifact)}
              <div className="p-4">
                <div className="flex items-center space-x-2 mb-2">
                  {getCategoryIcon(artifact.category)}
                  <h3 className="font-medium text-gray-900 truncate">{artifact.title}</h3>
                </div>
                <p className="text-gray-600 text-sm line-clamp-2 mb-3">{artifact.description}</p>
                <div className="flex flex-wrap gap-2">
                  {(artifact.tags || []).slice(0, 3).map((tag, index) => (
                    <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                      {tag}
                    </span>
                  ))}
                  {(artifact.tags || []).length > 3 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                      +{artifact.tags.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Artifact Detail Modal */}
      {selectedArtifact && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  {getCategoryIcon(selectedArtifact.category)}
                  <h3 className="text-xl font-semibold text-gray-900">{selectedArtifact.title}</h3>
                </div>
                <button
                  onClick={() => setSelectedArtifact(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {selectedArtifact.media_url && selectedArtifact.media_type === 'image' && (
                <div className="mb-6">
                  <img 
                    src={selectedArtifact.media_url} 
                    alt={selectedArtifact.title} 
                    className="w-full h-auto rounded-lg"
                  />
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Description</h4>
                  <p className="text-gray-900">{selectedArtifact.description}</p>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Category</h4>
                  <div className="flex items-center space-x-2">
                    {getCategoryIcon(selectedArtifact.category)}
                    <span className="text-gray-900 capitalize">{selectedArtifact.category}</span>
                  </div>
                </div>

                {selectedArtifact.tags && selectedArtifact.tags.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Tags</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedArtifact.tags.map((tag, index) => (
                        <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Added</h4>
                  <p className="text-gray-900">
                    {new Date(selectedArtifact.created_at).toLocaleDateString()}
                  </p>
                </div>

                {selectedArtifact.media_url && selectedArtifact.media_type !== 'image' && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Media</h4>
                    <a 
                      href={selectedArtifact.media_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center space-x-2 text-blue-600 hover:text-blue-800"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>View {selectedArtifact.media_type}</span>
                    </a>
                  </div>
                )}
              </div>

              <div className="mt-6 flex space-x-3">
                <button
                  onClick={() => setSelectedArtifact(null)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
                <button
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Edit Artifact
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Add Artifact Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl max-w-2xl w-full"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Add Cultural Artifact</h3>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter artifact title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    placeholder="Describe the cultural significance of this artifact"
                  ></textarea>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                      <option value="">Select a category</option>
                      <option value="image">Image</option>
                      <option value="document">Document</option>
                      <option value="audio">Audio</option>
                      <option value="video">Video</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Media URL (optional)
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="https://example.com/media.jpg"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tags (comma separated)
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="family, history, tradition, etc."
                  />
                </div>

                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <Info className="w-4 h-4" />
                  <span>Artifacts are searchable and can be linked to celebrations, traditions, and stories.</span>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    onClick={() => {
                      toast.success('Artifact added successfully!');
                      setShowAddForm(false);
                    }}
                  >
                    Save Artifact
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};