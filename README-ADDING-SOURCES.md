# 🚀 Adding New Data Sources & Use Cases

## Overview

The Genesis web app makes it **incredibly easy** to add new data sources and use cases. The system is designed to be modular and extensible with minimal code changes.

## ✨ Quick Start - Add a New API in One Line

```typescript
import { addAPISource } from './src/lib/source-templates';

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

## 🎯 Add a New Use Case in One Line

```typescript
import { addUseCase } from './src/lib/source-templates';

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

## 🖥️ Using the Admin Interface

The **easiest way** to add new sources and use cases is through the built-in admin interface:

1. Navigate to **Data Sources** in the dashboard
2. Click on **Data Sources** tab to add new sources
3. Click on **Use Cases** tab to add new use cases
4. Fill out the forms and click **Add**

The admin interface automatically validates your inputs and provides helpful feedback.

## 🔄 Automatic Integration

Once you add sources and use cases, they automatically appear in:

- ✅ **Universal Search** - Users can search across all your new sources
- ✅ **Use Case Selection** - New use cases appear in dropdown menus
- ✅ **Category Filtering** - Sources are filtered by your specified categories
- ✅ **Admin Interface** - Manage and test your additions

## 📋 Available Templates

### API Source Templates
- `addAPISource()` - For APIs with API key authentication
- `addPublicAPISource()` - For public APIs (no authentication)
- `createRESTAPISource()` - For REST APIs with custom headers
- `createOAuthAPISource()` - For OAuth-based APIs

### Use Case Templates
- `addUseCase()` - For simple search operations
- `createAnalysisUseCase()` - For data analysis with transformations

## 🧪 Testing Your Additions

```typescript
import { executeUseCase } from './src/lib/data-integration';

// Test your new use case
const result = await executeUseCase('your-use-case-id', {
  person_name: 'John Smith',
  ethnicity: 'Irish'
});
```

## 📊 Monitoring

```typescript
import { getSourceStats, listAllSources, listAllUseCases } from './src/lib/source-templates';

// Get statistics
const stats = getSourceStats();
console.log('Total sources:', stats.totalSources);
console.log('Total use cases:', stats.totalUseCases);

// List all sources and use cases
listAllSources();
listAllUseCases();
```

## 🎨 Examples

See `examples/add-new-source.ts` for complete examples of:
- Adding genealogy APIs
- Adding cultural heritage sources
- Adding business data sources
- Creating custom use cases
- Bulk operations

## 📚 Documentation

- **Complete Guide**: `docs/ADDING_SOURCES.md`
- **Admin Interface**: Available in the dashboard under "Data Sources"
- **API Reference**: Check the source code in `src/lib/`

## 🚨 Best Practices

1. **Use Descriptive IDs** - Make them unique and meaningful
2. **Categorize Properly** - Use existing categories or create logical new ones
3. **Provide Good Examples** - Help users understand how to use your use cases
4. **Test Thoroughly** - Use the built-in testing features
5. **Document APIs** - Add clear descriptions for your sources

## 🎉 That's It!

Your new sources and use cases are now fully integrated and available to users. The system automatically handles:

- ✅ Authentication
- ✅ Rate limiting
- ✅ Caching
- ✅ Error handling
- ✅ UI integration

**No additional code changes required!** 