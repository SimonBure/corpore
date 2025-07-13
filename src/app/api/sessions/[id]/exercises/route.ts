import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { ApiResponse, SessionExercise, ExerciseCategory } from '@/types';

const prisma = new PrismaClient();

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<SessionExercise>>> {
  try {
    const { id: sessionId } = await params;
    const body = await request.json();
    const { exerciseId, actualSets, actualReps, weight } = body;
    
    // Validate sessionId and exerciseId
    if (!sessionId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Session ID is required' 
      }, { status: 400 });
    }
    
    if (!exerciseId || typeof exerciseId !== 'number') {
      return NextResponse.json({ 
        success: false, 
        error: 'Valid exercise ID is required' 
      }, { status: 400 });
    }
    
    // Find the SessionExercise to update
    const existingSessionExercise = await prisma.sessionExercise.findFirst({
      where: {
        sessionId: sessionId,
        exerciseId: exerciseId
      }
    });
    
    if (!existingSessionExercise) {
      return NextResponse.json({ 
        success: false, 
        error: 'Session exercise not found' 
      }, { status: 404 });
    }
    
    const sessionExercise = await prisma.sessionExercise.update({
      where: {
        id: existingSessionExercise.id
      },
      data: {
        actualSets,
        actualReps: actualReps ? JSON.stringify(actualReps) : undefined,
        weight: weight ? JSON.stringify(weight) : undefined
      },
      include: {
        exercise: true
      }
    });
    
    const formattedSessionExercise: SessionExercise = {
      ...sessionExercise,
      actualReps: sessionExercise.actualReps ? JSON.parse(sessionExercise.actualReps) : undefined,
      weight: sessionExercise.weight ? JSON.parse(sessionExercise.weight) : undefined,
      exercise: sessionExercise.exercise ? {
        ...sessionExercise.exercise,
        category: sessionExercise.exercise.category as ExerciseCategory,
        muscleGroups: JSON.parse(sessionExercise.exercise.muscleGroups)
      } : undefined
    };
    
    return NextResponse.json({ success: true, data: formattedSessionExercise });
  } catch (error) {
    console.error('Failed to update session exercise:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to update session exercise' 
    }, { status: 500 });
  }
}