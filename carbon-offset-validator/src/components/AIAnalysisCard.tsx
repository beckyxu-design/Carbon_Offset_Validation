import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AIAnalysisResponse, NewsArticle } from "@/lib/types";
import { Copy, Check, MessageSquare, ExternalLink, ChevronDown, ChevronUp, ScanLine } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

// This interface defines the props for the AIAnalysisCard component.
// It ensures that the component receives the correct data structure,
// which is essential for type safety and proper rendering of the analysis results.

// data structure expected: AIAnalysisResponseç
interface AIAnalysisCardProps {
  data: AIAnalysisResponse;
}

const AIAnalysisCard: React.FC<AIAnalysisCardProps> = ({ data }) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [expandedSummary, setExpandedSummary] = useState<boolean>(false);
  const [expandedNews, setExpandedNews] = useState<boolean>(false);
  
  // Function to format policy text by parsing markdown-style formatting
  const formatPolicyText = (text: string) => {
    // Check if the text contains bullet points with asterisks
    if (text.includes('* **') || text.includes('**')) {
      // Split the text by bullet points
      const parts = text.split(/\*\s+\*\*/);
      
      if (parts.length > 1) {
        // First part is the introduction (if any)
        const intro = parts[0].trim();
        
        // Process the bullet points
        const bulletPoints = parts.slice(1).map(part => {
          // Extract the title and content
          const titleMatch = part.match(/([^:*]+):\*\*\s*(.*)/);
          if (titleMatch) {
            return {
              title: titleMatch[1].trim(),
              content: titleMatch[2].trim()
            };
          }
          return { title: '', content: part.trim() };
        }).filter(item => item.title || item.content);
        
        return (
          <>
            {intro && <p className="text-sm mb-3">{intro}</p>}
            <div className="space-y-3">
              {bulletPoints.map((item, index) => (
                <div key={index} className="bg-secondary/30 p-3 rounded-md">
                  {item.title && <h4 className="font-medium text-sm mb-1">{item.title}</h4>}
                  <p className="text-sm text-muted-foreground">{item.content}</p>
                </div>
              ))}
            </div>
          </>
        );
      }
    }
    
    // If no bullet points or parsing fails, return the original text
    return <p className="text-sm">{text}</p>;
  };
  
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
  
  // Split summary into sentences for showing only first 3
  const summarySentences = data.summary.summary.split('.').filter(s => s.trim()).map(s => s.trim() + '.');
  const visibleSentences = expandedSummary ? summarySentences : summarySentences.slice(0, 3);
  
  // Get visible news articles (first 2 when collapsed, all when expanded)
  const newsArticles = Array.isArray(data.summary.newsSearch) ? data.summary.newsSearch : [];
  const visibleNewsArticles = expandedNews 
    ? newsArticles 
    : newsArticles.slice(0, 1);
    
  return (
    <Card className="glass-card overflow-hidden animate-fade-in">
      <div className="bg-gradient-to-r from-primary/20 to-primary/5 h-2"></div>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-semibold flex items-center">
            <ScanLine className="h-5 w-5 mr-2 text-primary" />
            Analysis (LLM): Conflicts with National Policy
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
        <div className="relative">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Analysis Summary</h3>
          <motion.div 
            className="text-base leading-relaxed"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {visibleSentences.map((sentence, idx) => (
              <span key={idx}>
                {sentence}{' '}
              </span>
            ))}
          </motion.div>
          
          {/* Gradient fade for truncated text */}
          {!expandedSummary && summarySentences.length > 3 && (
            <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-white to-transparent pointer-events-none"></div>
          )}
          
          {/* Expand/collapse button - only show if there are more than 3 sentences */}
          {summarySentences.length > 3 && (
            <div className="relative z-10">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setExpandedSummary(!expandedSummary)} 
                className="mt-1 h-6 text-xs text-muted-foreground hover:text-primary flex items-center"
              >
                <AnimatePresence mode="wait" initial={false}>
                  {expandedSummary ? (
                    <motion.div 
                      key="less"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      transition={{ duration: 0.2 }}
                      className="flex items-center"
                    >
                      Show less <ChevronUp className="ml-1 h-3 w-3" />
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
                      Read more <ChevronDown className="ml-1 h-3 w-3" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </Button>
            </div>
          )}
        </div>

        {data.summary.policyAssessment && (
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Policy Analysis</h3>
            <div className="grid grid-cols-1 gap-3">
              {Object.entries(data.summary.policyAssessment).map(([key, value]) => {
                const [expanded, setExpanded] = useState(false);
                const valueStr = String(value);
                
                return (
                  <div key={key} className="bg-secondary/30 p-3 rounded-md">
                    <h4 className="font-medium capitalize mb-1">{key.replace(/_/g, ' ')}</h4>
                    
                    {/* If text is too long, apply expand/collapse behavior */}
                    {valueStr.length > 150 ? (
                      <>
                        <motion.div 
                          animate={{ 
                            height: expanded ? "auto" : "6rem",
                            opacity: 1 
                          }}
                          initial={false}
                          transition={{ 
                            height: { duration: 0.3, ease: "easeInOut" },
                            opacity: { duration: 0.2 }
                          }}
                          className="relative overflow-hidden"
                        >
                          {formatPolicyText(valueStr)}
                          
                          {/* Gradient fade for truncated text */}
                          {!expanded && (
                            <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white/90 to-transparent pointer-events-none"></div>
                          )}
                        </motion.div>
                        
                        <Button 
                          variant="link" 
                          size="sm" 
                          className="p-0 h-auto text-xs mt-1"
                          onClick={() => setExpanded(!expanded)}
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
                                Show less <ChevronUp className="ml-1 h-3 w-3" />
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
                                Read more <ChevronDown className="ml-1 h-3 w-3" />
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </Button>
                      </>
                    ) : (
                      formatPolicyText(valueStr)
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {newsArticles.length > 0 && (
          <div className="relative">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Related News Articles</h3>
            <div className="space-y-3">
              {visibleNewsArticles.map((article: NewsArticle, idx: number) => (
                <div key={idx} className="bg-secondary/30 p-3 rounded-md">
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
            
            {/* Show "Read more" button only if there are more than 2 news articles */}
            {newsArticles.length > 1 && (
              <div className="mt-3 text-center">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setExpandedNews(!expandedNews)}
                  className="text-xs text-muted-foreground hover:text-primary flex items-center mx-auto"
                >
                  <AnimatePresence mode="wait" initial={false}>
                    {expandedNews ? (
                      <motion.div 
                        key="less"
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        transition={{ duration: 0.2 }}
                        className="flex items-center"
                      >
                        Show less <ChevronUp className="ml-1 h-3 w-3" />
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
                        Show all {newsArticles.length} news articles <ChevronDown className="ml-1 h-3 w-3" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Button>
              </div>
            )}
            
            {/* Gradient fade at the bottom when collapsed */}
            {!expandedNews && newsArticles.length > 1 && (
              <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-white to-transparent pointer-events-none"></div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AIAnalysisCard;
