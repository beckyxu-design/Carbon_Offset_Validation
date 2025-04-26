import React, { createContext, useContext, useState } from 'react';
import { FeatureCollection } from 'geojson';

type MapContextType = {
  selectedProjectId: string | null;
  setSelectedProjectId: (id: string | null) => void;
  showDeforestationLayer: boolean;
  toggleDeforestationLayer: () => void;
  showForestLoss1Layer: boolean;
  toggleForestLoss1Layer: () => void;
  geospatialData: FeatureCollection | null;
  setGeospatialData: (data: FeatureCollection | null) => void;
  showPalmLayer: boolean;
  togglePalmLayer: () => void;
};

const MapContext = createContext<MapContextType | undefined>(undefined);

export const MapProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [showDeforestationLayer, setShowDeforestationLayer] = useState(false);
  const [showForestLoss1Layer, setShowForestLoss1Layer] = useState(false);
  const [geospatialData, setGeospatialData] = useState<FeatureCollection | null>(null);
  const [showPalmLayer, setShowPalmLayer] = useState(false);

  const toggleDeforestationLayer = () => {
    setShowDeforestationLayer(prev => !prev);
  };

  const toggleForestLoss1Layer = () => {
    setShowForestLoss1Layer(prev => !prev);
  };

  const togglePalmLayer = () => {
    setShowPalmLayer(prev => !prev);
  };

  return (
    <MapContext.Provider
      value={{
        selectedProjectId,
        setSelectedProjectId,
        showDeforestationLayer,
        toggleDeforestationLayer,
        showForestLoss1Layer,
        toggleForestLoss1Layer,
        geospatialData,
        setGeospatialData,
        showPalmLayer,
        togglePalmLayer,
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
