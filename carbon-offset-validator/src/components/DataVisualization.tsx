
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DeforestationData, EmissionsData } from "@/lib/types";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TreeDeciduous, BarChart4 } from "lucide-react";

interface DataVisualizationProps {
  deforestationData: DeforestationData[];
  emissionsData: EmissionsData[];
}

const DataVisualization: React.FC<DataVisualizationProps> = ({
  deforestationData,
  emissionsData
}) => {
  const [activeTab, setActiveTab] = useState<string>("deforestation");
  
  const CustomTooltip = ({ active, payload, label, dataType }: any) => {
    if (!active || !payload || !payload.length) return null;
    
    return (
      <div className="bg-white p-3 rounded-md shadow-lg border border-border">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-sm text-primary">
          {dataType === "deforestation" 
            ? `${payload[0].value} hectares` 
            : `${payload[0].value.toLocaleString()} tonnes CO₂e`}
        </p>
      </div>
    );
  };
  
  return (
    <Card className="glass-card overflow-hidden animate-fade-in">
      <div className="bg-gradient-to-r from-primary/20 to-primary/5 h-2"></div>
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-semibold flex items-center">
          <BarChart4 className="h-5 w-5 mr-2 text-primary" />
          Data Trends
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs 
          defaultValue="deforestation" 
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-4"
        >
          <TabsList className="grid grid-cols-2 bg-secondary/50">
            <TabsTrigger value="deforestation" className="flex items-center">
              <TreeDeciduous className="h-4 w-4 mr-2" />
              Deforestation
            </TabsTrigger>
            <TabsTrigger value="emissions">
              <svg className="h-4 w-4 mr-2 inline" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 16C8.7 16 6 13.3 6 10H4C4 14.4 7.6 18 12 18C16.4 18 20 14.4 20 10H18C18 13.3 15.3 16 12 16Z" fill="currentColor"/>
                <path d="M12 4C14.2 4 16 5.8 16 8H18C18 4.7 15.3 2 12 2C8.7 2 6 4.7 6 8H8C8 5.8 9.8 4 12 4Z" fill="currentColor"/>
              </svg>
              Emissions
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="deforestation" className="space-y-4">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={deforestationData}
                  margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
                  barSize={20}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="year" 
                    label={{ value: 'Year', position: 'insideBottom', offset: -15 }}
                  />
                  <YAxis 
                    label={{ 
                      value: 'Hectares', 
                      angle: -90, 
                      position: 'insideLeft',
                      style: { textAnchor: 'middle' }
                    }} 
                  />
                  <Tooltip content={<CustomTooltip dataType="deforestation" />} />
                  <Legend verticalAlign="top" height={36} />
                  <Bar 
                    dataKey="hectares" 
                    name="Deforested Area (hectares)" 
                    fill="#3b82f6" 
                    animationDuration={1500}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="text-sm text-muted-foreground">
              <p>This chart shows the annual deforestation rates in hectares within the project area over the past decade.</p>
            </div>
          </TabsContent>
          
          <TabsContent value="emissions" className="space-y-4">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={emissionsData}
                  margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="year" 
                    label={{ value: 'Year', position: 'insideBottom', offset: -15 }}
                  />
                  <YAxis 
                    label={{ 
                      value: 'Tonnes CO₂e', 
                      angle: -90, 
                      position: 'insideLeft',
                      style: { textAnchor: 'middle' }
                    }} 
                  />
                  <Tooltip content={<CustomTooltip dataType="emissions" />} />
                  <Legend verticalAlign="top" height={36} />
                  <Line 
                    type="monotone" 
                    dataKey="tonnes" 
                    name="CO₂ Emissions (tonnes)" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2, fill: 'white' }}
                    animationDuration={1500}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            
            <div className="text-sm text-muted-foreground">
              <p>This chart shows the estimated annual carbon emissions (in tonnes of CO₂ equivalent) associated with deforestation in the project area.</p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default DataVisualization;
