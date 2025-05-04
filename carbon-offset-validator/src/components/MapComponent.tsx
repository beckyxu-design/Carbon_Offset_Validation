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

import type { FeatureCollection, Feature } from 'geojson'

const MapComponent: React.FC = () => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const { 
    selectedProjectId, 
    showDeforestationLayer,
    showForestLoss1Layer,
    showPalmLayer,
    setSelectedProjectId,
    geospatialData
  } = useMap();
  const [mapInitialized, setMapInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deforestationLoaded, setDeforestationLoaded] = useState(false);
  const [forestloss1Loaded, setForestLoss1Loaded] = useState(false);
  const [forestloss2Loaded, setForestLoss2Loaded] = useState(false);
  const [palmLoaded, setPalmLoaded] = useState(false);

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
        console.log(geospatialData)
        map.current?.addLayer({
          id: 'project-area-fill',
          type: 'fill',
          source: 'project-area',
          paint: {
            'fill-color': '#0074FF',
            'fill-opacity': 0.4
          }
        });
        map.current?.addLayer({
          id: 'project-area-line',
          type: 'line',
          source: 'project-area',
          paint: {
            'line-color': '#0074FF',
            'line-width': 2
          }
        });

        // Add deforestation layer
        const TILESET_ID = 'ichobecky.cus4ehcj';
        try {
          // Try to load from sessionStorage first
          const deforestationTiles = sessionStorage.getItem('deforestationTiles');
          if (deforestationTiles) {
            map.current?.addSource('deforestation-source', {
              ...(JSON.parse(deforestationTiles) as any),
              type: 'raster',
            });
            setDeforestationLoaded(true);
            console.log('Deforestation layer loaded from sessionStorage');
          } else {
            const deforestationSource = {
              type: 'raster' as const,
              tiles: [
                `https://api.mapbox.com/v4/${TILESET_ID}/{z}/{x}/{y}.png?access_token=${mapboxgl.accessToken}`
              ],
              tileSize: 256
            };
            map.current?.addSource('deforestation-source', deforestationSource);
            sessionStorage.setItem('deforestationTiles', JSON.stringify(deforestationSource));
            setDeforestationLoaded(true);
            console.log('Deforestation layer loaded successfully and saved to sessionStorage');
          }
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
        } catch (error) {
          console.error('Error loading deforestation layer:', error);
          toast.error('Failed to load deforestation layer');
        }
        
        // Add forest loss change layer 1 - small
        const TILESET_ID_FL1 = 'beckyzqxu.7ggv075e';
        try {
          // Try to load from sessionStorage first
          const forestLoss1Tiles = sessionStorage.getItem('forestLoss1Tiles');
          if (forestLoss1Tiles) {
            map.current?.addSource('forest-loss-1-source', {
              ...(JSON.parse(forestLoss1Tiles) as any),
              type: 'raster',
            });
            setForestLoss1Loaded(true);
            console.log('Forest loss change layer 1 loaded from sessionStorage');
          } else {
            const forestLoss1Source = {
              type: 'raster' as const,
              tiles: [
                `https://api.mapbox.com/v4/${TILESET_ID_FL1}/{z}/{x}/{y}.png?access_token=${mapboxgl.accessToken}`
              ],
              tileSize: 256
            };
            map.current?.addSource('forest-loss-1-source', forestLoss1Source);
            sessionStorage.setItem('forestLoss1Tiles', JSON.stringify(forestLoss1Source));
            setForestLoss1Loaded(true);
            console.log('Forest loss change layer 1 loaded successfully and saved to sessionStorage');
          }
          map.current?.addLayer({
            id: 'forest-loss-1-layer',
            type: 'raster',
            source: 'forest-loss-1-source',
            paint: {
              'raster-opacity': 0.9
            },
            layout: {
              visibility: showForestLoss1Layer ? 'visible' : 'none'
            }
          });
        } catch (error) {
          console.error('Error loading forest loss 1 change layer:', error);
          toast.error('Failed to load forest loss 1 change layer');
        }

        // Add forest loss change layer 2 - large
        const TILESET_ID_FL2 = 'beckyzqxu.821qca28';
        try {
          // Try to load from sessionStorage first
          const forestLoss2Tiles = sessionStorage.getItem('forestLoss2Tiles');
          if (forestLoss2Tiles) {
            map.current?.addSource('forest-loss-2-source', {
              ...(JSON.parse(forestLoss2Tiles) as any),
              type: 'raster',
            });
            setForestLoss2Loaded(true);
            console.log('Forest loss change layer 2 loaded from sessionStorage');
          } else {
            const forestLoss2Source = {
              type: 'raster' as const,
              tiles: [
                `https://api.mapbox.com/v4/${TILESET_ID_FL2}/{z}/{x}/{y}.png?access_token=${mapboxgl.accessToken}`
              ],
              tileSize: 256
            };
            map.current?.addSource('forest-loss-2-source', forestLoss2Source);
            sessionStorage.setItem('forestLoss2Tiles', JSON.stringify(forestLoss2Source));
            setForestLoss2Loaded(true);
            console.log('Forest loss change layer loaded successfully and saved to sessionStorage');
          }
          map.current?.addLayer({
            id: 'forest-loss-2-layer',
            type: 'raster',
            source: 'forest-loss-2-source',
            paint: {
              'raster-opacity': 0.9
            },
            layout: {
              visibility: showForestLoss1Layer ? 'visible' : 'none'
            }
          });
        } catch (error) {
          console.error('Error loading forest loss 2 change layer:', error);
          toast.error('Failed to load forest loss 2 change layer');
        }

        // Add palm oil concession vector layer
        const TILESET_ID_PALM = 'ichobecky.bjwru1ey';
        try {
          // Try to load from sessionStorage first
          const palmTiles = sessionStorage.getItem('palmTiles');
          if (palmTiles) {
            map.current?.addSource('palm-source', {
              ...(JSON.parse(palmTiles) as any),
              type: 'vector',
            });
            setPalmLoaded(true);
            console.log('Palm oil concession loaded from sessionStorage');
          } else {
            map.current?.addSource('palm-source', {
              type: 'vector',
              url: `mapbox://${TILESET_ID_PALM}`
            });
            sessionStorage.setItem('palmTiles', JSON.stringify({
              type: 'vector',
              url: `mapbox://${TILESET_ID_PALM}`
            }));
            setPalmLoaded(true);
            console.log('Palm oil concession loaded and saved to sessionStorage');
          }
          map.current?.addLayer({
            id: 'palm-source-id',
            type: 'fill',
            source: 'palm-source',
            'source-layer': 'Indonesia_oil_palm_concession-8b9x8u',
            paint: {
              'fill-color': '#D9D9D9',
              'fill-opacity': 0.3
            },
            layout: {
              visibility: showPalmLayer ? 'visible' : 'none'
            }
          });

          // Add hover handler for palm oil concessions
          let palmPopup: mapboxgl.Popup | null = null;
          map.current?.on('mousemove', 'palm-source-id', (e) => {
            if (e.features && e.features.length > 0) {
              const properties = e.features[0].properties || {};
              const company = properties.company;
              const groupComp = properties.group_comp;
              if ((company || groupComp) && map.current) {
                map.current.getCanvas().style.cursor = 'pointer';
                const coordinates = e.lngLat;
                // Only show one popup at a time
                let content = "<div style='font-size:13px; opacity:0.9; background: white; border-radius: 4px; padding: 4px 8px;'>";
                if (company) content += `<strong>Company:</strong> ${company}<br/>`;
                if (groupComp) content += `<strong>Group:</strong> ${groupComp}`;
                content += "</div>";
                if (!palmPopup) {
                  palmPopup = new mapboxgl.Popup({ closeButton: false, closeOnClick: false })
                    .setLngLat(coordinates)
                    .setHTML(content)
                    .addTo(map.current);
                } else {
                  palmPopup.setLngLat(coordinates)
                    .setHTML(content);
                }
              }
            }
          });
          map.current?.on('mouseleave', 'palm-source-id', () => {
            if (palmPopup) {
              palmPopup.remove();
              palmPopup = null;
            }
            map.current && (map.current.getCanvas().style.cursor = '');
          });
        } catch (error) {
          console.error('Error loading palm oil concession layer:', error);
          toast.error('Failed to load palm oil concession layer');
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
        map.current.fitBounds(bounds, { padding: 50, maxZoom: 14 });
      }
    }
  }, [mapInitialized, geospatialData]);

  // Update deforestation layer visibility when toggle changes
  useEffect(() => {
    if (!map.current || !mapInitialized) return;
    
    if (map.current.getLayer('deforestation-layer')) {
      map.current.setLayoutProperty(
        'deforestation-layer',
        'visibility',
        showDeforestationLayer ? 'visible' : 'none'
      );
    }
  }, [showDeforestationLayer, mapInitialized]);

  // Separate effect for Forest Loss 1 layer with animated fade transition
  useEffect(() => {
    if (!map.current || !mapInitialized || !map.current.getLayer('forest-loss-1-layer')) return;
    
    // Always set to visible first when toggling
    map.current.setLayoutProperty(
      'forest-loss-1-layer',
      'visibility',
      'visible'
    );
    
    // Animate the opacity
    const targetOpacity = showForestLoss1Layer ? 0.9 : 0;
    const duration = 800; // ms
    const frames = 20;
    const initialOpacity = showForestLoss1Layer ? 0 : 0.9;
    
    // Get current opacity from map if possible, otherwise use initial value
    let currentOpacity = initialOpacity;
    try {
      const currentStyle = map.current.getPaintProperty('forest-loss-1-layer', 'raster-opacity');
      if (currentStyle !== undefined && typeof currentStyle === 'number') {
        currentOpacity = currentStyle;
      }
    } catch (e) {
      console.log('Could not get current opacity, using default');
    }
    
    const step = (targetOpacity - currentOpacity) / frames;
    let frame = 0;
    
    const animate = () => {
      frame++;
      const newOpacity = currentOpacity + (step * frame);
      
      if (map.current) {
        map.current.setPaintProperty(
          'forest-loss-1-layer',
          'raster-opacity',
          newOpacity
        );
      }
      
      if (frame < frames) {
        requestAnimationFrame(animate);
      } else if (!showForestLoss1Layer && map.current) {
        // Only hide the layer after fade out is complete
        map.current.setLayoutProperty(
          'forest-loss-1-layer',
          'visibility',
          'none'
        );
      }
    };
    
    requestAnimationFrame(animate);
  }, [showForestLoss1Layer, mapInitialized]);

  useEffect(() => {
    if (!map.current || !mapInitialized || !map.current.getLayer('forest-loss-2-layer')) return;
    
    // Always set to visible first when toggling
    map.current.setLayoutProperty(
      'forest-loss-2-layer',
      'visibility',
      'visible'
    );
    
    // Animate the opacity
    const targetOpacity = showForestLoss1Layer ? 0.9 : 0;
    const duration = 800; // ms
    const frames = 20;
    const initialOpacity = showForestLoss1Layer ? 0 : 0.9;
    
    // Get current opacity from map if possible, otherwise use initial value
    let currentOpacity = initialOpacity;
    try {
      const currentStyle = map.current.getPaintProperty('forest-loss-2-layer', 'raster-opacity');
      if (currentStyle !== undefined && typeof currentStyle === 'number') {
        currentOpacity = currentStyle;
      }
    } catch (e) {
      console.log('Could not get current opacity, using default');
    }
    
    const step = (targetOpacity - currentOpacity) / frames;
    let frame = 0;
    
    const animate = () => {
      frame++;
      const newOpacity = currentOpacity + (step * frame);
      
      if (map.current) {
        map.current.setPaintProperty(
          'forest-loss-2-layer',
          'raster-opacity',
          newOpacity
        );
      }
      
      if (frame < frames) {
        requestAnimationFrame(animate);
      } else if (!showForestLoss1Layer && map.current) {
        // Only hide the layer after fade out is complete
        map.current.setLayoutProperty(
          'forest-loss-2-layer',
          'visibility',
          'none'
        );
      }
    };
    
    requestAnimationFrame(animate);
  }, [showForestLoss1Layer, mapInitialized]);

  useEffect(() => {
    if (!map.current || !mapInitialized || !map.current.getLayer('palm-source-id')) return;
    
    // Always set to visible first when toggling
    map.current.setLayoutProperty(
      'palm-source-id',
      'visibility',
      'visible'
    );
    
    // Animate the opacity
    const targetOpacity = showPalmLayer ? 0.3 : 0;
    const duration = 800; // ms
    const frames = 20;
    const initialOpacity = showPalmLayer ? 0 : 0.3;
    
    // Get current opacity from map if possible, otherwise use initial value
    let currentOpacity = initialOpacity;
    try {
      const currentStyle = map.current.getPaintProperty('palm-source-id', 'fill-opacity');
      if (currentStyle !== undefined && typeof currentStyle === 'number') {
        currentOpacity = currentStyle;
      }
    } catch (e) {
      console.log('Could not get current opacity, using default');
    }
    
    const step = (targetOpacity - currentOpacity) / frames;
    let frame = 0;
    
    const animate = () => {
      frame++;
      const newOpacity = currentOpacity + (step * frame);
      
      if (map.current) {
        map.current.setPaintProperty(
          'palm-source-id',
          'fill-opacity',
          newOpacity
        );
      }
      
      if (frame < frames) {
        requestAnimationFrame(animate);
      } else if (!showPalmLayer && map.current) {
        // Only hide the layer after fade out is complete
        map.current.setLayoutProperty(
          'palm-source-id',
          'visibility',
          'none'
        );
      }
    };
    
    requestAnimationFrame(animate);
  }, [showPalmLayer, mapInitialized]);

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
