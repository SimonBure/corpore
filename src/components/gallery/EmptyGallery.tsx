import React from 'react';

interface EmptyGalleryProps {
  onTakePhoto: () => void;
  onUploadPhoto: () => void;
}

export const EmptyGallery: React.FC<EmptyGalleryProps> = ({ onTakePhoto, onUploadPhoto }) => {
  return (
    <div className="text-center py-12">
      <div className="max-w-md mx-auto">
        {/* Illustration */}
        <div className="mb-6">
          <div className="w-24 h-24 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        </div>

        {/* Title and description */}
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Start Your Progress Journey
        </h3>
        <p className="text-gray-600 mb-8">
          Capture and track your fitness transformation with progress photos. 
          See your improvement over time and stay motivated!
        </p>

        {/* Action buttons */}
        <div className="space-y-3">
          <button
            onClick={onTakePhoto}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>Take Your First Photo</span>
          </button>
          
          <button
            onClick={onUploadPhoto}
            className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium flex items-center justify-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <span>Upload Photo</span>
          </button>
        </div>

        {/* Tips */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg text-left">
          <h4 className="font-medium text-blue-900 mb-2">📸 Photo Tips</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Take photos in consistent lighting</li>
            <li>• Use the same pose and angle</li>
            <li>• Wear similar clothing for comparison</li>
            <li>• Take photos at regular intervals</li>
          </ul>
        </div>

        {/* Privacy notice */}
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-sm text-green-800 text-left">
              <p className="font-medium">Privacy First</p>
              <p>Your photos are stored securely on your device and never shared.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};