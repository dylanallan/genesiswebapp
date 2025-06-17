// Source Templates - Copy, paste, and customize!
// This file contains ready-to-use templates for adding new data sources and use cases

import { 
  createAPISource, 
  createDatabaseSource, 
  createUseCase, 
  SourceRegistry,
  DataSource,
  UseCase
} from './data-integration';

// ============================================================================
// API SOURCE TEMPLATES
// ============================================================================

// Template for REST API with API key authentication
export const createRESTAPISource = (
  id: string,
  name: string,
  baseUrl: string,
  apiKey: string,
  description: string,
  categories: string[]
): DataSource => createAPISource(id, name, baseUrl, description, categories, {
  apiKey,
  authType: 'api-key',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Accept': 'application/json'
  }
});

// Template for public API (no authentication)
export const createPublicAPISource = (
  id: string,
  name: string,
  baseUrl: string,
  description: string,
  categories: string[]
): DataSource => createAPISource(id, name, baseUrl, description, categories, {
  authType: 'none',
  headers: {
    'Accept': 'application/json'
  }
});

// Template for OAuth API
export const createOAuthAPISource = (
  id: string,
  name: string,
  baseUrl: string,
  description: string,
  categories: string[]
): DataSource => createAPISource(id, name, baseUrl, description, categories, {
  authType: 'oauth',
  headers: {
    'Accept': 'application/json'
  }
});

// ============================================================================
// USE CASE TEMPLATES
// ============================================================================

// Template for simple search use case
export const createSearchUseCase = (
  id: string,
  name: string,
  description: string,
  categories: string[],
  sources: string[],
  searchTemplate: string,
  examples: string[]
): UseCase => createUseCase(
  id,
  name,
  description,
  categories,
  sources,
  searchTemplate,
  examples
);

// Template for data analysis use case
export const createAnalysisUseCase = (
  id: string,
  name: string,
  description: string,
  categories: string[],
  sources: string[],
  analysisTemplate: string,
  examples: string[],
  transformer?: (data: any) => any
): UseCase => createUseCase(
  id,
  name,
  description,
  categories,
  sources,
  analysisTemplate,
  examples,
  transformer
);

// ============================================================================
// QUICK ADD FUNCTIONS
// ============================================================================

// Add a new API source in one line
export const addAPISource = (
  id: string,
  name: string,
  baseUrl: string,
  apiKey: string,
  description: string,
  categories: string[]
) => {
  const source = createRESTAPISource(id, name, baseUrl, apiKey, description, categories);
  SourceRegistry.registerSource(source);
  return source;
};

// Add a new public API source in one line
export const addPublicAPISource = (
  id: string,
  name: string,
  baseUrl: string,
  description: string,
  categories: string[]
) => {
  const source = createPublicAPISource(id, name, baseUrl, description, categories);
  SourceRegistry.registerSource(source);
  return source;
};

// Add a new use case in one line
export const addUseCase = (
  id: string,
  name: string,
  description: string,
  categories: string[],
  sources: string[],
  queryTemplate: string,
  examples: string[]
) => {
  const useCase = createUseCase(id, name, description, categories, sources, queryTemplate, examples);
  SourceRegistry.registerUseCase(useCase);
  return useCase;
};

// ============================================================================
// EXAMPLE USAGE - Copy these patterns!
// ============================================================================

/*
// Example 1: Add a new genealogy API
addAPISource(
  'geneanet',
  'Geneanet',
  'https://api.geneanet.org',
  'your-api-key-here',
  'French genealogy database with European records',
  ['genealogy', 'french', 'european']
);

// Example 2: Add a new public cultural API
addPublicAPISource(
  'met-museum',
  'Metropolitan Museum of Art',
  'https://collectionapi.metmuseum.org/public/collection/v1',
  'Metropolitan Museum of Art collection API',
  ['cultural-heritage', 'art', 'museums']
);

// Example 3: Add a new use case
addUseCase(
  'dna-matching',
  'DNA Matching',
  'Find DNA matches and genetic relatives',
  ['genealogy', 'dna'],
  ['ancestry', 'myheritage', 'geneanet'],
  'Find DNA matches for {person_name} with {ethnicity} background',
  [
    'Find DNA matches for Sarah Johnson with Irish background',
    'Research genetic relatives for the Martinez family',
    'Find DNA connections for Italian immigrants'
  ]
);

// Example 4: Add a new business data source
addAPISource(
  'alpha-vantage',
  'Alpha Vantage',
  'https://www.alphavantage.co/query',
  'your-api-key-here',
  'Real-time and historical stock market data',
  ['financial', 'business', 'stocks']
);
*/

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

export const validateSource = (source: DataSource): string[] => {
  const errors: string[] = [];
  
  if (!source.id) errors.push('Source ID is required');
  if (!source.name) errors.push('Source name is required');
  if (!source.description) errors.push('Source description is required');
  if (source.categories.length === 0) errors.push('At least one category is required');
  if (source.type === 'api' && !source.url) errors.push('API URL is required for API sources');
  
  return errors;
};

export const validateUseCase = (useCase: UseCase): string[] => {
  const errors: string[] = [];
  
  if (!useCase.id) errors.push('Use case ID is required');
  if (!useCase.name) errors.push('Use case name is required');
  if (!useCase.description) errors.push('Use case description is required');
  if (useCase.categories.length === 0) errors.push('At least one category is required');
  if (useCase.sources.length === 0) errors.push('At least one source is required');
  if (!useCase.queryTemplate) errors.push('Query template is required');
  if (useCase.examples.length === 0) errors.push('At least one example is required');
  
  return errors;
};

// ============================================================================
// BULK OPERATIONS
// ============================================================================

// Add multiple sources at once
export const addMultipleSources = (sources: DataSource[]) => {
  sources.forEach(source => {
    const errors = validateSource(source);
    if (errors.length > 0) {
      console.error(`❌ Invalid source ${source.id}:`, errors);
      return;
    }
    SourceRegistry.registerSource(source);
  });
};

// Add multiple use cases at once
export const addMultipleUseCases = (useCases: UseCase[]) => {
  useCases.forEach(useCase => {
    const errors = validateUseCase(useCase);
    if (errors.length > 0) {
      console.error(`❌ Invalid use case ${useCase.id}:`, errors);
      return;
    }
    SourceRegistry.registerUseCase(useCase);
  });
};

// ============================================================================
// DEBUGGING HELPERS
// ============================================================================

export const listAllSources = () => {
  const sources = SourceRegistry.getAllSources();
  console.log('📊 Available Sources:');
  sources.forEach(source => {
    console.log(`  • ${source.name} (${source.id}) - ${source.categories.join(', ')}`);
  });
  return sources;
};

export const listAllUseCases = () => {
  const useCases = SourceRegistry.getAllUseCases();
  console.log('🎯 Available Use Cases:');
  useCases.forEach(useCase => {
    console.log(`  • ${useCase.name} (${useCase.id}) - ${useCase.categories.join(', ')}`);
  });
  return useCases;
};

export const getSourceStats = () => {
  const sources = SourceRegistry.getAllSources();
  const useCases = SourceRegistry.getAllUseCases();
  
  const stats = {
    totalSources: sources.length,
    totalUseCases: useCases.length,
    sourcesByType: {} as Record<string, number>,
    sourcesByCategory: {} as Record<string, number>,
    useCasesByCategory: {} as Record<string, number>
  };
  
  sources.forEach(source => {
    stats.sourcesByType[source.type] = (stats.sourcesByType[source.type] || 0) + 1;
    source.categories.forEach(cat => {
      stats.sourcesByCategory[cat] = (stats.sourcesByCategory[cat] || 0) + 1;
    });
  });
  
  useCases.forEach(useCase => {
    useCase.categories.forEach(cat => {
      stats.useCasesByCategory[cat] = (stats.useCasesByCategory[cat] || 0) + 1;
    });
  });
  
  return stats;
}; 