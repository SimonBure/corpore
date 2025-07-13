import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { ApiResponse, Session, ExerciseCategory } from '@/types';

const prisma = new PrismaClient();

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<Session>>> {
  try {
    const { id } = await params;
    const session = await prisma.session.findUnique({
      where: { id },
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
    
    if (!session) {
      return NextResponse.json({ 
        success: false, 
        error: 'Session not found' 
      }, { status: 404 });
    }
    
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
    console.error('Failed to fetch session:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch session' 
    }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<Session>>> {
  try {
    const { id } = await params;
    const body = await request.json();
    const { title, date, warmupSeconds, isTemplate, completed, duration } = body;
    
    const session = await prisma.session.update({
      where: { id },
      data: {
        title,
        date: date ? new Date(date) : undefined,
        warmupSeconds,
        isTemplate,
        completed,
        duration
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
    console.error('Failed to update session:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to update session' 
    }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<null>>> {
  try {
    const { id } = await params;
    await prisma.session.delete({
      where: { id }
    });
    
    return NextResponse.json({ success: true, data: null });
  } catch (error) {
    console.error('Failed to delete session:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to delete session' 
    }, { status: 500 });
  }
}