
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useMap } from '@/contexts/MapContext';
import { Check, Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const MapboxTokenInput: React.FC = () => {
  const { mapToken, setMapToken } = useMap();
  const [inputToken, setInputToken] = useState(mapToken);
  const [isVisible, setIsVisible] = useState(!mapToken);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputToken.trim()) {
      setMapToken(inputToken.trim());
      setIsVisible(false);
    }
  };

  if (!isVisible && mapToken) {
    return (
      <div className="p-2">
        <Button 
          variant="outline" 
          size="sm" 
          className="bg-primary/10 text-primary text-xs gap-1"
          onClick={() => setIsVisible(true)}
        >
          <Check className="h-3.5 w-3.5" /> 
          Mapbox Token Set
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 mb-4 bg-white/70 backdrop-blur-sm border border-border/50 rounded-lg shadow-sm">
      <form onSubmit={handleSubmit} className="space-y-2">
        <div className="flex items-center gap-2 mb-2">
          <h3 className="text-sm font-medium">Mapbox API Token</h3>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs text-xs">
                  Get your free token from <a href="https://mapbox.com/" target="_blank" rel="noopener noreferrer" className="text-primary underline">mapbox.com</a>. 
                  Sign up, visit Account → Tokens, and copy your Default public token.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className="flex gap-2">
          <Input 
            type="text" 
            value={inputToken} 
            onChange={(e) => setInputToken(e.target.value)}
            placeholder="pk.eyJ1Ijo..."
            className="text-xs h-8"
          />
          <Button type="submit" size="sm" className="h-8">
            Save
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Token will be saved in your browser for future visits.
        </p>
      </form>
    </div>
  );
};

export default MapboxTokenInput;
