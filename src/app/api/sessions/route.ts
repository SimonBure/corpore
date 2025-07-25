import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { ApiResponse, Session, CreateSessionRequest, ExerciseCategory } from '@/types';

const prisma = new PrismaClient();

export async function GET(): Promise<NextResponse<ApiResponse<Session[]>>> {
  try {
    const sessions = await prisma.session.findMany({
      include: {
        sessionExercises: {
          include: {
            exercise: true
          },
          orderBy: {
            order: 'asc'
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    });
    
    const formattedSessions: Session[] = sessions.map(session => ({
      ...session,
      sessionExercises: session.sessionExercises.map(se => ({
        ...se,
        actualReps: se.actualReps ? JSON.parse(se.actualReps) : undefined,
        weight: se.weight ? JSON.parse(se.weight) : undefined,
        exercise: se.exercise ? {
          ...se.exercise,
          category: se.exercise.category as ExerciseCategory,
          muscleGroups: JSON.parse(se.exercise.muscleGroups)
        } : undefined
      }))
    }));
    
    return NextResponse.json({ success: true, data: formattedSessions });
  } catch (error) {
    console.error('Failed to fetch sessions:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch sessions' 
    }, { status: 500 });
  }
}

export async function POST(request: Request): Promise<NextResponse<ApiResponse<Session>>> {
  try {
    const body: CreateSessionRequest = await request.json();
    const { title, date, warmupSeconds, isTemplate, exercises } = body;
    
    if (!title || !date || !exercises || exercises.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Title, date, and exercises are required' 
      }, { status: 400 });
    }
    
    const session = await prisma.session.create({
      data: {
        title,
        date: new Date(date),
        warmupSeconds: warmupSeconds || 0,
        isTemplate,
        sessionExercises: {
          create: exercises.map(exercise => ({
            exerciseId: exercise.exerciseId,
            sets: exercise.sets,
            reps: exercise.reps,
            durationSeconds: exercise.durationSeconds,
            restBetweenSets: exercise.restBetweenSets,
            restAfter: exercise.restAfter,
            order: exercise.order
          }))
        }
      },
      include: {
        sessionExercises: {
          include: {
            exercise: true
          },
          orderBy: {
            order: 'asc'
          }
        }
      }
    });
    
    const formattedSession: Session = {
      ...session,
      sessionExercises: session.sessionExercises.map(se => ({
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
    console.error('Failed to create session:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to create session' 
    }, { status: 500 });
  }
}
