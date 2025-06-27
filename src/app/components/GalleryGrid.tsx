import React from 'react';

interface GalleryItem {
  date: string;
  img: string;
}

interface GalleryGridProps {
  items: GalleryItem[];
}

export const GalleryGrid: React.FC<GalleryGridProps> = ({ items }) => (
  <div className="grid grid-cols-4 gap-4 mt-6">
    {items.map((item, idx) => (
      <div key={idx} className="relative group rounded-lg overflow-hidden shadow border border-gray-200">
        <img src={item.img} alt={item.date} className="w-full h-32 object-cover" />
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
          <span className="text-white text-sm font-semibold">{item.date}</span>
        </div>
      </div>
    ))}
  </div>
);
