// Test script to verify data integration system is working
console.log('🧪 Testing Data Integration System...');

// Test if the module can be imported without crashing
try {
  // This will test the module loading
  const { 
    getAvailableSources, 
    getAvailableUseCases, 
    getSourceStats,
    SourceRegistry 
  } = require('./src/lib/data-integration');

  console.log('✅ Data integration module loaded successfully');

  // Test getting sources
  const sources = getAvailableSources();
  console.log(`✅ Found ${sources.length} data sources`);

  // Test getting use cases
  const useCases = getAvailableUseCases();
  console.log(`✅ Found ${useCases.length} use cases`);

  // Test getting stats
  const stats = getSourceStats();
  console.log('✅ System statistics:', {
    totalSources: stats.totalSources,
    totalUseCases: stats.totalUseCases,
    categories: Object.keys(stats.sourcesByCategory).length
  });

  console.log('🎉 All tests passed! Data integration system is working correctly.');

} catch (error) {
  console.error('❌ Test failed:', error);
  process.exit(1);
} 