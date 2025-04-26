import React, { useEffect, useState } from "react";
import { AIAnalysisResponse, LanduseTimeSeriesData } from "@/lib/types";
import ProjectHeader from "./ProjectHeader";
import AIAnalysisCard from "./AIAnalysisCard";
import RiskSummaryTable from "./RiskSummaryTable";
import DataVisualization from "./DataVisualization";
import LandusePieChart from "./LandusePieChart";
import LanduseTimeSeriesChart from "./LanduseTimeSeriesChart";
import { Alert, AlertDescription } from "@/components/ui/alert";

// define a typescript interface with input data prop type AIAnalysisResponse(structured data format)
interface ProjectAnalysisProps {
  // must receive a data prop of type AIAnalysisResponse
  data: AIAnalysisResponse;
}

// def react functional component
// expect prop type: <ProjectAnalysisProps> & expect input: {data}
const ProjectAnalysis: React.FC<ProjectAnalysisProps> = ({ data }) => {
  // Check if landuseTimeSeriesData exists in the data prop
  const landuseData = data.landuseTimeSeriesData || [];
  
  // Log data for debugging
  useEffect(() => {
    console.log("Project data:", data);
    // console.log("Land use time series data:", landuseData);
  }, [data, landuseData]);

  return (
    <div className="space-y-8">
      <ProjectHeader project={data.projectData} />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AIAnalysisCard data={data} />
        <RiskSummaryTable metrics={data.riskMetrics} />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
        {/* Debug log for timeSeriesData */}
        <DataVisualization 
          timeSeriesData={data.timeSeriesData || []} 
          // emissionsData={data.timeSeriesData} 
        />
        {/* <LandusePieChart data={data.pieChartData} /> */}
      </div>
      
      <div className="grid grid-cols-1 gap-6">
        {landuseData.length > 0 ? (
          <LanduseTimeSeriesChart data={landuseData} />
        ) : (
          <Alert>
            <AlertDescription>No land use time series data available for this project.</AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
};

export default ProjectAnalysis;
