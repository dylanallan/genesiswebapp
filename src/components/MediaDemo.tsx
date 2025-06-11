import React, { useState } from 'react';
import { Table as Tabs, Table as Tab } from 'lucide-react';
import { VideoPlayer } from './VideoPlayer';
import { AudioPlayer } from './AudioPlayer';
import { MediaUploader } from './MediaUploader';
import { VoiceRecorder } from './VoiceRecorder';
import { MediaGallery } from './MediaGallery';

export const MediaDemo: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'video' | 'audio' | 'upload' | 'record' | 'gallery'>('video');
  const [uploadedMedia, setUploadedMedia] = useState<{url: string, type: string, name: string} | null>(null);
  const [recordedAudio, setRecordedAudio] = useState<{url: string, blob: Blob} | null>(null);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Media Components Demo</h2>
        
        <div className="flex border-b border-gray-200 mb-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab('video')}
            className={`px-4 py-2 border-b-2 font-medium text-sm whitespace-nowrap ${
              activeTab === 'video'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Video Player
          </button>
          <button
            onClick={() => setActiveTab('audio')}
            className={`px-4 py-2 border-b-2 font-medium text-sm whitespace-nowrap ${
              activeTab === 'audio'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Audio Player
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`px-4 py-2 border-b-2 font-medium text-sm whitespace-nowrap ${
              activeTab === 'upload'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Media Uploader
          </button>
          <button
            onClick={() => setActiveTab('record')}
            className={`px-4 py-2 border-b-2 font-medium text-sm whitespace-nowrap ${
              activeTab === 'record'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Voice Recorder
          </button>
          <button
            onClick={() => setActiveTab('gallery')}
            className={`px-4 py-2 border-b-2 font-medium text-sm whitespace-nowrap ${
              activeTab === 'gallery'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Media Gallery
          </button>
        </div>
        
        <div className="space-y-6">
          {activeTab === 'video' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Video Player</h3>
              <VideoPlayer
                src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
                poster="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg"
                title="Big Buck Bunny"
              />
              <p className="text-sm text-gray-500 mt-4">
                This video player supports MP4 playback with full controls, including play/pause, volume, seeking, and fullscreen.
              </p>
            </div>
          )}
          
          {activeTab === 'audio' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Audio Player</h3>
              <AudioPlayer
                src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
                title="Sample Audio Track"
                artist="SoundHelix"
              />
              <p className="text-sm text-gray-500 mt-4">
                This audio player supports MP3, WAV, and other audio formats with playback controls.
              </p>
            </div>
          )}
          
          {activeTab === 'upload' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Media Uploader</h3>
              <MediaUploader
                onUploadComplete={(url, type, name) => {
                  setUploadedMedia({ url, type, name });
                }}
                acceptedTypes="audio/*,video/*,image/*"
                maxSizeMB={50}
                bucketName="media-uploads"
              />
              
              {uploadedMedia && (
                <div className="mt-6">
                  <h4 className="font-medium text-gray-900 mb-2">Uploaded Media Preview</h4>
                  {uploadedMedia.type.startsWith('image/') && (
                    <img 
                      src={uploadedMedia.url} 
                      alt={uploadedMedia.name} 
                      className="max-w-full h-auto rounded-lg"
                    />
                  )}
                  {uploadedMedia.type.startsWith('video/') && (
                    <VideoPlayer 
                      src={uploadedMedia.url} 
                      title={uploadedMedia.name}
                    />
                  )}
                  {uploadedMedia.type.startsWith('audio/') && (
                    <AudioPlayer 
                      src={uploadedMedia.url} 
                      title={uploadedMedia.name}
                    />
                  )}
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'record' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Voice Recorder</h3>
              <VoiceRecorder
                onRecordingComplete={(blob, url) => {
                  setRecordedAudio({ blob, url });
                }}
                maxDuration={60}
              />
              
              {recordedAudio && (
                <div className="mt-6">
                  <h4 className="font-medium text-gray-900 mb-2">Recorded Audio Preview</h4>
                  <AudioPlayer 
                    src={recordedAudio.url} 
                    title="Your Voice Recording"
                  />
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'gallery' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Media Gallery</h3>
              <MediaGallery 
                bucketName="media-uploads"
                title="Your Media Files"
                selectable={true}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};