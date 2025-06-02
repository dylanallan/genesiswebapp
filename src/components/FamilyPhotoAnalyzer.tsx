import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Upload, Image as ImageIcon, Loader2, Users, Tag, MapPin, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';

interface PhotoAnalysis {
  faces: Face[];
  labels: string[];
  location?: string;
  date?: string;
  objects: string[];
  relationships?: Relationship[];
}

interface Face {
  boundingBox: BoundingBox;
  confidence: number;
  landmarks: Landmark[];
  emotions: Emotion[];
  age: AgeRange;
  gender: string;
  name?: string;
}

interface BoundingBox {
  left: number;
  top: number;
  width: number;
  height: number;
}

interface Landmark {
  type: string;
  position: {
    x: number;
    y: number;
  };
}

interface Emotion {
  type: string;
  confidence: number;
}

interface AgeRange {
  low: number;
  high: number;
}

interface Relationship {
  person1: string;
  person2: string;
  relationship: string;
  confidence: number;
}

export const FamilyPhotoAnalyzer: React.FC = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<PhotoAnalysis | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const { register, handleSubmit, reset } = useForm();

  const analyzePhoto = async (file: File) => {
    try {
      setIsAnalyzing(true);

      // Create a preview URL for the selected image
      const imageUrl = URL.createObjectURL(file);
      setSelectedImage(imageUrl);

      // Upload to Supabase storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('family-photos')
        .upload(`photos/${Date.now()}-${file.name}`, file);

      if (uploadError) throw uploadError;

      // Call Google Vision AI through Edge Function
      const { data: analysisData, error: analysisError } = await supabase.functions
        .invoke('analyze-photo', {
          body: { photoPath: uploadData.path }
        });

      if (analysisError) throw analysisError;

      setAnalysis(analysisData);
      toast.success('Photo analysis complete!');

      // Store analysis results
      const { error: dbError } = await supabase
        .from('photo_analyses')
        .insert({
          photo_path: uploadData.path,
          analysis: analysisData,
          created_at: new Date().toISOString()
        });

      if (dbError) throw dbError;

    } catch (error) {
      console.error('Error analyzing photo:', error);
      toast.error('Failed to analyze photo. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      analyzePhoto(file);
    }
  };

  const updatePersonName = async (faceIndex: number, name: string) => {
    if (!analysis) return;

    const updatedAnalysis = {
      ...analysis,
      faces: analysis.faces.map((face, index) => 
        index === faceIndex ? { ...face, name } : face
      )
    };

    setAnalysis(updatedAnalysis);

    try {
      await supabase
        .from('face_names')
        .upsert({
          face_id: `${selectedImage}-${faceIndex}`,
          name,
          updated_at: new Date().toISOString()
        });

      toast.success(`Name updated to ${name}`);
    } catch (error) {
      console.error('Error updating name:', error);
      toast.error('Failed to update name');
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <ImageIcon className="w-6 h-6 text-blue-500" />
            <h2 className="text-xl font-semibold text-gray-900">Family Photo Analyzer</h2>
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            disabled={isAnalyzing}
          >
            {isAnalyzing ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Upload className="w-5 h-5" />
                <span>Upload Photo</span>
              </>
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {selectedImage && (
          <div className="relative mb-6">
            <img
              src={selectedImage}
              alt="Selected family photo"
              className="w-full rounded-lg"
            />
            {analysis?.faces.map((face, index) => (
              <div
                key={index}
                style={{
                  position: 'absolute',
                  left: `${face.boundingBox.left * 100}%`,
                  top: `${face.boundingBox.top * 100}%`,
                  width: `${face.boundingBox.width * 100}%`,
                  height: `${face.boundingBox.height * 100}%`,
                  border: '2px solid #3b82f6',
                  borderRadius: '4px'
                }}
              >
                <div className="absolute -bottom-8 left-0 bg-white px-2 py-1 rounded-md shadow-sm border border-gray-200 text-sm">
                  {face.name || `Person ${index + 1}`}
                </div>
              </div>
            ))}
          </div>
        )}

        {analysis && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-3">
                  <Users className="w-5 h-5 text-blue-500" />
                  <h3 className="font-medium text-blue-900">People</h3>
                </div>
                <div className="space-y-2">
                  {analysis.faces.map((face, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm text-blue-800">
                        {face.name || `Person ${index + 1}`}
                      </span>
                      <button
                        onClick={() => {
                          const name = prompt('Enter name:');
                          if (name) updatePersonName(index, name);
                        }}
                        className="text-xs text-blue-600 hover:text-blue-700"
                      >
                        Edit Name
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-3">
                  <Tag className="w-5 h-5 text-green-500" />
                  <h3 className="font-medium text-green-900">Labels</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {analysis.labels.map((label, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs"
                    >
                      {label}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-3">
                  <MapPin className="w-5 h-5 text-purple-500" />
                  <h3 className="font-medium text-purple-900">Details</h3>
                </div>
                <div className="space-y-2 text-sm text-purple-800">
                  {analysis.location && (
                    <p>📍 Location: {analysis.location}</p>
                  )}
                  {analysis.date && (
                    <p>📅 Date: {analysis.date}</p>
                  )}
                </div>
              </div>
            </div>

            {analysis.relationships && analysis.relationships.length > 0 && (
              <div className="bg-amber-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-3">
                  <Users className="w-5 h-5 text-amber-500" />
                  <h3 className="font-medium text-amber-900">Relationships</h3>
                </div>
                <div className="space-y-2">
                  {analysis.relationships.map((rel, index) => (
                    <div key={index} className="text-sm text-amber-800">
                      {rel.person1} is {rel.relationship} to {rel.person2}
                      <span className="text-xs text-amber-600 ml-2">
                        ({Math.round(rel.confidence * 100)}% confidence)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};