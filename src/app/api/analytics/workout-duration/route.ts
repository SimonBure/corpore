import { NextResponse } from 'next/server';
import { getWorkoutDurationHistory, type DateRange } from '@/utils/analyticsUtils';
import { ApiResponse } from '@/types';

export async function GET(request: Request): Promise<NextResponse<ApiResponse<any>>> {
  try {
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

    const data = await getWorkoutDurationHistory(range);
    
    return NextResponse.json({
      success: true,
      data: {
        range,
        workouts: data,
        totalWorkouts: data.length,
        averageDuration: data.length > 0 
          ? Math.round(data.reduce((sum, workout) => sum + workout.duration, 0) / data.length)
          : 0
      }
    });
  } catch (error) {
    console.error('Error in workout duration analytics:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch workout duration data'
    }, { status: 500 });
  }
}