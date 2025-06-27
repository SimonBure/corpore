import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  const exercises = await prisma.exercise.findMany();
  return NextResponse.json(exercises);
}
