
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
  const { showDeforestationLayer, toggleDeforestationLayer } = useMap();

  return (
    <div className="absolute top-4 right-4 z-10 bg-white/80 backdrop-blur-sm rounded-lg shadow-md p-2 flex gap-1 border border-border/60">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
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
          </TooltipTrigger>
          <TooltipContent side="left">
            <p className="text-xs">{showDeforestationLayer ? 'Hide' : 'Show'} deforestation rates</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="h-8 w-8 flex items-center justify-center rounded border border-border text-xs text-muted-foreground">
              <Layers className="h-4 w-4" />
            </div>
          </TooltipTrigger>
          <TooltipContent side="left">
            <div className="space-y-1">
              <p className="text-xs font-medium">Map layers:</p>
              <ul className="text-xs text-muted-foreground">
                <li>• Project boundaries</li>
                <li>• {showDeforestationLayer ? 'Deforestation rates (visible)' : 'Deforestation rates (hidden)'}</li>
              </ul>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};

export default MapControls;
