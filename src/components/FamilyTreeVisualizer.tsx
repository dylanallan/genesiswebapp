import React, { useEffect, useMemo, useState } from 'react';
import { findRelationship, relationCategory } from '../lib/relationship';
import { motion } from 'framer-motion';
import { 
  Users, 
  UserPlus, 
  Edit, 
  Trash, 
  ChevronDown, 
  ChevronUp, 
  Search,
  Filter,
  Download,
  Upload,
  X,
  Save,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import { t, useLang } from '../lib/i18n';

interface FamilyMember {
  id: string;
  name: string;
  relationship: string;
  gender?: string | null;
  birthDate?: string;
  birthPlace?: string;
  deathDate?: string;
  deathPlace?: string;
  notes?: string;
  confidence: number;
  source: 'user' | 'ai' | 'validated';
  parentIds?: string[];
  spouseIds?: string[];
  childrenIds?: string[];
}

interface FamilyTreeVisualizerProps {
  familyMembers: FamilyMember[];
  pendingMembers?: FamilyMember[];
  onAddMember?: (member: FamilyMember) => void;
  onUpdateMember?: (member: FamilyMember) => void;
  onDeleteMember?: (memberId: string) => void;
  onValidateMember?: (member: FamilyMember) => void;
  onRejectMember?: (memberId: string) => void;
}

export const FamilyTreeVisualizer: React.FC<FamilyTreeVisualizerProps> = ({
  familyMembers,
  pendingMembers = [],
  onAddMember,
  onUpdateMember,
  onDeleteMember,
  onValidateMember,
  onRejectMember
}) => {
  useLang();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRelationship, setFilterRelationship] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);
  const [expandedMemberId, setExpandedMemberId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<FamilyMember>>({
    name: '',
    relationship: '',
    birthDate: '',
    birthPlace: '',
    deathDate: '',
    deathPlace: '',
    notes: ''
  });

  const handleAddMember = () => {
    if (!formData.name || !formData.relationship) {
      toast.error(t('Name and relationship are required'));
      return;
    }

    const newMember: FamilyMember = {
      id: `user-${Date.now()}`,
      name: formData.name!,
      relationship: formData.relationship!,
      birthDate: formData.birthDate,
      birthPlace: formData.birthPlace,
      deathDate: formData.deathDate,
      deathPlace: formData.deathPlace,
      notes: formData.notes,
      confidence: 1.0, // User-added members have 100% confidence
      source: 'user'
    };

    onAddMember?.(newMember);
    resetForm();
  };

  const handleUpdateMember = () => {
    if (!editingMember || !formData.name || !formData.relationship) {
      toast.error(t('Name and relationship are required'));
      return;
    }

    const updatedMember: FamilyMember = {
      ...editingMember,
      name: formData.name,
      relationship: formData.relationship,
      birthDate: formData.birthDate,
      birthPlace: formData.birthPlace,
      deathDate: formData.deathDate,
      deathPlace: formData.deathPlace,
      notes: formData.notes
    };

    onUpdateMember?.(updatedMember);
    resetForm();
  };

  const handleDeleteMember = (memberId: string) => {
    if (confirm(t('Are you sure you want to delete this family member?'))) {
      onDeleteMember?.(memberId);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      relationship: '',
      birthDate: '',
      birthPlace: '',
      deathDate: '',
      deathPlace: '',
      notes: ''
    });
    setShowAddForm(false);
    setEditingMember(null);
  };

  const startEdit = (member: FamilyMember) => {
    setEditingMember(member);
    setFormData({
      name: member.name,
      relationship: member.relationship,
      birthDate: member.birthDate,
      birthPlace: member.birthPlace,
      deathDate: member.deathDate,
      deathPlace: member.deathPlace,
      notes: member.notes
    });
    setShowAddForm(true);
  };

  const toggleExpand = (memberId: string) => {
    setExpandedMemberId(expandedMemberId === memberId ? null : memberId);
  };

  // Imported trees can hold thousands of people; draw them in batches so the page stays fast.
  const [visibleCount, setVisibleCount] = useState(100);
  useEffect(() => setVisibleCount(100), [searchTerm, filterRelationship]);

  // Work out how each person is related to you from the tree links, so imported people and people added on the
  // tree chart get a relationship too, not only those whose relationship was typed in.
  // Worked out only when a person is shown or filtered on (not for everyone up front), and remembered, so a
  // 10,000-person tree opens quickly.
  const relationOf = useMemo(() => {
    const isSelf = (r: string) => /^(self|me|myself)$/i.test(r.trim());
    const self = familyMembers.find((m) => isSelf(m.relationship));
    const kin = familyMembers.map((m) => ({ id: m.id, name: m.name, gender: m.gender ?? null, parentIds: m.parentIds ?? [], spouseIds: m.spouseIds ?? [] }));
    const labels = new Map<string, string>();
    return (m: FamilyMember): string => {
      const known = labels.get(m.id);
      if (known !== undefined) return known;
      const label = isSelf(m.relationship) ? 'You' : (self && findRelationship(self.id, m.id, kin)?.label) || m.relationship;
      labels.set(m.id, label);
      return label;
    };
  }, [familyMembers]);
  const labelOf = (m: FamilyMember) => relationOf(m) || m.relationship;

  const filteredMembers = familyMembers.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (member.notes && member.notes.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesFilter = !filterRelationship || relationCategory(labelOf(member)).toLowerCase() === filterRelationship;
    return matchesSearch && matchesFilter;
  });

  const getSourceBadge = (source: string) => {
    switch (source) {
      case 'validated':
        return (
          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
            {t('Validated')}
          </span>
        );
      case 'user':
        return (
          <span className="px-2 py-1 bg-genesis-100 text-genesis-800 rounded-full text-xs font-medium">
            {t('User Added')}
          </span>
        );
      case 'ai':
        return (
          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
            {t('AI Detected')}
          </span>
        );
      default:
        return null;
    }
  };

  const getConfidenceIndicator = (confidence: number) => {
    if (confidence >= 0.9) {
      return <span title={t('High confidence')}><CheckCircle className="w-4 h-4 text-green-500" aria-label={t('High confidence')} /></span>;
    } else if (confidence >= 0.7) {
      return <span title={t('Medium confidence')}><CheckCircle className="w-4 h-4 text-yellow-500" aria-label={t('Medium confidence')} /></span>;
    } else {
      return <span title={t('Low confidence')}><AlertTriangle className="w-4 h-4 text-red-500" aria-label={t('Low confidence')} /></span>;
    }
  };

  const relationshipCategories = [
    'All',
    'Grandparent',
    'Parent',
    'Sibling',
    'Child',
    'Grandchild',
    'Spouse',
    'Cousin',
    'Aunt/Uncle',
    'Other'
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Users className="w-6 h-6 text-genesis-500" />
          <h2 className="text-xl font-semibold text-gray-900">{t('People in your tree')}</h2>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              const dataStr = JSON.stringify(familyMembers, null, 2);
              const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
              const downloadAnchorNode = document.createElement('a');
              downloadAnchorNode.setAttribute('href', dataUri);
              downloadAnchorNode.setAttribute('download', 'family-tree.json');
              document.body.appendChild(downloadAnchorNode);
              downloadAnchorNode.click();
              downloadAnchorNode.remove();
              toast.success(t('Family tree exported successfully'));
            }}
            aria-label={t('Download this list')}
            title={t('Download this list')}
            className="p-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Download className="w-5 h-5" />
          </button>
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-genesis-600 text-white rounded-lg hover:bg-genesis-700 transition-colors"
          >
            <UserPlus className="w-5 h-5" />
            <span>{t('Add Family Member')}</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center space-y-3 md:space-y-0 md:space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('Search family members...')}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-genesis-500 focus:border-genesis-500"
          />
        </div>
        <div className="flex items-center space-x-2 overflow-x-auto pb-2 md:pb-0">
          <Filter className="w-4 h-4 text-gray-500 flex-shrink-0" />
          {relationshipCategories.map(category => (
            <button
              key={category}
              onClick={() => setFilterRelationship(category === 'All' ? null : category.toLowerCase())}
              className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${
                (category === 'All' && !filterRelationship) || 
                filterRelationship === category.toLowerCase()
                  ? 'bg-genesis-100 text-genesis-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {t(category)}
            </button>
          ))}
        </div>
      </div>

      {/* Family Members List */}
      <div className="space-y-4">
        {filteredMembers.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">{t('No family members found')}</h3>
            <p className="text-gray-500">
              {searchTerm || filterRelationship
                ? t('Try adjusting your search or filters')
                : t('Start by adding your first family member')}
            </p>
            {!searchTerm && !filterRelationship && (
              <button
                onClick={() => setShowAddForm(true)}
                className="mt-4 px-4 py-2 bg-genesis-600 text-white rounded-lg hover:bg-genesis-700 transition-colors"
              >
                {t('Add Family Member')}
              </button>
            )}
          </div>
        ) : (
          filteredMembers.slice(0, visibleCount).map(member => (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  {member.source === 'ai' && (
                    <div className="pt-1">
                      {getConfidenceIndicator(member.confidence)}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-medium text-gray-900">{member.name}</h3>
                      {member.source !== 'user' && getSourceBadge(member.source)}
                    </div>
                    {labelOf(member) && <p className="text-sm text-genesis-600">{t(labelOf(member))}</p>}
                  </div>
                </div>
                <div className="flex space-x-1">
                  <button
                    onClick={() => toggleExpand(member.id)}
                    aria-label={t(expandedMemberId === member.id ? 'Hide details' : 'Show details')}
                    aria-expanded={expandedMemberId === member.id}
                    className="p-1 text-gray-500 hover:text-genesis-500 hover:bg-genesis-50 rounded-full transition-colors"
                  >
                    {expandedMemberId === member.id ? (
                      <ChevronUp className="w-5 h-5" />
                    ) : (
                      <ChevronDown className="w-5 h-5" />
                    )}
                  </button>
                  <button
                    onClick={() => startEdit(member)}
                    aria-label={t('Edit {name}', { name: member.name })}
                    className="p-1 text-gray-500 hover:text-genesis-500 hover:bg-genesis-50 rounded-full transition-colors"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDeleteMember(member.id)}
                    aria-label={t('Delete {name}', { name: member.name })}
                    className="p-1 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                  >
                    <Trash className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              {expandedMemberId === member.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3 pt-3 border-t border-gray-200"
                >
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <p className="text-xs text-gray-500">{t('Birth Date')}</p>
                      <p className="text-sm text-gray-700">{member.birthDate || t('Unknown')}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">{t('Birth Place')}</p>
                      <p className="text-sm text-gray-700">{member.birthPlace || t('Unknown')}</p>
                    </div>
                    {(member.deathDate || member.deathPlace) && (
                      <>
                        <div>
                          <p className="text-xs text-gray-500">{t('Death Date')}</p>
                          <p className="text-sm text-gray-700">{member.deathDate || t('Unknown')}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">{t('Death Place')}</p>
                          <p className="text-sm text-gray-700">{member.deathPlace || t('Unknown')}</p>
                        </div>
                      </>
                    )}
                  </div>
                  
                  {member.notes && (
                    <div className="mb-3">
                      <p className="text-xs text-gray-500">{t('Notes')}</p>
                      <p className="text-sm text-gray-700">{member.notes}</p>
                    </div>
                  )}

                </motion.div>
              )}
            </motion.div>
          ))
        )}
      </div>
      {filteredMembers.length > visibleCount && (
        <div className="text-center mb-6">
          <p className="text-sm text-gray-500 mb-2">{t('Showing {shown} of {total} people. Use search to find someone quickly.', { shown: visibleCount, total: filteredMembers.length })}</p>
          <button onClick={() => setVisibleCount((n) => n + 200)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            {t('Show more')}
          </button>
        </div>
      )}

      {/* Pending Members Section */}
      {pendingMembers.length > 0 && (
        <div className="mt-6 border-t border-gray-200 pt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              <h3 className="font-medium text-gray-900">{t('Pending Validation ({n})', { n: pendingMembers.length })}</h3>
            </div>
          </div>
          
          <div className="space-y-4">
            {pendingMembers.map(member => (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-yellow-50 border border-yellow-200 rounded-lg p-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">{member.name}</h3>
                    <p className="text-sm text-genesis-600">{t(member.relationship)}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-xs text-gray-500">{t('Confidence:')}</span>
                      <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${
                            member.confidence >= 0.9 ? 'bg-green-500' :
                            member.confidence >= 0.7 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${member.confidence * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-700">{Math.round(member.confidence * 100)}%</span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => onValidateMember?.(member)}
                      className="p-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                      title={t('Validate and add to family tree')}
                      aria-label={t('Validate and add to family tree')}
                    >
                      <CheckCircle className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => onRejectMember?.(member.id)}
                      className="p-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                      title={t('Reject')}
                      aria-label={t('Reject')}
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                  {member.birthDate && (
                    <div>
                      <span className="text-gray-500">{t('Birth:')} </span>
                      <span className="text-gray-700">{member.birthDate}</span>
                    </div>
                  )}
                  {member.birthPlace && (
                    <div>
                      <span className="text-gray-500">{t('Place:')} </span>
                      <span className="text-gray-700">{member.birthPlace}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Add/Edit Member Form */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl max-w-md w-full"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  {t(editingMember ? 'Edit Family Member' : 'Add Family Member')}
                </h3>
                <button
                  onClick={resetForm}
                  aria-label={t('Close')}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    {t('Name')} *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-genesis-500 focus:border-genesis-500"
                    placeholder={t('Full name')}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    {t('Relationship to You')} *
                  </label>
                  <input
                    type="text"
                    value={formData.relationship}
                    onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-genesis-500 focus:border-genesis-500"
                    placeholder={t('e.g., Mother, Grandfather, Cousin')}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">
                      {t('Birth Date')}
                    </label>
                    <input
                      type="date"
                      value={formData.birthDate}
                      onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-genesis-500 focus:border-genesis-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">
                      {t('Birth Place')}
                    </label>
                    <input
                      type="text"
                      value={formData.birthPlace}
                      onChange={(e) => setFormData({ ...formData, birthPlace: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-genesis-500 focus:border-genesis-500"
                      placeholder={t('City, Country')}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">
                      {t('Death Date')}
                    </label>
                    <input
                      type="date"
                      value={formData.deathDate}
                      onChange={(e) => setFormData({ ...formData, deathDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-genesis-500 focus:border-genesis-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">
                      {t('Death Place')}
                    </label>
                    <input
                      type="text"
                      value={formData.deathPlace}
                      onChange={(e) => setFormData({ ...formData, deathPlace: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-genesis-500 focus:border-genesis-500"
                      placeholder={t('City, Country')}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    {t('Notes')}
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-genesis-500 focus:border-genesis-500"
                    rows={3}
                    placeholder={t('Additional information, stories, etc.')}
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    {t('Cancel')}
                  </button>
                  <button
                    type="button"
                    onClick={editingMember ? handleUpdateMember : handleAddMember}
                    className="flex-1 px-4 py-2 bg-genesis-600 text-white rounded-lg hover:bg-genesis-700 transition-colors flex items-center justify-center space-x-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>{t(editingMember ? 'Update Member' : 'Add Member')}</span>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};