import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { ApiResponse, Session, ExerciseCategory } from '@/types';

const prisma = new PrismaClient();

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<Session>>> {
  try {
    const { id: sessionId } = await params;
    const body = await request.json();
    const { actualDuration, completedExercises } = body;
    
    // Validate sessionId
    if (!sessionId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Session ID is required' 
      }, { status: 400 });
    }
    
    // Validate request body
    if (typeof actualDuration !== 'number' || !Array.isArray(completedExercises)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid request data' 
      }, { status: 400 });
    }

    // Check if session exists
    const existingSession = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        sessionExercises: {
          include: { exercise: true },
          orderBy: { order: 'asc' }
        }
      }
    });

    if (!existingSession) {
      return NextResponse.json({ 
        success: false, 
        error: 'Session not found' 
      }, { status: 404 });
    }

    // Update session as completed with early termination flag
    const updatedSession = await prisma.session.update({
      where: { id: sessionId },
      data: {
        completed: true,
        duration: actualDuration,
        // Note: terminatedEarly field would need to be added to Prisma schema
        // For now, we'll rely on duration being less than expected as indicator
      },
      include: {
        sessionExercises: {
          include: { exercise: true },
          orderBy: { order: 'asc' }
        }
      }
    });

    // Update only the exercises that have completed data
    for (const exerciseData of completedExercises) {
      const { exerciseId, actualSets, actualReps, weight } = exerciseData;
      
      // Validate exercise data
      if (!exerciseId || typeof actualSets !== 'number') {
        console.warn(`Invalid exercise data for exerciseId: ${exerciseId}`);
        continue;
      }

      // Find the SessionExercise to update
      const sessionExercise = await prisma.sessionExercise.findFirst({
        where: {
          sessionId: sessionId,
          exerciseId: exerciseId
        }
      });

      if (sessionExercise) {
        await prisma.sessionExercise.update({
          where: { id: sessionExercise.id },
          data: {
            actualSets,
            actualReps: actualReps && actualReps.length > 0 ? JSON.stringify(actualReps) : null,
            weight: weight && weight.length > 0 ? JSON.stringify(weight) : null
          }
        });
      }
    }

    // Fetch the final updated session with all data
    const finalSession = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        sessionExercises: {
          include: { exercise: true },
          orderBy: { order: 'asc' }
        }
      }
    });

    if (!finalSession) {
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to retrieve updated session' 
      }, { status: 500 });
    }

    // Format the response data
    const formattedSession: Session = {
      ...finalSession,
      terminatedEarly: true, // Mark as terminated early
      sessionExercises: finalSession.sessionExercises.map(se => ({
        ...se,
        actualReps: se.actualReps ? JSON.parse(se.actualReps) : undefined,
        weight: se.weight ? JSON.parse(se.weight) : undefined,
        exercise: se.exercise ? {
          ...se.exercise,
          category: se.exercise.category as ExerciseCategory,
          muscleGroups: JSON.parse(se.exercise.muscleGroups)
        } : undefined
      }))
    };

    return NextResponse.json({ success: true, data: formattedSession });
  } catch (error) {
    console.error('Failed to terminate session:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to terminate session' 
    }, { status: 500 });
  }
}