import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Search, Plus, Edit, Trash, Globe, Calendar, User, Check, X, Tag, Info } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

interface CulturalStory {
  id: string;
  title: string;
  content: string;
  storyteller: string;
  date_recorded: string;
  location: string;
  themes: string[];
  language: string;
  translation: string;
  verification_status: string;
  created_at: string;
  updated_at: string;
}

export const CulturalStoryLibrary: React.FC = () => {
  const [stories, setStories] = useState<CulturalStory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStory, setSelectedStory] = useState<CulturalStory | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<CulturalStory>>({
    title: '',
    content: '',
    storyteller: '',
    date_recorded: new Date().toISOString().split('T')[0],
    location: '',
    themes: [],
    language: '',
    translation: '',
    verification_status: 'unverified'
  });

  useEffect(() => {
    fetchStories();
  }, []);

  const fetchStories = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('cultural_stories')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStories(data || []);
    } catch (error) {
      console.error('Error fetching stories:', error);
      toast.error('Failed to load cultural stories');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (isEditing && selectedStory) {
        // Update existing story
        const { error } = await supabase
          .from('cultural_stories')
          .update(formData)
          .eq('id', selectedStory.id);

        if (error) throw error;
        toast.success('Story updated successfully');
      } else {
        // Create new story
        const { error } = await supabase
          .from('cultural_stories')
          .insert([formData]);

        if (error) throw error;
        toast.success('Story added successfully');
      }

      // Reset form and fetch updated stories
      setFormData({
        title: '',
        content: '',
        storyteller: '',
        date_recorded: new Date().toISOString().split('T')[0],
        location: '',
        themes: [],
        language: '',
        translation: '',
        verification_status: 'unverified'
      });
      setShowAddForm(false);
      setIsEditing(false);
      setSelectedStory(null);
      fetchStories();
    } catch (error) {
      console.error('Error saving story:', error);
      toast.error('Failed to save story');
    }
  };

  const handleEdit = (story: CulturalStory) => {
    setFormData({
      title: story.title,
      content: story.content,
      storyteller: story.storyteller,
      date_recorded: story.date_recorded ? new Date(story.date_recorded).toISOString().split('T')[0] : '',
      location: story.location,
      themes: story.themes,
      language: story.language,
      translation: story.translation,
      verification_status: story.verification_status
    });
    setSelectedStory(story);
    setIsEditing(true);
    setShowAddForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this story?')) return;

    try {
      const { error } = await supabase
        .from('cultural_stories')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Story deleted successfully');
      fetchStories();
    } catch (error) {
      console.error('Error deleting story:', error);
      toast.error('Failed to delete story');
    }
  };

  const filteredStories = stories.filter(story => 
    story.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    story.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (story.storyteller && story.storyteller.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (story.themes && story.themes.some(theme => theme.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  const getVerificationBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return (
          <span className="flex items-center space-x-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
            <Check className="w-3 h-3" />
            <span>Verified</span>
          </span>
        );
      case 'pending':
        return (
          <span className="flex items-center space-x-1 px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
            <Clock className="w-3 h-3" />
            <span>Pending</span>
          </span>
        );
      default:
        return (
          <span className="flex items-center space-x-1 px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">
            <Info className="w-3 h-3" />
            <span>Unverified</span>
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <BookOpen className="w-6 h-6 text-blue-500" />
          <h2 className="text-xl font-semibold text-gray-900">Cultural Stories</h2>
        </div>
        <button
          onClick={() => {
            setShowAddForm(true);
            setIsEditing(false);
            setFormData({
              title: '',
              content: '',
              storyteller: '',
              date_recorded: new Date().toISOString().split('T')[0],
              location: '',
              themes: [],
              language: '',
              translation: '',
              verification_status: 'unverified'
            });
          }}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Add Story</span>
        </button>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search stories by title, content, storyteller, or themes..."
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : filteredStories.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No stories found</h3>
          <p className="text-gray-500 mb-4">
            {searchTerm 
              ? `No results for "${searchTerm}"` 
              : 'Start by adding your first cultural story'}
          </p>
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Story
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredStories.map((story) => (
            <motion.div
              key={story.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="text-xl font-semibold text-gray-900">{story.title}</h3>
                    {getVerificationBadge(story.verification_status)}
                  </div>
                  
                  <p className="text-gray-600 mb-4 line-clamp-3">{story.content}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    {story.storyteller && (
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <User className="w-4 h-4 text-blue-500" />
                        <span className="font-medium">Storyteller:</span>
                        <span>{story.storyteller}</span>
                      </div>
                    )}
                    
                    {story.date_recorded && (
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <Calendar className="w-4 h-4 text-green-500" />
                        <span className="font-medium">Recorded:</span>
                        <span>{new Date(story.date_recorded).toLocaleDateString()}</span>
                      </div>
                    )}
                    
                    {story.location && (
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <MapPin className="w-4 h-4 text-red-500" />
                        <span className="font-medium">Location:</span>
                        <span>{story.location}</span>
                      </div>
                    )}
                  </div>
                  
                  {story.themes && story.themes.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {story.themes.map((theme, index) => (
                        <span key={index} className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs">
                          {theme}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="flex space-x-2 ml-4">
                  <button
                    onClick={() => handleEdit(story)}
                    className="p-2 text-gray-500 hover:text-blue-500 hover:bg-blue-50 rounded-full transition-colors"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(story.id)}
                    className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                  >
                    <Trash className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              <button
                onClick={() => setSelectedStory(
                  selectedStory?.id === story.id ? null : story
                )}
                className="mt-4 text-sm text-blue-600 hover:text-blue-800 flex items-center"
              >
                <span>{selectedStory?.id === story.id ? 'Hide full story' : 'Read full story'}</span>
              </button>
              
              {selectedStory?.id === story.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 pt-4 border-t border-gray-200"
                >
                  <div className="prose prose-sm max-w-none">
                    <p>{story.content}</p>
                  </div>
                  
                  {story.language && story.language !== 'english' && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Original Language: {story.language}</h4>
                      {story.translation && (
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h5 className="text-sm font-medium text-gray-700 mb-2">Translation</h5>
                          <p className="text-gray-600">{story.translation}</p>
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Add/Edit Story Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  {isEditing ? 'Edit Cultural Story' : 'Add New Cultural Story'}
                </h3>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter story title"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Story Content *
                  </label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={6}
                    placeholder="Enter the full story text"
                    required
                  ></textarea>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Storyteller
                    </label>
                    <input
                      type="text"
                      value={formData.storyteller}
                      onChange={(e) => setFormData({ ...formData, storyteller: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Who told this story?"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date Recorded
                    </label>
                    <input
                      type="date"
                      value={formData.date_recorded ? new Date(formData.date_recorded).toISOString().split('T')[0] : ''}
                      onChange={(e) => setFormData({ ...formData, date_recorded: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Location
                    </label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Where does this story take place?"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Language
                    </label>
                    <input
                      type="text"
                      value={formData.language}
                      onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Original language of the story"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Themes (comma separated)
                  </label>
                  <input
                    type="text"
                    value={formData.themes?.join(', ') || ''}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      themes: e.target.value.split(',').map(theme => theme.trim()).filter(theme => theme) 
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., family, resilience, tradition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Translation (if applicable)
                  </label>
                  <textarea
                    value={formData.translation}
                    onChange={(e) => setFormData({ ...formData, translation: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={4}
                    placeholder="If the story is in another language, provide an English translation"
                  ></textarea>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Verification Status
                  </label>
                  <select
                    value={formData.verification_status}
                    onChange={(e) => setFormData({ ...formData, verification_status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="unverified">Unverified</option>
                    <option value="pending">Pending Verification</option>
                    <option value="verified">Verified</option>
                  </select>
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
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    {isEditing ? 'Update Story' : 'Save Story'}
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