import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TimeSeriesData, Project } from "@/lib/types";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell, ReferenceLine } from "recharts";
import { TreeDeciduous, BarChart4 } from "lucide-react";
import { useMap } from '@/contexts/MapContext';

interface DataVisualizationProps {
  timeSeriesData: TimeSeriesData[];
  project?: Project;
  // emissionsData: EmissionsData[];
}

const DataVisualization: React.FC<DataVisualizationProps> = ({
  timeSeriesData,
  project,
  // emissionsData
}) => {
  const [activeTab, setActiveTab] = useState<string>("deforestation");
  const { fadeForestLoss1Layer } = useMap();
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);
  
  // --- Unit adjustment logic ---
  const getYAxisUnit = (data: TimeSeriesData[]) => {
    const max = Math.max(...data.map(d => d.deforestation_area || 0));
    if (max >= 1_000_000) return { unit: 'millions', divisor: 1_000_000, label: 'Forest Loss (millions m²)' };
    if (max >= 1_000) return { unit: 'thousands', divisor: 1_000, label: 'Forest Loss (thousands m²)' };
    return { unit: 'm²', divisor: 1, label: 'Forest Loss (m²)' };
  };
  const yAxisUnit = useMemo(() => getYAxisUnit(timeSeriesData), [timeSeriesData]);
  const transformedData = useMemo(() => {
    return timeSeriesData.map(d => ({
      ...d,
      deforestation_area_display: d.deforestation_area / yAxisUnit.divisor
    }));
  }, [timeSeriesData, yAxisUnit]);

  // Extract project start year for reference line
  const projectStartYear = useMemo(() => {
    if (project?.start_date) {
      try {
        return new Date(project.start_date).getFullYear().toString();
      } catch (error) {
        console.error('Error parsing project start date:', error);
        return null;
      }
    }
    return null;
  }, [project]);

  useEffect(() => {
    if (timeSeriesData && timeSeriesData.length > 0) {
      // console.log("First data point:", timeSeriesData[0]);
      // console.log("Data keys:", Object.keys(timeSeriesData[0]));
    } else {
      console.log("No time series data available or empty array");
    }
  }, [timeSeriesData]);
  
  const CustomTooltip = ({ active, payload, label, dataType, unit, divisor }: any) => {
    if (!active || !payload || !payload.length) {
      // console.log("Tooltip not showing. Payload:", payload);
      return null;
    }
    let value = payload[0].value;
    let display = value.toLocaleString('en-US', { maximumFractionDigits: 2 });
    let suffix = '';
    if (unit === 'millions') suffix = ' million';
    else if (unit === 'thousands') suffix = ' thousand';
    return (
      <div className="bg-white p-3 rounded-md shadow-lg border border-border">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-sm text-primary">
          {dataType === "deforestation" 
            ? `${display}${suffix} square meters (m²)` 
            : `${payload[0].value.toLocaleString()} tonnes CO₂e`}
        </p>
      </div>
    );
  };
  
  // Yearly color palette for bars (2001-2023)
  const BAR_PALETTE = [
    '#880000', '#990000', '#AA0000', '#BB0000', '#CC0000', '#DD0000', '#EE0000', '#FF0000',
    '#FF1100', '#FF2200', '#FF3300', '#FF4400', '#FF5500', '#FF6600', '#FF7700',
    '#FF8800', '#FF9900', '#FFAA00', '#FFBB00', '#FFCC33', '#FFDD66', '#FFEE99', '#FFFFCC'
  ];

  // Assign color to each year from 2001 to 2023
  const yearToColor: Record<string, string> = {};
  for (let i = 0; i < 23; i++) {
    const year = (2001 + i).toString();
    yearToColor[year] = BAR_PALETTE[i];
  }

  const coloredData = useMemo(() => {
    return transformedData.map((d, index) => ({
      ...d,
      barColor: hoveredBarIndex === index 
        ? yearToColor[d.timestamp] || '#3b82f6' 
        : '#727272'
    }));
  }, [transformedData, hoveredBarIndex, yearToColor]);

  return (
    <Card className="glass-card overflow-hidden animate-fade-in">
      <div className="bg-gradient-to-r from-primary/20 to-primary/5 h-2"></div>
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-semibold flex items-center">
          <BarChart4 className="h-5 w-5 mr-2 text-primary" />
          Data Insight: Forest Loss (Yearly) 2001-2023
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
              Forest Loss
            </TabsTrigger>
            {/* <TabsTrigger value="emissions">
              <svg className="h-4 w-4 mr-2 inline" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 16C8.7 16 6 13.3 6 10H4C4 14.4 7.6 18 12 18C16.4 18 20 14.4 20 10H18C18 13.3 15.3 16 12 16Z" fill="currentColor"/>
                <path d="M12 4C14.2 4 16 5.8 16 8H18C18 4.7 15.3 2 12 2C8.7 2 6 4.7 6 8H8C8 5.8 9.8 4 12 4Z" fill="currentColor"/>
              </svg>
              Emissions
            </TabsTrigger> */}
          </TabsList>
          
          <TabsContent 
            value="deforestation" 
            className="space-y-4"
            onMouseEnter={() => fadeForestLoss1Layer(true)}
            onMouseLeave={() => fadeForestLoss1Layer(false)}
          >
            <div className="text-sm text-muted-foreground">
              <p>View more data in the map!</p>
            </div>

            <div className="h-80">
              {transformedData.length === 0 && (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  No deforestation data available
                </div>
              )}
              {transformedData.length > 0 && (
                <>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={transformedData}
                      margin={{ top: 10, right: 10, left: 20, bottom: 20 }}
                      barSize={20}
                      onMouseMove={(data) => {
                        if (data && data.activeTooltipIndex !== undefined) {
                          setHoveredBarIndex(data.activeTooltipIndex);
                        }
                      }}
                      onMouseLeave={() => {
                        setHoveredBarIndex(null);
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis 
                        dataKey="timestamp" 
                        label={{ value: 'Year', position: 'insideBottom', offset: -15 }}
                      />
                      <YAxis 
                        label={{ 
                          value: yAxisUnit.label, 
                          angle: -90, 
                          position: 'insideLeft',
                          style: { textAnchor: 'middle' }
                        }}
                        tickFormatter={value => value.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                        domain={[0, 'auto']}
                      />
                      <Tooltip content={<CustomTooltip dataType="deforestation" unit={yAxisUnit.unit} divisor={yAxisUnit.divisor} />} />
                      <Legend verticalAlign="top" height={36} />
                      
                      {/* Project start date reference line */}
                      {projectStartYear && (
                        <ReferenceLine 
                          x={projectStartYear} 
                          stroke="#0ea5e9" 
                          strokeWidth={2} 
                          strokeDasharray="5 5"
                          label={{ 
                            value: 'Project Start', 
                            position: 'top', 
                            fill: '#0ea5e9',
                            fontSize: 12
                          }}
                        />
                      )}
                      
                      <Bar
                        dataKey="deforestation_area_display"
                        name={yAxisUnit.label}
                        isAnimationActive={true}
                      >
                        {coloredData.map((entry, idx) => (
                          <Cell key={`cell-${entry.timestamp}`} fill={entry.barColor} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </>
              )}
            </div>
            
            <div className="text-sm text-muted-foreground">
              <p>This chart shows the annual forest lost at 10m resolution with 10km buffer around the project area from 2001 to 2023.</p>
              <p className="mt-2">The data is derived from satellite imagery analysis using the Global Forest Change dataset. Hover over the chart to highlight corresponding areas on the map, revealing forest loss patterns in relation to the project boundaries.</p>
              <p className="mt-2">Forest loss is shown in square meters and is color-coded by year, with brighter colors representing more recent deforestation events.</p>
              {projectStartYear && (
                <p className="mt-2 text-sky-600 font-medium">The vertical dashed line marks the project's crediting start date ({projectStartYear}).</p>
              )}
            </div>

            <div className="flex flex-wrap gap-1 mb-2">
              {Object.entries(yearToColor).map(([year, color]) => 
                  <div key={year} className="flex flex-col items-center mr-3 mb-2">
                    <div 
                      className="w-4 h-4 rounded-sm mb-1" 
                      style={{ backgroundColor: color }}
                    ></div>
                    <span className="text-xs">{year}</span>
                  </div>
              )}
            </div>
          </TabsContent>
          
          {/* if another plot! */}
          {/* <TabsContent value="emissions" className="space-y-4">
            <div className="h-80">
              {transformedData.length === 0 && (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  No emissions data available
                </div>
              )}
              {transformedData.length > 0 && (
                <>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={transformedData}
                      margin={{ top: 10, right: 10, left: 20, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis 
                        dataKey="timestamp" 
                        label={{ value: 'Year', position: 'insideBottom', offset: -15 }}
                      />
                      <YAxis 
                        label={{ 
                          value: yAxisUnit.label, 
                          angle: -90, 
                          position: 'insideLeft',
                          style: { textAnchor: 'middle' }
                        }}
                        tickFormatter={value => value.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                        domain={[0, 'auto']}
                      />
                      <Tooltip content={<CustomTooltip dataType="emissions" unit={yAxisUnit.unit} divisor={yAxisUnit.divisor} />} />
                      <Legend verticalAlign="top" height={36} />
                      <Line 
                        type="monotone" 
                        dataKey="deforestation_area_display" 
                        name={yAxisUnit.label} 
                        stroke="#3b82f6" 
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2, fill: 'white' }}
                        animationDuration={1500}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </>
              )}
            </div>
            
            <div className="text-sm text-muted-foreground">
              <p>This chart shows the forest loss trend over time within a 10km buffer around the project area.</p>
            </div>
          </TabsContent> */}

        </Tabs>
      </CardContent>
    </Card>
  );
};

export default DataVisualization;
