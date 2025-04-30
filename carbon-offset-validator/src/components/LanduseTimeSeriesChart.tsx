import React, { useMemo } from 'react';
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
import { BarChartIcon, PieChartIcon } from 'lucide-react';
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

const LanduseTimeSeriesChart: React.FC<LanduseTimeSeriesChartProps> = ({ data }) => {
  // --- Unit adjustment logic ---
  const getYAxisUnit = (data: LanduseTimeSeriesData[]) => {
    // Find the max value across all land use types
    const max = Math.max(
      ...data.flatMap(d => [d.bare, d.built, d.crops, d.flooded_vegetation, d.grass, d.shrub_and_scrub, d.snow_and_ice, d.trees, d.water])
    );
    if (max >= 1_000_000) return { unit: 'millions', divisor: 1_000_000, label: 'Area (millions of square meters (m²))' };
    if (max >= 1_000) return { unit: 'thousands', divisor: 1_000, label: 'Area (thousands of square meters (m²))' };
    return { unit: 'square meters (m²)', divisor: 1, label: 'Area (square meters (m²))' };
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

  // Calculate the most recent data for the pie chart (last entry)
  const pieChartData = useMemo(() => {
    if (data.length === 0) return [];
    
    const lastEntry = data[data.length - 1];
    return [
      { name: 'Bare Land', value: lastEntry.bare, color: COLORS.bare },
      { name: 'Built-up Area', value: lastEntry.built, color: COLORS.built },
      { name: 'Cropland', value: lastEntry.crops, color: COLORS.crops },
      { name: 'Flooded Vegetation', value: lastEntry.flooded_vegetation, color: COLORS.flooded_vegetation },
      { name: 'Grassland', value: lastEntry.grass, color: COLORS.grass },
      { name: 'Shrub and Scrub', value: lastEntry.shrub_and_scrub, color: COLORS.shrub_and_scrub },
      { name: 'Snow and Ice', value: lastEntry.snow_and_ice, color: COLORS.snow_and_ice },
      { name: 'Forest', value: lastEntry.trees, color: COLORS.trees },
      // { name: 'Water', value: lastEntry.water, color: COLORS.water }
    ].filter(item => item.value > 0); // Only include items with values > 0
  }, [data]);

  return (
    <Card className="glass-card overflow-hidden animate-fade-in h-auto">
      <div className="bg-gradient-to-r from-primary/20 to-primary/5 h-2"></div>
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-semibold flex items-center">
          <BarChartIcon className="h-5 w-5 mr-2 text-primary" />
          Time Series: Land Use Change
        </CardTitle>
      </CardHeader>
      <CardContent> {/* text box for explanations */}
        <div className="text-sm text-muted-foreground mt-2">
          <p>
            Land use change of the project surrounding overtime. More stable land use pattern generally means a more stable carbon sink.
          </p>
        </div>
      </CardContent>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <div className="h-[420px] mb-3">
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
                    label={{ value: yAxisUnit.label, angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }} 
                    tickFormatter={value => value.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                  />
                  <Tooltip 
                    content={(props: TooltipProps<any, string>) => {
                      if (!props.active || !props.payload || !props.payload.length) return null;
                      // Reverse the order of payload so Water is at the top
                      const reversed = [...props.payload].reverse();
                      return (
                        <div className="bg-white p-3 rounded-md shadow-lg border border-border">
                          <p className="text-sm font-medium mb-1">{props.label}</p>
                          {reversed.map((entry, i) => {
                            let display = Number(entry.value).toLocaleString('en-US', { maximumFractionDigits: 2 });
                            let suffix = '';
                            if (yAxisUnit.unit === 'millions') suffix = ' million';
                            else if (yAxisUnit.unit === 'thousands') suffix = ' thousand';
                            const label = FEATURE_LABELS[entry.name as string] || entry.name;
                            return (
                              <div key={i} className="flex items-center gap-2 text-xs">
                                <span style={{ color: entry.color, width: 12, display: 'inline-block' }}>●</span>
                                <span>{label}: {display}{suffix} square meters (m²)</span>
                              </div>
                            );
                          })}
                        </div>
                      );
                    }}
                  />
                  <Legend />
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
                  {/* <Area 
                    type="monotone" 
                    dataKey="water" 
                    stackId="1" 
                    stroke={COLORS.water} 
                    fill={COLORS.water} 
                    name="Water"
                  /> */}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div>
            <div className="h-[420px] mb-3">
              <div className="text-center mb-2">
                <PieChartIcon className="h-5 w-5 inline-block mr-2 text-primary" />
                <span className="text-lg font-medium">Current Land Use Distribution</span>
              </div>
              <ResponsiveContainer width="100%" height="85%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    fill="#8884d8"
                    label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                    labelLine={true}
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => {
                      let display = Number(value).toLocaleString('en-US', { maximumFractionDigits: 2 });
                      let suffix = '';
                      if (yAxisUnit.unit === 'millions') suffix = ' million';
                      else if (yAxisUnit.unit === 'thousands') suffix = ' thousand';
                      return [display + suffix + ' m²', 'Area'];
                    }}
                  />
                  <Legend layout="horizontal" align="right" verticalAlign="bottom" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </CardContent>
      <CardContent> {/* text box for explanations */}
        <div className="text-sm text-muted-foreground mt-2">
          <p>
            This chart shows the monthly land use change 10km buffer around the project area from 2001 to 2023. 
          </p>
          <p className="mt-1">The data is retrieved from Dynamic World</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default LanduseTimeSeriesChart;
