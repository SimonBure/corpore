import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { ApiResponse, Exercise, ExerciseCategory } from '@/types';

const prisma = new PrismaClient();

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<Exercise>>> {
  try {
    const { id: idString } = await params;
    const id = parseInt(idString);
    const exercise = await prisma.exercise.findUnique({
      where: { id }
    });
    
    if (!exercise) {
      return NextResponse.json({ 
        success: false, 
        error: 'Exercise not found' 
      }, { status: 404 });
    }
    
    const formattedExercise: Exercise = {
      ...exercise,
      category: exercise.category as ExerciseCategory,
      muscleGroups: JSON.parse(exercise.muscleGroups)
    };
    
    return NextResponse.json({ success: true, data: formattedExercise });
  } catch (error) {
    console.error('Failed to fetch exercise:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch exercise' 
    }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<Exercise>>> {
  try {
    const { id: idString } = await params;
    const id = parseInt(idString);
    const body = await request.json();
    const { 
      name, 
      category, 
      muscleGroups, 
      defaultSets, 
      defaultReps, 
      defaultDuration,
      isDurationBased,
      defaultRestBetweenSets, 
      defaultRestAfter,
      equipmentNeeded,
      instructions 
    } = body;
    
    const exercise = await prisma.exercise.update({
      where: { id },
      data: {
        name,
        category,
        muscleGroups: JSON.stringify(muscleGroups),
        defaultSets,
        defaultReps: isDurationBased ? null : defaultReps,
        defaultDuration: isDurationBased ? defaultDuration : null,
        isDurationBased: isDurationBased ?? false,
        defaultRestBetweenSets,
        defaultRestAfter,
        equipmentNeeded,
        instructions
      }
    });
    
    const formattedExercise: Exercise = {
      ...exercise,
      category: exercise.category as ExerciseCategory,
      muscleGroups: JSON.parse(exercise.muscleGroups)
    };
    
    return NextResponse.json({ success: true, data: formattedExercise });
  } catch (error) {
    console.error('Failed to update exercise:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to update exercise' 
    }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<null>>> {
  try {
    const { id: idString } = await params;
    const id = parseInt(idString);
    await prisma.exercise.delete({
      where: { id }
    });
    
    return NextResponse.json({ success: true, data: null });
  } catch (error) {
    console.error('Failed to delete exercise:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to delete exercise' 
    }, { status: 500 });
  }
}