import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface CustomLineChartProps {
  data: Array<{ date: string; value: number }>;
  yAxisLabel: string;
  dataKey?: string;
  stroke?: string;
  strokeWidth?: number;
}

export const CustomLineChart = ({ 
  data, 
  yAxisLabel,
  dataKey = 'value',
  stroke = 'hsl(var(--foreground))',
  strokeWidth = 2
}: CustomLineChartProps) => {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <RechartsLineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis dataKey="date" stroke="hsl(var(--foreground))" fontSize={12} />
        <YAxis 
          label={{ value: yAxisLabel, angle: -90, position: 'insideLeft' }} 
          stroke="hsl(var(--foreground))" 
          fontSize={12} 
        />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: 'hsl(var(--card))', 
            border: '1px solid hsl(var(--border))', 
            borderRadius: '0.5rem' 
          }} 
        />
        <Line 
          type="monotone" 
          dataKey={dataKey} 
          stroke={stroke} 
          strokeWidth={strokeWidth} 
          dot={{ fill: stroke }} 
        />
      </RechartsLineChart>
    </ResponsiveContainer>
  );
};
