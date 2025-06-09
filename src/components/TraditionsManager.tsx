import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Globe, Calendar, Users, MapPin, Clock, Plus, Edit, Trash, Search, Filter, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

interface Tradition {
  id: string;
  name: string;
  description: string;
  origin: string;
  historical_context: string;
  modern_application: string;
  frequency: string;
  participants: string[];
  created_at: string;
  updated_at: string;
}

export const TraditionsManager: React.FC = () => {
  const [traditions, setTraditions] = useState<Tradition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTradition, setSelectedTradition] = useState<Tradition | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Tradition>>({
    name: '',
    description: '',
    origin: '',
    historical_context: '',
    modern_application: '',
    frequency: '',
    participants: []
  });

  useEffect(() => {
    fetchTraditions();
  }, []);

  const fetchTraditions = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('traditions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTraditions(data || []);
    } catch (error) {
      console.error('Error fetching traditions:', error);
      toast.error('Failed to load traditions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (isEditing && selectedTradition) {
        // Update existing tradition
        const { error } = await supabase
          .from('traditions')
          .update(formData)
          .eq('id', selectedTradition.id);

        if (error) throw error;
        toast.success('Tradition updated successfully');
      } else {
        // Create new tradition
        const { error } = await supabase
          .from('traditions')
          .insert([formData]);

        if (error) throw error;
        toast.success('Tradition added successfully');
      }

      // Reset form and fetch updated traditions
      setFormData({
        name: '',
        description: '',
        origin: '',
        historical_context: '',
        modern_application: '',
        frequency: '',
        participants: []
      });
      setShowAddForm(false);
      setIsEditing(false);
      setSelectedTradition(null);
      fetchTraditions();
    } catch (error) {
      console.error('Error saving tradition:', error);
      toast.error('Failed to save tradition');
    }
  };

  const handleEdit = (tradition: Tradition) => {
    setFormData({
      name: tradition.name,
      description: tradition.description,
      origin: tradition.origin,
      historical_context: tradition.historical_context,
      modern_application: tradition.modern_application,
      frequency: tradition.frequency,
      participants: tradition.participants
    });
    setSelectedTradition(tradition);
    setIsEditing(true);
    setShowAddForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this tradition?')) return;

    try {
      const { error } = await supabase
        .from('traditions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Tradition deleted successfully');
      fetchTraditions();
    } catch (error) {
      console.error('Error deleting tradition:', error);
      toast.error('Failed to delete tradition');
    }
  };

  const filteredTraditions = traditions.filter(tradition => 
    tradition.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tradition.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tradition.origin.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Globe className="w-6 h-6 text-blue-500" />
          <h2 className="text-xl font-semibold text-gray-900">Cultural Traditions</h2>
        </div>
        <button
          onClick={() => {
            setShowAddForm(true);
            setIsEditing(false);
            setFormData({
              name: '',
              description: '',
              origin: '',
              historical_context: '',
              modern_application: '',
              frequency: '',
              participants: []
            });
          }}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Add Tradition</span>
        </button>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search traditions by name, description, or origin..."
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : filteredTraditions.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Globe className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No traditions found</h3>
          <p className="text-gray-500 mb-4">
            {searchTerm 
              ? `No results for "${searchTerm}"` 
              : 'Start by adding your first cultural tradition'}
          </p>
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Tradition
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredTraditions.map((tradition) => (
            <motion.div
              key={tradition.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{tradition.name}</h3>
                  <p className="text-gray-600 mb-4">{tradition.description}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <MapPin className="w-4 h-4 text-blue-500" />
                      <span className="font-medium">Origin:</span>
                      <span>{tradition.origin || 'Not specified'}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <Clock className="w-4 h-4 text-green-500" />
                      <span className="font-medium">Frequency:</span>
                      <span>{tradition.frequency || 'Not specified'}</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mt-4">
                    {tradition.participants && tradition.participants.map((participant, index) => (
                      <span key={index} className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs">
                        {participant}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(tradition)}
                    className="p-2 text-gray-500 hover:text-blue-500 hover:bg-blue-50 rounded-full transition-colors"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(tradition.id)}
                    className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                  >
                    <Trash className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              <button
                onClick={() => setSelectedTradition(tradition)}
                className="mt-4 text-sm text-blue-600 hover:text-blue-800 flex items-center"
              >
                <span>View full details</span>
                <ChevronDown className="w-4 h-4 ml-1" />
              </button>
              
              {selectedTradition?.id === tradition.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 pt-4 border-t border-gray-200"
                >
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-1">Historical Context</h4>
                      <p className="text-gray-600">{tradition.historical_context || 'No historical context provided'}</p>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-1">Modern Application</h4>
                      <p className="text-gray-600">{tradition.modern_application || 'No modern application provided'}</p>
                    </div>
                    
                    <div className="flex justify-end">
                      <button
                        onClick={() => setSelectedTradition(null)}
                        className="text-sm text-gray-500 hover:text-gray-700"
                      >
                        Close details
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Add/Edit Tradition Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  {isEditing ? 'Edit Tradition' : 'Add New Tradition'}
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
                    Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter tradition name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    placeholder="Describe this tradition"
                  ></textarea>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Origin
                    </label>
                    <input
                      type="text"
                      value={formData.origin}
                      onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Where did this tradition originate?"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Frequency
                    </label>
                    <select
                      value={formData.frequency}
                      onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select frequency</option>
                      <option value="Daily">Daily</option>
                      <option value="Weekly">Weekly</option>
                      <option value="Monthly">Monthly</option>
                      <option value="Yearly">Yearly</option>
                      <option value="Special occasions">Special occasions</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Historical Context
                  </label>
                  <textarea
                    value={formData.historical_context}
                    onChange={(e) => setFormData({ ...formData, historical_context: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    placeholder="Describe the historical context of this tradition"
                  ></textarea>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Modern Application
                  </label>
                  <textarea
                    value={formData.modern_application}
                    onChange={(e) => setFormData({ ...formData, modern_application: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    placeholder="How is this tradition practiced today?"
                  ></textarea>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Participants (comma separated)
                  </label>
                  <input
                    type="text"
                    value={formData.participants?.join(', ') || ''}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      participants: e.target.value.split(',').map(p => p.trim()).filter(p => p) 
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Family members, community, etc."
                  />
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
                    {isEditing ? 'Update Tradition' : 'Save Tradition'}
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