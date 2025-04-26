import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useMap } from '@/contexts/MapContext';
import { sampleGeoJSON } from '@/lib/sample-data';
import MapControls from './MapControls';
import ProjectSelector from './ProjectSelector';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { getPalmoilData } from '@/lib/api';

// Define GeoJSON types for TypeScript
interface GeoJSONFeature {
  type: string;
  geometry: any;
  properties?: any;
}

interface GeoJSONFeatureCollection {
  type: 'FeatureCollection';
  features: GeoJSONFeature[];
}

interface GeoJSON {
  type: string;
  features: GeoJSONFeature[];
}

const MapComponent: React.FC = () => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const { 
    selectedProjectId, 
    showDeforestationLayer,
    showPalmOilLayer,
    setSelectedProjectId,
    geospatialData
  } = useMap();
  const [mapInitialized, setMapInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deforestationLoaded, setDeforestationLoaded] = useState(false);

  useEffect(() => {
    if (!mapContainerRef.current || map.current) return;

    try {
      const token = import.meta.env.VITE_MAPBOX_TOKEN;
      if (!token) {
        throw new Error('Mapbox token not found. Please add VITE_MAPBOX_TOKEN to your .env.local file.');
      }
      
      mapboxgl.accessToken = token;
      
      const newMap = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: 'mapbox://styles/mapbox/satellite-v9',
        center: [113.9213, -0.7893],
        zoom: 5
      });

      newMap.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), 'bottom-right');
      newMap.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-left');

      newMap.on('style.load', () => {
        newMap.setFog({
          color: 'rgb(186, 210, 235)', 
          'high-color': 'rgb(36, 92, 223)', 
          'horizon-blend': 0.1
        });
      });

      map.current = newMap;

      newMap.on('load', () => {
        setMapInitialized(true);
        setError(null);

        // Add project shape layer
        map.current?.addSource('project-area', {
          type: 'geojson',
          data: geospatialData || sampleGeoJSON
        });

        map.current?.addLayer({
          id: 'project-area-fill',
          type: 'fill',
          source: 'project-area',
          paint: {
            'fill-color': '#F9C80E',
            'fill-opacity': 0.4
          }
        });
        map.current?.addLayer({
          id: 'project-area-line',
          type: 'line',
          source: 'project-area',
          paint: {
            'line-color': '#F9C80E',
            'line-width': 2
          }
        });

        // Add deforestation layer (unchanged)
        const TILESET_ID = 'ichobecky.cus4ehcj';
        try {
          map.current?.addSource('deforestation-source', {
            type: 'raster',
            tiles: [
              `https://api.mapbox.com/v4/${TILESET_ID}/{z}/{x}/{y}.png?access_token=${mapboxgl.accessToken}`
            ],
            tileSize: 256
          });

          map.current?.addLayer({
            id: 'deforestation-layer',
            type: 'raster',
            source: 'deforestation-source',
            paint: {
              'raster-opacity': 0.9
            },
            layout: {
              visibility: showDeforestationLayer ? 'visible' : 'none'
            }
          });
          
          setDeforestationLoaded(true);
          console.log('Deforestation layer loaded successfully');
        } catch (error) {
          console.error('Error loading deforestation layer:', error);
          toast.error('Failed to load deforestation layer');
        }

        // Add click handler for project area
        map.current?.on('click', 'project-area-fill', (e) => {
          if (e.features && e.features[0].properties) {
            setSelectedProjectId(e.features[0].properties.id);
          }
        });

        map.current?.on('mouseenter', 'project-area-fill', () => {
          if (map.current) map.current.getCanvas().style.cursor = 'pointer';
        });
        map.current?.on('mouseleave', 'project-area-fill', () => {
          if (map.current) map.current.getCanvas().style.cursor = '';
        });
      });

      return () => {
        newMap.remove();
        map.current = null;
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to initialize the map';
      console.error('Error initializing map:', error);
      setError(errorMessage);
      toast.error(errorMessage);
    }
  }, [setSelectedProjectId, geospatialData]);

  // Update project area bounds
  useEffect(() => {
    if (!mapInitialized || !map.current || !geospatialData) return;

    const source = map.current.getSource('project-area') as mapboxgl.GeoJSONSource;
    if (source) {
      source.setData(geospatialData);
      
      const bounds = new mapboxgl.LngLatBounds();
      geospatialData.features.forEach(feature => {
        if (feature.geometry.type === 'Polygon') {
          feature.geometry.coordinates[0].forEach((coord: [number, number]) => {
            bounds.extend(coord as mapboxgl.LngLatLike);
          });
        } else if (feature.geometry.type === 'MultiPolygon') {
          feature.geometry.coordinates.forEach(polygon => {
            polygon[0].forEach((coord: [number, number]) => {
              bounds.extend(coord as mapboxgl.LngLatLike);
            });
          });
        } else if (feature.geometry.type === 'Point') {
          bounds.extend(feature.geometry.coordinates as mapboxgl.LngLatLike);
        }
      });

      if (!bounds.isEmpty()) {
        map.current.fitBounds(bounds, {
          padding: 50,
          maxZoom: 15
        });
      }
    }
  }, [mapInitialized, geospatialData]);

  // Fetch and display palm oil data
  useEffect(() => {
    if (!mapInitialized || !map.current) return;

    const fetchPalmOilData = async () => {
      try {
        const response = await getPalmoilData();
        if (response.data && response.data.palmOilData) {
          const geojsonData: any = response.data.palmOilData;
          console.log("Palm oil data:", geojsonData);

          // Create a proper GeoJSON FeatureCollection object
          const featureCollection = {
            type: 'FeatureCollection',
            features: Array.isArray(geojsonData) ? geojsonData : 
                     (geojsonData && geojsonData.features ? geojsonData.features : [])
          };

          // Use a direct type cast to any to bypass TypeScript's type checking
          // This is necessary when working with external library expectations
          map.current?.addSource('palm-oil-data', {
            type: 'geojson',
            data: featureCollection as any
          });
          
          map.current?.addLayer({
            id: 'palm-oil-layer',
            type: 'fill',
            source: 'palm-oil-data',
            paint: {
              'fill-color': '#F9C80E',
              'fill-opacity': 0.8
            }
          });

          // Add an outline layer for better visibility
          map.current?.addLayer({
            id: 'palm-oil-layer-outline',
            type: 'line',
            source: 'palm-oil-data',
            paint: {
              'line-color': '#F86624',
              'line-width': 1
            }
          });

          console.log("Palm oil data added to map successfully");
        } else {
          throw new Error(response.error || 'Failed to load palm oil data');
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error("Error fetching palm oil data:", errorMessage);
        toast.error("Failed to load palm oil data: " + errorMessage);
      }
    };

    fetchPalmOilData();
  }, [mapInitialized]);

  // Toggle palm oil layer visibility
  useEffect(() => {
    if (!mapInitialized || !map.current) return;

    const visibility = showPalmOilLayer ? 'visible' : 'none';
    if (map.current.getLayer('palm-oil-layer')) {
      map.current.setLayoutProperty('palm-oil-layer', 'visibility', visibility);
    }
    if (map.current.getLayer('palm-oil-layer-outline')) {
      map.current.setLayoutProperty('palm-oil-layer-outline', 'visibility', visibility);
    }
  }, [mapInitialized, showPalmOilLayer]);

  // Toggle deforestation layer visibility
  useEffect(() => {
    if (!mapInitialized || !map.current) return;

    if (map.current.getLayer('deforestation-layer')) {
      map.current.setLayoutProperty(
        'deforestation-layer',
        'visibility',
        showDeforestationLayer ? 'visible' : 'none'
      );
    }
  }, [mapInitialized, showDeforestationLayer]);

  return (
    <div className="relative w-full h-full rounded-lg overflow-hidden border border-border/30 shadow-lg">
      {error && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-md">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      )}
      <div 
        ref={mapContainerRef}
        className="w-full h-full"
      />
      <ProjectSelector />
      <MapControls />
      {!mapInitialized && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/30 backdrop-blur-sm">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}
    </div>
  );
};

export default MapComponent;
