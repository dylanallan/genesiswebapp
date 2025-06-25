import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Globe, Users, TrendingUp, Sparkles, Loader2 } from 'lucide-react';
import { 
  searchGenealogy, 
  searchCulturalHeritage, 
  searchBusinessData,
  getAvailableUseCases,
  executeUseCase
} from '../lib/data-integration';
import { chatApi } from '../api/chat';
import { supabase } from '../lib/supabase';

interface SearchResult {
  id: string;
  title: string;
  description: string;
  source: string;
  category: string;
  url?: string;
  score?: number;
}

interface UseCase {
  id: string;
  name: string;
  description: string;
  categories: string[];
  examples: string[];
}

const UniversalSearch: React.FC = () => {
  const [query, setQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['all']);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [useCases, setUseCases] = useState<UseCase[]>([]);
  const [selectedUseCase, setSelectedUseCase] = useState<string>('');
  const [aiInsights, setAiInsights] = useState<string>('');
  const [traditions, setTraditions] = useState<any[]>([]);
  const [traditionsError, setTraditionsError] = useState<string | null>(null);

  const categories = [
    { id: 'all', name: 'All Categories', icon: Globe, color: 'bg-blue-500' },
    { id: 'genealogy', name: 'Genealogy', icon: Users, color: 'bg-green-500' },
    { id: 'cultural-heritage', name: 'Cultural Heritage', icon: Globe, color: 'bg-purple-500' },
    { id: 'business', name: 'Business & Economics', icon: TrendingUp, color: 'bg-orange-500' }
  ];

  useEffect(() => {
    // Load available use cases
    const availableUseCases = getAvailableUseCases();
    setUseCases(availableUseCases);
  }, []);

  const handleSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setResults([]);
    setAiInsights('');

    try {
      const searchPromises = [];
      const searchCategories = selectedCategories.includes('all') 
        ? ['genealogy', 'cultural-heritage', 'business']
        : selectedCategories;

      // Search across selected categories
      if (searchCategories.includes('genealogy')) {
        searchPromises.push(searchGenealogy(query));
      }
      if (searchCategories.includes('cultural-heritage')) {
        searchPromises.push(searchCulturalHeritage(query));
      }
      if (searchCategories.includes('business')) {
        searchPromises.push(searchBusinessData(query));
      }

      const searchResults = await Promise.allSettled(searchPromises);
      
      // Process results
      const processedResults: SearchResult[] = [];
      searchResults.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value) {
          const category = searchCategories[index];
          if (Array.isArray(result.value)) {
            result.value.forEach((item: any) => {
              processedResults.push({
                id: `${category}-${item.id || Math.random()}`,
                title: item.title || item.name || 'Untitled',
                description: item.description || item.summary || 'No description available',
                source: item.source || category,
                category,
                url: item.url,
                score: item.score || 0.8
              });
            });
          }
        }
      });

      setResults(processedResults);

      // Get AI insights
      if (processedResults.length > 0) {
        const insightsPrompt = `Based on these search results about "${query}", provide 2-3 key insights and suggestions for further research: ${JSON.stringify(processedResults.slice(0, 5))}`;
        
        try {
          const aiResponse = await chatApi.sendMessage(insightsPrompt);
          setAiInsights(aiResponse.response);
        } catch (error) {
          console.error('Error getting AI insights:', error);
        }
      }

      // Search for traditions
      const { data: traditionsData, error: traditionsError } = await supabase.from('traditions').select('*').ilike('name', `%${query}%`);
      if (traditionsData) {
        setTraditions(traditionsData);
      } else {
        setTraditions([]);
      }

    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUseCaseExecution = async (useCaseId: string) => {
    if (!query.trim()) return;

    setLoading(true);
    try {
      const result = await executeUseCase(useCaseId, { query });
      console.log('Use case result:', result);
      // Handle use case results
    } catch (error) {
      console.error('Use case execution error:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (categoryId: string) => {
    if (categoryId === 'all') {
      setSelectedCategories(['all']);
    } else {
      setSelectedCategories(prev => {
        const newCategories = prev.filter(c => c !== 'all');
        if (newCategories.includes(categoryId)) {
          return newCategories.filter(c => c !== categoryId);
        } else {
          return [...newCategories, categoryId];
        }
      });
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-lg p-6"
      >
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🔍 Universal Search
          </h1>
          <p className="text-gray-600">
            Search across genealogy, cultural heritage, and business data sources
          </p>
        </div>

        {/* Search Input */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search for anything: family history, cultural artifacts, economic data..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-genesis-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={loading}
            className="px-6 py-3 bg-genesis-600 text-white rounded-lg hover:bg-genesis-700 disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Search className="w-5 h-5" />
            )}
            Search
          </button>
        </div>

        {/* Category Filters */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Categories</h3>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => toggleCategory(category.id)}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                  selectedCategories.includes(category.id)
                    ? `${category.color} text-white`
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <category.icon className="w-4 h-4" />
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* Use Cases */}
        {useCases.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {useCases.slice(0, 6).map((useCase) => (
                <button
                  key={useCase.id}
                  onClick={() => handleUseCaseExecution(useCase.id)}
                  disabled={loading}
                  className="p-3 text-left bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <h4 className="font-medium text-gray-900">{useCase.name}</h4>
                  <p className="text-sm text-gray-600">{useCase.description}</p>
                </button>
              ))}
            </div>
          </div>
        )}
      </motion.div>

      {/* Results */}
      {loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-lg shadow-lg p-6 text-center"
        >
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-genesis-600" />
          <p className="text-gray-600">Searching across multiple data sources...</p>
        </motion.div>
      )}

      {results.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-lg p-6"
        >
          <h2 className="text-2xl font-bold mb-4">Search Results ({results.length})</h2>
          
          <div className="grid gap-4">
            {results.map((result) => (
              <motion.div
                key={result.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">{result.title}</h3>
                    <p className="text-gray-600 text-sm mb-2">{result.description}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Globe className="w-3 h-3" />
                        {result.source}
                      </span>
                      <span className="px-2 py-1 bg-gray-100 rounded">
                        {result.category}
                      </span>
                      {result.score && (
                        <span>Score: {(result.score * 100).toFixed(0)}%</span>
                      )}
                    </div>
                  </div>
                  {result.url && (
                    <a
                      href={result.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-genesis-600 hover:text-genesis-700 text-sm"
                    >
                      View →
                    </a>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* AI Insights */}
      {aiInsights && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-genesis-50 to-spiritual-50 rounded-lg shadow-lg p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-genesis-600" />
            <h3 className="text-lg font-semibold text-gray-900">AI Insights</h3>
          </div>
          <div className="prose prose-sm max-w-none">
            <p className="text-gray-700 whitespace-pre-wrap">{aiInsights}</p>
          </div>
        </motion.div>
      )}

      {traditions && traditions.length > 0 && (
        <div className="mt-4">
          <h3 className="text-lg font-semibold mb-2">UNESCO Traditions</h3>
          <ul className="list-disc pl-5">
            {traditions.map((t: any) => (
              <li key={t.id}><strong>{t.name}</strong>: {t.description?.slice(0, 100)}...</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default UniversalSearch; 