import nlp from 'compromise';
import natural from 'natural';
import { supabase } from './supabase';

interface VerificationResult {
  isVerified: boolean;
  confidence: number;
  sources: string[];
  potentialContacts?: Contact[];
  suggestedQuestions?: string[];
}

interface Contact {
  name: string;
  relationship: string;
  contactInfo?: string;
}

interface FactCheck {
  fact: string;
  sources: string[];
  confidence: number;
  verificationMethod: string[];
}

export async function verifyFamilyHistory(text: string): Promise<VerificationResult> {
  const facts = extractFacts(text);
  const verifiedFacts: FactCheck[] = [];
  const contacts: Contact[] = [];

  for (const fact of facts) {
    const verification = await verifyFact(fact);
    verifiedFacts.push(verification);

    if (verification.confidence < 0.8) {
      const relatedContacts = await findRelatedContacts(fact);
      contacts.push(...relatedContacts);
    }
  }

  const overallConfidence = calculateOverallConfidence(verifiedFacts);
  const suggestedQuestions = generateFollowUpQuestions(facts, verifiedFacts);

  return {
    isVerified: overallConfidence > 0.8,
    confidence: overallConfidence,
    sources: [...new Set(verifiedFacts.flatMap(f => f.sources))],
    potentialContacts: contacts.length > 0 ? contacts : undefined,
    suggestedQuestions
  };
}

function extractFacts(text: string): string[] {
  const doc = nlp(text);
  
  // Extract statements about dates, places, people, and events
  const statements = doc.match('#Person+ (was|were|had|lived|worked|married|born|died) #Preposition? #Place+? #Date+?').out('array');
  
  // Extract relationships
  const relationships = doc.match('#Person+ #Possessive? (#Noun|#Adjective)+ (#Preposition #Person+)?').out('array');
  
  return [...new Set([...statements, ...relationships])];
}

async function verifyFact(fact: string): Promise<FactCheck> {
  const verificationMethods = [];
  const sources = [];
  let confidence = 0;

  // 1. Check against genealogical databases
  const { data: dbResults, error: dbError } = await supabase
    .from('genealogy_records')
    .select('*')
    .textSearch('content', fact);

  if (!dbError && dbResults?.length > 0) {
    confidence += 0.4;
    verificationMethods.push('database_match');
    sources.push(...dbResults.map(r => r.source));
  }

  // 2. Natural language analysis for consistency
  const tokenizer = new natural.WordTokenizer();
  const tokens = tokenizer.tokenize(fact);
  const classifier = new natural.BayesClassifier();
  
  // Train classifier with known patterns
  classifier.addDocument('born in city on date', 'valid_birth_record');
  classifier.addDocument('married to person in place', 'valid_marriage_record');
  classifier.train();

  const classification = classifier.classify(fact);
  if (classification.startsWith('valid_')) {
    confidence += 0.2;
    verificationMethods.push('linguistic_analysis');
  }

  // 3. Cross-reference with historical records
  const { data: historicalData, error: historicalError } = await supabase
    .from('historical_records')
    .select('*')
    .textSearch('content', fact);

  if (!historicalError && historicalData?.length > 0) {
    confidence += 0.3;
    verificationMethods.push('historical_records');
    sources.push(...historicalData.map(r => r.source));
  }

  return {
    fact,
    sources,
    confidence,
    verificationMethod: verificationMethods
  };
}

async function findRelatedContacts(fact: string): Promise<Contact[]> {
  const doc = nlp(fact);
  const people = doc.people().out('array');
  const contacts: Contact[] = [];

  for (const person of people) {
    const { data, error } = await supabase
      .from('family_contacts')
      .select('*')
      .textSearch('related_names', person);

    if (!error && data) {
      contacts.push(...data.map(contact => ({
        name: contact.name,
        relationship: contact.relationship,
        contactInfo: contact.contact_info
      })));
    }
  }

  return contacts;
}

function calculateOverallConfidence(facts: FactCheck[]): number {
  if (facts.length === 0) return 0;
  
  const weightedConfidence = facts.reduce((sum, fact) => {
    let weight = 1;
    
    // Add weight based on verification methods
    weight += fact.verificationMethod.length * 0.2;
    
    // Add weight based on number of sources
    weight += fact.sources.length * 0.1;
    
    return sum + (fact.confidence * weight);
  }, 0);

  return Math.min(weightedConfidence / facts.length, 1);
}

function generateFollowUpQuestions(facts: string[], verifiedFacts: FactCheck[]): string[] {
  const questions: string[] = [];
  
  for (const fact of facts) {
    const verification = verifiedFacts.find(v => v.fact === fact);
    
    if (!verification || verification.confidence < 0.8) {
      const doc = nlp(fact);
      
      // Generate questions based on missing information
      if (!doc.dates().length) {
        questions.push(`When did this event with ${doc.people().out('text')} occur?`);
      }
      
      if (!doc.places().length) {
        questions.push(`Where did this happen with ${doc.people().out('text')}?`);
      }
      
      // Ask for additional context
      questions.push(`Can you provide more details about ${doc.people().out('text')} and this event?`);
    }
  }

  return [...new Set(questions)];
}