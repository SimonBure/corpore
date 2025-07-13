import { NextResponse } from 'next/server';
import { getExerciseProgressionData, type DateRange } from '@/utils/analyticsUtils';
import { ApiResponse } from '@/types';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ exerciseId: string }> }
): Promise<NextResponse<ApiResponse<any>>> {
  try {
    const { exerciseId: exerciseIdString } = await params;
    const exerciseId = parseInt(exerciseIdString);
    
    if (isNaN(exerciseId)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid exercise ID'
      }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const range = (searchParams.get('range') as DateRange) || '30d';
    
    // Validate range parameter
    const validRanges = ['30d', '3m', '6m', '1y'];
    if (!validRanges.includes(range)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid date range. Valid options: 30d, 3m, 6m, 1y'
      }, { status: 400 });
    }

    const data = await getExerciseProgressionData(exerciseId, range);
    
    // Calculate trends
    const trends = calculateProgressionTrends(data);
    
    return NextResponse.json({
      success: true,
      data: {
        exerciseId,
        range,
        progressions: data,
        totalSessions: data.length,
        trends
      }
    });
  } catch (error) {
    console.error('Error in exercise progression analytics:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch exercise progression data'
    }, { status: 500 });
  }
}

function calculateProgressionTrends(data: any[]) {
  if (data.length < 2) {
    return {
      repsChange: 0,
      weightChange: 0,
      volumeChange: 0
    };
  }

  const first = data[0];
  const last = data[data.length - 1];
  
  const repsChange = last.averageReps - first.averageReps;
  const weightChange = last.averageWeight - first.averageWeight;
  const volumeChange = last.totalVolume - first.totalVolume;
  
  return {
    repsChange: Math.round(repsChange * 10) / 10,
    weightChange: Math.round(weightChange * 10) / 10,
    volumeChange: Math.round(volumeChange),
    repsPercentage: first.averageReps > 0 ? Math.round((repsChange / first.averageReps) * 100) : 0,
    weightPercentage: first.averageWeight > 0 ? Math.round((weightChange / first.averageWeight) * 100) : 0,
    volumePercentage: first.totalVolume > 0 ? Math.round((volumeChange / first.totalVolume) * 100) : 0
  };
}