import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useMap } from '@/contexts/MapContext';
import { sampleProjects, deforestationLayers, getProjectById } from '@/lib/sample-data';
import MapboxTokenInput from './MapboxTokenInput';
import MapControls from './MapControls';
import { toast } from 'sonner';

const MapComponent: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const { 
    selectedProjectId, 
    showDeforestationLayer,
    mapToken 
  } = useMap();
  const [mapInitialized, setMapInitialized] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!mapToken || !mapContainer.current || map.current) return;

    try {
      mapboxgl.accessToken = mapToken;
      
      const newMap = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/satellite-streets-v12',
        center: [0, 20], // Default center
        zoom: 1.5,
        projection: 'globe',
        attributionControl: false,
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
      });

      // Clean up on unmount
      return () => {
        newMap.remove();
        map.current = null;
      };
    } catch (error) {
      console.error('Error initializing map:', error);
      toast.error('Failed to initialize the map. Please check your Mapbox token.');
    }
  }, [mapToken]);

  // Add project GeoJSON layers
  useEffect(() => {
    if (!mapInitialized || !map.current) return;

    // Add all project layers
    sampleProjects.forEach(project => {
      if (project.geojson) {
        const sourceId = `source-${project.id}`;
        const layerId = `layer-${project.id}`;

        // Add source if it doesn't exist
        if (!map.current?.getSource(sourceId)) {
          map.current?.addSource(sourceId, {
            type: 'geojson',
            data: project.geojson
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
              'fill-color': '#3BB2D0',
              'fill-opacity': 0.5
            }
          });

          // Add outline layer
          map.current?.addLayer({
            id: `${layerId}-outline`,
            type: 'line',
            source: sourceId,
            layout: {},
            paint: {
              'line-color': '#3BB2D0',
              'line-width': 2
            }
          });
        }
      }
    });

    // Fit bounds to show all projects
    const bounds = new mapboxgl.LngLatBounds();
    let hasValidBounds = false;

    sampleProjects.forEach(project => {
      if (project.geojson?.features?.length) {
        project.geojson.features.forEach(feature => {
          if (feature.geometry.type === 'Polygon') {
            const coordinates = feature.geometry.coordinates[0];
            coordinates.forEach(coord => {
              bounds.extend([coord[0], coord[1]]);
              hasValidBounds = true;
            });
          }
        });
      }
    });

    if (hasValidBounds) {
      map.current.fitBounds(bounds, {
        padding: 50,
        maxZoom: 10
      });
    }

    return () => {
      // Clean up is handled in the initial useEffect
    };
  }, [mapInitialized]);

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
      deforestationLayers.forEach(layer => {
        const layerId = `deforestation-layer-${layer.id}`;
        const outlineLayerId = `${layerId}-outline`;

        if (map.current?.getLayer(outlineLayerId)) {
          map.current.removeLayer(outlineLayerId);
        }

        if (map.current?.getLayer(layerId)) {
          map.current.removeLayer(layerId);
        }
      });
    }
  }, [mapInitialized, showDeforestationLayer]);

  // Zoom to selected project when selectedProjectId changes
  useEffect(() => {
    if (!mapInitialized || !map.current || !selectedProjectId) return;

    const project = getProjectById(selectedProjectId);
    if (!project?.geojson?.features?.length) return;

    const bounds = new mapboxgl.LngLatBounds();
    let hasValidBounds = false;

    project.geojson.features.forEach(feature => {
      if (feature.geometry.type === 'Polygon') {
        const coordinates = feature.geometry.coordinates[0];
        coordinates.forEach(coord => {
          bounds.extend([coord[0], coord[1]]);
          hasValidBounds = true;
        });
      }
    });

    if (hasValidBounds) {
      map.current.flyTo({
        center: bounds.getCenter(),
        zoom: 5,
        duration: 2000,
        essential: true
      });
    }
  }, [selectedProjectId, mapInitialized]);

  if (!mapToken) {
    return (
      <div className="bg-background/70 backdrop-blur-sm border border-border/50 rounded-lg h-full flex items-center justify-center p-4">
        <div className="max-w-sm">
          <h2 className="text-lg font-semibold mb-2">Mapbox Token Required</h2>
          <p className="text-sm text-muted-foreground mb-4">
            To view the interactive map, please enter your Mapbox API token below. 
            This will be saved locally in your browser.
          </p>
          <MapboxTokenInput />
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full rounded-lg overflow-hidden border border-border/30 shadow-lg">
      <div 
        ref={mapContainer} 
        className="absolute inset-0 bg-muted"
      />
      <MapControls />
      {!mapInitialized && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/30 backdrop-blur-sm">
          <div className="text-center">
            <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Loading map...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapComponent;
