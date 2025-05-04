import React, { useState } from "react";
import { Copy, Check, ChevronDown, ChevronUp, Lightbulb } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface RecommendationsProps {
  recommendations: string;
}

const Recommendations: React.FC<RecommendationsProps> = ({ recommendations }) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [expanded, setExpanded] = useState<boolean>(false);

  // Split recommendations into an array for better rendering and remove dashes
  const recommendationsList = recommendations
    .split('\n')
    .filter(rec => rec.trim())
    .map(rec => rec.trim().replace(/^[-–—•]\s*/, '')); // Remove any type of dash or bullet at the beginning

  const copyToClipboard = () => {
    const text = `
      Project Recommendations
      
      ${recommendationsList.join('\n')}
    `;

    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Recommendations copied to clipboard");

    setTimeout(() => setCopied(false), 2000);
  };

  // Get visible recommendations (first two when collapsed, all when expanded)
  const visibleRecommendations = expanded 
    ? recommendationsList 
    : recommendationsList.slice(0, 3);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full mb-6"
    >
      <Card className="glass-card overflow-hidden">
        <div className="bg-gradient-to-r from-amber-400/20 to-amber-500/5 h-2"></div>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <CardTitle className="text-xl font-semibold flex items-center">
              <Lightbulb className="h-5 w-5 mr-2 text-amber-500" />
              Recommendations for Next Steps
            </CardTitle>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={copyToClipboard}
              className="h-8 w-8"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-2 mb-10">
            To further analyze and/or improve the credibility of the project, here is a list of recommended actions to take:
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Always render the first 3 recommendations */}
            {recommendationsList.slice(0, 3).map((recommendation, index) => (
              <motion.div 
                key={`fixed-${index}`}
                initial={{ opacity: 1 }}
                animate={{ opacity: 1 }}
                className="flex gap-3"
              >
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-medium">
                  {index + 1}
                </div>
                <p className="text-sm">{recommendation}</p>
              </motion.div>
            ))}
            
            {/* Conditionally render the remaining recommendations with animation */}
            <AnimatePresence>
              {expanded && recommendationsList.length > 3 && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="space-y-4 overflow-hidden"
                >
                  {recommendationsList.slice(3).map((recommendation, index) => (
                    <div key={`extra-${index}`} className="flex gap-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-medium">
                        {index + 4}
                      </div>
                      <p className="text-sm">{recommendation}</p>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
            
            {recommendationsList.length > 3 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setExpanded(!expanded)}
                className="flex items-center text-sm text-muted-foreground mt-2"
              >
                <AnimatePresence mode="wait" initial={false}>
                  {expanded ? (
                    <motion.div
                      key="less"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      transition={{ duration: 0.2 }}
                      className="flex items-center"
                    >
                      Show less <ChevronUp className="ml-1 h-4 w-4" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="more"
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      transition={{ duration: 0.2 }}
                      className="flex items-center"
                    >
                      Show all {recommendationsList.length} recommendations <ChevronDown className="ml-1 h-4 w-4" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default Recommendations;
