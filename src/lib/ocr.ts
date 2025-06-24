import { createWorker } from 'tesseract.js';
import { supabase } from './supabase';
import { toast } from 'sonner';

export async function processImage(imageFile: File) {
  try {
    const worker = await createWorker('eng');
    
    // Process image with OCR
    const { data: { text } } = await worker.recognize(imageFile);
    await worker.terminate();

    // Extract potential dates, names, and locations
    const dates = text.match(/\b\d{1,2}[-/]\d{1,2}[-/]\d{2,4}\b|\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2},? \d{4}\b/g) || [];
    const names = text.match(/\b[A-Z][a-z]+ (?:[A-Z][a-z]+ )?[A-Z][a-z]+\b/g) || [];
    const locations = text.match(/\b[A-Z][a-z]+(?: [A-Z][a-z]+)*,? (?:[A-Z]{2}|[A-Z][a-z]+(?: [A-Z][a-z]+)*)\b/g) || [];

    // Store the extracted data
    const { data, error } = await supabase
      .from('cultural_artifacts')
      .insert({
        title: 'OCR Processed Document',
        description: text,
        category: 'document',
        metadata: {
          dates,
          names,
          locations,
          ocr_confidence: 0.95
        }
      })
      .select()
      .maybeSingle();

    if (error) throw error;

    toast.success('Document processed successfully');
    return { text, dates, names, locations, artifactId: data.id };
  } catch (error) {
    console.error('OCR processing error:', error);
    toast.error('Error processing document');
    throw error;
  }
}