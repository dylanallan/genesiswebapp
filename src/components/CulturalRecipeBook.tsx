import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChefHat, Clock, Users, Star, Search, Plus, Heart, Globe } from 'lucide-react';
import { toast } from 'sonner';

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

export const CulturalRecipeBook: React.FC = () => {
  const [recipes, setRecipes] = useState<Recipe[]>([
    {
      id: '1',
      name: 'Nonna\'s Ragu Bolognese',
      origin: 'Bologna, Italy',
      culturalSignificance: 'Passed down through four generations, this recipe represents our family\'s Sunday tradition.',
      ingredients: [
        { name: 'Ground beef', amount: '500g', culturalNote: 'Always use fresh ground beef from the local butcher' },
        { name: 'San Marzano tomatoes', amount: '400g', culturalNote: 'These tomatoes are essential for authentic flavor' },
        { name: 'Soffritto (carrot, celery, onion)', amount: '1 cup', culturalNote: 'The holy trinity of Italian cooking' }
      ],
      instructions: [
        'Prepare the soffritto by finely chopping carrots, celery, and onions',
        'Brown the ground beef slowly, allowing the flavors to develop',
        'Add the soffritto and cook until fragrant',
        'Add tomatoes and simmer for 3-4 hours, stirring occasionally'
      ],
      prepTime: 30,
      cookTime: 240,
      servings: 6,
      difficulty: 'Medium',
      story: 'Every Sunday, Nonna would start this sauce at dawn. The aroma would fill the house, calling the family together. She believed that the secret ingredient was time and love.',
      tags: ['traditional', 'sunday dinner', 'family recipe'],
      rating: 5
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

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
          <h2 className="text-xl font-semibold">Cultural Recipe Collection</h2>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Add Recipe</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search recipes by name, origin, or tags..."
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
        />
      </div>

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
                    {recipe.difficulty}
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
      ) : (
        /* Recipe Detail View */
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
              ← Back to recipes
            </button>
            <button className="flex items-center space-x-1 text-red-500 hover:text-red-600">
              <Heart className="w-5 h-5" />
              <span>Save to favorites</span>
            </button>
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
                    {selectedRecipe.difficulty}
                  </span>
                </div>
              </div>

              <div className="bg-orange-50 p-4 rounded-lg">
                <h3 className="font-semibold text-orange-900 mb-2">Cultural Significance</h3>
                <p className="text-orange-800">{selectedRecipe.culturalSignificance}</p>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">Family Story</h3>
                <p className="text-blue-800">{selectedRecipe.story}</p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Instructions</h3>
                <ol className="space-y-3">
                  {selectedRecipe.instructions.map((instruction, index) => (
                    <li key={index} className="flex space-x-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
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
                <h3 className="font-semibold text-gray-900 mb-4">Recipe Info</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Prep Time:</span>
                    <span>{selectedRecipe.prepTime} min</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cook Time:</span>
                    <span>{selectedRecipe.cookTime} min</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Time:</span>
                    <span>{selectedRecipe.prepTime + selectedRecipe.cookTime} min</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Servings:</span>
                    <span>{selectedRecipe.servings}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Ingredients</h3>
                <ul className="space-y-3">
                  {selectedRecipe.ingredients.map((ingredient, index) => (
                    <li key={index} className="text-sm">
                      <div className="flex justify-between items-start">
                        <span className="font-medium">{ingredient.name}</span>
                        <span className="text-gray-600">{ingredient.amount}</span>
                      </div>
                      {ingredient.culturalNote && (
                        <p className="text-xs text-blue-600 mt-1 italic">{ingredient.culturalNote}</p>
                      )}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Tags</h3>
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
    </div>
  );
};