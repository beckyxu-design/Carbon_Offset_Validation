import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AIAnalysisResponse, NewsArticle } from "@/lib/types";
import { Copy, Check, MessageSquare, ExternalLink } from "lucide-react";
import { toast } from "sonner";

// This interface defines the props for the AIAnalysisCard component.
// It ensures that the component receives the correct data structure,
// which is essential for type safety and proper rendering of the analysis results.

// data structure expected: AIAnalysisResponseç
interface AIAnalysisCardProps {
  data: AIAnalysisResponse;
}

const AIAnalysisCard: React.FC<AIAnalysisCardProps> = ({ data }) => {
  const [copied, setCopied] = useState<boolean>(false);
  const copyToClipboard = () => {
    const text = `
      Project: ${data.projectData.name}
      
      Summary: ${data.summary.summary}
      
      Policy Analysis:
      ${data.summary.policyAssessment ? Object.entries(data.summary.policyAssessment).map(([key, value]) => `- ${key}: ${value}`).join('\n') : 'No policy analysis available'}
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
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Summary</h3>
          <p>{data.summary.summary}</p>
        </div>

        {data.summary.policyAssessment && (
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Policy Analysis</h3>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(data.summary.policyAssessment).map(([key, value]) => (
                <div key={key} className="bg-secondary/30 p-3 rounded-md">
                  <h4 className="font-medium capitalize mb-1">{key.replace('_', ' ')}</h4>
                  <p className="text-sm line-clamp-4">{value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {data.summary.newsSearch && data.summary.newsSearch.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Related News Articles</h3>
            <div className="space-y-3">
              {data.summary.newsSearch.map((article: NewsArticle, index: number) => (
                <div key={index} className="bg-secondary/30 p-3 rounded-md">
                  <h4 className="font-medium mb-1">{article.title}</h4>
                  <p className="text-sm mb-2">{article.content}</p>
                  <a 
                    href={article.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary text-sm flex items-center hover:underline"
                  >
                    Read More <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

      </CardContent>
    </Card>
  );
};

export default AIAnalysisCard;
