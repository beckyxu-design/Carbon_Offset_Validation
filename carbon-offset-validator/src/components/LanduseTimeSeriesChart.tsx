import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { BarChartIcon, ChartAreaIcon, PieChartIcon } from 'lucide-react';
import { TooltipProps } from 'recharts';

interface LanduseTimeSeriesData {
  month: string;
  bare: number;
  built: number;
  crops: number;
  flooded_vegetation: number;
  grass: number;
  shrub_and_scrub: number;
  snow_and_ice: number;
  trees: number;
  water: number;
}

interface LanduseTimeSeriesChartProps {
  data: LanduseTimeSeriesData[];
}

// Color palette for different land use types
const COLORS = {
  bare: '#a59b8f',           // Light brown
  built: '#c4281b',          // Gray
  crops: '#e49635',          // Khaki
  flooded_vegetation: '#7a87c6', // Olive Drab
  grass: '#88b053',          // Light Green
  shrub_and_scrub: '#dfc35a', // Yellow Green
  snow_and_ice: '#b39fe1',   // Light Cyan
  trees: '#397d49',          // Forest Green
  water: '#419bdf'           // Dodger Blue
};

const FEATURE_LABELS: Record<string, string> = {
  bare: 'Bare Land',
  built: 'Built-up Area',
  crops: 'Cropland',
  flooded_vegetation: 'Flooded Vegetation',
  grass: 'Grassland',
  shrub_and_scrub: 'Shrub and Scrub',
  snow_and_ice: 'Snow and Ice',
  trees: 'Forest',
  water: 'Water',
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
};

// Utility to convert hex to rgba
function hexToRgba(hex: string, alpha: number) {
  let c = hex.replace('#', '');
  if (c.length === 3) {
    c = c.split('').map((x) => x + x).join('');
  }
  const num = parseInt(c, 16);
  return `rgba(${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}, ${alpha})`;
}

const LanduseTimeSeriesChart: React.FC<LanduseTimeSeriesChartProps> = ({ data }) => {
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const chartRef = useRef<HTMLDivElement>(null);
  
  // Set up Intersection Observer to detect when chart is visible
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        // When the chart becomes visible, set isVisible to true
        if (entry.isIntersecting) {
          setIsVisible(true);
          // Once we've seen it, no need to keep observing
          if (chartRef.current) {
            observer.unobserve(chartRef.current);
          }
        }
      },
      {
        // Start rendering slightly before it comes into view
        rootMargin: '200px 0px',
        threshold: 0.1 // Trigger when at least 10% of the element is visible
      }
    );

    if (chartRef.current) {
      observer.observe(chartRef.current);
    }

    return () => {
      if (chartRef.current) {
        observer.unobserve(chartRef.current);
      }
    };
  }, []);
  
  // --- Unit adjustment logic ---
  const getYAxisUnit = (data: LanduseTimeSeriesData[]) => {
    // Find the max value across all land use types
    const max = Math.max(
      ...data.flatMap(d => [d.bare, d.built, d.crops, d.flooded_vegetation, d.grass, d.shrub_and_scrub, d.snow_and_ice, d.trees, d.water])
    );
    if (max >= 1_000_000) return { unit: 'millions', divisor: 1_000_000, label: 'Area (millions of m²)' };
    if (max >= 1_000) return { unit: 'thousands', divisor: 1_000, label: 'Area (thousands of m²)' };
    return { unit: 'm²', divisor: 1, label: 'Area (m²)' };
  };
  const yAxisUnit = useMemo(() => getYAxisUnit(data), [data]);
  // Format data for the chart
  const formattedData = useMemo(() => data.map(item => ({
    ...item,
    month: formatDate(item.month),
    bare: item.bare / yAxisUnit.divisor,
    built: item.built / yAxisUnit.divisor,
    crops: item.crops / yAxisUnit.divisor,
    flooded_vegetation: item.flooded_vegetation / yAxisUnit.divisor,
    grass: item.grass / yAxisUnit.divisor,
    shrub_and_scrub: item.shrub_and_scrub / yAxisUnit.divisor,
    snow_and_ice: item.snow_and_ice / yAxisUnit.divisor,
    trees: item.trees / yAxisUnit.divisor,
    water: item.water / yAxisUnit.divisor
  })), [data, yAxisUnit]);

  // Track hovered month for pie chart
  const [hoveredMonth, setHoveredMonth] = useState<string | null>(null);

  // Get the raw (unscaled) data for pie chart
  const rawDataByMonth = useMemo(() => {
    const map: Record<string, LanduseTimeSeriesData> = {};
    data.forEach(item => {
      map[formatDate(item.month)] = item;
    });
    return map;
  }, [data]);

  // Pick the data for the hovered month or the last month
  const pieChartData = useMemo(() => {
    let entry: LanduseTimeSeriesData | undefined;
    if (hoveredMonth && rawDataByMonth[hoveredMonth]) {
      entry = rawDataByMonth[hoveredMonth];
    } else if (data.length > 0) {
      entry = data[data.length - 1];
    }
    if (!entry) return [];
    return [
      { name: 'Bare Land', value: entry.bare, color: COLORS.bare },
      { name: 'Built-up Area', value: entry.built, color: COLORS.built },
      { name: 'Cropland', value: entry.crops, color: COLORS.crops },
      { name: 'Flooded Vegetation', value: entry.flooded_vegetation, color: COLORS.flooded_vegetation },
      { name: 'Grassland', value: entry.grass, color: COLORS.grass },
      { name: 'Shrub and Scrub', value: entry.shrub_and_scrub, color: COLORS.shrub_and_scrub },
      { name: 'Snow and Ice', value: entry.snow_and_ice, color: COLORS.snow_and_ice },
      { name: 'Forest', value: entry.trees, color: COLORS.trees },
      { name: 'Water', value: entry.water, color: COLORS.water }
    ].filter(item => item.value > 0).sort((a, b) => b.value - a.value);
  }, [hoveredMonth, rawDataByMonth, data]);

  // Calculate total area for percentage calculation
  const totalArea = useMemo(() => {
    return pieChartData.reduce((sum, item) => sum + item.value, 0);
  }, [pieChartData]);

  // Custom tooltip for area chart
  const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      // Set the hovered month for the pie chart
      if (label && label !== hoveredMonth) {
        setHoveredMonth(label);
      }

      // Create a reversed copy of the payload array
      const reversedPayload = [...payload].reverse();

      return (
        <div className="bg-white p-3 rounded-md shadow-lg border border-border">
          <p className="text-sm font-medium">{label}</p>
          <div className="space-y-1 mt-1">
            {reversedPayload.map((entry, index) => {
              if (entry.value === 0) return null;
              const dataKey = entry.dataKey as string;
              const label = FEATURE_LABELS[dataKey] || dataKey;
              return (
                <div key={`item-${index}`} className="flex items-center text-xs">
                  <div 
                    className="w-3 h-3 mr-2 flex-shrink-0" 
                    style={{ backgroundColor: entry.color as string }}
                  ></div>
                  <span className="truncate">{label}:</span>
                  <span className="ml-1 font-medium">
                    {entry.value.toLocaleString()} {yAxisUnit.unit}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom tooltip for pie chart
  const PieTooltip = ({ active, payload }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const percentage = ((data.value / totalArea) * 100).toFixed(1);
      return (
        <div className="bg-white p-3 rounded-md shadow-lg border border-border">
          <p className="text-sm font-medium">{data.name}</p>
          <p className="text-xs">
            <span className="font-medium">{data.value.toLocaleString()}</span> m²
            <span className="ml-2">({percentage}%)</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="glass-card overflow-hidden animate-fade-in" ref={chartRef}>
      <div className="bg-gradient-to-r from-primary/20 to-primary/5 h-2"></div>
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-semibold flex items-center">
          <ChartAreaIcon className="h-5 w-5 mr-2 text-primary" />
          Land Use Composition (2017-2023)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!isVisible && (
          <div className="flex items-center justify-center h-80 text-muted-foreground">
            Chart loading...
          </div>
        )}
        
        {isVisible && (
          <>
            <div className="h-80 mb-6">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={formattedData}
                  margin={{ top: 10, right: 10, left: 20, bottom: 20 }}
                  onMouseLeave={() => setHoveredMonth(null)}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis 
                    dataKey="month" 
                    label={{ value: 'Month', position: 'insideBottom', offset: -15 }}
                  />
                  <YAxis 
                    label={{ 
                      value: yAxisUnit.label, 
                      angle: -90, 
                      position: 'insideLeft',
                      style: { textAnchor: 'middle' }
                    }}
                    tickFormatter={value => value.toLocaleString()}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  {/* <Legend 
                    verticalAlign="bottom" 
                    height={36} 
                    wrapperStyle={{ 
                      paddingTop: '20px',
                      marginTop: '10px',
                      bottom: 0
                    }}
                  /> */}
                  <Area 
                    type="monotone" 
                    dataKey="bare" 
                    stackId="1" 
                    stroke={COLORS.bare} 
                    fill={COLORS.bare} 
                    name="Bare Land"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="built" 
                    stackId="1" 
                    stroke={COLORS.built} 
                    fill={COLORS.built} 
                    name="Built-up Area"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="crops" 
                    stackId="1" 
                    stroke={COLORS.crops} 
                    fill={COLORS.crops} 
                    name="Cropland"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="flooded_vegetation" 
                    stackId="1" 
                    stroke={COLORS.flooded_vegetation} 
                    fill={COLORS.flooded_vegetation} 
                    name="Flooded Vegetation"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="grass" 
                    stackId="1" 
                    stroke={COLORS.grass} 
                    fill={COLORS.grass} 
                    name="Grassland"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="shrub_and_scrub" 
                    stackId="1" 
                    stroke={COLORS.shrub_and_scrub} 
                    fill={COLORS.shrub_and_scrub} 
                    name="Shrub and Scrub"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="snow_and_ice" 
                    stackId="1" 
                    stroke={COLORS.snow_and_ice} 
                    fill={COLORS.snow_and_ice} 
                    name="Snow and Ice"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="trees" 
                    stackId="1" 
                    stroke={COLORS.trees} 
                    fill={COLORS.trees} 
                    name="Forest"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="water" 
                    stackId="1" 
                    stroke={COLORS.water} 
                    fill={COLORS.water} 
                    name="Water"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="flex flex-col md:flex-row items-center gap-4">
              <div className="w-full md:w-1/2 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      animationDuration={500}
                      // label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<PieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              <div className="w-full md:w-1/2">
                <h3 className="text-sm font-medium mb-2 flex items-center">
                  <PieChartIcon className="h-4 w-4 mr-1" />
                  {hoveredMonth ? `Land Use Composition (${hoveredMonth})` : 'Current Land Use Composition'}
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {pieChartData.map((entry, index) => (
                    <div key={index} className="flex items-center text-sm">
                      <div 
                        className="w-3 h-3 mr-2 flex-shrink-0" 
                        style={{ backgroundColor: entry.color }}
                      ></div>
                      <span className="truncate">{entry.name}:</span>
                      <span className="ml-1 font-medium">
                        {((entry.value / totalArea) * 100).toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="text-sm text-muted-foreground mt-4">
              <p>This chart shows the land use composition over time within the project area. Hover over the area chart to see detailed breakdowns for specific months.</p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default LanduseTimeSeriesChart;
