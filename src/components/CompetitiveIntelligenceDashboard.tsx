import React, { useState, useEffect } from 'react';
import { CompetitiveIntelligence } from '../lib/competitive-intelligence';
import { ComprehensiveAnalytics } from '../lib/comprehensive-analytics';

interface CompetitorAnalysis {
  market_leaders: {
    ai_research: string[];
    enterprise_ai: string[];
    consumer_ai: string[];
    hardware_ai: string[];
    cloud_ai: string[];
  };
  technology_gaps: {
    voice_synthesis: string;
    cultural_intelligence: string;
    heritage_preservation: string;
    business_automation: string;
    cross_domain_intelligence: string;
  };
  competitive_advantages: {
    unique_positioning: string;
    cultural_intelligence: string;
    voice_technology: string;
    data_comprehensiveness: string;
    business_integration: string;
  };
  strategic_recommendations: string[];
}

interface MarketIntelligence {
  market_size: {
    cultural_ai: string;
    voice_synthesis: string;
    heritage_platforms: string;
    business_automation: string;
  };
  growth_rates: {
    cultural_ai: string;
    voice_synthesis: string;
    heritage_platforms: string;
    business_automation: string;
  };
  key_drivers: string[];
  market_segments: string[];
}

const CompetitiveIntelligenceDashboard: React.FC = () => {
  const [competitorAnalysis, setCompetitorAnalysis] = useState<CompetitorAnalysis | null>(null);
  const [marketIntelligence, setMarketIntelligence] = useState<MarketIntelligence | null>(null);
  const [crossDomainInsights, setCrossDomainInsights] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCompetitiveIntelligence();
  }, []);

  const loadCompetitiveIntelligence = async () => {
    try {
      setLoading(true);
      
      const competitiveIntel = new CompetitiveIntelligence();
      const analytics = new ComprehensiveAnalytics();
      
      const [landscape, insights] = await Promise.all([
        competitiveIntel.analyzeCompetitorLandscape(),
        analytics.generateCrossDomainInsights()
      ]);
      
      setCompetitorAnalysis(landscape);
      setCrossDomainInsights(insights);
      
      // Mock market intelligence data
      setMarketIntelligence({
        market_size: {
          cultural_ai: '$45B by 2027',
          voice_synthesis: '$28B by 2026',
          heritage_platforms: '$12B by 2025',
          business_automation: '$156B by 2026'
        },
        growth_rates: {
          cultural_ai: '156% annually',
          voice_synthesis: '89% annually',
          heritage_platforms: '234% annually',
          business_automation: '67% annually'
        },
        key_drivers: [
          'Cultural preservation demand',
          'Voice technology advancement',
          'Business automation needs',
          'AI ethics requirements'
        ],
        market_segments: [
          'Enterprise cultural AI (40%)',
          'Consumer heritage platforms (30%)',
          'Voice synthesis services (20%)',
          'Business automation (10%)'
        ]
      });
      
    } catch (error) {
      console.error('Error loading competitive intelligence:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mx-auto"></div>
            <h2 className="text-2xl font-bold text-white mt-4">Loading Competitive Intelligence...</h2>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">
            🎯 Competitive Intelligence Dashboard
          </h1>
          <p className="text-xl text-blue-200">
            Strategic Analysis: How We Surpass Major Tech Companies
          </p>
        </div>

        {/* Market Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Market Size */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
            <h3 className="text-2xl font-bold text-white mb-6">📊 Market Size & Growth</h3>
            {marketIntelligence && (
              <div className="space-y-4">
                {Object.entries(marketIntelligence.market_size).map(([key, value]) => (
                  <div key={key} className="flex justify-between items-center">
                    <span className="text-blue-200 capitalize">{key.replace('_', ' ')}</span>
                    <span className="text-green-400 font-bold">{value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Growth Rates */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
            <h3 className="text-2xl font-bold text-white mb-6">📈 Growth Rates</h3>
            {marketIntelligence && (
              <div className="space-y-4">
                {Object.entries(marketIntelligence.growth_rates).map(([key, value]) => (
                  <div key={key} className="flex justify-between items-center">
                    <span className="text-blue-200 capitalize">{key.replace('_', ' ')}</span>
                    <span className="text-yellow-400 font-bold">{value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Competitive Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Market Leaders */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
            <h3 className="text-2xl font-bold text-white mb-6">🏆 Market Leaders</h3>
            {competitorAnalysis && (
              <div className="space-y-4">
                {Object.entries(competitorAnalysis.market_leaders).map(([category, companies]) => (
                  <div key={category}>
                    <h4 className="text-lg font-semibold text-blue-200 capitalize mb-2">
                      {category.replace('_', ' ')}
                    </h4>
                    <div className="space-y-1">
                      {companies.map((company, index) => (
                        <div key={index} className="text-sm text-gray-300">
                          • {company}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Technology Gaps */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
            <h3 className="text-2xl font-bold text-white mb-6">🕳️ Technology Gaps</h3>
            {competitorAnalysis && (
              <div className="space-y-4">
                {Object.entries(competitorAnalysis.technology_gaps).map(([gap, description]) => (
                  <div key={gap}>
                    <h4 className="text-lg font-semibold text-red-300 capitalize mb-2">
                      {gap.replace('_', ' ')}
                    </h4>
                    <p className="text-sm text-gray-300">{description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Our Advantages */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
            <h3 className="text-2xl font-bold text-white mb-6">🚀 Our Advantages</h3>
            {competitorAnalysis && (
              <div className="space-y-4">
                {Object.entries(competitorAnalysis.competitive_advantages).map(([advantage, description]) => (
                  <div key={advantage}>
                    <h4 className="text-lg font-semibold text-green-300 capitalize mb-2">
                      {advantage.replace('_', ' ')}
                    </h4>
                    <p className="text-sm text-gray-300">{description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Strategic Recommendations */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 mb-12">
          <h3 className="text-2xl font-bold text-white mb-6">📋 Strategic Recommendations</h3>
          {competitorAnalysis && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {competitorAnalysis.strategic_recommendations.map((recommendation, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <span className="text-green-400 text-xl">✓</span>
                  <span className="text-gray-200">{recommendation}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cross-Domain Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Academic-Business Correlation */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
            <h3 className="text-2xl font-bold text-white mb-6">🎓 Academic-Business Correlation</h3>
            {crossDomainInsights?.academic_business_correlation && (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-4xl font-bold text-green-400">
                    {Math.round(crossDomainInsights.academic_business_correlation.correlation_strength * 100)}%
                  </div>
                  <div className="text-blue-200">Correlation Strength</div>
                </div>
                <div className="space-y-2">
                  {crossDomainInsights.academic_business_correlation.key_insights.map((insight: string, index: number) => (
                    <div key={index} className="text-sm text-gray-300">• {insight}</div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Cultural Technology Trends */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
            <h3 className="text-2xl font-bold text-white mb-6">🏺 Cultural Technology Trends</h3>
            {crossDomainInsights?.cultural_technology_trends && (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-4xl font-bold text-purple-400">
                    {Math.round(crossDomainInsights.cultural_technology_trends.cultural_impact_score * 100)}%
                  </div>
                  <div className="text-blue-200">Cultural Impact Score</div>
                </div>
                <div className="space-y-2">
                  {crossDomainInsights.cultural_technology_trends.key_findings.map((finding: string, index: number) => (
                    <div key={index} className="text-sm text-gray-300">• {finding}</div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Market Drivers & Segments */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Key Drivers */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
            <h3 className="text-2xl font-bold text-white mb-6">🔑 Key Market Drivers</h3>
            {marketIntelligence && (
              <div className="space-y-3">
                {marketIntelligence.key_drivers.map((driver, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <span className="text-yellow-400 text-xl">🔥</span>
                    <span className="text-gray-200">{driver}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Market Segments */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
            <h3 className="text-2xl font-bold text-white mb-6">📊 Market Segments</h3>
            {marketIntelligence && (
              <div className="space-y-3">
                {marketIntelligence.market_segments.map((segment, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <span className="text-blue-400 text-xl">📈</span>
                    <span className="text-gray-200">{segment}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Competitive Positioning Summary */}
        <div className="mt-12 bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-2xl p-8 border border-green-500/30">
          <h3 className="text-3xl font-bold text-white mb-6 text-center">
            🎯 Competitive Positioning Summary
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-4xl font-bold text-green-400 mb-2">10 Years</div>
              <div className="text-blue-200">Competitive Advantage</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-purple-400 mb-2">$45B</div>
              <div className="text-blue-200">Market Opportunity</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-yellow-400 mb-2">156%</div>
              <div className="text-blue-200">Annual Growth Rate</div>
            </div>
          </div>
          <div className="text-center mt-6">
            <p className="text-xl text-white">
              Genesis Heritage Pro is positioned to lead the cultural AI revolution and achieve market leadership
              through our unique combination of cultural intelligence, advanced voice synthesis, and comprehensive
              business integration.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompetitiveIntelligenceDashboard; 