import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { ApiResponse, Exercise, ExerciseCategory } from '@/types';

const prisma = new PrismaClient();

export async function GET(): Promise<NextResponse<ApiResponse<Exercise[]>>> {
  try {
    const exercises = await prisma.exercise.findMany({
      orderBy: { name: 'asc' }
    });
    
    const formattedExercises: Exercise[] = exercises.map(exercise => ({
      ...exercise,
      category: exercise.category as ExerciseCategory,
      muscleGroups: JSON.parse(exercise.muscleGroups)
    }));
    
    return NextResponse.json({ success: true, data: formattedExercises });
  } catch (error) {
    console.error('Failed to fetch exercises:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch exercises' 
    }, { status: 500 });
  }
}

export async function POST(request: Request): Promise<NextResponse<ApiResponse<Exercise>>> {
  try {
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
      instructions,
      isCustom
    } = body;
    
    if (!name || !category || !muscleGroups || !defaultSets || !defaultRestBetweenSets || !defaultRestAfter) {
      return NextResponse.json({ 
        success: false, 
        error: 'Required fields: name, category, muscleGroups, defaultSets, defaultRestBetweenSets, defaultRestAfter' 
      }, { status: 400 });
    }

    // Validate based on exercise type
    if (isDurationBased && !defaultDuration) {
      return NextResponse.json({ 
        success: false, 
        error: 'Default duration is required for duration-based exercises' 
      }, { status: 400 });
    }

    if (!isDurationBased && !defaultReps) {
      return NextResponse.json({ 
        success: false, 
        error: 'Default reps is required for rep-based exercises' 
      }, { status: 400 });
    }
    
    const exercise = await prisma.exercise.create({
      data: {
        name,
        category,
        muscleGroups: JSON.stringify(muscleGroups),
        equipmentNeeded,
        instructions,
        isCustom: isCustom ?? true,
        isDurationBased: isDurationBased ?? false,
        defaultSets,
        defaultReps: isDurationBased ? null : defaultReps,
        defaultDuration: isDurationBased ? defaultDuration : null,
        defaultRestBetweenSets,
        defaultRestAfter
      }
    });
    
    const formattedExercise: Exercise = {
      ...exercise,
      category: exercise.category as ExerciseCategory,
      muscleGroups: JSON.parse(exercise.muscleGroups)
    };
    
    return NextResponse.json({ success: true, data: formattedExercise });
  } catch (error) {
    console.error('Failed to create exercise:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to create exercise' 
    }, { status: 500 });
  }
}
