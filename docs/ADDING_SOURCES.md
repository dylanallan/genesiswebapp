# Adding New Data Sources and Use Cases

This guide shows you how incredibly easy it is to add new data sources and use cases to the Genesis web app. The system is designed to be modular and extensible.

## 🚀 Quick Start - Add a New API Source

### Method 1: One-Line Addition (Recommended)

```typescript
import { addAPISource } from '../lib/source-templates';

// Add a new genealogy API
addAPISource(
  'geneanet',                    // Unique ID
  'Geneanet',                    // Display name
  'https://api.geneanet.org',    // Base URL
  'your-api-key-here',           // API key
  'French genealogy database',   // Description
  ['genealogy', 'french']        // Categories
);
```

### Method 2: Using Templates

```typescript
import { createRESTAPISource } from '../lib/source-templates';
import { SourceRegistry } from '../lib/data-integration';

const newSource = createRESTAPISource(
  'met-museum',
  'Metropolitan Museum of Art',
  'https://collectionapi.metmuseum.org/public/collection/v1',
  'your-api-key',
  'Metropolitan Museum of Art collection API',
  ['cultural-heritage', 'art', 'museums']
);

SourceRegistry.registerSource(newSource);
```

### Method 3: Public API (No Authentication)

```typescript
import { addPublicAPISource } from '../lib/source-templates';

addPublicAPISource(
  'open-weather',
  'OpenWeatherMap',
  'https://api.openweathermap.org/data/2.5',
  'Weather data API',
  ['weather', 'environmental']
);
```

## 🎯 Adding New Use Cases

### Method 1: One-Line Addition

```typescript
import { addUseCase } from '../lib/source-templates';

addUseCase(
  'dna-matching',                                    // Use case ID
  'DNA Matching',                                    // Display name
  'Find DNA matches and genetic relatives',          // Description
  ['genealogy', 'dna'],                              // Categories
  ['ancestry', 'myheritage'],                        // Data sources to use
  'Find DNA matches for {person_name}',              // Query template
  [                                                   // Example queries
    'Find DNA matches for Sarah Johnson',
    'Research genetic relatives for the Martinez family'
  ]
);
```

### Method 2: Advanced Use Case with Data Transformation

```typescript
import { createAnalysisUseCase } from '../lib/source-templates';

const dnaUseCase = createAnalysisUseCase(
  'dna-analysis',
  'DNA Analysis',
  'Analyze DNA results and find genetic connections',
  ['genealogy', 'dna', 'analysis'],
  ['ancestry', 'myheritage', 'geneanet'],
  'Analyze DNA results for {person_name} with {ethnicity} background',
  [
    'Analyze DNA results for John Smith with Irish background',
    'Find genetic connections for Italian immigrants'
  ],
  (data) => ({
    ...data,
    analysis: {
      ethnicityBreakdown: data.ethnicity,
      geneticMatches: data.matches,
      healthMarkers: data.health
    }
  })
);
```

## 🖥️ Using the Admin Interface

The easiest way to add new sources and use cases is through the built-in admin interface:

1. Navigate to the Data Source Administration page
2. Click on "Data Sources" tab to add new sources
3. Click on "Use Cases" tab to add new use cases
4. Fill out the forms and click "Add"

The admin interface automatically validates your inputs and provides helpful feedback.

## 📋 Available Templates

### API Source Templates

- `createRESTAPISource()` - For APIs with API key authentication
- `createPublicAPISource()` - For public APIs (no authentication)
- `createOAuthAPISource()` - For OAuth-based APIs
- `createDatabaseSource()` - For database connections

### Use Case Templates

- `createSearchUseCase()` - For simple search operations
- `createAnalysisUseCase()` - For data analysis with transformations

## 🔧 Advanced Configuration

### Custom Headers and Authentication

```typescript
const customSource = createAPISource('custom-api', 'Custom API', 'https://api.example.com', 'Description', ['category'], {
  authType: 'bearer',
  headers: {
    'X-Custom-Header': 'value',
    'Accept': 'application/vnd.api+json'
  },
  endpoints: {
    search: '/search',
    details: '/details/{id}'
  },
  transformers: {
    search: (data) => data.results,
    details: (data) => data.item
  }
});
```

### Rate Limiting and Caching

```typescript
const rateLimitedSource = createAPISource('rate-limited-api', 'Rate Limited API', 'https://api.example.com', 'Description', ['category'], {
  rateLimit: 100, // requests per second
  cache: {
    enabled: true,
    ttl: 300000 // 5 minutes
  }
});
```

## 🧪 Testing Your Additions

### Test a Use Case

```typescript
import { executeUseCase } from '../lib/data-integration';

// Test your new use case
const result = await executeUseCase('your-use-case-id', {
  person_name: 'John Smith',
  ethnicity: 'Irish'
});

console.log('Test result:', result);
```

### Validate Your Configuration

```typescript
import { validateSource, validateUseCase } from '../lib/source-templates';

// Validate a source
const sourceErrors = validateSource(yourSource);
if (sourceErrors.length > 0) {
  console.error('Source validation errors:', sourceErrors);
}

// Validate a use case
const useCaseErrors = validateUseCase(yourUseCase);
if (useCaseErrors.length > 0) {
  console.error('Use case validation errors:', useCaseErrors);
}
```

## 📊 Monitoring and Statistics

### View System Statistics

```typescript
import { getSourceStats, listAllSources, listAllUseCases } from '../lib/source-templates';

// Get overall statistics
const stats = getSourceStats();
console.log('Total sources:', stats.totalSources);
console.log('Total use cases:', stats.totalUseCases);

// List all sources
listAllSources();

// List all use cases
listAllUseCases();
```

## 🔄 Bulk Operations

### Add Multiple Sources at Once

```typescript
import { addMultipleSources } from '../lib/source-templates';

const newSources = [
  createAPISource('source1', 'Source 1', 'https://api1.com', 'Description 1', ['category1']),
  createAPISource('source2', 'Source 2', 'https://api2.com', 'Description 2', ['category2']),
  createPublicAPISource('source3', 'Source 3', 'https://api3.com', 'Description 3', ['category3'])
];

addMultipleSources(newSources);
```

### Add Multiple Use Cases at Once

```typescript
import { addMultipleUseCases } from '../lib/source-templates';

const newUseCases = [
  createUseCase('usecase1', 'Use Case 1', 'Description 1', ['category1'], ['source1'], 'Template 1', ['Example 1']),
  createUseCase('usecase2', 'Use Case 2', 'Description 2', ['category2'], ['source2'], 'Template 2', ['Example 2'])
];

addMultipleUseCases(newUseCases);
```

## 🎨 Integration with UI

Once you add sources and use cases, they automatically appear in:

1. **Universal Search** - Users can search across all your new sources
2. **Use Case Selection** - New use cases appear in the dropdown
3. **Category Filtering** - Sources are filtered by your specified categories
4. **Admin Interface** - Manage and test your additions

## 🚨 Best Practices

1. **Use Descriptive IDs** - Make them unique and meaningful
2. **Categorize Properly** - Use existing categories or create logical new ones
3. **Provide Good Examples** - Help users understand how to use your use cases
4. **Test Thoroughly** - Use the built-in testing features
5. **Document APIs** - Add clear descriptions for your sources
6. **Handle Errors** - Implement proper error handling in transformers

## 🔍 Example: Complete Genealogy Integration

Here's a complete example of adding a new genealogy service:

```typescript
// 1. Add the data source
addAPISource(
  'genealogybank',
  'GenealogyBank',
  'https://api.genealogybank.com',
  'your-api-key',
  'Historical newspaper and genealogy records',
  ['genealogy', 'newspapers', 'historical']
);

// 2. Add a use case
addUseCase(
  'newspaper-research',
  'Newspaper Research',
  'Search historical newspapers for family mentions',
  ['genealogy', 'newspapers', 'historical'],
  ['genealogybank', 'ancestry'],
  'Find newspaper mentions of {person_name} in {location} around {year}',
  [
    'Find newspaper mentions of John Smith in New York around 1900',
    'Search for obituaries of Maria Garcia in Chicago',
    'Look for wedding announcements in Boston newspapers'
  ]
);

// 3. Test the integration
const result = await executeUseCase('newspaper-research', {
  person_name: 'John Smith',
  location: 'New York',
  year: '1900'
});
```

That's it! Your new genealogy service is now fully integrated and available to users. The system automatically handles authentication, rate limiting, caching, and error handling. 