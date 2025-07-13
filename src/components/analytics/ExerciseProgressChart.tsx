import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

interface ExerciseProgressionData {
  date: string;
  sessionId: string;
  actualSets: number;
  averageReps: number;
  averageWeight: number;
  totalVolume: number;
  averageDuration?: number;
  isDurationBased?: boolean;
}

interface ExerciseProgressChartProps {
  data: ExerciseProgressionData[];
  exerciseName?: string;
  loading?: boolean;
  height?: number;
}

type MetricType = 'reps' | 'duration' | 'weight' | 'volume';

// Helper function to format duration
const formatDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  }
  return `${remainingSeconds}s`;
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const isDurationBased = data.isDurationBased;
    
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
        {isDurationBased ? (
          <>
            <p className="text-sm">
              <span className="font-medium text-blue-600">Avg Duration:</span> {formatDuration(data.averageDuration || 0)}
            </p>
            <p className="text-sm">
              <span className="font-medium text-green-600">Avg Weight:</span> {data.averageWeight} kg
            </p>
            <p className="text-sm">
              <span className="font-medium text-purple-600">Volume:</span> {data.totalVolume} kg⋅s
            </p>
          </>
        ) : (
          <>
            <p className="text-sm">
              <span className="font-medium text-blue-600">Avg Reps:</span> {data.averageReps}
            </p>
            <p className="text-sm">
              <span className="font-medium text-green-600">Avg Weight:</span> {data.averageWeight} kg
            </p>
            <p className="text-sm">
              <span className="font-medium text-purple-600">Volume:</span> {data.totalVolume} kg
            </p>
          </>
        )}
        <p className="text-sm">
          <span className="font-medium text-gray-600">Sets:</span> {data.actualSets}
        </p>
      </div>
    );
  }
  return null;
};

export const ExerciseProgressChart: React.FC<ExerciseProgressChartProps> = ({
  data,
  exerciseName = 'Exercise',
  loading = false,
  height = 350
}) => {
  // Determine if this is a duration-based exercise
  const isDurationBased = data.length > 0 && data[0].isDurationBased;
  
  // Set default metrics based on exercise type
  const [selectedMetrics, setSelectedMetrics] = useState<MetricType[]>(
    isDurationBased ? ['duration', 'weight'] : ['reps', 'weight']
  );
  
  // Update selected metrics when exercise type changes
  useEffect(() => {
    if (isDurationBased && !selectedMetrics.includes('duration')) {
      setSelectedMetrics(['duration', 'weight']);
    } else if (!isDurationBased && !selectedMetrics.includes('reps')) {
      setSelectedMetrics(['reps', 'weight']);
    }
  }, [isDurationBased]);

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
        <div className="text-gray-400 text-4xl mb-2">💪</div>
        <p className="text-gray-600">No progress data available</p>
        <p className="text-sm text-gray-500">
          Complete workouts with this exercise to track progress!
        </p>
      </div>
    );
  }

  const toggleMetric = (metric: MetricType) => {
    setSelectedMetrics(prev => 
      prev.includes(metric) 
        ? prev.filter(m => m !== metric)
        : [...prev, metric]
    );
  };

  // Format data for chart
  const chartData = data.map(item => ({
    ...item,
    formattedDate: new Date(item.date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }));

  // Calculate trends
  const firstSession = data[0];
  const lastSession = data[data.length - 1];
  const repsChange = lastSession.averageReps - firstSession.averageReps;
  const durationChange = (lastSession.averageDuration || 0) - (firstSession.averageDuration || 0);
  const weightChange = lastSession.averageWeight - firstSession.averageWeight;
  const volumeChange = lastSession.totalVolume - firstSession.totalVolume;

  return (
    <div className="w-full">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {exerciseName} Progress
        </h3>
        
        {/* Metric Toggles */}
        <div className="flex flex-wrap gap-2 mb-3">
          {/* Show Reps button only for rep-based exercises */}
          {!isDurationBased && (
            <button
              onClick={() => toggleMetric('reps')}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                selectedMetrics.includes('reps')
                  ? 'bg-blue-100 text-blue-800 border border-blue-300'
                  : 'bg-gray-100 text-gray-600 border border-gray-300'
              }`}
            >
              Reps
            </button>
          )}
          
          {/* Show Duration button only for duration-based exercises */}
          {isDurationBased && (
            <button
              onClick={() => toggleMetric('duration')}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                selectedMetrics.includes('duration')
                  ? 'bg-blue-100 text-blue-800 border border-blue-300'
                  : 'bg-gray-100 text-gray-600 border border-gray-300'
              }`}
            >
              Duration
            </button>
          )}
          
          <button
            onClick={() => toggleMetric('weight')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              selectedMetrics.includes('weight')
                ? 'bg-green-100 text-green-800 border border-green-300'
                : 'bg-gray-100 text-gray-600 border border-gray-300'
            }`}
          >
            Weight
          </button>
          <button
            onClick={() => toggleMetric('volume')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              selectedMetrics.includes('volume')
                ? 'bg-purple-100 text-purple-800 border border-purple-300'
                : 'bg-gray-100 text-gray-600 border border-gray-300'
            }`}
          >
            Volume
          </button>
        </div>
      </div>

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
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          
          {selectedMetrics.includes('reps') && !isDurationBased && (
            <Line
              type="monotone"
              dataKey="averageReps"
              stroke="#3b82f6"
              strokeWidth={2}
              name="Avg Reps"
              dot={{ fill: '#3b82f6', strokeWidth: 2, r: 3 }}
              activeDot={{ r: 5, stroke: '#3b82f6', strokeWidth: 2, fill: '#fff' }}
            />
          )}
          
          {selectedMetrics.includes('duration') && isDurationBased && (
            <Line
              type="monotone"
              dataKey="averageDuration"
              stroke="#3b82f6"
              strokeWidth={2}
              name="Avg Duration (s)"
              dot={{ fill: '#3b82f6', strokeWidth: 2, r: 3 }}
              activeDot={{ r: 5, stroke: '#3b82f6', strokeWidth: 2, fill: '#fff' }}
            />
          )}
          
          {selectedMetrics.includes('weight') && (
            <Line
              type="monotone"
              dataKey="averageWeight"
              stroke="#10b981"
              strokeWidth={2}
              name="Avg Weight (kg)"
              dot={{ fill: '#10b981', strokeWidth: 2, r: 3 }}
              activeDot={{ r: 5, stroke: '#10b981', strokeWidth: 2, fill: '#fff' }}
            />
          )}
          
          {selectedMetrics.includes('volume') && (
            <Line
              type="monotone"
              dataKey="totalVolume"
              stroke="#8b5cf6"
              strokeWidth={2}
              name="Volume (kg)"
              dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 3 }}
              activeDot={{ r: 5, stroke: '#8b5cf6', strokeWidth: 2, fill: '#fff' }}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
      
      {/* Progress summary */}
      {data.length > 1 && (
        <div className="mt-4 grid grid-cols-3 gap-4 text-center">
          <div className="bg-blue-50 rounded-lg p-3">
            {isDurationBased ? (
              <>
                <div className="text-sm text-blue-600 font-medium">Duration Change</div>
                <div className={`text-lg font-bold ${durationChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {durationChange >= 0 ? '+' : ''}{durationChange.toFixed(1)}s
                </div>
              </>
            ) : (
              <>
                <div className="text-sm text-blue-600 font-medium">Reps Change</div>
                <div className={`text-lg font-bold ${repsChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {repsChange >= 0 ? '+' : ''}{repsChange.toFixed(1)}
                </div>
              </>
            )}
          </div>
          <div className="bg-green-50 rounded-lg p-3">
            <div className="text-sm text-green-600 font-medium">Weight Change</div>
            <div className={`text-lg font-bold ${weightChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {weightChange >= 0 ? '+' : ''}{weightChange.toFixed(1)} kg
            </div>
          </div>
          <div className="bg-purple-50 rounded-lg p-3">
            <div className="text-sm text-purple-600 font-medium">Volume Change</div>
            <div className={`text-lg font-bold ${volumeChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {volumeChange >= 0 ? '+' : ''}{volumeChange}{isDurationBased ? ' kg⋅s' : ' kg'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};