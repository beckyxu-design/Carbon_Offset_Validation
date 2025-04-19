import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { BarChartIcon } from 'lucide-react';

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
  bare: '#d9b382',           // Light brown
  built: '#a0a0a0',          // Gray
  crops: '#f0e68c',          // Khaki
  flooded_vegetation: '#6b8e23', // Olive Drab
  grass: '#90ee90',          // Light Green
  shrub_and_scrub: '#9acd32', // Yellow Green
  snow_and_ice: '#e0ffff',   // Light Cyan
  trees: '#228b22',          // Forest Green
  water: '#1e90ff'           // Dodger Blue
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
};

const LanduseTimeSeriesChart: React.FC<LanduseTimeSeriesChartProps> = ({ data }) => {
  // Format data for the chart
  const formattedData = data.map(item => ({
    ...item,
    month: formatDate(item.month)
  }));

  return (
    <Card className="glass-card overflow-hidden animate-fade-in">
      <div className="bg-gradient-to-r from-primary/20 to-primary/5 h-2"></div>
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-semibold flex items-center">
          <BarChartIcon className="h-5 w-5 mr-2 text-primary" />
          Land Use Time Series
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={formattedData}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="month" 
                label={{ value: 'Date', position: 'insideBottomRight', offset: -10 }} 
              />
              <YAxis 
                label={{ value: 'Area (hectares)', angle: -90, position: 'insideLeft' }} 
              />
              <Tooltip formatter={(value) => [`${Number(value).toFixed(2)} hectares`, '']} />
              <Legend />
              
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
      </CardContent>
    </Card>
  );
};

export default LanduseTimeSeriesChart;
