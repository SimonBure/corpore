import React, { useState, useRef } from 'react';
import { PhotoTimeline } from './PhotoTimeline';
import { WebcamCapture } from './WebcamCapture';
import { PhotoUpload } from './PhotoUpload';

interface PhotoGalleryProps {
  onPhotoSuccess?: () => void;
}

export const PhotoGallery: React.FC<PhotoGalleryProps> = ({ onPhotoSuccess }) => {
  const [activeModal, setActiveModal] = useState<'webcam' | 'upload' | null>(null);
  const refreshPhotosRef = useRef<(() => void) | null>(null);

  const handlePhotoCapture = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('captureDate', new Date().toISOString());
      
      const response = await fetch('/api/photos', {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();
      
      if (result.success) {
        setActiveModal(null);
        // Switch to Evolution Gallery tab
        onPhotoSuccess?.();
        // Refresh photos without page reload
        refreshPhotosRef.current?.();
      } else {
        console.error('Failed to save photo:', result.error);
        alert('Failed to save photo. Please try again.');
      }
    } catch (error) {
      console.error('Error saving photo:', error);
      alert('Failed to save photo. Please try again.');
    }
  };

  const handlePhotoUpload = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('captureDate', new Date().toISOString());
      
      const response = await fetch('/api/photos', {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();
      
      if (result.success) {
        setActiveModal(null);
        // Switch to Evolution Gallery tab
        onPhotoSuccess?.();
        // Refresh photos without page reload
        refreshPhotosRef.current?.();
      } else {
        console.error('Failed to upload photo:', result.error);
        alert('Failed to upload photo. Please try again.');
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      alert('Failed to upload photo. Please try again.');
    }
  };

  return (
    <div>
      <PhotoTimeline
        onTakePhoto={() => setActiveModal('webcam')}
        onUploadPhoto={() => setActiveModal('upload')}
        onRefresh={(refreshFn) => { refreshPhotosRef.current = refreshFn; }}
      />
      
      {activeModal === 'webcam' && (
        <WebcamCapture
          onCapture={handlePhotoCapture}
          onClose={() => setActiveModal(null)}
        />
      )}
      
      {activeModal === 'upload' && (
        <PhotoUpload
          onUpload={handlePhotoUpload}
          onClose={() => setActiveModal(null)}
        />
      )}
    </div>
  );
};