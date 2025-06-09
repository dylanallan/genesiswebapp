import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Globe, Image, FileText, Music, Video, Search, Filter, Plus, Info, ExternalLink, Tag, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Modal } from './ui/Modal';
import { Card, CardBody } from './ui/Card';
import { CulturalArtifactForm } from './CulturalArtifactForm';
import { EmptyState } from './EmptyState';
import { LoadingSpinner } from './LoadingSpinner';

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
  const [showEditForm, setShowEditForm] = useState(false);

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

  const handleDeleteArtifact = async (id: string) => {
    if (!confirm('Are you sure you want to delete this artifact?')) return;

    try {
      const { error } = await supabase
        .from('cultural_artifacts')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Artifact deleted successfully');
      setArtifacts(artifacts.filter(artifact => artifact.id !== id));
      setSelectedArtifact(null);
    } catch (error) {
      console.error('Error deleting artifact:', error);
      toast.error('Failed to delete artifact');
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
        <Button
          onClick={() => setShowAddForm(true)}
          leftIcon={<Plus className="w-5 h-5" />}
        >
          Add Artifact
        </Button>
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
          <LoadingSpinner size="lg" text="Loading artifacts..." />
        </div>
      ) : filteredArtifacts.length === 0 ? (
        <EmptyState
          icon={<Globe className="w-8 h-8" />}
          title="No artifacts found"
          description={
            searchTerm 
              ? `No results for "${searchTerm}"` 
              : selectedCategory 
                ? `No ${selectedCategory} artifacts found` 
                : 'Start by adding your first cultural artifact'
          }
          action={{
            label: "Add Artifact",
            onClick: () => setShowAddForm(true)
          }}
        />
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
      <Modal
        isOpen={!!selectedArtifact}
        onClose={() => setSelectedArtifact(null)}
        title={selectedArtifact?.title || ''}
        size="lg"
      >
        {selectedArtifact && (
          <div className="space-y-6">
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

            <div className="flex space-x-3 pt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setSelectedArtifact(null)}
              >
                Close
              </Button>
              <Button
                className="flex-1"
                onClick={() => {
                  setShowEditForm(true);
                }}
              >
                Edit Artifact
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  handleDeleteArtifact(selectedArtifact.id);
                }}
              >
                Delete
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Add Artifact Form Modal */}
      <Modal
        isOpen={showAddForm}
        onClose={() => setShowAddForm(false)}
        title="Add Cultural Artifact"
        size="lg"
      >
        <CulturalArtifactForm
          onClose={() => setShowAddForm(false)}
          onSuccess={fetchArtifacts}
        />
      </Modal>

      {/* Edit Artifact Form Modal */}
      <Modal
        isOpen={showEditForm && !!selectedArtifact}
        onClose={() => setShowEditForm(false)}
        title="Edit Cultural Artifact"
        size="lg"
      >
        {selectedArtifact && (
          <CulturalArtifactForm
            onClose={() => setShowEditForm(false)}
            onSuccess={() => {
              fetchArtifacts();
              setSelectedArtifact(null);
            }}
            initialData={selectedArtifact}
            isEditing
          />
        )}
      </Modal>
    </div>
  );
};