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
import { FeatureCollection } from 'geojson';
import { getProjectData } from "@/lib/api";

const Results = () => {
  const [analysisResult, setAnalysisResult] = useState<AIAnalysisResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { setSelectedProjectId, setGeospatialData } = useMap();
  const { projectCode } = useParams<{ projectCode: string }>();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Try to get the analysis result from sessionStorage
        const storedResult = sessionStorage.getItem('analysisResult');
        // console.log('store result is :', storedResult);
        
        if (storedResult) {
          try {
            const parsedResult = JSON.parse(storedResult) as AIAnalysisResponse;
            
            // If we have a project code, fetch the latest data from the API
            if (projectCode && parsedResult.projectData?.project_code) {
              try {
                // Fetch the latest project data from the AP
                // const apiResponse = await getProjectData(projectCode);
                setAnalysisResult(parsedResult)
                
                // if (apiResponse.data) {
                //   console.log('API data:', apiResponse.data);
                  
                //   // Merge the API data with the stored result
                //   // This ensures we get the latest land use time series data and time series data
                //   setAnalysisResult({
                //     ...parsedResult,
                //     // timeSeriesData: apiResponse.data.timeSeriesData || [],
                //     // landuseTimeSeriesData: apiResponse.data.landuseTimeSeriesData || []
                //   });
                // } else {
                //   // If API call fails, use the stored result
                //   setAnalysisResult(parsedResult);
                // }
                
              } catch (apiError) {
                console.error('Error fetching API data:', apiError);
                // If API call fails, use the stored result
                setAnalysisResult(parsedResult);
              }
            } else {
              // If no project code, just use the stored result
              setAnalysisResult(parsedResult);
            }
            
            // Set the geospatial data for the map
            if (parsedResult.geospatialData) {
              // The backend now returns a proper FeatureCollection
              console.log("Received geospatial data:", parsedResult.geospatialData[0]['geometry']);
              setGeospatialData(parsedResult.geospatialData[0]['geometry']);
            } else {
              console.warn("No valid geospatial data found in the analysis result");
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
  }, [navigate, setSelectedProjectId, setGeospatialData, projectCode]);

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
    <SplitLayout showMap={true}>
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
