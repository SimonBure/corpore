import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { promises as fs } from 'fs';
import { ApiResponse } from '@/types';
import { getPhotoPath, deletePhotoFile } from '@/utils/photoUtils';

const prisma = new PrismaClient();

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;
    
    // If the ID looks like a filename, serve the file directly
    if (id.includes('.')) {
      const filePath = getPhotoPath(id);
      
      try {
        const fileBuffer = await fs.readFile(filePath);
        const extension = id.split('.').pop()?.toLowerCase();
        
        let contentType = 'image/jpeg';
        switch (extension) {
          case 'png':
            contentType = 'image/png';
            break;
          case 'webp':
            contentType = 'image/webp';
            break;
        }
        
        return new NextResponse(fileBuffer, {
          headers: {
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
          },
        });
      } catch {
        return NextResponse.json({ error: 'Photo not found' }, { status: 404 });
      }
    }
    
    // Otherwise, get photo metadata
    const photo = await prisma.photo.findUnique({
      where: { id }
    });

    if (!photo) {
      return NextResponse.json({
        success: false,
        error: 'Photo not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: photo
    });
  } catch (error) {
    console.error('Error fetching photo:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch photo'
    }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const { id } = await params;
    const body = await request.json();
    const { notes } = body;

    const photo = await prisma.photo.update({
      where: { id },
      data: { notes }
    });

    return NextResponse.json({
      success: true,
      data: photo
    });
  } catch (error) {
    console.error('Error updating photo:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update photo'
    }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<null>>> {
  try {
    const { id } = await params;

    // Get photo info first
    const photo = await prisma.photo.findUnique({
      where: { id }
    });

    if (!photo) {
      return NextResponse.json({
        success: false,
        error: 'Photo not found'
      }, { status: 404 });
    }

    // Delete file from disk
    const deleteResult = await deletePhotoFile(photo.filename, photo.userId || undefined);
    if (!deleteResult.success) {
      console.warn('Failed to delete photo file:', deleteResult.error);
      // Continue with database deletion even if file deletion fails
    }

    // Delete from database
    await prisma.photo.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      data: null
    });
  } catch (error) {
    console.error('Error deleting photo:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to delete photo'
    }, { status: 500 });
  }
}