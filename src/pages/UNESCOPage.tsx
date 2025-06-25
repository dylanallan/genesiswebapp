import React from 'react';
import TraditionsAnalytics from '../components/TraditionsAnalytics';
import TraditionSearchBar from '../components/TraditionSearchBar';
import TraditionsList from '../components/TraditionsList';

const UNESCOPage: React.FC = () => (
  <div className="max-w-3xl mx-auto p-6">
    <h1 className="text-2xl font-bold mb-4">UNESCO Intangible Cultural Heritage</h1>
    <TraditionsAnalytics />
    <TraditionSearchBar />
    <TraditionsList />
  </div>
);

export default UNESCOPage; 