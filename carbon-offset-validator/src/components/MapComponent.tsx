import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useMap } from '@/contexts/MapContext';
import { sampleProject, sampleGeoJSON } from '@/lib/sample-data';
import MapControls from './MapControls';
import ProjectSelector from './ProjectSelector';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

// We'll use a Mapbox-hosted tileset instead of a local GeoTIFF
// In a real application, replace with your actual tileset ID
const MapComponent: React.FC = () => {
  const mapContainerRef = useRef<HTMLDivElement>(null); //A React ref that will be attached to a div element in your JSX
  const map = useRef<mapboxgl.Map | null>(null); //A ref that will store the Mapbox map instance
  const { 
    selectedProjectId, 
    showDeforestationLayer,
    setSelectedProjectId,
    geospatialData
  } = useMap();
  const [mapInitialized, setMapInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deforestationLoaded, setDeforestationLoaded] = useState(false);

  //loading basemap and load the project geojson
  useEffect(() => {
    if (!mapContainerRef.current || map.current) return;

    try {
      const token = import.meta.env.VITE_MAPBOX_TOKEN;
      if (!token) {
        throw new Error('Mapbox token not found. Please add VITE_MAPBOX_TOKEN to your .env.local file.');
      }
      
      mapboxgl.accessToken = token;
      
      // set basemap
      const newMap = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: 'mapbox://styles/mapbox/satellite-v9',
        center: [113.9213, -0.7893],
        zoom: 5
      });

      // Add navigation controls
      newMap.addControl(
        new mapboxgl.NavigationControl({visualizePitch: true}),
        'bottom-right'
      );
      // Add attributions in a better position
      newMap.addControl(new mapboxgl.AttributionControl({compact: true}), 'bottom-left');
      // Add atmosphere and fog effects
      newMap.on('style.load', () => {
        newMap.setFog({
          color: 'rgb(186, 210, 235)', 
          'high-color': 'rgb(36, 92, 223)', 
          'horizon-blend': 0.1
        });
      });
      map.current = newMap;

      // Add project layers when the map is ready
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
        const TILESET_ID = 'ichobecky.cus4ehcj';
        // Add deforestation layer using a Mapbox-hosted tileset
        try {
          // beckyzqxu.b217gxob
          // Using a standard Mapbox tileset that we know exists
          map.current?.addSource('deforestation-source', {
            type: 'raster',
            // Using Mapbox's satellite tileset as a placeholder
            tiles: [
              `https://api.mapbox.com/v4/${TILESET_ID}/{z}/{x}/{y}.png?access_token=${mapboxgl.accessToken}`
            ],
            tileSize: 256
          });
          // map.current?.addSource('deforestation-source', {
          //   type: 'raster',
          //   // Using Mapbox's satellite tileset as a placeholder
          //   tiles: [
          //     `https://api.mapbox.com/v4/${TILESET_ID}/{z}/{x}/{y}.png?access_token=${mapboxgl.accessToken}`
          //   ],
          //   tileSize: 256
          // });

          // Add raster layer with initial visibility based on context
          map.current?.addLayer({
            id: 'deforestation-layer',
            type: 'raster',
            source: 'deforestation-source',
            paint: {
              'raster-opacity': 0.9
              ,
              // 'raster-saturation': -0.9, // Make it more grayscale to represent deforestation data
              // 'raster-contrast': 0.2,
              // 'raster-brightness-min': 0.1
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

        // Add click handler
        map.current?.on('click', 'project-area-fill', (e) => {
          if (e.features && e.features[0].properties) {
            setSelectedProjectId(e.features[0].properties.id);
          }
        });

        // Change cursor on hover
        map.current?.on('mouseenter', 'project-area-fill', () => {
          if (map.current) map.current.getCanvas().style.cursor = 'pointer';
        });
        map.current?.on('mouseleave', 'project-area-fill', () => {
          if (map.current) map.current.getCanvas().style.cursor = '';
        });
      });

      // Clean up on unmount
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
  }, [setSelectedProjectId, geospatialData, showDeforestationLayer]);

  // Update map bounding box to locate project geojson
  useEffect(() => {
    if (!mapInitialized || !map.current) return;

    // If we have a map source and geospatial data, update the source
    if (map.current.getSource('project-area') && geospatialData) {
      (map.current.getSource('project-area') as mapboxgl.GeoJSONSource).setData(geospatialData);
      
      // Try to fit the map to the bounds of the geospatial data
      try {
        // Create a bounding box for the features
        const bounds = new mapboxgl.LngLatBounds();
        
        geospatialData.features.forEach(feature => {
          if (feature.geometry.type === 'Polygon') {
            const coordinates = feature.geometry.coordinates[0];
            coordinates.forEach((coord: [number, number]) => {
              bounds.extend(coord as mapboxgl.LngLatLike);
            });
          } else if (feature.geometry.type === 'MultiPolygon') {
            // Handle MultiPolygon geometry type
            const polygons = feature.geometry.coordinates;
            polygons.forEach(polygon => {
              // Each polygon has an outer ring (first element)
              const outerRing = polygon[0];
              outerRing.forEach((coord: [number, number]) => {
                bounds.extend(coord as mapboxgl.LngLatLike);
              });
            });
          } else if (feature.geometry.type === 'Point') {
            bounds.extend(feature.geometry.coordinates as mapboxgl.LngLatLike);
          }
        });
        
        // Only zoom to bounds if we have valid bounds
        if (!bounds.isEmpty()) {
          map.current.fitBounds(bounds, {
            padding: 50,
            maxZoom: 15
          });
        }
      } catch (error) {
        console.error('Error fitting map to bounds:', error);
      }
    }
  }, [mapInitialized, geospatialData]);

  // Toggle deforestation layer visibility
  useEffect(() => {
    if (!mapInitialized || !map.current) return;

    if (map.current.getLayer('deforestation-layer')) {
      map.current.setLayoutProperty(
        'deforestation-layer',
        'visibility',
        showDeforestationLayer ? 'visible' : 'none'
      );
      console.log(`Deforestation layer visibility set to: ${showDeforestationLayer ? 'visible' : 'none'}`);
    } else {
      console.warn('Deforestation layer not found in map');
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
