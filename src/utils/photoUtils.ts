import { promises as fs } from 'fs';
import path from 'path';

// Photo storage configuration
export const PHOTO_STORAGE_PATH = path.join(process.cwd(), 'photos');
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/**
 * Generate unique filename for photo
 */
export function generatePhotoFilename(originalName: string, userId?: string): string {
  const timestamp = Date.now();
  const extension = path.extname(originalName).toLowerCase();
  const userPart = userId ? `_${userId}` : '';
  return `photo_${timestamp}${userPart}${extension}`;
}

/**
 * Get full file path for photo
 */
export function getPhotoPath(filename: string, userId?: string): string {
  const userDir = userId ? `user_${userId}` : 'general';
  return path.join(PHOTO_STORAGE_PATH, userDir, filename);
}

/**
 * Ensure directory exists
 */
export async function ensurePhotoDirectory(userId?: string): Promise<void> {
  const userDir = userId ? `user_${userId}` : 'general';
  const dirPath = path.join(PHOTO_STORAGE_PATH, userDir);
  
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
}

/**
 * Validate file type and size
 */
export function validatePhotoFile(file: File): { valid: boolean; error?: string } {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB`
    };
  }

  // Check file type
  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: ${ALLOWED_TYPES.join(', ')}`
    };
  }

  return { valid: true };
}

/**
 * Save uploaded file to disk
 */
export async function savePhotoFile(
  file: File,
  filename: string,
  userId?: string
): Promise<{ success: boolean; filePath?: string; error?: string }> {
  try {
    // Ensure directory exists
    await ensurePhotoDirectory(userId);
    
    // Get full file path
    const filePath = getPhotoPath(filename, userId);
    
    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Write file to disk
    await fs.writeFile(filePath, buffer);
    
    return {
      success: true,
      filePath
    };
  } catch (error) {
    console.error('Error saving photo file:', error);
    return {
      success: false,
      error: 'Failed to save photo file'
    };
  }
}

/**
 * Delete photo file from disk
 */
export async function deletePhotoFile(
  filename: string,
  userId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const filePath = getPhotoPath(filename, userId);
    await fs.unlink(filePath);
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting photo file:', error);
    return {
      success: false,
      error: 'Failed to delete photo file'
    };
  }
}

/**
 * Get image dimensions from file (server-side safe)
 */
export async function getImageDimensions(file: File): Promise<{ width: number; height: number } | null> {
  // Image dimensions cannot be calculated server-side without additional libraries
  // Return null for now - dimensions can be calculated client-side if needed
  return null;
}

/**
 * Create photo thumbnail (client-side)
 */
export function createPhotoThumbnail(
  file: File,
  maxWidth: number = 300,
  maxHeight: number = 300,
  quality: number = 0.8
): Promise<string> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Calculate thumbnail dimensions
      let { width, height } = img;
      
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }
      
      // Set canvas dimensions
      canvas.width = width;
      canvas.height = height;
      
      // Draw image on canvas
      ctx?.drawImage(img, 0, 0, width, height);
      
      // Convert to data URL
      const dataUrl = canvas.toDataURL('image/jpeg', quality);
      resolve(dataUrl);
    };
    
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Check if file is an image
 */
export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/');
}