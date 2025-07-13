import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { formatDuration } from '@/utils/analyticsUtils';

interface WorkoutDurationData {
  date: string;
  duration: number;
  sessionId: string;
  title: string;
}

interface WorkoutDurationChartProps {
  data: WorkoutDurationData[];
  loading?: boolean;
  height?: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    
    // Use the original date from data instead of the formatted label
    const displayDate = new Date(data.date).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
    
    return (
      <div className="bg-white p-3 border border-gray-300 rounded-lg shadow-lg">
        <p className="text-sm text-gray-600 font-medium">{displayDate}</p>
        <p className="font-semibold text-blue-600">
          Duration: {formatDuration(data.duration)}
        </p>
        <p className="text-sm text-gray-700">Workout: {data.title}</p>
      </div>
    );
  }
  return null;
};

export const WorkoutDurationChart: React.FC<WorkoutDurationChartProps> = ({
  data,
  loading = false,
  height = 300
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center" style={{ height }}>
        <div className="text-gray-400 text-4xl mb-2">📊</div>
        <p className="text-gray-600">No workout data available</p>
        <p className="text-sm text-gray-500">Complete some workouts to see your progress!</p>
      </div>
    );
  }

  // Calculate average duration for reference line
  const averageDuration = data.reduce((sum, item) => sum + item.duration, 0) / data.length;

  // Format data for chart (convert seconds to minutes for better readability)
  const chartData = data.map(item => ({
    ...item,
    durationMinutes: Math.round(item.duration / 60),
    formattedDate: new Date(item.date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }));

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="formattedDate" 
            stroke="#666"
            fontSize={12}
            tick={{ fill: '#666' }}
          />
          <YAxis 
            stroke="#666"
            fontSize={12}
            tick={{ fill: '#666' }}
            label={{ value: 'Duration (min)', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine 
            y={Math.round(averageDuration / 60)} 
            stroke="#fbbf24" 
            strokeDasharray="5 5"
            label={{ value: "Avg", position: "topRight", fill: "#fbbf24" }}
          />
          <Line
            type="monotone"
            dataKey="durationMinutes"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2, fill: '#fff' }}
          />
        </LineChart>
      </ResponsiveContainer>
      
      {/* Summary stats */}
      <div className="mt-4 grid grid-cols-3 gap-4 text-center">
        <div className="bg-blue-50 rounded-lg p-3">
          <div className="text-sm text-blue-600 font-medium">Total Workouts</div>
          <div className="text-lg font-bold text-blue-800">{data.length}</div>
        </div>
        <div className="bg-green-50 rounded-lg p-3">
          <div className="text-sm text-green-600 font-medium">Avg Duration</div>
          <div className="text-lg font-bold text-green-800">{formatDuration(averageDuration)}</div>
        </div>
        <div className="bg-purple-50 rounded-lg p-3">
          <div className="text-sm text-purple-600 font-medium">Longest</div>
          <div className="text-lg font-bold text-purple-800">
            {formatDuration(Math.max(...data.map(d => d.duration)))}
          </div>
        </div>
      </div>
    </div>
  );
};