import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { ApiResponse, Session, ExerciseCategory } from '@/types';

const prisma = new PrismaClient();

export async function GET(): Promise<NextResponse<ApiResponse<Session[]>>> {
  try {
    const templates = await prisma.session.findMany({
      where: { isTemplate: true },
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
        createdAt: 'desc'
      }
    });
    
    const formattedTemplates: Session[] = templates.map(template => ({
      ...template,
      sessionExercises: template.sessionExercises.map(se => ({
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
    
    return NextResponse.json({ success: true, data: formattedTemplates });
  } catch (error) {
    console.error('Failed to fetch templates:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch templates' 
    }, { status: 500 });
  }
}
