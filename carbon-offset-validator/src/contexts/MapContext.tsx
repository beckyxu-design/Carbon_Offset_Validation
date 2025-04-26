import React, { createContext, useContext, useState } from 'react';
import { FeatureCollection } from 'geojson';

type MapContextType = {
  selectedProjectId: string | null;
  setSelectedProjectId: (id: string | null) => void;
  showDeforestationLayer: boolean;
  toggleDeforestationLayer: () => void;
  showPalmOilLayer: boolean;
  togglePalmOilLayer: () => void;
  geospatialData: FeatureCollection | null;
  setGeospatialData: (data: FeatureCollection | null) => void;
};

const MapContext = createContext<MapContextType | undefined>(undefined);

export const MapProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [showDeforestationLayer, setShowDeforestationLayer] = useState(false);
  const [showPalmOilLayer, setShowPalmOilLayer] = useState(true);
  const [geospatialData, setGeospatialData] = useState<FeatureCollection | null>(null);

  const toggleDeforestationLayer = () => {
    setShowDeforestationLayer(prev => !prev);
  };

  const togglePalmOilLayer = () => {
    setShowPalmOilLayer(prev => !prev);
  };

  return (
    <MapContext.Provider
      value={{
        selectedProjectId,
        setSelectedProjectId,
        showDeforestationLayer,
        toggleDeforestationLayer,
        showPalmOilLayer,
        togglePalmOilLayer,
        geospatialData,
        setGeospatialData,
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
