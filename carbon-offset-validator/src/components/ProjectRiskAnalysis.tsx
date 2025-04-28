import React, { useState } from "react";
import { OverallSummary } from "@/lib/types";
import { AlertTriangle, Copy, Check, ChevronDown, ChevronUp } from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ProjectRiskAnalysisProps {
  overallSummary: OverallSummary[];
}

const ProjectRiskAnalysis: React.FC<ProjectRiskAnalysisProps> = ({ overallSummary }) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [expandedRecommendations, setExpandedRecommendations] = useState<boolean>(false);

  if (!overallSummary || overallSummary.length === 0 || !overallSummary[0].summary || !overallSummary[0].recommendations) {
    return null;
  }

  // Split recommendations into an array for better rendering
  const recommendations = overallSummary[0].recommendations.split('\n').filter(rec => rec.trim());

  // Split summary into sentences for highlighting
  const summarySentences = overallSummary[0].summary.split('.').filter(s => s.trim()).map(s => s.trim() + '.');

  const copyToClipboard = () => {
    const text = `
      Project Overall Risk Analysis
      
      Summary: ${overallSummary[0].summary}
      
      Recommendations:
      ${recommendations.join('\n')}
    `;

    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Risk analysis copied to clipboard");

    setTimeout(() => setCopied(false), 2000);
  };

  // Get visible recommendations (first two when collapsed, all when expanded)
  const visibleRecommendations = expandedRecommendations 
    ? recommendations 
    : recommendations.slice(0, 2);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="glass-card overflow-hidden animate-fade-in">
        <div className="bg-gradient-to-r from-amber-500/20 to-amber-500/5 h-2"></div>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-semibold flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-amber-500" />
              Project Overall Risk Analysis
            </CardTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={copyToClipboard}
              className="h-8 w-8 p-0"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              <span className="sr-only">Copy analysis</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Summary</h3>
            <div className="relative">
              {/* Visual indicator for long content */}
              <div className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-amber-500/50 via-amber-300/50 to-amber-100/50 rounded-full"></div>
              
              {/* Text with visual hierarchy */}
              <div className="pl-2">
                <div className="text-base leading-relaxed">
                  {summarySentences.map((sentence, idx) => (
                    <span key={idx} className={idx === 0 ? 'font-medium' : ''}>
                      {idx > 0 && ' '}{sentence}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="relative"
          >
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Recommendations</h3>
            <div className="space-y-3">
              {visibleRecommendations.map((rec, idx) => (
                <motion.div 
                  key={idx} 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + (idx * 0.05), duration: 0.3 }}
                  className="bg-secondary/30 p-3 rounded-md relative"
                >
                  {/* Visual indicator for recommendations */}
                  <div className="absolute -left-1 top-0 bottom-0 w-1 bg-gradient-to-b from-amber-500/50 to-amber-300/50 rounded-full"></div>
                  
                  {/* Recommendation text */}
                  <div className="pl-2">
                    <p className="text-base leading-relaxed">{rec}</p>
                  </div>
                </motion.div>
              ))}
            </div>
            
            {/* Show "Read more" button only if there are more than 2 recommendations */}
            {recommendations.length > 2 && (
              <div className="mt-3 text-center">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setExpandedRecommendations(!expandedRecommendations)}
                  className="text-xs text-muted-foreground hover:text-primary flex items-center mx-auto"
                >
                  {expandedRecommendations ? (
                    <>Show less <ChevronUp className="ml-1 h-3 w-3" /></>
                  ) : (
                    <>Show all {recommendations.length} recommendations <ChevronDown className="ml-1 h-3 w-3" /></>
                  )}
                </Button>
              </div>
            )}
            
            {/* Gradient fade at the bottom when collapsed */}
            {!expandedRecommendations && recommendations.length > 2 && (
              <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-white to-transparent pointer-events-none"></div>
            )}
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ProjectRiskAnalysis;
