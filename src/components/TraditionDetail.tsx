import React from 'react';

const TraditionDetail: React.FC<{ tradition: any }> = ({ tradition }) => {
  if (!tradition) return <div>No tradition selected.</div>;
  return (
    <div className="p-4 border rounded-lg bg-white shadow">
      <h2 className="text-2xl font-bold mb-2">{tradition.title}</h2>
      <p className="mb-2 text-gray-700">{tradition.description}</p>
      <div className="mb-2"><strong>Country:</strong> {tradition.country}</div>
      <div className="mb-2"><strong>Region:</strong> {tradition.region}</div>
      <div className="mb-2"><strong>Domain:</strong> {tradition.domain}</div>
      <div className="mb-2"><strong>Year:</strong> {tradition.year}</div>
      {tradition.external_id && (
        <div className="mb-2"><strong>External ID:</strong> {tradition.external_id}</div>
      )}
      {tradition.source && (
        <div className="mb-2"><strong>Source:</strong> {tradition.source}</div>
      )}
    </div>
  );
};

export default TraditionDetail; 