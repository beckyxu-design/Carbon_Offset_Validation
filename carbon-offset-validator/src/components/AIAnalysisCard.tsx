import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AIAnalysisResponse } from "@/lib/types";
import { Copy, Check, MessageSquare } from "lucide-react";
import { toast } from "sonner";

interface AIAnalysisCardProps {
  data: AIAnalysisResponse;
}

const AIAnalysisCard: React.FC<AIAnalysisCardProps> = ({ data }) => {
  const [copied, setCopied] = useState<boolean>(false);
  
  const copyToClipboard = () => {
    const text = `
      Project: ${data.projectData.name}
      
      Query: ${data.queryResponse}
      
      Summary: ${data.analysis.summary}
      
      Risk Metrics:
      ${data.riskMetrics.map(metric => `- ${metric.category}: ${metric.score}/100 - ${metric.description}`).join('\n')}
      
      Recommendations:
      ${data.analysis.recommendations.map(rec => `- ${rec}`).join('\n')}
      
      Additional Insights: ${data.analysis.additionalInsights || 'None'}
    `;
    
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Analysis copied to clipboard");
    
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <Card className="glass-card overflow-hidden animate-fade-in">
      <div className="bg-gradient-to-r from-primary/20 to-primary/5 h-2"></div>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-semibold flex items-center">
            <MessageSquare className="h-5 w-5 mr-2 text-primary" />
            AI Analysis Results
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={copyToClipboard}
            className="h-8 text-muted-foreground hover:text-foreground"
          >
            {copied ? (
              <span className="flex items-center">
                <Check className="h-4 w-4 mr-1 text-green-500" />
                Copied
              </span>
            ) : (
              <span className="flex items-center">
                <Copy className="h-4 w-4 mr-1" />
                Copy
              </span>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Your Query</h3>
          <div className="bg-muted/50 p-3 rounded-md">
            <p className="font-medium">{data.queryResponse}</p>
          </div>
        </div>
        
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Summary</h3>
          <p>{data.analysis.summary}</p>
        </div>
        
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Recommendations</h3>
          <ul className="space-y-2">
            {data.analysis.recommendations.map((recommendation, index) => (
              <li key={index} className="flex items-start">
                <span className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs mr-2 shrink-0 mt-0.5">
                  {index + 1}
                </span>
                <span>{recommendation}</span>
              </li>
            ))}
          </ul>
        </div>
        
        {data.analysis.additionalInsights && (
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Additional Insights</h3>
            <div className="bg-secondary/30 p-3 rounded-md">
              <p>{data.analysis.additionalInsights}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AIAnalysisCard;
