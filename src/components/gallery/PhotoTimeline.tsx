import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Photo } from '@/types';
import { PhotoCard } from './PhotoCard';
import { EmptyGallery } from './EmptyGallery';
import { PhotoModal } from './PhotoModal';

interface PhotoTimelineProps {
  onTakePhoto: () => void;
  onUploadPhoto: () => void;
  onRefresh?: (refreshFn: () => void) => void;
}

export const PhotoTimeline: React.FC<PhotoTimelineProps> = ({ onTakePhoto, onUploadPhoto, onRefresh }) => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [groupBy, setGroupBy] = useState<'date' | 'month'>('date');
  const onRefreshRef = useRef(onRefresh);

  const fetchPhotos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/photos');
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch photos');
      }
      
      setPhotos(result.data);
    } catch (err) {
      console.error('Error fetching photos:', err);
      setError(err instanceof Error ? err.message : 'Failed to load photos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPhotos();
  }, [fetchPhotos]);

  // Update ref when onRefresh prop changes
  useEffect(() => {
    onRefreshRef.current = onRefresh;
  }, [onRefresh]);

  // Expose fetchPhotos through onRefresh prop
  useEffect(() => {
    if (onRefreshRef.current) {
      onRefreshRef.current(fetchPhotos);
    }
  }, [fetchPhotos]);

  const handlePhotoDeleted = useCallback((photoId: string) => {
    setPhotos(prev => prev.filter(photo => photo.id !== photoId));
    setSelectedPhoto(null);
  }, []);

  const handlePhotoUpdated = useCallback((updatedPhoto: Photo) => {
    setPhotos(prev => prev.map(photo => 
      photo.id === updatedPhoto.id ? updatedPhoto : photo
    ));
    setSelectedPhoto(updatedPhoto);
  }, []);

  const groupPhotosByDate = useCallback((photos: Photo[]) => {
    const groups: { [key: string]: Photo[] } = {};
    
    photos.forEach(photo => {
      const date = new Date(photo.captureDate);
      let key: string;
      
      if (groupBy === 'month') {
        key = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
      } else {
        key = date.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric' 
        });
      }
      
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(photo);
    });
    
    return groups;
  }, [groupBy]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error}</p>
        <button
          onClick={fetchPhotos}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (photos.length === 0) {
    return <EmptyGallery onTakePhoto={onTakePhoto} onUploadPhoto={onUploadPhoto} />;
  }

  const photoGroups = groupPhotosByDate(photos);
  const groupKeys = Object.keys(photoGroups).sort((a, b) => {
    // Sort by date descending (newest first)
    const dateA = new Date(photoGroups[a][0].captureDate);
    const dateB = new Date(photoGroups[b][0].captureDate);
    return dateB.getTime() - dateA.getTime();
  });

  return (
    <div className="space-y-6">
      {/* Header with controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-bold text-gray-900">
            Evolution Gallery ({photos.length} photos)
          </h2>
          
          {/* Group by toggle */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Group by:</span>
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as 'date' | 'month')}
              className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="date">Day</option>
              <option value="month">Month</option>
            </select>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex space-x-2">
          <button
            onClick={onTakePhoto}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>Take Photo</span>
          </button>
          
          <button
            onClick={onUploadPhoto}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <span>Upload</span>
          </button>
        </div>
      </div>

      {/* Photo timeline */}
      <div className="space-y-8">
        {groupKeys.map(dateKey => (
          <div key={dateKey} className="space-y-4">
            {/* Date header */}
            <div className="flex items-center">
              <h3 className="text-lg font-semibold text-gray-800 mr-4">{dateKey}</h3>
              <div className="flex-1 h-px bg-gray-200"></div>
              <span className="ml-4 text-sm text-gray-500">
                {photoGroups[dateKey].length} photo{photoGroups[dateKey].length !== 1 ? 's' : ''}
              </span>
            </div>
            
            {/* Photo grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {photoGroups[dateKey].map(photo => (
                <PhotoCard
                  key={photo.id}
                  photo={photo}
                  onClick={() => setSelectedPhoto(photo)}
                  onDelete={handlePhotoDeleted}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Photo modal */}
      {selectedPhoto && (
        <PhotoModal
          photo={selectedPhoto}
          onClose={() => setSelectedPhoto(null)}
          onDelete={handlePhotoDeleted}
          onUpdate={handlePhotoUpdated}
        />
      )}
    </div>
  );
};