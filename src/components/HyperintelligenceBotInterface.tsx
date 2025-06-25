import React, { useState, useEffect } from 'react';
import { HyperintelligenceBot, HyperintelligenceBotFactory } from '../lib/hyperintelligence-bot.js';
import { AdvancedGenealogySystem } from '../lib/advanced-genealogy-system.js';

interface BotResponse {
  query: string;
  timestamp: string;
  botId: string;
  botType: string;
  capabilities: any;
  insights: any[];
  recommendations: any[];
  dataSources: any[];
  confidence: number;
  crossDomainAnalysis: any;
  intent: any;
}

interface FamilyTree {
  id: string;
  name: string;
  description: string;
  members: any[];
  relationships: any[];
  lastModified: string;
}

const HyperintelligenceBotInterface: React.FC = () => {
  const [bots, setBots] = useState<Map<string, HyperintelligenceBot>>(new Map());
  const [activeBot, setActiveBot] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [responses, setResponses] = useState<BotResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [genealogySystem, setGenealogySystem] = useState<AdvancedGenealogySystem | null>(null);
  const [familyTrees, setFamilyTrees] = useState<FamilyTree[]>([]);
  const [selectedTree, setSelectedTree] = useState<string | null>(null);
  const [showGenealogy, setShowGenealogy] = useState(false);

  useEffect(() => {
    initializeBots();
    initializeGenealogySystem();
  }, []);

  const initializeBots = async () => {
    const botTypes = ['genealogy', 'business', 'cultural'];
    const newBots = new Map();

    for (const botType of botTypes) {
      const bot = HyperintelligenceBotFactory.createBot(botType);
      newBots.set(botType, bot);
    }

    setBots(newBots);
    setActiveBot('genealogy');
  };

  const initializeGenealogySystem = async () => {
    const system = new AdvancedGenealogySystem();
    setGenealogySystem(system);

    // Create a sample family tree
    const sampleTree = await system.createFamilyTree({
      name: 'Sample Family Tree',
      description: 'A comprehensive family tree with AI-powered insights',
      privacy: 'private'
    });

    setFamilyTrees([sampleTree]);
    setSelectedTree(sampleTree.id);
  };

  const handleQuery = async () => {
    if (!query.trim() || !activeBot) return;

    setLoading(true);
    try {
      const bot = bots.get(activeBot);
      if (!bot) return;

      const response = await bot.processQuery(query, {
        context: 'user_query',
        timestamp: new Date().toISOString()
      });

      setResponses(prev => [response, ...prev]);
      setQuery('');
    } catch (error) {
      console.error('Error processing query:', error);
    } finally {
      setLoading(false);
    }
  };

  const addPersonToTree = async () => {
    if (!genealogySystem || !selectedTree) return;

    const personData = {
      firstName: 'John',
      lastName: 'Doe',
      birthDate: '1940-01-01',
      birthPlace: 'New York, NY',
      gender: 'male',
      ethnicity: 'European'
    };

    try {
      const person = await genealogySystem.addPersonToTree(selectedTree, personData);
      console.log('Added person:', person);
      
      // Refresh family trees
      const updatedTree = genealogySystem.getFamilyTree(selectedTree);
      if (updatedTree) {
        setFamilyTrees(prev => prev.map(tree => 
          tree.id === selectedTree ? updatedTree : tree
        ));
      }
    } catch (error) {
      console.error('Error adding person:', error);
    }
  };

  const getBotCapabilities = (botType: string) => {
    const bot = bots.get(botType);
    return bot ? bot.getCapabilities() : null;
  };

  const getBotMemory = (botType: string) => {
    const bot = bots.get(botType);
    return bot ? bot.getMemory() : [];
  };

  const clearBotMemory = (botType: string) => {
    const bot = bots.get(botType);
    if (bot) {
      bot.clearMemory();
      setResponses([]);
    }
  };

  const formatConfidence = (confidence: number) => {
    return `${(confidence * 100).toFixed(1)}%`;
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-500';
    if (confidence >= 0.6) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Hyperintelligence Bot Interface
          </h1>
          <p className="text-purple-200">
            Advanced AI bots with access to comprehensive data sources and genealogy features
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Bot Selection and Controls */}
          <div className="lg:col-span-1">
            <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20 mb-6">
              <h2 className="text-2xl font-bold text-white mb-4">Bot Selection</h2>
              
              <div className="space-y-3">
                {Array.from(bots.keys()).map(botType => (
                  <button
                    key={botType}
                    onClick={() => setActiveBot(botType)}
                    className={`w-full p-4 rounded-lg text-left transition-all ${
                      activeBot === botType
                        ? 'bg-purple-600 text-white'
                        : 'bg-white/5 text-gray-300 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold capitalize">{botType} Bot</span>
                      <span className="text-sm">
                        {getBotCapabilities(botType)?.name}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Bot Capabilities */}
            {activeBot && (
              <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20 mb-6">
                <h3 className="text-xl font-bold text-white mb-4">Bot Capabilities</h3>
                <div className="space-y-2">
                  <p className="text-purple-200">
                    <strong>Name:</strong> {getBotCapabilities(activeBot)?.name}
                  </p>
                  <p className="text-purple-200">
                    <strong>Description:</strong> {getBotCapabilities(activeBot)?.description}
                  </p>
                  <div className="mt-4">
                    <strong className="text-white">Data Sources:</strong>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {getBotCapabilities(activeBot)?.dataSources.map((source: string) => (
                        <span key={source} className="px-2 py-1 bg-purple-600 rounded text-sm">
                          {source}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Genealogy Controls */}
            <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20">
              <h3 className="text-xl font-bold text-white mb-4">Genealogy System</h3>
              <div className="space-y-4">
                <button
                  onClick={() => setShowGenealogy(!showGenealogy)}
                  className="w-full p-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-semibold"
                >
                  {showGenealogy ? 'Hide' : 'Show'} Genealogy Features
                </button>
                
                {showGenealogy && (
                  <>
                    <button
                      onClick={addPersonToTree}
                      className="w-full p-3 bg-green-600 hover:bg-green-700 rounded-lg text-white font-semibold"
                    >
                      Add Sample Person
                    </button>
                    
                    <div className="mt-4">
                      <label className="block text-white text-sm font-medium mb-2">
                        Family Trees
                      </label>
                      <select
                        value={selectedTree || ''}
                        onChange={(e) => setSelectedTree(e.target.value)}
                        className="w-full p-2 bg-white/10 border border-white/20 rounded text-white"
                      >
                        {familyTrees.map(tree => (
                          <option key={tree.id} value={tree.id}>
                            {tree.name} ({tree.members.length} members)
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Query Interface and Responses */}
          <div className="lg:col-span-2">
            {/* Query Input */}
            <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20 mb-6">
              <h2 className="text-2xl font-bold text-white mb-4">Query Interface</h2>
              
              <div className="flex gap-4">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ask your hyperintelligent bot anything..."
                  className="flex-1 p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400"
                  onKeyPress={(e) => e.key === 'Enter' && handleQuery()}
                />
                <button
                  onClick={handleQuery}
                  disabled={loading || !query.trim()}
                  className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 rounded-lg text-white font-semibold"
                >
                  {loading ? 'Processing...' : 'Ask'}
                </button>
              </div>

              {activeBot && (
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => clearBotMemory(activeBot)}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-white text-sm"
                  >
                    Clear Memory
                  </button>
                  <span className="text-sm text-gray-400 self-center">
                    Memory: {getBotMemory(activeBot).length} entries
                  </span>
                </div>
              )}
            </div>

            {/* Responses */}
            <div className="space-y-4">
              {responses.map((response, index) => (
                <div key={index} className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">
                      Query: {response.query}
                    </h3>
                    <div className="flex items-center gap-4">
                      <span className={`text-sm font-semibold ${getConfidenceColor(response.confidence)}`}>
                        Confidence: {formatConfidence(response.confidence)}
                      </span>
                      <span className="text-sm text-gray-400">
                        {new Date(response.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>

                  {/* Intent Analysis */}
                  {response.intent && (
                    <div className="mb-4 p-4 bg-white/5 rounded-lg">
                      <h4 className="text-white font-semibold mb-2">Intent Analysis</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-purple-300">Primary Domain:</span>
                          <span className="text-white ml-2 capitalize">{response.intent.primaryDomain}</span>
                        </div>
                        <div>
                          <span className="text-purple-300">Complexity:</span>
                          <span className="text-white ml-2 capitalize">{response.intent.complexity}</span>
                        </div>
                      </div>
                      <div className="mt-2">
                        <span className="text-purple-300">Domains:</span>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {response.intent.domains.map((domain: string) => (
                            <span key={domain} className="px-2 py-1 bg-purple-600 rounded text-xs">
                              {domain}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Data Sources */}
                  {response.dataSources.length > 0 && (
                    <div className="mb-4 p-4 bg-white/5 rounded-lg">
                      <h4 className="text-white font-semibold mb-2">Data Sources</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {response.dataSources.map((source, idx) => (
                          <div key={idx} className="text-sm">
                            <span className="text-purple-300 capitalize">{source.domain}:</span>
                            <span className="text-white ml-2">
                              {source.data.records?.length || 0} records
                            </span>
                            <div className="text-xs text-gray-400">
                              Relevance: {(source.relevance * 100).toFixed(1)}%
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Insights */}
                  {response.insights.length > 0 && (
                    <div className="mb-4 p-4 bg-white/5 rounded-lg">
                      <h4 className="text-white font-semibold mb-2">Key Insights</h4>
                      <div className="space-y-2">
                        {response.insights.slice(0, 3).map((insight, idx) => (
                          <div key={idx} className="text-sm">
                            <span className="text-purple-300 capitalize">{insight.source}:</span>
                            <span className="text-white ml-2">{insight.insight}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recommendations */}
                  {response.recommendations.length > 0 && (
                    <div className="p-4 bg-white/5 rounded-lg">
                      <h4 className="text-white font-semibold mb-2">Recommendations</h4>
                      <div className="space-y-2">
                        {response.recommendations.slice(0, 3).map((rec, idx) => (
                          <div key={idx} className="text-sm">
                            <div className="flex items-center justify-between">
                              <span className="text-white">{rec.description}</span>
                              <span className={`text-xs px-2 py-1 rounded ${
                                rec.priority === 'high' ? 'bg-red-600' : 
                                rec.priority === 'medium' ? 'bg-yellow-600' : 'bg-green-600'
                              }`}>
                                {rec.priority}
                              </span>
                            </div>
                            <div className="text-xs text-gray-400">
                              Confidence: {(rec.confidence * 100).toFixed(1)}%
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HyperintelligenceBotInterface; 