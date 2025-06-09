import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Search, Plus, Edit, Trash, MapPin, Users, Info, X, CalendarDays } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Modal } from './ui/Modal';
import { Card, CardBody } from './ui/Card';
import { EmptyState } from './EmptyState';
import { LoadingSpinner } from './LoadingSpinner';
import { formatDate } from '../lib/utils';

interface Celebration {
  id: string;
  name: string;
  description: string;
  date_or_season: string;
  significance: string;
  location: string;
  participants: string[];
  created_at: string;
  updated_at: string;
}

interface CelebrationFormData {
  name: string;
  description: string;
  date_or_season: string;
  significance: string;
  location: string;
  participants: string[];
}

export const CelebrationManager: React.FC = () => {
  const [celebrations, setCelebrations] = useState<Celebration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCelebration, setSelectedCelebration] = useState<Celebration | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [formData, setFormData] = useState<CelebrationFormData>({
    name: '',
    description: '',
    date_or_season: '',
    significance: '',
    location: '',
    participants: []
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchCelebrations();
  }, []);

  const fetchCelebrations = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('celebrations')
        .select('*')
        .order('date_or_season', { ascending: true });

      if (error) throw error;
      setCelebrations(data || []);
    } catch (error) {
      console.error('Error fetching celebrations:', error);
      toast.error('Failed to load celebrations');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      if (showEditForm && selectedCelebration) {
        // Update existing celebration
        const { error } = await supabase
          .from('celebrations')
          .update(formData)
          .eq('id', selectedCelebration.id);

        if (error) throw error;
        toast.success('Celebration updated successfully');
      } else {
        // Create new celebration
        const { error } = await supabase
          .from('celebrations')
          .insert([formData]);

        if (error) throw error;
        toast.success('Celebration added successfully');
      }

      // Reset form and fetch updated celebrations
      resetForm();
      fetchCelebrations();
    } catch (error) {
      console.error('Error saving celebration:', error);
      toast.error('Failed to save celebration');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (celebration: Celebration) => {
    setFormData({
      name: celebration.name,
      description: celebration.description || '',
      date_or_season: celebration.date_or_season || '',
      significance: celebration.significance || '',
      location: celebration.location || '',
      participants: celebration.participants || []
    });
    setSelectedCelebration(celebration);
    setShowEditForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this celebration?')) return;

    try {
      const { error } = await supabase
        .from('celebrations')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Celebration deleted successfully');
      fetchCelebrations();
    } catch (error) {
      console.error('Error deleting celebration:', error);
      toast.error('Failed to delete celebration');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      date_or_season: '',
      significance: '',
      location: '',
      participants: []
    });
    setShowAddForm(false);
    setShowEditForm(false);
    setSelectedCelebration(null);
  };

  const filteredCelebrations = celebrations.filter(celebration => 
    celebration.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (celebration.description && celebration.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (celebration.location && celebration.location.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Group celebrations by season or month
  const groupedCelebrations = filteredCelebrations.reduce((groups, celebration) => {
    const date = celebration.date_or_season;
    let group = 'Other';
    
    // Try to determine if it's a date or season
    if (date) {
      if (['spring', 'summer', 'fall', 'autumn', 'winter'].some(season => 
        date.toLowerCase().includes(season)
      )) {
        group = date;
      } else if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        // ISO date format
        const month = new Date(date).toLocaleString('default', { month: 'long' });
        group = month;
      } else {
        group = date;
      }
    }
    
    if (!groups[group]) {
      groups[group] = [];
    }
    groups[group].push(celebration);
    return groups;
  }, {} as Record<string, Celebration[]>);

  const renderCelebrationForm = () => (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Name *"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        placeholder="Enter celebration name"
        required
      />

      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          rows={3}
          placeholder="Describe this celebration"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Date or Season"
          value={formData.date_or_season}
          onChange={(e) => setFormData({ ...formData, date_or_season: e.target.value })}
          placeholder="e.g., December 25 or Winter"
        />

        <Input
          label="Location"
          value={formData.location}
          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          placeholder="Where is this celebration held?"
        />
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Significance
        </label>
        <textarea
          value={formData.significance}
          onChange={(e) => setFormData({ ...formData, significance: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          rows={3}
          placeholder="What is the cultural or personal significance of this celebration?"
        />
      </div>

      <Input
        label="Participants (comma separated)"
        value={formData.participants?.join(', ') || ''}
        onChange={(e) => setFormData({ 
          ...formData, 
          participants: e.target.value.split(',').map(p => p.trim()).filter(p => p) 
        })}
        placeholder="Family members, community, etc."
      />

      <div className="flex space-x-3 pt-4">
        <Button
          type="button"
          onClick={resetForm}
          variant="outline"
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          isLoading={isSubmitting}
          className="flex-1"
        >
          {showEditForm ? 'Update Celebration' : 'Save Celebration'}
        </Button>
      </div>
    </form>
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Calendar className="w-6 h-6 text-blue-500" />
          <h2 className="text-xl font-semibold text-gray-900">Celebrations & Events</h2>
        </div>
        <Button
          onClick={() => setShowAddForm(true)}
          leftIcon={<Plus className="w-5 h-5" />}
        >
          Add Celebration
        </Button>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search celebrations by name, description, or location..."
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" text="Loading celebrations..." />
        </div>
      ) : filteredCelebrations.length === 0 ? (
        <EmptyState
          icon={<Calendar className="w-8 h-8" />}
          title="No celebrations found"
          description={
            searchTerm 
              ? `No results for "${searchTerm}"` 
              : 'Start by adding your first celebration or cultural event'
          }
          action={{
            label: "Add Celebration",
            onClick: () => setShowAddForm(true)
          }}
        />
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedCelebrations).map(([group, groupCelebrations]) => (
            <div key={group}>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <CalendarDays className="w-5 h-5 text-blue-500 mr-2" />
                {group}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {groupCelebrations.map((celebration) => (
                  <motion.div
                    key={celebration.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">{celebration.name}</h3>
                        <p className="text-gray-600 text-sm mb-3">{celebration.description}</p>
                      </div>
                      
                      <div className="flex space-x-1">
                        <button
                          onClick={() => handleEdit(celebration)}
                          className="p-1 text-gray-500 hover:text-blue-500 hover:bg-blue-50 rounded-full transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(celebration.id)}
                          className="p-1 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 mt-3">
                      {celebration.date_or_season && (
                        <div className="flex items-center space-x-2 text-sm">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-700">{celebration.date_or_season}</span>
                        </div>
                      )}
                      
                      {celebration.location && (
                        <div className="flex items-center space-x-2 text-sm">
                          <MapPin className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-700">{celebration.location}</span>
                        </div>
                      )}
                    </div>
                    
                    {celebration.participants && celebration.participants.length > 0 && (
                      <div className="mt-3 flex items-center space-x-2">
                        <Users className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-700">
                          {celebration.participants.length} participant{celebration.participants.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    )}
                    
                    <button
                      onClick={() => setSelectedCelebration(
                        selectedCelebration?.id === celebration.id ? null : celebration
                      )}
                      className="mt-3 text-sm text-blue-600 hover:text-blue-800 flex items-center"
                    >
                      <Info className="w-4 h-4 mr-1" />
                      <span>{selectedCelebration?.id === celebration.id ? 'Hide details' : 'View details'}</span>
                    </button>
                    
                    {selectedCelebration?.id === celebration.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-3 pt-3 border-t border-gray-100"
                      >
                        {celebration.significance && (
                          <div className="mb-3">
                            <h4 className="text-sm font-medium text-gray-700 mb-1">Significance</h4>
                            <p className="text-sm text-gray-600">{celebration.significance}</p>
                          </div>
                        )}
                        
                        {celebration.participants && celebration.participants.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-1">Participants</h4>
                            <div className="flex flex-wrap gap-2">
                              {celebration.participants.map((participant, index) => (
                                <span key={index} className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs">
                                  {participant}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Celebration Form Modal */}
      <Modal
        isOpen={showAddForm}
        onClose={() => setShowAddForm(false)}
        title="Add New Celebration"
        size="lg"
      >
        {renderCelebrationForm()}
      </Modal>

      {/* Edit Celebration Form Modal */}
      <Modal
        isOpen={showEditForm}
        onClose={() => setShowEditForm(false)}
        title="Edit Celebration"
        size="lg"
      >
        {renderCelebrationForm()}
      </Modal>
    </div>
  );
};