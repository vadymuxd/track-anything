import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface CustomBarChartProps {
  data: Array<{ date: string; value: number }>;
  yAxisLabel: string;
  dataKey?: string;
  fill?: string;
}

export const CustomBarChart = ({ 
  data, 
  yAxisLabel,
  dataKey = 'value',
  fill = 'hsl(var(--foreground))'
}: CustomBarChartProps) => {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <RechartsBarChart data={data}>
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
        <Bar dataKey={dataKey} fill={fill} />
      </RechartsBarChart>
    </ResponsiveContainer>
  );
};
