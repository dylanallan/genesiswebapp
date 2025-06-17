import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Calendar, MapPin, Users, Image, Video, FileText, Edit, Trash } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';

interface TimelineEvent {
  id: string;
  date: string;
  title: string;
  description: string;
  location?: string;
  people: string[];
  media: {
    type: 'image' | 'video' | 'document';
    url: string;
    caption?: string;
  }[];
  category: 'birth' | 'marriage' | 'migration' | 'achievement' | 'tradition' | 'other';
}

export const TimelineBuilder: React.FC = () => {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<TimelineEvent | null>(null);
  const [newEvent, setNewEvent] = useState<Partial<TimelineEvent>>({
    date: '',
    title: '',
    description: '',
    location: '',
    people: [],
    media: [],
    category: 'other'
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('timeline_events')
        .select('*')
        .order('date', { ascending: true });
      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      toast.error('Failed to load timeline events');
    } finally {
      setIsLoading(false);
    }
  };

  const addEvent = async () => {
    if (!newEvent.date || !newEvent.title) {
      toast.error('Please fill in required fields');
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('timeline_events')
        .insert([{ ...newEvent }]);
      if (error) throw error;
      toast.success('Event added to timeline');
      setShowAddForm(false);
      setNewEvent({
        date: '',
        title: '',
        description: '',
        location: '',
        people: [],
        media: [],
        category: 'other'
      });
      fetchEvents();
    } catch (error) {
      toast.error('Failed to add event');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteEvent = async (id: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.from('timeline_events').delete().eq('id', id);
      if (error) throw error;
      setEvents(prev => prev.filter(e => e.id !== id));
      toast.success('Event removed from timeline');
    } catch (error) {
      toast.error('Failed to remove event');
    } finally {
      setIsLoading(false);
    }
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      birth: 'bg-green-100 text-green-800',
      marriage: 'bg-pink-100 text-pink-800',
      migration: 'bg-blue-100 text-blue-800',
      achievement: 'bg-purple-100 text-purple-800',
      tradition: 'bg-amber-100 text-amber-800',
      other: 'bg-gray-100 text-gray-800'
    };
    return colors[category as keyof typeof colors] || colors.other;
  };

  const getCategoryIcon = (category: string) => {
    const icons = {
      birth: '👶',
      marriage: '💒',
      migration: '🚢',
      achievement: '🏆',
      tradition: '🎭',
      other: '📅'
    };
    return icons[category as keyof typeof icons] || icons.other;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Calendar className="w-6 h-6 text-blue-500" />
          <h2 className="text-xl font-semibold">Family Timeline</h2>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Add Event</span>
        </button>
      </div>

      {/* Add Event Form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 p-4 bg-gray-50 rounded-lg"
          >
            <h3 className="font-medium mb-4">Add New Event</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="date"
                value={newEvent.date}
                onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="Date"
              />
              <input
                type="text"
                value={newEvent.title}
                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="Event title"
              />
              <input
                type="text"
                value={newEvent.location}
                onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="Location"
              />
              <select
                value={newEvent.category}
                onChange={(e) => setNewEvent({ ...newEvent, category: e.target.value as any })}
                className="px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="birth">Birth</option>
                <option value="marriage">Marriage</option>
                <option value="migration">Migration</option>
                <option value="achievement">Achievement</option>
                <option value="tradition">Tradition</option>
                <option value="other">Other</option>
              </select>
            </div>
            <textarea
              value={newEvent.description}
              onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
              className="w-full mt-4 px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="Event description"
              rows={3}
            />
            <div className="flex space-x-3 mt-4">
              <button
                onClick={addEvent}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Add Event
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Timeline */}
      <div className="relative">
        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-300"></div>
        
        <div className="space-y-6">
          {events.map((event, index) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative flex items-start space-x-4"
            >
              <div className="flex-shrink-0 w-16 h-16 bg-white border-4 border-blue-500 rounded-full flex items-center justify-center text-2xl z-10">
                {getCategoryIcon(event.category)}
              </div>
              
              <div className="flex-1 bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(event.category)}`}>
                        {event.category}
                      </span>
                      <span className="text-sm text-gray-500">
                        {new Date(event.date).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <h3 className="font-semibold text-gray-900 mb-2">{event.title}</h3>
                    <p className="text-gray-600 mb-3">{event.description}</p>
                    
                    {event.location && (
                      <div className="flex items-center space-x-1 text-sm text-gray-500 mb-2">
                        <MapPin className="w-4 h-4" />
                        <span>{event.location}</span>
                      </div>
                    )}
                    
                    {event.people.length > 0 && (
                      <div className="flex items-center space-x-1 text-sm text-gray-500">
                        <Users className="w-4 h-4" />
                        <span>{event.people.join(', ')}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setEditingEvent(event)}
                      className="p-1 text-gray-400 hover:text-blue-500"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteEvent(event.id)}
                      className="p-1 text-gray-400 hover:text-red-500"
                    >
                      <Trash className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};