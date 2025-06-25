// Comprehensive API Integrations for Genesis Heritage Pro
// Building the world's most comprehensive knowledge base

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://yomgwdeqsvbapvqpuspq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvbWd3ZGVxc3ZiYXB2cXB1c3BxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU5NzI4NzQsImV4cCI6MjA1MTU0ODg3NH0.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export class ComprehensiveAPIIntegrations {
  constructor() {
    this.apiKeys = {
      // Academic APIs
      arxiv: null, // No key required
      semanticScholar: null, // No key required
      crossref: null, // No key required
      ieee: process.env.IEEE_API_KEY,
      elsevier: process.env.ELSEVIER_API_KEY,
      
      // Government APIs
      nasa: process.env.NASA_API_KEY,
      census: null, // No key required
      fda: null, // No key required
      weather: null, // No key required
      
      // Cultural APIs
      familySearch: process.env.FAMILYSEARCH_API_KEY,
      ancestry: process.env.ANCESTRY_API_KEY,
      myHeritage: process.env.MYHERITAGE_API_KEY,
      wikimedia: null, // No key required
      loc: null, // No key required
      europeana: process.env.EUROPEANA_API_KEY,
      
      // Business APIs
      alphaVantage: process.env.ALPHA_VANTAGE_API_KEY,
      polygon: process.env.POLYGON_API_KEY,
      yahoo: null, // No key required
      finnhub: process.env.FINNHUB_API_KEY,
      quandl: process.env.QUANDL_API_KEY,
      crunchbase: process.env.CRUNCHBASE_API_KEY,
      pitchbook: process.env.PITCHBOOK_API_KEY,
      clearbit: process.env.CLEARBIT_API_KEY,
      
      // Scientific APIs
      clinicalTrials: null, // No key required
      ensembl: null, // No key required
      uniprot: null, // No key required
      pdb: null, // No key required
      chemspider: process.env.CHEMSPIDER_API_KEY,
      
      // News APIs
      newsAPI: process.env.NEWS_API_KEY,
      nyt: process.env.NYT_API_KEY,
      guardian: process.env.GUARDIAN_API_KEY,
      reuters: process.env.REUTERS_API_KEY,
      
      // Technology APIs
      googlePatents: null, // No key required
      uspto: null, // No key required
      kaggle: process.env.KAGGLE_API_KEY,
      huggingface: process.env.HUGGINGFACE_API_KEY,
      
      // Social APIs
      twitter: process.env.TWITTER_API_KEY,
      reddit: process.env.REDDIT_API_KEY,
      stackoverflow: null, // No key required
      github: process.env.GITHUB_API_KEY,
      
      // Legal APIs
      courtListener: null, // No key required
      cornellLaw: null, // No key required
      
      // Environmental APIs
      noaa: null, // No key required
      epa: null, // No key required
      worldBank: null, // No key required
    };
  }

  // Academic & Research Intelligence APIs
  async fetchArxivData(query = 'artificial intelligence', maxResults = 100) {
    try {
      const url = `https://export.arxiv.org/api/query?search_query=all:${encodeURIComponent(query)}&start=0&max_results=${maxResults}`;
      const response = await fetch(url);
      const data = await response.text();
      
      // Parse XML response
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(data, 'text/xml');
      const entries = xmlDoc.getElementsByTagName('entry');
      
      const papers = [];
      for (let entry of entries) {
        papers.push({
          title: entry.getElementsByTagName('title')[0]?.textContent,
          authors: Array.from(entry.getElementsByTagName('author')).map(a => a.textContent),
          summary: entry.getElementsByTagName('summary')[0]?.textContent,
          published: entry.getElementsByTagName('published')[0]?.textContent,
          category: entry.getElementsByTagName('category')[0]?.getAttribute('term'),
          source: 'arXiv',
          source_category: 'Academic Research & Publications'
        });
      }
      
      return papers;
    } catch (error) {
      console.error('Error fetching arXiv data:', error);
      return [];
    }
  }

  async fetchSemanticScholarData(query = 'artificial intelligence', limit = 100) {
    try {
      const url = `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(query)}&limit=${limit}&fields=title,authors,abstract,year,venue,citationCount`;
      const response = await fetch(url);
      const data = await response.json();
      
      return data.data?.map(paper => ({
        title: paper.title,
        authors: paper.authors?.map(a => a.name),
        abstract: paper.abstract,
        year: paper.year,
        venue: paper.venue,
        citations: paper.citationCount,
        source: 'Semantic Scholar',
        source_category: 'Academic Research & Publications'
      })) || [];
    } catch (error) {
      console.error('Error fetching Semantic Scholar data:', error);
      return [];
    }
  }

  async fetchPubMedData(query = 'artificial intelligence', maxResults = 100) {
    try {
      const url = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(query)}&retmax=${maxResults}&retmode=json`;
      const response = await fetch(url);
      const data = await response.json();
      
      const ids = data.esearchresult?.idlist || [];
      const articles = [];
      
      for (let id of ids.slice(0, 10)) { // Limit to 10 for performance
        const articleUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${id}&retmode=json`;
        const articleResponse = await fetch(articleUrl);
        const articleData = await articleResponse.json();
        
        const article = articleData.result[id];
        if (article) {
          articles.push({
            title: article.title,
            authors: article.authors?.map(a => a.name),
            abstract: article.abstract,
            journal: article.fulljournalname,
            published: article.pubdate,
            source: 'PubMed',
            source_category: 'Scientific & Medical Research'
          });
        }
      }
      
      return articles;
    } catch (error) {
      console.error('Error fetching PubMed data:', error);
      return [];
    }
  }

  // Cultural Heritage & Genealogy APIs
  async fetchWikimediaData(query = 'family history', limit = 100) {
    try {
      const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`;
      const response = await fetch(url);
      const data = await response.json();
      
      return [{
        title: data.title,
        description: data.extract,
        url: data.content_urls?.desktop?.page,
        source: 'Wikimedia',
        source_category: 'Cultural Heritage & Genealogy'
      }];
    } catch (error) {
      console.error('Error fetching Wikimedia data:', error);
      return [];
    }
  }

  async fetchLibraryOfCongressData(query = 'family history', limit = 100) {
    try {
      const url = `https://www.loc.gov/collections/?fo=json&c=${limit}&q=${encodeURIComponent(query)}`;
      const response = await fetch(url);
      const data = await response.json();
      
      return data.results?.map(item => ({
        title: item.title,
        description: item.description,
        url: item.url,
        source: 'Library of Congress',
        source_category: 'Cultural Heritage & Genealogy'
      })) || [];
    } catch (error) {
      console.error('Error fetching Library of Congress data:', error);
      return [];
    }
  }

  // Business & Economic Intelligence APIs
  async fetchAlphaVantageData(symbol = 'AAPL') {
    try {
      if (!this.apiKeys.alphaVantage) {
        console.warn('Alpha Vantage API key not configured');
        return [];
      }
      
      const url = `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${symbol}&apikey=${this.apiKeys.alphaVantage}`;
      const response = await fetch(url);
      const data = await response.json();
      
      return [{
        company_name: data.Name,
        ticker_symbol: data.Symbol,
        industry: data.Industry,
        market_cap: data.MarketCapitalization,
        revenue: data.RevenueTTM,
        employees: data.FullTimeEmployees,
        description: data.Description,
        source: 'Alpha Vantage',
        source_category: 'Business & Economic Intelligence'
      }];
    } catch (error) {
      console.error('Error fetching Alpha Vantage data:', error);
      return [];
    }
  }

  async fetchYahooFinanceData(symbol = 'AAPL') {
    try {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=5y`;
      const response = await fetch(url);
      const data = await response.json();
      
      const quote = data.chart?.result?.[0]?.meta;
      if (quote) {
        return [{
          company_name: quote.symbol,
          ticker_symbol: quote.symbol,
          market_cap: quote.marketCap,
          currency: quote.currency,
          source: 'Yahoo Finance',
          source_category: 'Business & Economic Intelligence'
        }];
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching Yahoo Finance data:', error);
      return [];
    }
  }

  // News & Media Intelligence APIs
  async fetchNewsAPIData(query = 'artificial intelligence', pageSize = 100) {
    try {
      if (!this.apiKeys.newsAPI) {
        console.warn('News API key not configured');
        return [];
      }
      
      const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&apiKey=${this.apiKeys.newsAPI}&pageSize=${pageSize}&language=en&sortBy=publishedAt`;
      const response = await fetch(url);
      const data = await response.json();
      
      return data.articles?.map(article => ({
        title: article.title,
        author: article.author,
        source: article.source.name,
        url: article.url,
        published_date: article.publishedAt,
        content: article.content,
        summary: article.description,
        source_api: 'NewsAPI',
        source_category: 'News & Media Intelligence'
      })) || [];
    } catch (error) {
      console.error('Error fetching News API data:', error);
      return [];
    }
  }

  // Technology & Innovation Intelligence APIs
  async fetchGooglePatentsData(query = 'artificial intelligence', num = 100) {
    try {
      const url = `https://patents.google.com/xhr/query?q=${encodeURIComponent(query)}&num=${num}&language=ENGLISH&type=PATENT`;
      const response = await fetch(url);
      const data = await response.json();
      
      return data.results?.map(patent => ({
        patent_number: patent.patent_number,
        title: patent.title,
        inventors: patent.inventors,
        assignee: patent.assignee,
        filing_date: patent.filing_date,
        publication_date: patent.publication_date,
        abstract: patent.abstract,
        source: 'Google Patents',
        source_category: 'Technology & Innovation Intelligence'
      })) || [];
    } catch (error) {
      console.error('Error fetching Google Patents data:', error);
      return [];
    }
  }

  async fetchKaggleDatasets(query = 'artificial intelligence', limit = 100) {
    try {
      if (!this.apiKeys.kaggle) {
        console.warn('Kaggle API key not configured');
        return [];
      }
      
      const url = `https://www.kaggle.com/api/v1/datasets?search=${encodeURIComponent(query)}&limit=${limit}`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.apiKeys.kaggle}`
        }
      });
      const data = await response.json();
      
      return data.map(dataset => ({
        dataset_name: dataset.title,
        description: dataset.description,
        source: dataset.ownerName,
        data_type: dataset.datasetType,
        sample_size: dataset.downloadCount,
        variables: dataset.tags,
        source_api: 'Kaggle',
        source_category: 'Technology & Innovation Intelligence'
      }));
    } catch (error) {
      console.error('Error fetching Kaggle data:', error);
      return [];
    }
  }

  // Social & Demographic Intelligence APIs
  async fetchGitHubData(query = 'artificial intelligence', limit = 100) {
    try {
      if (!this.apiKeys.github) {
        console.warn('GitHub API key not configured');
        return [];
      }
      
      const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=${limit}`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `token ${this.apiKeys.github}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      const data = await response.json();
      
      return data.items?.map(repo => ({
        title: repo.name,
        description: repo.description,
        author: repo.owner.login,
        url: repo.html_url,
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        language: repo.language,
        source: 'GitHub',
        source_category: 'Social & Demographic Intelligence'
      })) || [];
    } catch (error) {
      console.error('Error fetching GitHub data:', error);
      return [];
    }
  }

  async fetchStackOverflowData(query = 'artificial intelligence', limit = 100) {
    try {
      const url = `https://api.stackoverflow.com/2.3/search?order=desc&sort=activity&tagged=${encodeURIComponent(query)}&site=stackoverflow&pagesize=${limit}`;
      const response = await fetch(url);
      const data = await response.json();
      
      return data.items?.map(question => ({
        title: question.title,
        content: question.body,
        author: question.owner?.display_name,
        url: question.link,
        score: question.score,
        answers: question.answer_count,
        tags: question.tags,
        source: 'Stack Overflow',
        source_category: 'Social & Demographic Intelligence'
      })) || [];
    } catch (error) {
      console.error('Error fetching Stack Overflow data:', error);
      return [];
    }
  }

  // Government & Public Data APIs
  async fetchNASAAPOD(count = 100) {
    try {
      if (!this.apiKeys.nasa) {
        console.warn('NASA API key not configured');
        return [];
      }
      
      const url = `https://api.nasa.gov/planetary/apod?api_key=${this.apiKeys.nasa}&count=${count}`;
      const response = await fetch(url);
      const data = await response.json();
      
      return data.map(apod => ({
        title: apod.title,
        description: apod.explanation,
        url: apod.url,
        date: apod.date,
        copyright: apod.copyright,
        source: 'NASA',
        source_category: 'Government & Public Data'
      }));
    } catch (error) {
      console.error('Error fetching NASA APOD data:', error);
      return [];
    }
  }

  async fetchCensusData() {
    try {
      const url = 'https://api.census.gov/data/2020/dec/pl?get=NAME,P0010001&for=state:*';
      const response = await fetch(url);
      const data = await response.json();
      
      return data.slice(1).map(row => ({
        state: row[0],
        population: parseInt(row[1]),
        source: 'US Census Bureau',
        source_category: 'Government & Public Data'
      }));
    } catch (error) {
      console.error('Error fetching Census data:', error);
      return [];
    }
  }

  // Environmental & Climate Intelligence APIs
  async fetchNOAAData() {
    try {
      const url = 'https://api.weather.gov/gridpoints/TOP/31,80/forecast';
      const response = await fetch(url);
      const data = await response.json();
      
      return data.properties?.periods?.map(period => ({
        title: period.name,
        description: period.detailedForecast,
        temperature: period.temperature,
        wind_speed: period.windSpeed,
        source: 'NOAA',
        source_category: 'Environmental & Climate Intelligence'
      })) || [];
    } catch (error) {
      console.error('Error fetching NOAA data:', error);
      return [];
    }
  }

  // Unified Data Ingestion Method
  async ingestAllDataSources() {
    console.log('🚀 Starting comprehensive data ingestion...');
    
    const allData = {
      academic: [],
      cultural: [],
      business: [],
      news: [],
      technology: [],
      social: [],
      government: [],
      environmental: []
    };

    try {
      // Academic data
      console.log('📚 Fetching academic data...');
      allData.academic = [
        ...await this.fetchArxivData('artificial intelligence', 50),
        ...await this.fetchSemanticScholarData('AI research', 50),
        ...await this.fetchPubMedData('machine learning', 50)
      ];

      // Cultural data
      console.log('🏺 Fetching cultural data...');
      allData.cultural = [
        ...await this.fetchWikimediaData('family history', 50),
        ...await this.fetchLibraryOfCongressData('genealogy', 50)
      ];

      // Business data
      console.log('💼 Fetching business data...');
      allData.business = [
        ...await this.fetchAlphaVantageData('AAPL'),
        ...await this.fetchYahooFinanceData('GOOGL')
      ];

      // News data
      console.log('📰 Fetching news data...');
      allData.news = await this.fetchNewsAPIData('AI technology', 50);

      // Technology data
      console.log('⚡ Fetching technology data...');
      allData.technology = [
        ...await this.fetchGooglePatentsData('artificial intelligence', 50),
        ...await this.fetchKaggleDatasets('machine learning', 50)
      ];

      // Social data
      console.log('👥 Fetching social data...');
      allData.social = [
        ...await this.fetchGitHubData('AI projects', 50),
        ...await this.fetchStackOverflowData('artificial intelligence', 50)
      ];

      // Government data
      console.log('🏛️ Fetching government data...');
      allData.government = [
        ...await this.fetchNASAAPOD(50),
        ...await this.fetchCensusData()
      ];

      // Environmental data
      console.log('🌍 Fetching environmental data...');
      allData.environmental = await this.fetchNOAAData();

      console.log('✅ Data ingestion completed successfully!');
      return allData;

    } catch (error) {
      console.error('❌ Error in comprehensive data ingestion:', error);
      return allData;
    }
  }

  // Store data in Supabase
  async storeDataInSupabase(data) {
    console.log('🗄️ Storing data in Supabase...');
    
    try {
      for (const [category, items] of Object.entries(data)) {
        if (items.length > 0) {
          const { error } = await supabase
            .from('knowledge_base')
            .insert(items);
          
          if (error) {
            console.error(`Error storing ${category} data:`, error);
          } else {
            console.log(`✅ Stored ${items.length} ${category} items`);
          }
        }
      }
      
      console.log('✅ All data stored successfully!');
    } catch (error) {
      console.error('❌ Error storing data:', error);
    }
  }
} 