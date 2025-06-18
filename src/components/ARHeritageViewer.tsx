import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Camera, Scan, MapPin, Clock, Users, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

interface ARMarker {
  id: string;
  position: { x: number; y: number; z: number };
  content: {
    title: string;
    description: string;
    mediaUrl?: string;
    historicalDate?: string;
  };
}

export const ARHeritageViewer: React.FC = () => {
  const [isARActive, setIsARActive] = useState(false);
  const [markers, setMarkers] = useState<ARMarker[]>([]);
  const [selectedMarker, setSelectedMarker] = useState<ARMarker | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (isARActive) {
      startARSession();
    } else {
      stopARSession();
    }
  }, [isARActive]);

  const startARSession = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      // Simulate AR marker detection
      setTimeout(() => {
        setMarkers([
          {
            id: '1',
            position: { x: 100, y: 200, z: 0 },
            content: {
              title: 'Family Home (1920)',
              description: 'Your great-grandmother lived here from 1920-1945',
              historicalDate: '1920-1945'
            }
          },
          {
            id: '2',
            position: { x: 300, y: 150, z: 0 },
            content: {
              title: 'Community Center',
              description: 'Traditional gatherings and celebrations took place here',
              historicalDate: '1900-present'
            }
          }
        ]);
      }, 2000);

    } catch (error) {
      console.error('AR initialization error:', error);
      toast.error('Failed to start AR session');
    }
  };

  const stopARSession = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    setMarkers([]);
    setSelectedMarker(null);
  };

  const handleMarkerClick = (marker: ARMarker) => {
    setSelectedMarker(marker);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Sparkles className="w-6 h-6 text-purple-500" />
            <h2 className="text-xl font-semibold">AR Heritage Explorer</h2>
          </div>
          <button
            onClick={() => setIsARActive(!isARActive)}
            className={`px-4 py-2 rounded-lg transition-colors ${
              isARActive 
                ? 'bg-red-500 text-white hover:bg-red-600' 
                : 'bg-purple-500 text-white hover:bg-purple-600'
            }`}
          >
            {isARActive ? 'Stop AR' : 'Start AR'}
          </button>
        </div>

        <div className="relative">
          <video
            ref={videoRef}
            className="w-full h-96 bg-gray-900 rounded-lg"
            style={{ display: isARActive ? 'block' : 'none' }}
          />
          
          {!isARActive && (
            <div className="w-full h-96 bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <Camera className="w-16 h-16 text-purple-500 mx-auto mb-4" />
                <p className="text-gray-600">Point your camera at heritage locations</p>
                <p className="text-sm text-gray-500">Discover hidden stories and historical context</p>
              </div>
            </div>
          )}

          {/* AR Markers Overlay */}
          {isARActive && markers.map(marker => (
            <motion.div
              key={marker.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="absolute cursor-pointer"
              style={{
                left: marker.position.x,
                top: marker.position.y,
                transform: 'translate(-50%, -50%)'
              }}
              onClick={() => handleMarkerClick(marker)}
            >
              <div className="bg-white rounded-full p-3 shadow-lg border-2 border-purple-500">
                <MapPin className="w-6 h-6 text-purple-500" />
              </div>
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-white rounded-lg p-2 shadow-lg min-w-max">
                <p className="text-xs font-medium text-gray-900">{marker.content.title}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Selected Marker Details */}
        {selectedMarker && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 bg-purple-50 rounded-lg p-4"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-purple-900">{selectedMarker.content.title}</h3>
                <p className="text-purple-700 mt-1">{selectedMarker.content.description}</p>
                {selectedMarker.content.historicalDate && (
                  <div className="flex items-center space-x-1 mt-2">
                    <Clock className="w-4 h-4 text-purple-600" />
                    <span className="text-sm text-purple-600">{selectedMarker.content.historicalDate}</span>
                  </div>
                )}
              </div>
              <button
                onClick={() => setSelectedMarker(null)}
                className="text-purple-500 hover:text-purple-700"
              >
                ×
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};