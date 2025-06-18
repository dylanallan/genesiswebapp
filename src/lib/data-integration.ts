import { supabase } from './supabase';
// Temporarily disabled to fix white screen issue

// Data Source Configuration
export interface DataSource {
  id: string;
  name: string;
  type: 'api' | 'database' | 'file' | 'webhook';
  url?: string;
  apiKey?: string;
  description: string;
  categories: string[];
  rateLimit?: number;
  enabled: boolean;
  // New fields for easier integration
  authType?: 'none' | 'api-key' | 'oauth' | 'bearer';
  headers?: Record<string, string>;
  endpoints?: Record<string, string>;
  transformers?: Record<string, (data: any) => any>;
}

// Use Case Template Interface
export interface UseCase {
  id: string;
  name: string;
  description: string;
  categories: string[];
  sources: string[];
  queryTemplate: string;
  resultTransformer?: (data: any) => any;
  examples: string[];
}

// Source Registration Utilities
export class SourceRegistry {
  private static sources: Map<string, DataSource> = new Map();
  private static useCases: Map<string, UseCase> = new Map();

  static registerSource(source: DataSource) {
    this.sources.set(source.id, source);
    console.log(`✅ Registered data source: ${source.name} (${source.id})`);
  }

  static registerUseCase(useCase: UseCase) {
    this.useCases.set(useCase.id, useCase);
    console.log(`✅ Registered use case: ${useCase.name} (${useCase.id})`);
  }

  static getSource(id: string): DataSource | undefined {
    return this.sources.get(id);
  }

  static getUseCase(id: string): UseCase | undefined {
    return this.useCases.get(id);
  }

  static getAllSources(): DataSource[] {
    return Array.from(this.sources.values());
  }

  static getAllUseCases(): UseCase[] {
    return Array.from(this.useCases.values());
  }

  static getSourcesByCategory(category: string): DataSource[] {
    return this.getAllSources().filter(source => 
      source.categories.includes(category) && source.enabled
    );
  }

  static getUseCasesByCategory(category: string): UseCase[] {
    return this.getAllUseCases().filter(useCase => 
      useCase.categories.includes(category)
    );
  }
}

// Quick Source Creation Helpers
export const createAPISource = (
  id: string,
  name: string,
  url: string,
  description: string,
  categories: string[],
  options: Partial<DataSource> = {}
): DataSource => ({
  id,
  name,
  type: 'api',
  url,
  description,
  categories,
  enabled: true,
  rateLimit: 100,
  authType: 'api-key',
  ...options
});

export const createDatabaseSource = (
  id: string,
  name: string,
  description: string,
  categories: string[],
  options: Partial<DataSource> = {}
): DataSource => ({
  id,
  name,
  type: 'database',
  description,
  categories,
  enabled: true,
  ...options
});

// Use Case Creation Helpers
export const createUseCase = (
  id: string,
  name: string,
  description: string,
  categories: string[],
  sources: string[],
  queryTemplate: string,
  examples: string[],
  resultTransformer?: (data: any) => any
): UseCase => ({
  id,
  name,
  description,
  categories,
  sources,
  queryTemplate,
  resultTransformer,
  examples
});

// Genealogy Data Sources
export const GENEALOGY_SOURCES: DataSource[] = [
  createAPISource(
    'ancestry',
    'Ancestry.com',
    'https://api.ancestry.com',
    'Genealogy records and family trees',
    ['genealogy', 'family-history'],
    {
      authType: 'api-key',
      apiKey: import.meta.env.VITE_ANCESTRY_API_KEY,
      rateLimit: 100,
      enabled: true
    }
  ),
  createAPISource(
    'familysearch',
    'FamilySearch',
    'https://api.familysearch.org',
    'Free genealogy records and family trees',
    ['genealogy', 'family-history'],
    {
      authType: 'api-key',
      apiKey: import.meta.env.VITE_FAMILYSEARCH_API_KEY,
      rateLimit: 50,
      enabled: true
    }
  ),
  createAPISource(
    'myheritage',
    'MyHeritage',
    'https://api.myheritage.com',
    'DNA testing and genealogy records',
    ['genealogy', 'dna', 'family-history'],
    {
      authType: 'api-key',
      apiKey: import.meta.env.VITE_MYHERITAGE_API_KEY,
      rateLimit: 100,
      enabled: true
    }
  )
];

// Cultural Heritage Data Sources
export const CULTURAL_SOURCES: DataSource[] = [
  createAPISource(
    'unesco',
    'UNESCO World Heritage',
    'https://whc.unesco.org/api',
    'World Heritage sites and cultural properties',
    ['cultural-heritage', 'unesco'],
    {
      authType: 'none',
      rateLimit: 200,
      enabled: true
    }
  ),
  createAPISource(
    'europeana',
    'Europeana',
    'https://api.europeana.eu',
    'European cultural heritage collections',
    ['cultural-heritage', 'europe'],
    {
      authType: 'api-key',
      apiKey: import.meta.env.VITE_EUROPEANA_API_KEY,
      rateLimit: 100,
      enabled: true
    }
  ),
  createAPISource(
    'loc',
    'Library of Congress',
    'https://www.loc.gov/api',
    'American cultural heritage and historical records',
    ['cultural-heritage', 'american-history'],
    {
      authType: 'none',
      rateLimit: 100,
      enabled: true
    }
  ),
  createAPISource(
    'smithsonian',
    'Smithsonian Institution',
    'https://api.si.edu',
    'Smithsonian collections and cultural artifacts',
    ['cultural-heritage', 'museums'],
    {
      authType: 'api-key',
      apiKey: import.meta.env.VITE_SMITHSONIAN_API_KEY,
      rateLimit: 100,
      enabled: true
    }
  ),
  createAPISource(
    'british-museum',
    'British Museum',
    'https://collection.britishmuseum.org/api',
    'British Museum collections and artifacts',
    ['cultural-heritage', 'museums'],
    {
      authType: 'none',
      rateLimit: 100,
      enabled: true
    }
  )
];

// Business & Economic Data Sources
export const BUSINESS_SOURCES: DataSource[] = [
  createAPISource(
    'fred',
    'Federal Reserve Economic Data',
    'https://api.stlouisfed.org/fred',
    'Economic data and financial indicators',
    ['economics', 'business', 'financial'],
    {
      authType: 'api-key',
      apiKey: import.meta.env.VITE_FRED_API_KEY,
      rateLimit: 120,
      enabled: true
    }
  ),
  createAPISource(
    'census',
    'US Census Bureau',
    'https://api.census.gov',
    'Demographic and economic census data',
    ['economics', 'demographics', 'business'],
    {
      authType: 'api-key',
      apiKey: import.meta.env.VITE_CENSUS_API_KEY,
      rateLimit: 500,
      enabled: true
    }
  ),
  createAPISource(
    'bls',
    'Bureau of Labor Statistics',
    'https://api.bls.gov',
    'Labor market and employment data',
    ['economics', 'labor', 'business'],
    {
      authType: 'api-key',
      apiKey: import.meta.env.VITE_BLS_API_KEY,
      rateLimit: 25,
      enabled: true
    }
  ),
  createAPISource(
    'sec',
    'SEC EDGAR',
    'https://data.sec.gov',
    'SEC filings and financial data',
    ['financial', 'business', 'securities'],
    {
      authType: 'none',
      rateLimit: 10,
      enabled: true
    }
  ),
  createAPISource(
    'world-bank',
    'World Bank',
    'https://api.worldbank.org',
    'Global economic and development data',
    ['economics', 'global', 'development'],
    {
      authType: 'none',
      rateLimit: 100,
      enabled: true
    }
  )
];

// AI & Machine Learning Sources
export const AI_SOURCES: DataSource[] = [
  createAPISource(
    'openai-embeddings',
    'OpenAI Embeddings',
    'https://api.openai.com/v1/embeddings',
    'Text embeddings and semantic search',
    ['ai', 'embeddings', 'nlp'],
    {
      authType: 'api-key',
      apiKey: import.meta.env.VITE_OPENAI_API_KEY,
      rateLimit: 3000,
      enabled: true
    }
  ),
  createAPISource(
    'huggingface',
    'Hugging Face',
    'https://api-inference.huggingface.co',
    'Open source AI models and inference',
    ['ai', 'ml', 'nlp'],
    {
      authType: 'api-key',
      apiKey: import.meta.env.VITE_HUGGINGFACE_API_KEY,
      rateLimit: 100,
      enabled: true
    }
  ),
  createAPISource(
    'pinecone',
    'Pinecone Vector Database',
    'https://api.pinecone.io',
    'Vector database for embeddings',
    ['ai', 'embeddings', 'vector-db'],
    {
      authType: 'api-key',
      apiKey: import.meta.env.VITE_PINECONE_API_KEY,
      rateLimit: 100,
      enabled: true
    }
  )
];

// Local Database Tables for Enhanced Data Storage
export const LOCAL_DATA_TABLES = {
  // Genealogy Data
  family_trees: 'family_trees',
  family_members: 'family_members',
  genealogical_records: 'genealogical_records',
  dna_results: 'dna_results',
  family_photos: 'family_photos',
  family_documents: 'family_documents',
  
  // Cultural Heritage Data
  cultural_artifacts: 'cultural_artifacts',
  traditions: 'traditions',
  recipes: 'recipes',
  stories: 'stories',
  celebrations: 'celebrations',
  historical_events: 'historical_events',
  
  // Business Data
  business_processes: 'business_processes',
  automation_workflows: 'automation_workflows',
  market_data: 'market_data',
  competitor_analysis: 'competitor_analysis',
  financial_records: 'financial_records',
  
  // AI & Analytics Data
  ai_conversations: 'ai_conversations',
  user_preferences: 'user_preferences',
  data_insights: 'data_insights',
  predictions: 'predictions',
  recommendations: 'recommendations'
};

// Data Integration Manager
export class DataIntegrationManager {
  private sources: Map<string, DataSource> = new Map();
  private cache: Map<string, any> = new Map();
  private rateLimiters: Map<string, number> = new Map();

  constructor() {
    this.initializeSources();
  }

  private initializeSources() {
    [...GENEALOGY_SOURCES, ...CULTURAL_SOURCES, ...BUSINESS_SOURCES, ...AI_SOURCES].forEach(source => {
      this.sources.set(source.id, source);
    });
  }

  // Generic API call with rate limiting and caching
  async callAPI(sourceId: string, endpoint: string, params: any = {}, options: any = {}) {
    const source = this.sources.get(sourceId);
    if (!source || !source.enabled) {
      throw new Error(`Source ${sourceId} not available`);
    }

    // Check rate limiting
    if (source.rateLimit) {
      const lastCall = this.rateLimiters.get(sourceId) || 0;
      const now = Date.now();
      if (now - lastCall < (1000 / source.rateLimit)) {
        throw new Error(`Rate limit exceeded for ${sourceId}`);
      }
      this.rateLimiters.set(sourceId, now);
    }

    // Check cache
    const cacheKey = `${sourceId}:${endpoint}:${JSON.stringify(params)}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const url = `${source.url}${endpoint}`;
      const headers: any = {
        'Content-Type': 'application/json',
        ...options.headers
      };

      if (source.apiKey) {
        headers['Authorization'] = `Bearer ${source.apiKey}`;
      }

      const response = await fetch(url, {
        method: options.method || 'GET',
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
        ...options
      });

      if (!response.ok) {
        throw new Error(`API call failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // Cache the result for 5 minutes
      this.cache.set(cacheKey, data);
      setTimeout(() => this.cache.delete(cacheKey), 5 * 60 * 1000);

      return data;
    } catch (error) {
      console.error(`Error calling ${sourceId} API:`, error);
      throw error;
    }
  }

  // Genealogy-specific methods
  async searchAncestryRecords(query: string, filters: any = {}) {
    return this.callAPI('ancestry', '/search', { q: query, ...filters });
  }

  async getFamilySearchRecords(personId: string) {
    return this.callAPI('familysearch', `/persons/${personId}`);
  }

  async searchMyHeritage(query: string) {
    return this.callAPI('myheritage', '/search', { query });
  }

  // Cultural heritage methods
  async getUNESCOHeritageSites(country?: string) {
    const params = country ? { country } : {};
    return this.callAPI('unesco', '/sites', params);
  }

  async searchEuropeana(query: string, type?: string) {
    return this.callAPI('europeana', '/search', { query, type });
  }

  async getLibraryOfCongress(query: string) {
    return this.callAPI('loc', '/search', { q: query });
  }

  // Business data methods
  async getEconomicData(series: string, startDate?: string, endDate?: string) {
    return this.callAPI('fred', `/series/observations`, { 
      series_id: series, 
      observation_start: startDate, 
      observation_end: endDate 
    });
  }

  async getCensusData(year: number, variables: string[], geography: string) {
    return this.callAPI('census', `/data/${year}/acs/acs5`, {
      get: variables.join(','),
      for: geography
    });
  }

  async getLaborStatistics(series: string) {
    return this.callAPI('bls', '/timeseries/data', { series_id: series });
  }

  // AI and ML methods
  async getEmbeddings(text: string) {
    return this.callAPI('openai-embeddings', '', {}, {
      method: 'POST',
      body: { input: text, model: 'text-embedding-ada-002' }
    });
  }

  async callHuggingFaceModel(model: string, inputs: any) {
    return this.callAPI('huggingface', `/models/${model}`, {}, {
      method: 'POST',
      body: inputs
    });
  }

  // Local database operations
  async storeLocalData(table: string, data: any) {
    const { data: result, error } = await supabase
      .from(table)
      .insert(data)
      .select();

    if (error) throw error;
    return result;
  }

  async getLocalData(table: string, filters: any = {}) {
    let query = supabase.from(table).select('*');
    
    Object.entries(filters).forEach(([key, value]) => {
      query = query.eq(key, value);
    });

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  // Advanced search across multiple sources
  async multiSourceSearch(query: string, categories: string[] = []) {
    const results: any = {};
    
    for (const [sourceId, source] of this.sources) {
      if (!source.enabled) continue;
      
      if (categories.length === 0 || categories.some(cat => source.categories.includes(cat))) {
        try {
          const data = await this.callAPI(sourceId, '/search', { q: query });
          results[sourceId] = data;
        } catch (error) {
          console.warn(`Failed to search ${sourceId}:`, error);
        }
      }
    }
    
    return results;
  }

  // Data enrichment pipeline
  async enrichData(data: any, enrichmentTypes: string[]) {
    const enriched = { ...data };
    
    for (const type of enrichmentTypes) {
      switch (type) {
        case 'embeddings':
          if (data.text) {
            enriched.embeddings = await this.getEmbeddings(data.text);
          }
          break;
        case 'geocoding':
          if (data.location) {
            // Add geocoding logic
          }
          break;
        case 'sentiment':
          if (data.text) {
            // Add sentiment analysis
          }
          break;
        case 'entities':
          if (data.text) {
            // Add entity extraction
          }
          break;
      }
    }
    
    return enriched;
  }
}

// Initialize the data integration manager
export const dataManager = new DataIntegrationManager();

// Register all sources with the registry
const registerAllSources = () => {
  // Register genealogy sources
  GENEALOGY_SOURCES.forEach(source => SourceRegistry.registerSource(source));
  
  // Register cultural heritage sources
  CULTURAL_SOURCES.forEach(source => SourceRegistry.registerSource(source));
  
  // Register business sources
  BUSINESS_SOURCES.forEach(source => SourceRegistry.registerSource(source));
  
  // Register AI sources
  AI_SOURCES.forEach(source => SourceRegistry.registerSource(source));
  
  console.log(`🎯 Registered ${SourceRegistry.getAllSources().length} data sources`);
};

// Example Use Cases - Easy to add new ones!
const GENEALOGY_USE_CASES: UseCase[] = [
  createUseCase(
    'family-tree-research',
    'Family Tree Research',
    'Research family history and build family trees',
    ['genealogy', 'family-history'],
    ['ancestry', 'familysearch', 'myheritage'],
    'Find information about {person_name} born around {year} in {location}',
    [
      'Find information about John Smith born around 1850 in New York',
      'Research the family history of Maria Garcia from Spain',
      'Build a family tree for the Johnson family from Texas'
    ],
    (data) => ({
      ...data,
      familyTree: data.records?.map((record: any) => ({
        name: record.name,
        birthDate: record.birthDate,
        deathDate: record.deathDate,
        relationships: record.relationships
      }))
    })
  ),
  
  createUseCase(
    'immigration-research',
    'Immigration Research',
    'Research immigration records and passenger lists',
    ['genealogy', 'immigration'],
    ['ancestry', 'archives', 'familysearch'],
    'Find immigration records for {person_name} arriving in {country} around {year}',
    [
      'Find immigration records for Giuseppe Rossi arriving in USA around 1900',
      'Research passenger lists for ships arriving in Ellis Island',
      'Find naturalization records for immigrants from Italy'
    ]
  )
];

const CULTURAL_USE_CASES: UseCase[] = [
  createUseCase(
    'heritage-site-exploration',
    'Heritage Site Exploration',
    'Explore UNESCO World Heritage sites and cultural properties',
    ['cultural-heritage', 'unesco'],
    ['unesco', 'europeana', 'loc'],
    'Find information about heritage sites in {country} or related to {culture}',
    [
      'Explore UNESCO World Heritage sites in Italy',
      'Find cultural heritage sites related to ancient Rome',
      'Research historical monuments in Paris'
    ]
  ),
  
  createUseCase(
    'art-collection-research',
    'Art Collection Research',
    'Research art collections and cultural artifacts',
    ['cultural-heritage', 'art'],
    ['smithsonian', 'british-museum', 'europeana'],
    'Find information about {artwork_type} from {period} or by {artist}',
    [
      'Find Renaissance paintings in museum collections',
      'Research ancient Egyptian artifacts',
      'Explore modern art collections from the 20th century'
    ]
  )
];

const BUSINESS_USE_CASES: UseCase[] = [
  createUseCase(
    'economic-analysis',
    'Economic Analysis',
    'Analyze economic data and market trends',
    ['economics', 'business'],
    ['fred', 'census', 'bls'],
    'Analyze {economic_indicator} trends for {timeframe} in {region}',
    [
      'Analyze GDP growth trends for the last 5 years',
      'Research unemployment rates by state',
      'Find demographic data for business planning'
    ]
  ),
  
  createUseCase(
    'financial-research',
    'Financial Research',
    'Research company financial data and market information',
    ['financial', 'business'],
    ['sec', 'fred', 'world-bank'],
    'Research financial data for {company} or {industry} sector',
    [
      'Research Apple Inc. financial filings',
      'Analyze technology sector market trends',
      'Find economic indicators for emerging markets'
    ]
  )
];

// Register all use cases
const registerAllUseCases = () => {
  [...GENEALOGY_USE_CASES, ...CULTURAL_USE_CASES, ...BUSINESS_USE_CASES]
    .forEach(useCase => SourceRegistry.registerUseCase(useCase));
  
  console.log(`🎯 Registered ${SourceRegistry.getAllUseCases().length} use cases`);
};

// Initialize everything
try {
  registerAllSources();
  registerAllUseCases();
  console.log('✅ Data integration system initialized successfully');
} catch (error) {
  console.error('❌ Error initializing data integration system:', error);
  // Continue without crashing the app
}

// Export convenience functions
export const searchGenealogy = (query: string) => dataManager.multiSourceSearch(query, ['genealogy']);
export const searchCulturalHeritage = (query: string) => dataManager.multiSourceSearch(query, ['cultural-heritage']);
export const searchBusinessData = (query: string) => dataManager.multiSourceSearch(query, ['economics', 'business']);
export const enrichWithAI = (data: any) => dataManager.enrichData(data, ['embeddings', 'sentiment', 'entities']);

// New convenience functions for use cases
export const executeUseCase = async (useCaseId: string, params: Record<string, string>) => {
  const useCase = SourceRegistry.getUseCase(useCaseId);
  if (!useCase) {
    throw new Error(`Use case ${useCaseId} not found`);
  }
  
  // Replace placeholders in query template
  let query = useCase.queryTemplate;
  Object.entries(params).forEach(([key, value]) => {
    query = query.replace(`{${key}}`, value);
  });
  
  // Execute search across all sources for this use case
  const results = await dataManager.multiSourceSearch(query, useCase.categories);
  
  // Apply result transformer if available
  if (useCase.resultTransformer) {
    return useCase.resultTransformer(results);
  }
  
  return results;
};

export const getAvailableUseCases = (category?: string) => {
  if (category) {
    return SourceRegistry.getUseCasesByCategory(category);
  }
  return SourceRegistry.getAllUseCases();
};

export const getAvailableSources = (category?: string) => {
  if (category) {
    return SourceRegistry.getSourcesByCategory(category);
  }
  return SourceRegistry.getAllSources();
}; 