import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Globe, Image, FileText, Music, Video, Search, Filter, Plus, Info, ExternalLink, Tag, X } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';

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
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedArtifact, setSelectedArtifact] = useState<CulturalArtifact | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    media_url: '',
    media_type: '',
    tags: [] as string[]
  });
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    fetchArtifacts();
  }, []);

  const fetchArtifacts = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('cultural_artifacts')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setArtifacts(data || []);
    } catch (error) {
      toast.error('Failed to load artifacts');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredArtifacts = artifacts.filter(artifact => 
    artifact.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    artifact.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (artifact.tags && artifact.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())))
  ).filter(artifact => 
    !selectedCategory || artifact.category === selectedCategory
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

  const handleAddArtifact = () => {
    setShowAddForm(true);
    setFormData({
      title: '',
      description: '',
      category: '',
      media_url: '',
      media_type: '',
      tags: []
    });
  };

  const handleEditArtifact = (artifact: CulturalArtifact) => {
    setShowEditForm(true);
    setSelectedArtifact(artifact);
    setFormData({
      title: artifact.title,
      description: artifact.description,
      category: artifact.category,
      media_url: artifact.media_url || '',
      media_type: artifact.media_type || '',
      tags: artifact.tags || []
    });
  };

  const handleDeleteArtifact = async (id: string) => {
    if (!confirm('Are you sure you want to delete this artifact?')) return;
    setIsLoading(true);
    try {
      const { error } = await supabase.from('cultural_artifacts').delete().eq('id', id);
      if (error) throw error;
      setArtifacts(artifacts.filter(a => a.id !== id));
      setSelectedArtifact(null);
      toast.success('Artifact deleted successfully');
    } catch (error) {
      toast.error('Failed to delete artifact');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.category) {
      toast.error('Title and category are required');
      return;
    }
    setIsLoading(true);
    try {
      if (showEditForm && selectedArtifact) {
        // Update
        const { error } = await supabase
          .from('cultural_artifacts')
          .update(formData)
          .eq('id', selectedArtifact.id);
        if (error) throw error;
        toast.success('Artifact updated successfully');
      } else {
        // Add
        const { error } = await supabase
          .from('cultural_artifacts')
          .insert([{ ...formData }]);
        if (error) throw error;
        toast.success('Artifact added successfully');
      }
      setShowAddForm(false);
      setShowEditForm(false);
      setSelectedArtifact(null);
      setFormData({
        title: '',
        description: '',
        category: '',
        media_url: '',
        media_type: '',
        tags: []
      });
      fetchArtifacts();
    } catch (error) {
      toast.error('Failed to save artifact');
    } finally {
      setIsLoading(false);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()]
      });
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(t => t !== tag)
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Globe className="w-6 h-6 text-blue-500" />
          <h2 className="text-xl font-semibold text-gray-900">Cultural Artifacts</h2>
        </div>
        <button
          onClick={handleAddArtifact}
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
            onClick={handleAddArtifact}
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">{selectedArtifact.title}</h3>
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

              <div className="flex space-x-3 pt-6 mt-6 border-t border-gray-200">
                <button
                  onClick={() => setSelectedArtifact(null)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    handleEditArtifact(selectedArtifact);
                    setSelectedArtifact(null);
                  }}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Edit Artifact
                </button>
                <button
                  onClick={() => {
                    handleDeleteArtifact(selectedArtifact.id);
                  }}
                  className="px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Add/Edit Artifact Form Modal */}
      {(showAddForm || showEditForm) && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  {showEditForm ? "Edit Cultural Artifact" : "Add Cultural Artifact"}
                </h3>
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setShowEditForm(false);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleFormSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter artifact title"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    placeholder="Describe the cultural significance of this artifact"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Category *
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="">Select a category</option>
                      <option value="image">Image</option>
                      <option value="document">Document</option>
                      <option value="audio">Audio</option>
                      <option value="video">Video</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Media URL (optional)
                    </label>
                    <input
                      type="text"
                      value={formData.media_url}
                      onChange={(e) => setFormData({ ...formData, media_url: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="https://example.com/media.jpg"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Tags
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addTag();
                        }
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Add a tag and press Enter"
                    />
                    <button
                      type="button"
                      onClick={addTag}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.tags.map((tag, index) => (
                      <div
                        key={index}
                        className="flex items-center space-x-1 px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                      >
                        <span>{tag}</span>
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false);
                      setShowEditForm(false);
                    }}
                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    {showEditForm ? 'Update Artifact' : 'Save Artifact'}
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