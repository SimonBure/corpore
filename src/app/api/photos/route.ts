import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { ApiResponse, Photo } from '@/types';
import { 
  validatePhotoFile, 
  savePhotoFile, 
  generatePhotoFilename,
  getImageDimensions 
} from '@/utils/photoUtils';

const prisma = new PrismaClient();

export async function GET(): Promise<NextResponse<ApiResponse<Photo[]>>> {
  try {
    const photos = await prisma.photo.findMany({
      orderBy: {
        captureDate: 'desc'
      }
    });

    return NextResponse.json({
      success: true,
      data: photos
    });
  } catch (error) {
    console.error('Error fetching photos:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch photos'
    }, { status: 500 });
  }
}

export async function POST(request: Request): Promise<NextResponse<ApiResponse<Photo>>> {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const notes = formData.get('notes') as string || null;
    const captureDateStr = formData.get('captureDate') as string;
    const userId = formData.get('userId') as string || null;

    if (!file) {
      return NextResponse.json({
        success: false,
        error: 'No file provided'
      }, { status: 400 });
    }

    // Validate file
    const validation = validatePhotoFile(file);
    if (!validation.valid) {
      return NextResponse.json({
        success: false,
        error: validation.error
      }, { status: 400 });
    }

    // Generate filename
    const filename = generatePhotoFilename(file.name, userId || undefined);

    // Save file to disk
    const saveResult = await savePhotoFile(file, filename, userId || undefined);
    if (!saveResult.success) {
      return NextResponse.json({
        success: false,
        error: saveResult.error
      }, { status: 500 });
    }

    // Get image dimensions (if possible)
    let width: number | null = null;
    let height: number | null = null;
    try {
      const dimensions = await getImageDimensions(file);
      if (dimensions) {
        width = dimensions.width;
        height = dimensions.height;
      }
    } catch (error) {
      console.warn('Could not get image dimensions:', error);
    }

    // Parse capture date
    const captureDate = captureDateStr ? new Date(captureDateStr) : new Date();

    // Save photo metadata to database
    const photo = await prisma.photo.create({
      data: {
        userId,
        filename,
        originalName: file.name,
        captureDate,
        notes,
        fileSize: file.size,
        mimeType: file.type,
        width,
        height
      }
    });

    return NextResponse.json({
      success: true,
      data: photo
    });
  } catch (error) {
    console.error('Error uploading photo:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to upload photo'
    }, { status: 500 });
  }
}