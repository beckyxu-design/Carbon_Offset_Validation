
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import UploadForm from "@/components/UploadForm";
import { AIAnalysisRequest } from "@/lib/types";
import { processQuery } from "@/lib/ai";
import { toast } from "sonner";
import SplitLayout from "@/components/SplitLayout";
import { useMap } from "@/contexts/MapContext";

const Index = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const navigate = useNavigate();
  const { setSelectedProjectId } = useMap();

  const handleSubmit = async (request: AIAnalysisRequest) => {
    setIsLoading(true);
    
    try {
      // Set the selected project ID for the map
      setSelectedProjectId(request.projectId);
      
      // Process the query using our AI functions
      const result = await processQuery(request);
      
      // Store the result in sessionStorage to pass it to the results page
      sessionStorage.setItem('analysisResult', JSON.stringify(result));
      
      // Navigate to the results page
      navigate('/results');
    } catch (error) {
      console.error("Error analyzing project:", error);
      toast.error("Failed to analyze project. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SplitLayout>
      <div className="flex flex-col min-h-screen bg-gradient-to-b from-background to-muted/30">
        <div className="flex-1">
          <div className="p-6 sm:p-10">
            <div className="max-w-xl mx-auto text-center mb-10">
              <div className="inline-block mb-6">
                <div className="relative">
                  <div className="h-20 w-20 rounded-xl bg-primary/10 animate-pulse-slow backdrop-blur-sm flex items-center justify-center mx-auto">
                    <svg className="h-10 w-10 text-primary" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M17 8H7c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2z" fill="currentColor" fillOpacity="0.2"/>
                      <path d="M19 4H9c-1.1 0-2 .9-2 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M15 12l-3 3 2 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M3 12h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M3 6h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M3 18h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold">
                    AI
                  </div>
                </div>
              </div>
              <h1 className="text-4xl font-bold tracking-tight mb-3">Carbon Project Analysis</h1>
              <p className="text-lg text-muted-foreground max-w-xl mx-auto">
                Analyze carbon projects with AI-powered insights. Input a project ID, upload documents, 
                and get detailed analysis on risks, trends, and recommendations.
              </p>
            </div>
            
            <div className="bg-white/70 backdrop-blur-lg rounded-xl border border-white/20 shadow-xl max-w-xl mx-auto p-6 md:p-8">
              <UploadForm onSubmit={handleSubmit} isLoading={isLoading} />
            </div>
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

export default Index;
