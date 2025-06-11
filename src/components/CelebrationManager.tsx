import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Search, Plus, Edit, Trash, MapPin, Users, Info, X, CalendarDays } from 'lucide-react';
import { toast } from 'sonner';

interface Celebration {
  id: string;
  name: string;
  description: string;
  date_or_season: string;
  significance: string;
  location?: string;
  participants: string[];
  created_at: string;
  updated_at: string;
}

export const CelebrationManager: React.FC = () => {
  const [celebrations, setCelebrations] = useState<Celebration[]>([
    {
      id: '1',
      name: 'Winter Solstice Gathering',
      description: 'Annual family gathering to celebrate the winter solstice with traditional foods and rituals.',
      date_or_season: 'December 21',
      significance: 'Marks the shortest day of the year and celebrates the return of light. Our family has observed this for generations.',
      location: 'Family home',
      participants: ['Immediate family', 'Extended family', 'Close friends'],
      created_at: '2025-01-10T14:30:00Z',
      updated_at: '2025-01-10T14:30:00Z'
    },
    {
      id: '2',
      name: 'Harvest Festival',
      description: 'Community celebration of the autumn harvest with traditional foods, music, and games.',
      date_or_season: 'Fall',
      significance: 'Gives thanks for the year\'s bounty and celebrates agricultural traditions from our heritage.',
      location: 'Community center',
      participants: ['Family', 'Community members', 'Local farmers'],
      created_at: '2025-02-15T09:45:00Z',
      updated_at: '2025-02-15T09:45:00Z'
    },
    {
      id: '3',
      name: 'Ancestor Remembrance Day',
      description: 'Day dedicated to honoring and remembering our ancestors through stories, photos, and traditional foods.',
      date_or_season: 'November 1',
      significance: 'Maintains connection with our ancestral heritage and passes down family history to younger generations.',
      location: 'Family home',
      participants: ['All family members'],
      created_at: '2025-03-05T18:20:00Z',
      updated_at: '2025-03-05T18:20:00Z'
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCelebration, setSelectedCelebration] = useState<Celebration | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [formData, setFormData] = useState<Partial<Celebration>>({
    name: '',
    description: '',
    date_or_season: '',
    significance: '',
    location: '',
    participants: []
  });

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name) {
      toast.error('Name is required');
      return;
    }

    if (showEditForm && selectedCelebration) {
      // Update existing celebration
      setCelebrations(celebrations.map(c => 
        c.id === selectedCelebration.id 
          ? { 
              ...c, 
              ...formData, 
              updated_at: new Date().toISOString() 
            } as Celebration
          : c
      ));
      toast.success('Celebration updated successfully');
    } else {
      // Create new celebration
      const newCelebration: Celebration = {
        id: Date.now().toString(),
        name: formData.name!,
        description: formData.description || '',
        date_or_season: formData.date_or_season || '',
        significance: formData.significance || '',
        location: formData.location,
        participants: formData.participants || [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      setCelebrations([newCelebration, ...celebrations]);
      toast.success('Celebration added successfully');
    }
    
    // Reset form and state
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

  const handleEdit = (celebration: Celebration) => {
    setFormData({
      name: celebration.name,
      description: celebration.description,
      date_or_season: celebration.date_or_season,
      significance: celebration.significance,
      location: celebration.location,
      participants: celebration.participants
    });
    setSelectedCelebration(celebration);
    setShowEditForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this celebration?')) {
      setCelebrations(celebrations.filter(c => c.id !== id));
      toast.success('Celebration deleted successfully');
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Calendar className="w-6 h-6 text-blue-500" />
          <h2 className="text-xl font-semibold text-gray-900">Celebrations & Events</h2>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Add Celebration</span>
        </button>
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : filteredCelebrations.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No celebrations found</h3>
          <p className="text-gray-500 mb-4">
            {searchTerm 
              ? `No results for "${searchTerm}"` 
              : 'Start by adding your first celebration or cultural event'}
          </p>
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Celebration
          </button>
        </div>
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

      {/* Add/Edit Celebration Form Modal */}
      {(showAddForm || showEditForm) && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  {showEditForm ? 'Edit Celebration' : 'Add New Celebration'}
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
                    placeholder="Enter celebration name"
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
                    placeholder="Describe this celebration"
                  ></textarea>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date or Season
                    </label>
                    <input
                      type="text"
                      value={formData.date_or_season}
                      onChange={(e) => setFormData({ ...formData, date_or_season: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., December 25 or Winter"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Location
                    </label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Where is this celebration held?"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Significance
                  </label>
                  <textarea
                    value={formData.significance}
                    onChange={(e) => setFormData({ ...formData, significance: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    placeholder="What is the cultural or personal significance of this celebration?"
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
                    {showEditForm ? 'Update Celebration' : 'Save Celebration'}
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