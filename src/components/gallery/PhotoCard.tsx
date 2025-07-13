import React, { useState } from 'react';
import { Photo } from '@/types';

interface PhotoCardProps {
  photo: Photo;
  onClick: () => void;
  onDelete: (photoId: string) => void;
}

export const PhotoCard: React.FC<PhotoCardProps> = ({ photo, onClick, onDelete }) => {
  const [imageError, setImageError] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    
    if (!confirm('Are you sure you want to delete this photo?')) {
      return;
    }

    setIsDeleting(true);
    
    try {
      const response = await fetch(`/api/photos/${photo.id}`, {
        method: 'DELETE'
      });
      
      const result = await response.json();
      
      if (result.success) {
        onDelete(photo.id);
      } else {
        console.error('Failed to delete photo:', result.error);
        alert('Failed to delete photo. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting photo:', error);
      alert('Failed to delete photo. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div
      className="group relative bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden border border-gray-200"
      onClick={onClick}
    >
      {/* Image */}
      <div className="aspect-square relative overflow-hidden bg-gray-100">
        {!imageError ? (
          <img
            src={`/api/photos/${photo.filename}`}
            alt={photo.originalName}
            className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        
        {/* Overlay with actions - only visible on hover */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
          <div className="flex space-x-2">
            {/* View button */}
            <button
              className="p-2 bg-white bg-opacity-90 rounded-full hover:bg-opacity-100 transition-all"
              title="View photo"
            >
              <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </button>
            
            {/* Delete button */}
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="p-2 bg-red-500 bg-opacity-90 rounded-full hover:bg-opacity-100 transition-all disabled:opacity-50"
              title="Delete photo"
            >
              {isDeleting ? (
                <div className="w-4 h-4 animate-spin rounded-full border-b-2 border-white"></div>
              ) : (
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Photo info */}
      <div className="p-3">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{formatDate(photo.captureDate)}</span>
          <span>{formatTime(photo.captureDate)}</span>
        </div>
        
        {photo.notes && (
          <p className="mt-1 text-sm text-gray-600 truncate" title={photo.notes}>
            {photo.notes}
          </p>
        )}
        
        {/* File info */}
        <div className="mt-2 flex items-center justify-between text-xs text-gray-400">
          <span>{photo.width && photo.height ? `${photo.width}×${photo.height}` : 'Unknown size'}</span>
          <span>{Math.round(photo.fileSize / 1024)}KB</span>
        </div>
      </div>
    </div>
  );
};