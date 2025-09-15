import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { title } = await request.json();

    if (!title) {
      return NextResponse.json(
        { success: false, error: 'Title is required' },
        { status: 400 }
      );
    }

    const updatedSession = await prisma.session.update({
      where: { id },
      data: { title },
      include: {
        sessionExercises: {
          include: { exercise: true },
          orderBy: { order: 'asc' }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: updatedSession
    });

  } catch (error) {
    console.error('Error renaming session:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to rename session' },
      { status: 500 }
    );
  }
}