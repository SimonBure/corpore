import { NextResponse } from 'next/server';
import { getAvailableExercisesFromHistory, getWorkoutFrequencyStats, type DateRange } from '@/utils/analyticsUtils';
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

    const [exercises, frequencyStats] = await Promise.all([
      getAvailableExercisesFromHistory(),
      getWorkoutFrequencyStats(range)
    ]);
    
    return NextResponse.json({
      success: true,
      data: {
        exercises,
        stats: {
          ...frequencyStats,
          totalExercisesUsed: exercises.length,
          mostUsedExercise: exercises.length > 0 ? exercises[0] : null
        }
      }
    });
  } catch (error) {
    console.error('Error in exercises analytics:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch exercises data'
    }, { status: 500 });
  }
}