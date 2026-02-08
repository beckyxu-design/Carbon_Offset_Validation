import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NewsArticle } from "@/lib/types";
import { ExternalLink, ChevronDown, ChevronUp, Newspaper } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface NewsArticlesCardProps {
  newsArticles: NewsArticle[];
}

const NewsArticlesCard: React.FC<NewsArticlesCardProps> = ({ newsArticles }) => {
  const [expandedNews, setExpandedNews] = useState<boolean>(false);
  
  // Get visible news articles (first 1 when collapsed, all when expanded)
  const visibleNewsArticles = expandedNews 
    ? newsArticles 
    : newsArticles.slice(0, 1);
    
  if (newsArticles.length === 0) {
    return null;
  }
  
  return (
    <Card className="glass-card overflow-hidden animate-fade-in">
      <div className="bg-gradient-to-r from-primary/20 to-primary/5 h-2"></div>
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-semibold flex items-center">
          <Newspaper className="h-5 w-5 mr-2 text-primary" />
          Related News Articles
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
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
        
        {/* Show "Read more" button only if there are more than 1 news article */}
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
      </CardContent>
    </Card>
  );
};

export default NewsArticlesCard;
