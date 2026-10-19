import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChefHat, Clock, Users, Star, Search, Plus, Globe, Pencil, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { t, useLang } from '../lib/i18n';

interface Recipe {
  id: string;
  name: string;
  origin: string;
  culturalSignificance: string;
  ingredients: {
    name: string;
    amount: string;
    culturalNote?: string;
  }[];
  instructions: string[];
  prepTime: number;
  cookTime: number;
  servings: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  story: string;
  tags: string[];
  rating: number;
  image?: string;
}

interface RecipeDraft {
  name: string;
  origin: string;
  culturalSignificance: string;
  story: string;
  ingredients: string;
  instructions: string;
  prepTime: string;
  cookTime: string;
  servings: string;
  difficulty: Recipe['difficulty'];
  tags: string;
  rating: string;
}

const emptyDraft: RecipeDraft = {
  name: '', origin: '', culturalSignificance: '', story: '', ingredients: '', instructions: '',
  prepTime: '', cookTime: '', servings: '', difficulty: 'Easy', tags: '', rating: '0',
};

// Rows saved by older versions of the app can be missing any of these fields.
const normalize = (r: Partial<Recipe> & { id: string }): Recipe => ({
  ...r,
  name: r.name ?? 'Untitled recipe',
  origin: r.origin ?? '',
  culturalSignificance: r.culturalSignificance ?? '',
  story: r.story ?? '',
  ingredients: Array.isArray(r.ingredients) ? r.ingredients : [],
  instructions: Array.isArray(r.instructions) ? r.instructions : [],
  prepTime: r.prepTime ?? 0,
  cookTime: r.cookTime ?? 0,
  servings: r.servings ?? 0,
  difficulty: r.difficulty ?? 'Easy',
  tags: r.tags ?? [],
  rating: Number(r.rating ?? 0),
});

const toDraft = (r: Recipe): RecipeDraft => ({
  name: r.name,
  origin: r.origin,
  culturalSignificance: r.culturalSignificance,
  story: r.story,
  ingredients: r.ingredients.map(i => (i.amount ? `${i.amount} | ${i.name}` : i.name)).join('\n'),
  instructions: r.instructions.join('\n'),
  prepTime: r.prepTime ? String(r.prepTime) : '',
  cookTime: r.cookTime ? String(r.cookTime) : '',
  servings: r.servings ? String(r.servings) : '',
  difficulty: r.difficulty,
  tags: r.tags.join(', '),
  rating: String(r.rating),
});

const lines = (text: string) => text.split('\n').map(l => l.trim()).filter(Boolean);
const toInt = (text: string) => (text.trim() ? Math.max(0, parseInt(text, 10) || 0) : null);

const toRow = (d: RecipeDraft) => ({
  name: d.name.trim(),
  origin: d.origin.trim(),
  culturalSignificance: d.culturalSignificance.trim() || null,
  story: d.story.trim() || null,
  ingredients: lines(d.ingredients).map(l => {
    const [amount, ...rest] = l.split('|');
    return rest.length ? { amount: amount.trim(), name: rest.join('|').trim() } : { amount: '', name: l };
  }),
  instructions: lines(d.instructions),
  prepTime: toInt(d.prepTime),
  cookTime: toInt(d.cookTime),
  servings: toInt(d.servings),
  difficulty: d.difficulty,
  tags: d.tags.split(',').map(t => t.trim()).filter(Boolean),
  rating: Math.min(5, Math.max(0, Number(d.rating) || 0)),
  updated_at: new Date().toISOString(),
});

const inputClass =
  'mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500';

export const CulturalRecipeBook: React.FC = () => {
  useLang();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<RecipeDraft>(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    fetchRecipes();
  }, []);

  const fetchRecipes = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setRecipes((data || []).map(normalize));
    } catch (error) {
      toast.error(t('Failed to load recipes'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddRecipe = () => {
    setEditingId(null);
    setFormData(emptyDraft);
    setShowAddForm(true);
  };

  const closeForm = () => {
    setShowAddForm(false);
    setEditingId(null);
    setFormData(emptyDraft);
  };

  const handleEditRecipe = (recipe: Recipe) => {
    setEditingId(recipe.id);
    setFormData(toDraft(recipe));
    setShowAddForm(true);
  };

  const handleDeleteRecipe = async (id: string) => {
    if (!confirm(t('Are you sure you want to delete this recipe?'))) return;
    setIsLoading(true);
    try {
      const { error } = await supabase.from('recipes').delete().eq('id', id);
      if (error) throw error;
      setRecipes(recipes.filter(r => r.id !== id));
      setSelectedRecipe(null);
      toast.success(t('Recipe deleted successfully'));
    } catch (error) {
      toast.error(t('Failed to delete recipe'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.origin.trim()) {
      toast.error(t('Name and origin are required'));
      return;
    }
    setIsLoading(true);
    try {
      if (editingId) {
        const { error } = await supabase
          .from('recipes')
          .update(toRow(formData))
          .eq('id', editingId);
        if (error) throw error;
        toast.success(t('Recipe updated successfully'));
      } else {
        const { error } = await supabase
          .from('recipes')
          .insert([toRow(formData)]);
        if (error) throw error;
        toast.success(t('Recipe added successfully'));
      }
      closeForm();
      setSelectedRecipe(null);
      fetchRecipes();
    } catch (error) {
      toast.error(t('Failed to save recipe'));
    } finally {
      setIsLoading(false);
    }
  };

  const setField = <K extends keyof RecipeDraft>(key: K, value: RecipeDraft[K]) =>
    setFormData(prev => ({ ...prev, [key]: value }));

  const filteredRecipes = recipes.filter(recipe =>
    recipe.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    recipe.origin.toLowerCase().includes(searchTerm.toLowerCase()) ||
    recipe.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getDifficultyColor = (difficulty: string) => {
    const colors = {
      Easy: 'bg-green-100 text-green-800',
      Medium: 'bg-yellow-100 text-yellow-800',
      Hard: 'bg-red-100 text-red-800'
    };
    return colors[difficulty as keyof typeof colors];
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ));
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <ChefHat className="w-6 h-6 text-orange-500" />
          <h2 className="text-xl font-semibold">{t('Cultural Recipe Collection')}</h2>
        </div>
        <button
          onClick={handleAddRecipe}
          className="flex items-center space-x-2 px-4 py-2 bg-orange-700 text-white rounded-lg hover:bg-orange-800 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>{t('Add Recipe')}</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={t('Search recipes by name, origin, or tags...')}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
        />
      </div>

      {!selectedRecipe && !isLoading && filteredRecipes.length === 0 && (
        <p className="text-center text-gray-500 py-12">
          {recipes.length === 0 ? 'No recipes yet. Click "Add Recipe" to save your first family recipe.' : 'No recipes match your search.'}
        </p>
      )}

      {!selectedRecipe ? (
        /* Recipe Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRecipes.map((recipe, index) => (
            <motion.div
              key={recipe.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setSelectedRecipe(recipe)}
            >
              <div className="h-48 bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center">
                <ChefHat className="w-16 h-16 text-orange-400" />
              </div>
              
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 truncate">{recipe.name}</h3>
                  <div className="flex items-center space-x-1">
                    {renderStars(recipe.rating)}
                  </div>
                </div>
                
                <div className="flex items-center space-x-1 text-sm text-gray-500 mb-2">
                  <Globe className="w-4 h-4" />
                  <span>{recipe.origin}</span>
                </div>
                
                <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>{recipe.prepTime + recipe.cookTime} min</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Users className="w-4 h-4" />
                    <span>{recipe.servings} servings</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(recipe.difficulty)}`}>
                    {t(recipe.difficulty)}
                  </span>
                  <div className="flex space-x-1">
                    {recipe.tags.slice(0, 2).map(tag => (
                      <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : ( /* Recipe Detail View */
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSelectedRecipe(null)}
              className="text-orange-600 hover:text-orange-700"
            >
              {t('← Back to recipes')}
            </button>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => handleEditRecipe(selectedRecipe)}
                className="flex items-center space-x-1 text-orange-600 hover:text-orange-700"
              >
                <Pencil className="w-5 h-5" />
                <span>{t('Edit')}</span>
              </button>
              <button
                onClick={() => handleDeleteRecipe(selectedRecipe.id)}
                className="flex items-center space-x-1 text-red-500 hover:text-red-600"
              >
                <Trash2 className="w-5 h-5" />
                <span>{t('Delete')}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{selectedRecipe.name}</h1>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <Globe className="w-4 h-4" />
                    <span>{selectedRecipe.origin}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    {renderStars(selectedRecipe.rating)}
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(selectedRecipe.difficulty)}`}>
                    {t(selectedRecipe.difficulty)}
                  </span>
                </div>
              </div>

              <div className="bg-orange-50 p-4 rounded-lg">
                <h3 className="font-semibold text-orange-900 mb-2">{t('Cultural Significance')}</h3>
                <p className="text-orange-800">{selectedRecipe.culturalSignificance}</p>
              </div>

              <div className="bg-genesis-50 p-4 rounded-lg">
                <h3 className="font-semibold text-genesis-900 mb-2">{t('Family Story')}</h3>
                <p className="text-genesis-800">{selectedRecipe.story}</p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-4">{t('Instructions')}</h3>
                <ol className="space-y-3">
                  {selectedRecipe.instructions.map((instruction, index) => (
                    <li key={index} className="flex space-x-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-orange-700 text-white rounded-full flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </span>
                      <span className="text-gray-700">{instruction}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-4">{t('Recipe Info')}</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>{t('Prep Time:')}</span>
                    <span>{selectedRecipe.prepTime} min</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('Cook Time:')}</span>
                    <span>{selectedRecipe.cookTime} min</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('Total Time:')}</span>
                    <span>{selectedRecipe.prepTime + selectedRecipe.cookTime} min</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('Servings:')}</span>
                    <span>{selectedRecipe.servings}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-4">{t('Ingredients')}</h3>
                <ul className="space-y-3">
                  {selectedRecipe.ingredients.map((ingredient, index) => (
                    <li key={index} className="text-sm">
                      <div className="flex justify-between items-start">
                        <span className="font-medium">{ingredient.name}</span>
                        <span className="text-gray-600">{ingredient.amount}</span>
                      </div>
                      {ingredient.culturalNote && (
                        <p className="text-xs text-genesis-600 mt-1 italic">{ingredient.culturalNote}</p>
                      )}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">{t('Tags')}</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedRecipe.tags.map(tag => (
                    <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
          <form
            onSubmit={handleFormSubmit}
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-xl shadow-xl p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">{editingId ? 'Edit recipe' : 'Add a recipe'}</h3>
              <button type="button" onClick={closeForm} aria-label={t('Close')} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="block text-sm">
                <span className="font-medium">{t('Recipe name *')}</span>
                <input required value={formData.name} onChange={e => setField('name', e.target.value)} className={inputClass} />
              </label>
              <label className="block text-sm">
                <span className="font-medium">{t('Origin (place or culture) *')}</span>
                <input required value={formData.origin} onChange={e => setField('origin', e.target.value)} className={inputClass} />
              </label>
            </div>
            <label className="block text-sm">
              <span className="font-medium">{t('Cultural significance')}</span>
              <textarea rows={2} value={formData.culturalSignificance} onChange={e => setField('culturalSignificance', e.target.value)} className={inputClass} />
            </label>
            <label className="block text-sm">
              <span className="font-medium">{t('Family story')}</span>
              <textarea rows={3} value={formData.story} onChange={e => setField('story', e.target.value)} className={inputClass} />
            </label>
            <label className="block text-sm">
              <span className="font-medium">{t('Ingredients (one per line, e.g. "2 cups | flour")')}</span>
              <textarea rows={4} value={formData.ingredients} onChange={e => setField('ingredients', e.target.value)} className={inputClass} />
            </label>
            <label className="block text-sm">
              <span className="font-medium">{t('Instructions (one step per line)')}</span>
              <textarea rows={4} value={formData.instructions} onChange={e => setField('instructions', e.target.value)} className={inputClass} />
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <label className="block text-sm">
                <span className="font-medium">{t('Prep (min)')}</span>
                <input type="number" min={0} value={formData.prepTime} onChange={e => setField('prepTime', e.target.value)} className={inputClass} />
              </label>
              <label className="block text-sm">
                <span className="font-medium">{t('Cook (min)')}</span>
                <input type="number" min={0} value={formData.cookTime} onChange={e => setField('cookTime', e.target.value)} className={inputClass} />
              </label>
              <label className="block text-sm">
                <span className="font-medium">{t('Servings')}</span>
                <input type="number" min={0} value={formData.servings} onChange={e => setField('servings', e.target.value)} className={inputClass} />
              </label>
              <label className="block text-sm">
                <span className="font-medium">{t('Rating (0-5)')}</span>
                <input type="number" min={0} max={5} value={formData.rating} onChange={e => setField('rating', e.target.value)} className={inputClass} />
              </label>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="block text-sm">
                <span className="font-medium">{t('Difficulty')}</span>
                <select value={formData.difficulty} onChange={e => setField('difficulty', e.target.value as Recipe['difficulty'])} className={inputClass}>
                  <option>{t('Easy')}</option>
                  <option>{t('Medium')}</option>
                  <option>{t('Hard')}</option>
                </select>
              </label>
              <label className="block text-sm">
                <span className="font-medium">{t('Tags (comma separated)')}</span>
                <input value={formData.tags} onChange={e => setField('tags', e.target.value)} className={inputClass} />
              </label>
            </div>
            <div className="flex justify-end space-x-3 pt-2">
              <button type="button" onClick={closeForm} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                {t('Cancel')}
              </button>
              <button type="submit" disabled={isLoading} className="px-4 py-2 bg-orange-700 text-white rounded-lg hover:bg-orange-800 disabled:opacity-50">
                {isLoading ? 'Saving...' : 'Save recipe'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};