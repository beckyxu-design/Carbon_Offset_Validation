import React from 'react';
import MapComponent from './MapComponent';

interface SplitLayoutProps {
  children: React.ReactNode;
  showMap?: boolean;
}

const SplitLayout: React.FC<SplitLayoutProps> = ({ children, showMap = false }) => {
  return (
    <div className={`min-h-screen flex flex-col ${showMap ? 'md:flex-row' : ''}`}>
      <div className={`w-full ${showMap ? 'md:w-1/2 md:overflow-y-auto' : ''}`}>
        {children}
      </div>
      {showMap && (
        <div className="w-full md:w-1/2 md:h-screen sticky top-0">
          <MapComponent />
        </div>
      )}
    </div>
  );
};

export default SplitLayout;
