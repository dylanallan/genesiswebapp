import { createClient } from 'npm:@supabase/supabase-js';
import { ImageAnnotatorClient } from 'npm:@google-cloud/vision';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { photoPath } = await req.json();

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get photo from storage
    const { data: photoData, error: photoError } = await supabase.storage
      .from('family-photos')
      .download(photoPath);

    if (photoError) throw photoError;

    // Initialize Google Vision client
    const vision = new ImageAnnotatorClient({
      credentials: JSON.parse(Deno.env.get('GOOGLE_VISION_CREDENTIALS')!)
    });

    // Analyze the image
    const [result] = await vision.annotateImage({
      image: { content: await photoData.arrayBuffer() },
      features: [
        { type: 'FACE_DETECTION' },
        { type: 'LABEL_DETECTION' },
        { type: 'LANDMARK_DETECTION' },
        { type: 'OBJECT_LOCALIZATION' },
        { type: 'TEXT_DETECTION' }
      ]
    });

    // Process faces
    const faces = result.faceAnnotations?.map(face => ({
      boundingBox: {
        left: face.boundingPoly?.vertices?.[0].x || 0,
        top: face.boundingPoly?.vertices?.[0].y || 0,
        width: (face.boundingPoly?.vertices?.[2].x || 0) - (face.boundingPoly?.vertices?.[0].x || 0),
        height: (face.boundingPoly?.vertices?.[2].y || 0) - (face.boundingPoly?.vertices?.[0].y || 0)
      },
      confidence: face.confidence || 0,
      landmarks: face.landmarks?.map(landmark => ({
        type: landmark.type,
        position: {
          x: landmark.position?.x || 0,
          y: landmark.position?.y || 0
        }
      })) || [],
      emotions: [
        { type: 'joy', confidence: face.joyLikelihood || 0 },
        { type: 'sorrow', confidence: face.sorrowLikelihood || 0 },
        { type: 'anger', confidence: face.angerLikelihood || 0 },
        { type: 'surprise', confidence: face.surpriseLikelihood || 0 }
      ],
      age: {
        low: face.age?.low || 0,
        high: face.age?.high || 0
      },
      gender: face.gender || 'UNKNOWN'
    })) || [];

    // Process labels
    const labels = result.labelAnnotations?.map(label => label.description || '') || [];

    // Process location
    const location = result.landmarkAnnotations?.[0]?.description;

    // Process objects
    const objects = result.localizedObjectAnnotations?.map(obj => obj.name || '') || [];

    // Extract date from text if available
    const text = result.textAnnotations?.[0]?.description || '';
    const dateMatch = text.match(/\b\d{1,2}[-/]\d{1,2}[-/]\d{2,4}\b/);
    const date = dateMatch ? dateMatch[0] : undefined;

    // Analyze potential relationships based on face positions and characteristics
    const relationships = analyzeRelationships(faces);

    const analysis = {
      faces,
      labels,
      location,
      date,
      objects,
      relationships
    };

    return new Response(
      JSON.stringify(analysis),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error analyzing photo:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});

function analyzeRelationships(faces: any[]): any[] {
  const relationships = [];

  for (let i = 0; i < faces.length; i++) {
    for (let j = i + 1; j < faces.length; j++) {
      const face1 = faces[i];
      const face2 = faces[j];

      // Calculate age difference
      const ageDiff = Math.abs(
        ((face1.age.low + face1.age.high) / 2) -
        ((face2.age.low + face2.age.high) / 2)
      );

      // Analyze spatial proximity
      const distance = calculateDistance(face1.boundingBox, face2.boundingBox);

      // Determine potential relationship based on age difference and proximity
      if (ageDiff > 20 && ageDiff < 40) {
        relationships.push({
          person1: `Person ${i + 1}`,
          person2: `Person ${j + 1}`,
          relationship: 'parent/child',
          confidence: calculateConfidence(ageDiff, distance)
        });
      } else if (ageDiff < 10) {
        relationships.push({
          person1: `Person ${i + 1}`,
          person2: `Person ${j + 1}`,
          relationship: 'siblings',
          confidence: calculateConfidence(ageDiff, distance)
        });
      }
    }
  }

  return relationships;
}

function calculateDistance(box1: any, box2: any): number {
  const center1 = {
    x: box1.left + box1.width / 2,
    y: box1.top + box1.height / 2
  };
  const center2 = {
    x: box2.left + box2.width / 2,
    y: box2.top + box2.height / 2
  };

  return Math.sqrt(
    Math.pow(center2.x - center1.x, 2) +
    Math.pow(center2.y - center1.y, 2)
  );
}

function calculateConfidence(ageDiff: number, distance: number): number {
  // Implement confidence calculation based on age difference and spatial proximity
  const ageFactor = 1 - (Math.min(ageDiff, 40) / 40);
  const distanceFactor = 1 - (Math.min(distance, 1000) / 1000);
  return (ageFactor + distanceFactor) / 2;
}