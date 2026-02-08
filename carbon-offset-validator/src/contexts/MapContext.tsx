import React, { createContext, useContext, useState } from 'react';
import { FeatureCollection } from 'geojson';

type MapContextType = {
  selectedProjectId: string | null;
  setSelectedProjectId: (id: string | null) => void;
  showDeforestationLayer: boolean;
  toggleDeforestationLayer: () => void;
  showForestLoss1Layer: boolean;
  toggleForestLoss1Layer: () => void;
  fadeForestLoss1Layer: (fadeIn: boolean) => void;
  geospatialData: FeatureCollection | null;
  setGeospatialData: (data: FeatureCollection | null) => void;
  showPalmLayer: boolean;
  togglePalmLayer: () => void;
  showForestLossYear23Layer: boolean;
  toggleForestLossYear23Layer: () => void;
};

const MapContext = createContext<MapContextType | undefined>(undefined);

export const MapProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [showDeforestationLayer, setShowDeforestationLayer] = useState(false);
  const [showForestLoss1Layer, setShowForestLoss1Layer] = useState(false);
  const [geospatialData, setGeospatialData] = useState<FeatureCollection | null>(null);
  const [showPalmLayer, setShowPalmLayer] = useState(false);
  const [showForestLossYear23Layer, setShowForestLossYear23Layer] = useState(false);

  const toggleDeforestationLayer = () => {
    setShowDeforestationLayer(prev => !prev);
  };

  const toggleForestLoss1Layer = () => {
    setShowForestLoss1Layer(prev => !prev);
  };

  const fadeForestLoss1Layer = (fadeIn: boolean) => {
    setShowForestLoss1Layer(fadeIn);
  };

  const togglePalmLayer = () => {
    setShowPalmLayer(prev => !prev);
  };

  const toggleForestLossYear23Layer = () => {
    setShowForestLossYear23Layer(prev => !prev);
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
        fadeForestLoss1Layer,
        geospatialData,
        setGeospatialData,
        showPalmLayer,
        togglePalmLayer,
        showForestLossYear23Layer,
        toggleForestLossYear23Layer,
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
