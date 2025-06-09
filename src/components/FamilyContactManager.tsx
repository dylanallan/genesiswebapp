import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Search, Plus, Edit, Trash, Phone, Mail, MapPin, Calendar, X, Info } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

interface FamilyContact {
  id: string;
  name: string;
  relationship: string;
  contact_info: {
    email?: string;
    phone?: string;
    address?: string;
    social?: Record<string, string>;
  };
  birth_date?: string;
  location?: string;
  notes?: string;
  related_names?: string[];
  created_at: string;
  updated_at: string;
}

export const FamilyContactManager: React.FC = () => {
  const [contacts, setContacts] = useState<FamilyContact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedContact, setSelectedContact] = useState<FamilyContact | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<FamilyContact>>({
    name: '',
    relationship: '',
    contact_info: {},
    birth_date: '',
    location: '',
    notes: '',
    related_names: []
  });

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('family_contacts')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setContacts(data || []);
    } catch (error) {
      console.error('Error fetching contacts:', error);
      toast.error('Failed to load family contacts');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (isEditing && selectedContact) {
        // Update existing contact
        const { error } = await supabase
          .from('family_contacts')
          .update(formData)
          .eq('id', selectedContact.id);

        if (error) throw error;
        toast.success('Contact updated successfully');
      } else {
        // Create new contact
        const { error } = await supabase
          .from('family_contacts')
          .insert([formData]);

        if (error) throw error;
        toast.success('Contact added successfully');
      }

      // Reset form and fetch updated contacts
      setFormData({
        name: '',
        relationship: '',
        contact_info: {},
        birth_date: '',
        location: '',
        notes: '',
        related_names: []
      });
      setShowAddForm(false);
      setIsEditing(false);
      setSelectedContact(null);
      fetchContacts();
    } catch (error) {
      console.error('Error saving contact:', error);
      toast.error('Failed to save contact');
    }
  };

  const handleEdit = (contact: FamilyContact) => {
    setFormData({
      name: contact.name,
      relationship: contact.relationship,
      contact_info: contact.contact_info,
      birth_date: contact.birth_date,
      location: contact.location,
      notes: contact.notes,
      related_names: contact.related_names
    });
    setSelectedContact(contact);
    setIsEditing(true);
    setShowAddForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this contact?')) return;

    try {
      const { error } = await supabase
        .from('family_contacts')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Contact deleted successfully');
      fetchContacts();
    } catch (error) {
      console.error('Error deleting contact:', error);
      toast.error('Failed to delete contact');
    }
  };

  const filteredContacts = contacts.filter(contact => 
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (contact.relationship && contact.relationship.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (contact.location && contact.location.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getRelationshipColor = (relationship: string) => {
    const colors: Record<string, string> = {
      'parent': 'bg-blue-100 text-blue-800',
      'grandparent': 'bg-purple-100 text-purple-800',
      'sibling': 'bg-green-100 text-green-800',
      'cousin': 'bg-yellow-100 text-yellow-800',
      'aunt': 'bg-pink-100 text-pink-800',
      'uncle': 'bg-pink-100 text-pink-800',
      'friend': 'bg-gray-100 text-gray-800',
      'spouse': 'bg-red-100 text-red-800',
      'child': 'bg-indigo-100 text-indigo-800'
    };

    // Check if the relationship contains any of the keys
    for (const [key, value] of Object.entries(colors)) {
      if (relationship.toLowerCase().includes(key)) {
        return value;
      }
    }

    return 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Users className="w-6 h-6 text-blue-500" />
          <h2 className="text-xl font-semibold text-gray-900">Family Contacts</h2>
        </div>
        <button
          onClick={() => {
            setShowAddForm(true);
            setIsEditing(false);
            setFormData({
              name: '',
              relationship: '',
              contact_info: {},
              birth_date: '',
              location: '',
              notes: '',
              related_names: []
            });
          }}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Add Contact</span>
        </button>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search contacts by name, relationship, or location..."
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : filteredContacts.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No contacts found</h3>
          <p className="text-gray-500 mb-4">
            {searchTerm 
              ? `No results for "${searchTerm}"` 
              : 'Start by adding your first family contact'}
          </p>
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Contact
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredContacts.map((contact) => (
            <motion.div
              key={contact.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{contact.name}</h3>
                  {contact.relationship && (
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getRelationshipColor(contact.relationship)}`}>
                      {contact.relationship}
                    </span>
                  )}
                </div>
                
                <div className="flex space-x-1">
                  <button
                    onClick={() => handleEdit(contact)}
                    className="p-1 text-gray-500 hover:text-blue-500 hover:bg-blue-50 rounded-full transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(contact.id)}
                    className="p-1 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                  >
                    <Trash className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="mt-4 space-y-2">
                {contact.contact_info?.phone && (
                  <div className="flex items-center space-x-2 text-sm">
                    <Phone className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-700">{contact.contact_info.phone}</span>
                  </div>
                )}
                
                {contact.contact_info?.email && (
                  <div className="flex items-center space-x-2 text-sm">
                    <Mail className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-700">{contact.contact_info.email}</span>
                  </div>
                )}
                
                {contact.location && (
                  <div className="flex items-center space-x-2 text-sm">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-700">{contact.location}</span>
                  </div>
                )}
                
                {contact.birth_date && (
                  <div className="flex items-center space-x-2 text-sm">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-700">{new Date(contact.birth_date).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
              
              {contact.notes && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-sm text-gray-600 line-clamp-2">{contact.notes}</p>
                </div>
              )}
              
              {contact.related_names && contact.related_names.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center space-x-2 mb-2">
                    <Users className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">Related to:</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {contact.related_names.slice(0, 3).map((name, index) => (
                      <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                        {name}
                      </span>
                    ))}
                    {contact.related_names.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                        +{contact.related_names.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Add/Edit Contact Form Modal */}
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
                  {isEditing ? 'Edit Contact' : 'Add New Contact'}
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
                    placeholder="Enter contact name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Relationship
                  </label>
                  <input
                    type="text"
                    value={formData.relationship}
                    onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Mother, Cousin, Grandfather"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.contact_info?.email || ''}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        contact_info: { ...formData.contact_info, email: e.target.value } 
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="email@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={formData.contact_info?.phone || ''}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        contact_info: { ...formData.contact_info, phone: e.target.value } 
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="(123) 456-7890"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Birth Date
                    </label>
                    <input
                      type="date"
                      value={formData.birth_date || ''}
                      onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Location
                    </label>
                    <input
                      type="text"
                      value={formData.location || ''}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="City, Country"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <input
                    type="text"
                    value={formData.contact_info?.address || ''}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      contact_info: { ...formData.contact_info, address: e.target.value } 
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Full address"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes || ''}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    placeholder="Additional notes about this contact"
                  ></textarea>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Related Names (comma separated)
                  </label>
                  <input
                    type="text"
                    value={formData.related_names?.join(', ') || ''}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      related_names: e.target.value.split(',').map(name => name.trim()).filter(name => name) 
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="John Doe, Jane Smith, etc."
                  />
                </div>

                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <Info className="w-4 h-4" />
                  <span>Contact information is securely stored and only visible to you.</span>
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
                    {isEditing ? 'Update Contact' : 'Save Contact'}
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