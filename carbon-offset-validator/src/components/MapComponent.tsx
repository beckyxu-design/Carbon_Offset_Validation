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
      
      // set basemap
      const newMap = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: 'mapbox://styles/mapbox/satellite-v9',
        center: [117.8902, -2.4833],
        zoom: 5
      });

      // Add navigation controls
      newMap.addControl(
        new mapboxgl.NavigationControl({
          visualizePitch: true,
        }),
        'bottom-right'
      );
      // Add attributions in a better position
      newMap.addControl(new mapboxgl.AttributionControl({
        compact: true
      }), 'bottom-left');
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
  }, [setSelectedProjectId]);

  // Update map bounding box when geospatial data changes
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


  // Add or remove deforestation layers based on toggle
  useEffect(() => {
    if (!mapInitialized || !map.current) return;

    if (showDeforestationLayer) {
      // Add deforestation layers
      deforestationLayers.forEach(layer => {
        const sourceId = `deforestation-source-${layer.id}`;
        const layerId = `deforestation-layer-${layer.id}`;

        // Add source if it doesn't exist
        if (!map.current?.getSource(sourceId)) {
          map.current?.addSource(sourceId, {
            type: 'geojson',
            data: layer.geojson
          });
        }

        // Add layer if it doesn't exist
        if (!map.current?.getLayer(layerId)) {
          map.current?.addLayer({
            id: layerId,
            type: 'fill',
            source: sourceId,
            layout: {},
            paint: {
              'fill-color': [
                'interpolate',
                ['linear'],
                ['get', 'rate'],
                1, '#FFF587', // low deforestation
                2, '#FF8C64', // medium 
                3, '#FF665A'  // high deforestation
              ],
              'fill-opacity': 0.7
            }
          });

          // Add outline for deforestation layer
          map.current?.addLayer({
            id: `${layerId}-outline`,
            type: 'line',
            source: sourceId,
            layout: {},
            paint: {
              'line-color': '#FF3D00',
              'line-width': 1,
              'line-dasharray': [2, 1]
            }
          });
        }
      });
    } else {
      // Remove deforestation layers if they exist
      // deforestationLayers.forEach(layer => {
      //   const layerId = `deforestation-layer-${layer.id}`;
      //   const outlineLayerId = `${layerId}-outline`;

      //   if (map.current?.getLayer(outlineLayerId)) {
      //     map.current.removeLayer(outlineLayerId);
      //   }

      //   if (map.current?.getLayer(layerId)) {
      //     map.current.removeLayer(layerId);
      //   }
      // });
    }
  }, [mapInitialized, showDeforestationLayer]);

  // Zoom to selected project
  useEffect(() => {
    if (!mapInitialized || !map.current || !selectedProjectId) return;

    // Highlight selected project
    // sampleProjects.forEach(p => {
    //   const layerId = `layer-${p.id}`;
    //   if (map.current?.getLayer(layerId)) {
    //     map.current?.setPaintProperty(
    //       layerId,
    //       'fill-color',
    //       p.id === selectedProjectId ? '#FFB74D' : '#3BB2D0'
    //     );
    //     map.current?.setPaintProperty(
    //       layerId,
    //       'fill-opacity',
    //       p.id === selectedProjectId ? 0.7 : 0.5
    //     );
    //   }
    // });

    // Calculate bounds of the selected project
    // const bounds = new mapboxgl.LngLatBounds();
    // project.geojson.features.forEach(feature => {
    //   if (feature.geometry.type === 'Polygon') {
    //     const coordinates = feature.geometry.coordinates[0];
    //     coordinates.forEach(coord => {
    //       bounds.extend([coord[0], coord[1]]);
    //     });
    //   }
    // });

    // Zoom to the selected project
    // map.current.fitBounds(bounds, {
    //   padding: 50,
    //   maxZoom: 12,
    //   duration: 1000
    // });
  }, [selectedProjectId, mapInitialized]);

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
