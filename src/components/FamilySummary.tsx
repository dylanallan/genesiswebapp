import React from 'react';
import { useGlobalData } from '../lib/GlobalDataContext';

const FamilySummary: React.FC = () => {
  const { familyContacts, loading, error } = useGlobalData();

  if (loading) return <div>Loading family data...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h2 className="text-xl font-bold mb-2">Family Contacts</h2>
      <ul className="list-disc pl-5">
        {familyContacts.map((contact: any) => (
          <li key={contact.id} className="mb-1">{contact.name} ({contact.relationship})</li>
        ))}
      </ul>
    </div>
  );
};

export default FamilySummary; 