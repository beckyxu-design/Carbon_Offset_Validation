
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import ProjectAnalysis from "@/components/ProjectAnalysis";
import { AIAnalysisResponse } from "@/lib/types";
import { ArrowLeft, Home } from "lucide-react";
import { toast } from "sonner";
import SplitLayout from "@/components/SplitLayout";
import { useMap } from "@/contexts/MapContext";

const Results = () => {
  const [analysisResult, setAnalysisResult] = useState<AIAnalysisResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const navigate = useNavigate();
  const { setSelectedProjectId } = useMap();

  useEffect(() => {
    // Try to get the analysis result from sessionStorage
    const storedResult = sessionStorage.getItem('analysisResult');
    
    if (storedResult) {
      try {
        const parsedResult = JSON.parse(storedResult) as AIAnalysisResponse;
        setAnalysisResult(parsedResult);
        
        // Set the project ID for the map
        if (parsedResult.projectData?.id) {
          setSelectedProjectId(parsedResult.projectData.id);
        }
      } catch (error) {
        console.error("Error parsing analysis result:", error);
        toast.error("Error loading analysis results");
        navigate('/');
      }
    } else {
      // If no result is found, redirect to the home page
      toast.error("No analysis results found");
      navigate('/');
    }
    
    setIsLoading(false);
    
    // Cleanup function
    return () => {
      // We don't clear sessionStorage here to allow going back to the results
    };
  }, [navigate, setSelectedProjectId]);

  const handleGoBack = () => {
    navigate('/');
  };

  if (isLoading) {
    return (
      <SplitLayout>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/30">
          <div className="text-center">
            <div className="h-10 w-10 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading analysis results...</p>
          </div>
        </div>
      </SplitLayout>
    );
  }

  if (!analysisResult) {
    return (
      <SplitLayout>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/30">
          <div className="text-center">
            <p className="text-xl font-semibold mb-4">No analysis results found</p>
            <Button onClick={handleGoBack}>Go to Home</Button>
          </div>
        </div>
      </SplitLayout>
    );
  }

  return (
    <SplitLayout>
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-muted/30">
        <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={handleGoBack}
                className="h-9 text-muted-foreground gap-1"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </Button>
              
              <div className="flex items-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/')}
                  className="h-9 text-muted-foreground"
                >
                  <Home className="h-4 w-4 mr-1" />
                  Home
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex-1">
          <div className="p-6">
            <ProjectAnalysis data={analysisResult} />
          </div>
        </div>
        
        <footer className="py-6 border-t border-border bg-background/50 backdrop-blur-sm">
          <div className="px-6">
            <div className="text-center text-sm text-muted-foreground">
              <p>AI-Powered Carbon Project Analysis Tool</p>
            </div>
          </div>
        </footer>
      </div>
    </SplitLayout>
  );
};

export default Results;
