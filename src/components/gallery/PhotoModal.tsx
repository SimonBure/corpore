import React, { useState } from 'react';
import { Photo } from '@/types';

interface PhotoModalProps {
  photo: Photo;
  onClose: () => void;
  onDelete: (photoId: string) => void;
  onUpdate: (photo: Photo) => void;
}

export const PhotoModal: React.FC<PhotoModalProps> = ({ 
  photo, 
  onClose, 
  onDelete, 
  onUpdate 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [notes, setNotes] = useState(photo.notes || '');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [imageError, setImageError] = useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleSaveNotes = async () => {
    setIsSaving(true);
    
    try {
      const response = await fetch(`/api/photos/${photo.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ notes })
      });
      
      const result = await response.json();
      
      if (result.success) {
        onUpdate(result.data);
        setIsEditing(false);
      } else {
        console.error('Failed to update notes:', result.error);
        alert('Failed to update notes. Please try again.');
      }
    } catch (error) {
      console.error('Error updating notes:', error);
      alert('Failed to update notes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this photo? This action cannot be undone.')) {
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
        setIsDeleting(false);
      }
    } catch (error) {
      console.error('Error deleting photo:', error);
      alert('Failed to delete photo. Please try again.');
      setIsDeleting(false);
    }
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = `/api/photos/${photo.filename}`;
    link.download = photo.originalName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Progress Photo</h2>
          <div className="flex items-center space-x-2">
            {/* Download button */}
            <button
              onClick={handleDownload}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              title="Download photo"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </button>
            
            {/* Close button */}
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid md:grid-cols-3 lg:grid-cols-2 gap-6 p-6">
            {/* Image */}
            <div className="md:col-span-2 lg:col-span-1">
              <div className="relative bg-gray-100 rounded-lg overflow-hidden">
                {!imageError ? (
                  <img
                    src={`/api/photos/${photo.filename}`}
                    alt={photo.originalName}
                    className="w-full h-auto max-h-96 object-contain"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <div className="w-full h-96 flex items-center justify-center text-gray-400">
                    <div className="text-center">
                      <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p>Image not available</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Details */}
            <div className="space-y-6">
              {/* Photo info */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Photo Details</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-gray-500">Captured:</span>
                    <p className="font-medium">{formatDate(photo.captureDate)}</p>
                  </div>
                  
                  <div>
                    <span className="text-gray-500">File name:</span>
                    <p className="font-medium truncate">{photo.originalName}</p>
                  </div>
                  
                  <div>
                    <span className="text-gray-500">Size:</span>
                    <p className="font-medium">{formatFileSize(photo.fileSize)}</p>
                  </div>
                  
                  {photo.width && photo.height && (
                    <div>
                      <span className="text-gray-500">Dimensions:</span>
                      <p className="font-medium">{photo.width} × {photo.height} pixels</p>
                    </div>
                  )}
                  
                  <div>
                    <span className="text-gray-500">Type:</span>
                    <p className="font-medium">{photo.mimeType}</p>
                  </div>
                </div>
              </div>

              {/* Notes section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">Notes</h3>
                  {!isEditing && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="text-blue-600 hover:text-blue-700 transition-colors text-sm"
                    >
                      {photo.notes ? 'Edit' : 'Add notes'}
                    </button>
                  )}
                </div>
                
                {isEditing ? (
                  <div className="space-y-3">
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Add notes about this photo..."
                      className="w-full h-24 p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex space-x-2">
                      <button
                        onClick={handleSaveNotes}
                        disabled={isSaving}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors text-sm"
                      >
                        {isSaving ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={() => {
                          setIsEditing(false);
                          setNotes(photo.notes || '');
                        }}
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-gray-600">
                    {photo.notes ? (
                      <p className="whitespace-pre-wrap">{photo.notes}</p>
                    ) : (
                      <p className="italic text-gray-400">No notes added yet</p>
                    )}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-gray-200">
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed transition-colors text-sm flex items-center justify-center space-x-2"
                >
                  {isDeleting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      <span>Delete Photo</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};