import React, { useState, useEffect } from 'react';
import { 
  getAvailableSources, 
  getAvailableUseCases, 
  executeUseCase 
} from '../lib/data-integration';
import { 
  addAPISource, 
  addPublicAPISource, 
  addUseCase,
  listAllSources,
  listAllUseCases,
  validateSource,
  validateUseCase
} from '../lib/source-templates';
import { DataSource, UseCase } from '../lib/data-integration';

interface SourceFormData {
  id: string;
  name: string;
  baseUrl: string;
  apiKey: string;
  description: string;
  categories: string;
  isPublic: boolean;
}

interface UseCaseFormData {
  id: string;
  name: string;
  description: string;
  categories: string;
  sources: string;
  queryTemplate: string;
  examples: string;
}

export const DataSourceAdmin: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'sources' | 'useCases' | 'stats'>('stats');
  const [sources, setSources] = useState<DataSource[]>([]);
  const [useCases, setUseCases] = useState<UseCase[]>([]);
  const [stats, setStats] = useState<any>(null);
  
  const [sourceForm, setSourceForm] = useState<SourceFormData>({
    id: '',
    name: '',
    baseUrl: '',
    apiKey: '',
    description: '',
    categories: '',
    isPublic: false
  });
  
  const [useCaseForm, setUseCaseForm] = useState<UseCaseFormData>({
    id: '',
    name: '',
    description: '',
    categories: '',
    sources: '',
    queryTemplate: '',
    examples: ''
  });

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setSources(getAvailableSources());
    setUseCases(getAvailableUseCases());
    setStats({
      totalSources: getAvailableSources().length,
      totalUseCases: getAvailableUseCases().length,
      enabledSources: getAvailableSources().filter(s => s.enabled).length,
      categories: [...new Set(getAvailableSources().flatMap(s => s.categories))]
    });
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleAddSource = (e: React.FormEvent) => {
    e.preventDefault();
    
    const categories = sourceForm.categories.split(',').map(cat => cat.trim()).filter(Boolean);
    
    if (sourceForm.isPublic) {
      addPublicAPISource(
        sourceForm.id,
        sourceForm.name,
        sourceForm.baseUrl,
        sourceForm.description,
        categories
      );
    } else {
      addAPISource(
        sourceForm.id,
        sourceForm.name,
        sourceForm.baseUrl,
        sourceForm.apiKey,
        sourceForm.description,
        categories
      );
    }
    
    showMessage('success', `✅ Added new data source: ${sourceForm.name}`);
    setSourceForm({
      id: '',
      name: '',
      baseUrl: '',
      apiKey: '',
      description: '',
      categories: '',
      isPublic: false
    });
    loadData();
  };

  const handleAddUseCase = (e: React.FormEvent) => {
    e.preventDefault();
    
    const categories = useCaseForm.categories.split(',').map(cat => cat.trim()).filter(Boolean);
    const sources = useCaseForm.sources.split(',').map(src => src.trim()).filter(Boolean);
    const examples = useCaseForm.examples.split('\n').map(ex => ex.trim()).filter(Boolean);
    
    addUseCase(
      useCaseForm.id,
      useCaseForm.name,
      useCaseForm.description,
      categories,
      sources,
      useCaseForm.queryTemplate,
      examples
    );
    
    showMessage('success', `✅ Added new use case: ${useCaseForm.name}`);
    setUseCaseForm({
      id: '',
      name: '',
      description: '',
      categories: '',
      sources: '',
      queryTemplate: '',
      examples: ''
    });
    loadData();
  };

  const testUseCase = async (useCaseId: string) => {
    try {
      const useCase = useCases.find(uc => uc.id === useCaseId);
      if (!useCase) return;
      
      // Use the first example as a test
      const example = useCase.examples[0];
      const result = await executeUseCase(useCaseId, { query: example });
      
      showMessage('success', `✅ Test successful for ${useCase.name}`);
      console.log('Test result:', result);
    } catch (error) {
      showMessage('error', `❌ Test failed: ${error}`);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Data Source Administration</h1>
        
        {/* Message Display */}
        {message && (
          <div className={`p-4 rounded-lg mb-6 ${
            message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {message.text}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-6">
          <button
            onClick={() => setActiveTab('stats')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'stats' ? 'bg-white text-gray-900 shadow' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            📊 Statistics
          </button>
          <button
            onClick={() => setActiveTab('sources')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'sources' ? 'bg-white text-gray-900 shadow' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            🔗 Data Sources
          </button>
          <button
            onClick={() => setActiveTab('useCases')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'useCases' ? 'bg-white text-gray-900 shadow' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            🎯 Use Cases
          </button>
        </div>

        {/* Statistics Tab */}
        {activeTab === 'stats' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-900">Total Sources</h3>
                <p className="text-3xl font-bold text-blue-600">{stats?.totalSources || 0}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-green-900">Enabled Sources</h3>
                <p className="text-3xl font-bold text-green-600">{stats?.enabledSources || 0}</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-purple-900">Use Cases</h3>
                <p className="text-3xl font-bold text-purple-600">{stats?.totalUseCases || 0}</p>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-orange-900">Categories</h3>
                <p className="text-3xl font-bold text-orange-600">{stats?.categories?.length || 0}</p>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-3">Available Categories</h3>
              <div className="flex flex-wrap gap-2">
                {stats?.categories?.map((category: string) => (
                  <span key={category} className="px-3 py-1 bg-white rounded-full text-sm">
                    {category}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Sources Tab */}
        {activeTab === 'sources' && (
          <div className="space-y-6">
            {/* Add Source Form */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">Add New Data Source</h3>
              <form onSubmit={handleAddSource} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Source ID (e.g., 'my-api')"
                    value={sourceForm.id}
                    onChange={(e) => setSourceForm({...sourceForm, id: e.target.value})}
                    className="p-2 border rounded"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Source Name"
                    value={sourceForm.name}
                    onChange={(e) => setSourceForm({...sourceForm, name: e.target.value})}
                    className="p-2 border rounded"
                    required
                  />
                </div>
                <input
                  type="url"
                  placeholder="Base URL"
                  value={sourceForm.baseUrl}
                  onChange={(e) => setSourceForm({...sourceForm, baseUrl: e.target.value})}
                  className="w-full p-2 border rounded"
                  required
                />
                <input
                  type="text"
                  placeholder="API Key (optional for public APIs)"
                  value={sourceForm.apiKey}
                  onChange={(e) => setSourceForm({...sourceForm, apiKey: e.target.value})}
                  className="w-full p-2 border rounded"
                />
                <textarea
                  placeholder="Description"
                  value={sourceForm.description}
                  onChange={(e) => setSourceForm({...sourceForm, description: e.target.value})}
                  className="w-full p-2 border rounded"
                  rows={2}
                  required
                />
                <input
                  type="text"
                  placeholder="Categories (comma-separated)"
                  value={sourceForm.categories}
                  onChange={(e) => setSourceForm({...sourceForm, categories: e.target.value})}
                  className="w-full p-2 border rounded"
                  required
                />
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={sourceForm.isPublic}
                    onChange={(e) => setSourceForm({...sourceForm, isPublic: e.target.checked})}
                  />
                  Public API (no API key required)
                </label>
                <button
                  type="submit"
                  className="w-full bg-genesis-600 text-white py-2 rounded hover:bg-genesis-700"
                >
                  Add Source
                </button>
              </form>
            </div>

            {/* Sources List */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Current Sources</h3>
              <div className="space-y-3">
                {sources.map((source) => (
                  <div key={source.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold">{source.name}</h4>
                        <p className="text-sm text-gray-600">{source.description}</p>
                        <div className="flex gap-2 mt-2">
                          {source.categories.map((category) => (
                            <span key={category} className="px-2 py-1 bg-gray-100 rounded text-xs">
                              {category}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-1 rounded text-xs ${
                          source.enabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {source.enabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Use Cases Tab */}
        {activeTab === 'useCases' && (
          <div className="space-y-6">
            {/* Add Use Case Form */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">Add New Use Case</h3>
              <form onSubmit={handleAddUseCase} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Use Case ID"
                    value={useCaseForm.id}
                    onChange={(e) => setUseCaseForm({...useCaseForm, id: e.target.value})}
                    className="p-2 border rounded"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Use Case Name"
                    value={useCaseForm.name}
                    onChange={(e) => setUseCaseForm({...useCaseForm, name: e.target.value})}
                    className="p-2 border rounded"
                    required
                  />
                </div>
                <textarea
                  placeholder="Description"
                  value={useCaseForm.description}
                  onChange={(e) => setUseCaseForm({...useCaseForm, description: e.target.value})}
                  className="w-full p-2 border rounded"
                  rows={2}
                  required
                />
                <input
                  type="text"
                  placeholder="Categories (comma-separated)"
                  value={useCaseForm.categories}
                  onChange={(e) => setUseCaseForm({...useCaseForm, categories: e.target.value})}
                  className="w-full p-2 border rounded"
                  required
                />
                <input
                  type="text"
                  placeholder="Sources (comma-separated)"
                  value={useCaseForm.sources}
                  onChange={(e) => setUseCaseForm({...useCaseForm, sources: e.target.value})}
                  className="w-full p-2 border rounded"
                  required
                />
                <input
                  type="text"
                  placeholder="Query Template (use {placeholders})"
                  value={useCaseForm.queryTemplate}
                  onChange={(e) => setUseCaseForm({...useCaseForm, queryTemplate: e.target.value})}
                  className="w-full p-2 border rounded"
                  required
                />
                <textarea
                  placeholder="Examples (one per line)"
                  value={useCaseForm.examples}
                  onChange={(e) => setUseCaseForm({...useCaseForm, examples: e.target.value})}
                  className="w-full p-2 border rounded"
                  rows={3}
                  required
                />
                <button
                  type="submit"
                  className="w-full bg-genesis-600 text-white py-2 rounded hover:bg-genesis-700"
                >
                  Add Use Case
                </button>
              </form>
            </div>

            {/* Use Cases List */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Current Use Cases</h3>
              <div className="space-y-3">
                {useCases.map((useCase) => (
                  <div key={useCase.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold">{useCase.name}</h4>
                        <p className="text-sm text-gray-600">{useCase.description}</p>
                        <div className="flex gap-2 mt-2">
                          {useCase.categories.map((category) => (
                            <span key={category} className="px-2 py-1 bg-gray-100 rounded text-xs">
                              {category}
                            </span>
                          ))}
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          Sources: {useCase.sources.join(', ')}
                        </p>
                      </div>
                      <button
                        onClick={() => testUseCase(useCase.id)}
                        className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                      >
                        Test
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 