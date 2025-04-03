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

// Sample deforestation GeoTIFF URL - replace with your actual GeoTIFF URL
const deforestationGeoTIFF = 'https://your-source/deforestation.tiff';

const MapComponent: React.FC = () => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const { 
    selectedProjectId, 
    showDeforestationLayer,
    setSelectedProjectId,
    geospatialData
  } = useMap();
  const [mapInitialized, setMapInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current || map.current) return;

    try {
      const token = import.meta.env.VITE_MAPBOX_TOKEN;
      if (!token) {
        throw new Error('Mapbox token not found. Please add VITE_MAPBOX_TOKEN to your .env.local file.');
      }
      
      mapboxgl.accessToken = token;
      
      // Set default center to Indonesia
      const newMap = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: 'mapbox://styles/mapbox/satellite-v9',
        center: [113.9213, -0.7893], // Center of Indonesia
        zoom: 5
      });

      newMap.addControl(
        new mapboxgl.NavigationControl({ visualizePitch: true }),
        'bottom-right'
      );
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

        // Add project area layer
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

        // Add GeoTIFF source
        map.current?.addSource('deforestation-tiff', {
          type: 'raster',
          url: deforestationGeoTIFF,
          tileSize: 256
        });

        // Add raster layer (initially hidden)
        map.current?.addLayer({
          id: 'deforestation-layer',
          type: 'raster',
          source: 'deforestation-tiff',
          paint: {
            'raster-opacity': 0.7,
            'raster-hue-rotate': 0,
          },
          layout: {
            visibility: 'none' // Initially hidden
          }
        });

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
  }, [setSelectedProjectId]);

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

  // Update map bounds and other effects remain the same
  useEffect(() => {
    if (!mapInitialized || !map.current) return;

    if (map.current.getSource('project-area') && geospatialData) {
      (map.current.getSource('project-area') as mapboxgl.GeoJSONSource).setData(geospatialData);
      
      const bounds = new mapboxgl.LngLatBounds();
      geospatialData.features.forEach(feature => {
        if (feature.geometry.type === 'Polygon') {
          const coordinates = feature.geometry.coordinates[0];
          coordinates.forEach((coord: [number, number]) => {
            bounds.extend(coord as mapboxgl.LngLatLike);
          });
        } else if (feature.geometry.type === 'MultiPolygon') {
          const polygons = feature.geometry.coordinates;
          polygons.forEach(polygon => {
            const outerRing = polygon[0];
            outerRing.forEach((coord: [number, number]) => {
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

  // Rest of your component remains the same
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