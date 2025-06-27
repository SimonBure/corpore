import React from 'react';

export const LayoutDashboard: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="min-h-screen bg-gray-50 flex flex-col items-center">
    <main className="w-full max-w-5xl mx-auto flex flex-col items-center pt-8 pb-16">
      {children}
    </main>
  </div>
);
