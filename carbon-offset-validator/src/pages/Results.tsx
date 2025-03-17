import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import ProjectAnalysis from "@/components/ProjectAnalysis";
import { AIAnalysisResponse } from "@/lib/types";
import { ArrowLeft, Home } from "lucide-react";
import { toast } from "sonner";
import SplitLayout from "@/components/SplitLayout";
import { useMap } from "@/contexts/MapContext";
import { Alert, AlertDescription } from '@/components/ui/alert';

const Results = () => {
  const [analysisResult, setAnalysisResult] = useState<AIAnalysisResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { setSelectedProjectId } = useMap();
  const { projectCode } = useParams<{ projectCode: string }>();

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Fetching data for project:', projectCode);
        setIsLoading(true);
        setError(null);

        // Try to get the analysis result from sessionStorage
        const storedResult = sessionStorage.getItem('analysisResult');
        
        if (storedResult) {
          try {
            const parsedResult = JSON.parse(storedResult) as AIAnalysisResponse;
            setAnalysisResult(parsedResult);
            
            // Set the project code for the map
            if (parsedResult.projectData?.project_code) {
              setSelectedProjectId(parsedResult.projectData.project_code);
            }
          } catch (error) {
            console.error("Error parsing analysis result:", error);
            setError('Error loading analysis results');
          }
        } else {
          // If no result is found, redirect to the home page
          setError('No analysis results found');
        }
        
        setIsLoading(false);
        
        // Cleanup function
        return () => {
          // We don't clear sessionStorage here to allow going back to the results
        };
      } catch (err) {
        console.error('Error in Results page:', err);
        setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [navigate, setSelectedProjectId, projectCode]);

  const handleGoBack = () => {
    navigate('/');
  };

  if (isLoading) {
    return (
      <SplitLayout showMap={false}>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/30">
          <div className="text-center">
            <div className="h-10 w-10 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading analysis results...</p>
          </div>
        </div>
      </SplitLayout>
    );
  }

  if (error) {
    return (
      <SplitLayout showMap={false}>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/30">
          <div className="text-center">
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        </div>
      </SplitLayout>
    );
  }

  if (!analysisResult) {
    return (
      <SplitLayout showMap={false}>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/30">
          <div className="text-center">
            <Alert>
              <AlertDescription>No analysis results found.</AlertDescription>
            </Alert>
          </div>
        </div>
      </SplitLayout>
    );
  }

  return (
    <SplitLayout showMap={false}>
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
