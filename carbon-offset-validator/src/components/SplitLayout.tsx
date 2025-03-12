
import React from 'react';
import MapComponent from './MapComponent';

interface SplitLayoutProps {
  children: React.ReactNode;
}

const SplitLayout: React.FC<SplitLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <div className="w-full md:w-1/2 md:overflow-y-auto">
        {children}
      </div>
      <div className="w-full md:w-1/2 md:h-screen sticky top-0">
        <MapComponent />
      </div>
    </div>
  );
};

export default SplitLayout;
