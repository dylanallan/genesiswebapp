// Example: Adding New Data Sources and Use Cases
// This file demonstrates how incredibly easy it is to extend the Genesis web app

import { 
  addAPISource, 
  addPublicAPISource, 
  addUseCase,
  getSourceStats,
  listAllSources,
  listAllUseCases 
} from '../src/lib/source-templates';

// ============================================================================
// EXAMPLE 1: Add a New Genealogy API
// ============================================================================

console.log('🔗 Adding new genealogy API...');

addAPISource(
  'geneanet',
  'Geneanet',
  'https://api.geneanet.org',
  'your-geneanet-api-key',
  'French genealogy database with European records',
  ['genealogy', 'french', 'european']
);

// ============================================================================
// EXAMPLE 2: Add a New Cultural Heritage API
// ============================================================================

console.log('🏛️ Adding new cultural heritage API...');

addPublicAPISource(
  'met-museum',
  'Metropolitan Museum of Art',
  'https://collectionapi.metmuseum.org/public/collection/v1',
  'Metropolitan Museum of Art collection API',
  ['cultural-heritage', 'art', 'museums']
);

// ============================================================================
// EXAMPLE 3: Add a New Business Data API
// ============================================================================

console.log('📊 Adding new business data API...');

addAPISource(
  'alpha-vantage',
  'Alpha Vantage',
  'https://www.alphavantage.co/query',
  'your-alpha-vantage-api-key',
  'Real-time and historical stock market data',
  ['financial', 'business', 'stocks']
);

// ============================================================================
// EXAMPLE 4: Add New Use Cases
// ============================================================================

console.log('🎯 Adding new use cases...');

// DNA Matching Use Case
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

// Art Collection Research Use Case
addUseCase(
  'art-research',
  'Art Collection Research',
  'Research art collections and cultural artifacts',
  ['cultural-heritage', 'art'],
  ['met-museum', 'smithsonian', 'europeana'],
  'Find information about {artwork_type} from {period} or by {artist}',
  [
    'Find Renaissance paintings in museum collections',
    'Research ancient Egyptian artifacts',
    'Explore modern art collections from the 20th century'
  ]
);

// Stock Market Analysis Use Case
addUseCase(
  'stock-analysis',
  'Stock Market Analysis',
  'Analyze stock market data and trends',
  ['financial', 'business'],
  ['alpha-vantage', 'fred'],
  'Analyze {stock_symbol} performance over {timeframe}',
  [
    'Analyze AAPL performance over the last 6 months',
    'Research TSLA stock trends',
    'Compare tech sector performance'
  ]
);

// ============================================================================
// EXAMPLE 5: Display Results
// ============================================================================

console.log('\n📊 Current System Statistics:');
const stats = getSourceStats();
console.log(`Total Sources: ${stats.totalSources}`);
console.log(`Total Use Cases: ${stats.totalUseCases}`);
console.log(`Categories: ${Object.keys(stats.sourcesByCategory).length}`);

console.log('\n🔗 Available Sources:');
listAllSources();

console.log('\n🎯 Available Use Cases:');
listAllUseCases();

console.log('\n✅ All examples completed successfully!');
console.log('🎉 Your new sources and use cases are now available in the app!');

// ============================================================================
// USAGE INSTRUCTIONS
// ============================================================================

console.log(`
🎯 HOW TO USE:

1. Copy any of the examples above
2. Replace API keys with your actual keys
3. Run the script or add to your app
4. New sources and use cases appear automatically in the UI

🔄 AUTOMATIC INTEGRATION:
- Sources appear in Universal Search
- Use cases appear in dropdown menus
- Categories are automatically filtered
- Admin interface shows all additions

📚 NEXT STEPS:
- Add your own API sources
- Create custom use cases
- Test with the admin interface
- Deploy to production

🚀 That's it! Your app is now more powerful!
`); 