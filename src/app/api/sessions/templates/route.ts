import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  const templates = await prisma.session.findMany({
    where: { isTemplate: true },
  });
  return NextResponse.json(templates);
}

export async function POST(request: Request) {
  const data = await request.json();
  const newTemplate = await prisma.session.create({
    data: { ...data, isTemplate: true },
  });
  return NextResponse.json(newTemplate);
}
