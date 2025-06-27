import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  const sessions = await prisma.session.findMany()
  return NextResponse.json(sessions)
}

export async function POST(request: Request) {
  const data = await request.json()
  const newSession = await prisma.session.create({ data })

  if (!data.isTemplate) {
    // Logique pour terminer une session (exemple : mise à jour des données)
    await prisma.session.update({
      where: { id: newSession.id },
      data: { ...data, isTemplate: false },
    })
  }

  return NextResponse.json(newSession)
}
