import React from 'react';
import { useMap } from '@/contexts/MapContext';
import { Layers, Eye, EyeOff } from 'lucide-react';
import { Toggle } from '@/components/ui/toggle';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const MapControls: React.FC = () => {
  const { 
    showDeforestationLayer, 
    toggleDeforestationLayer,
    showForestLoss1Layer,
    toggleForestLoss1Layer,
    showPalmLayer,
    togglePalmLayer,
    showForestLossYear23Layer,
    toggleForestLossYear23Layer
  } = useMap();

  return (
    <div className="absolute top-4 right-4 z-10 bg-white/80 backdrop-blur-sm rounded-lg shadow-md p-2 flex flex-col gap-2 border border-border/60">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2">
              <Toggle
                pressed={showDeforestationLayer}
                onPressedChange={toggleDeforestationLayer}
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0 data-[state=on]:bg-primary/20 data-[state=on]:text-primary"
              >
                {showDeforestationLayer ? (
                  <Eye className="h-4 w-4" />
                ) : (
                  <EyeOff className="h-4 w-4" />
                )}
              </Toggle>
              <span className="text-xs font-medium whitespace-nowrap">Deforestation (2018-2024) | Dynamic World </span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p className="text-xs">{showDeforestationLayer ? 'Hide' : 'Show'} deforestation rates</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2">
              <Toggle
                pressed={showForestLoss1Layer}
                onPressedChange={toggleForestLoss1Layer}
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0 data-[state=on]:bg-primary/20 data-[state=on]:text-primary"
              >
                {showForestLoss1Layer ? (
                  <Eye className="h-4 w-4" />
                ) : (
                  <EyeOff className="h-4 w-4" />
                )}
              </Toggle>
              <span className="text-xs font-medium whitespace-nowrap"> Forest Loss (2001-2023) | GFW </span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p className="text-xs">{showForestLoss1Layer ? 'Hide' : 'Show'} Forest Loss </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2">
              <Toggle
                pressed={showPalmLayer}
                onPressedChange={togglePalmLayer}
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0 data-[state=on]:bg-primary/20 data-[state=on]:text-primary"
              >
                {showPalmLayer ? (
                  <Eye className="h-4 w-4" />
                ) : (
                  <EyeOff className="h-4 w-4" />
                )}
              </Toggle>
              <span className="text-xs font-medium whitespace-nowrap">Oil Palm Concessions (2023) | GFW</span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p className="text-xs">{showPalmLayer ? 'Hide' : 'Show'} Oil Palm Concessions</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

    </div>
  );
};

export default MapControls;
