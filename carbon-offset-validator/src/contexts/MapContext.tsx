
import React, { createContext, useContext, useState, useEffect } from 'react';
import { ProjectData } from '@/lib/types';

type MapContextType = {
  selectedProjectId: string | null;
  setSelectedProjectId: (id: string | null) => void;
  showDeforestationLayer: boolean;
  toggleDeforestationLayer: () => void;
  mapToken: string;
  setMapToken: (token: string) => void;
};

const MapContext = createContext<MapContextType | undefined>(undefined);

export const MapProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [showDeforestationLayer, setShowDeforestationLayer] = useState(false);
  const [mapToken, setMapToken] = useState<string>('');

  const toggleDeforestationLayer = () => {
    setShowDeforestationLayer(prev => !prev);
  };

  // Get token from localStorage on initial load
  useEffect(() => {
    const storedToken = localStorage.getItem('mapboxToken');
    if (storedToken) {
      setMapToken(storedToken);
    }
  }, []);

  // Save token to localStorage whenever it changes
  useEffect(() => {
    if (mapToken) {
      localStorage.setItem('mapboxToken', mapToken);
    }
  }, [mapToken]);

  return (
    <MapContext.Provider
      value={{
        selectedProjectId,
        setSelectedProjectId,
        showDeforestationLayer,
        toggleDeforestationLayer,
        mapToken,
        setMapToken
      }}
    >
      {children}
    </MapContext.Provider>
  );
};

export const useMap = () => {
  const context = useContext(MapContext);
  if (context === undefined) {
    throw new Error('useMap must be used within a MapProvider');
  }
  return context;
};
