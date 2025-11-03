import fs from 'fs';
import path from 'path';
import type { MediaItem, MulterFile } from '../types';

// Base directory for media storage
const MEDIA_DIR = path.join(process.cwd(), 'src/server/data');
const MEDIA_FILE = 'media.json';
const UPLOADS_DIR = path.join(process.cwd(), 'public/uploads');

// Ensure directories exist
function ensureDirectoriesExist(): void {
  if (!fs.existsSync(MEDIA_DIR)) {
    fs.mkdirSync(MEDIA_DIR, { recursive: true });
  }
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
}

// Get full path for media data file
function getMediaFilePath(): string {
  return path.join(MEDIA_DIR, MEDIA_FILE);
}

// Get all media items
export function getAllMedia(): MediaItem[] {
  ensureDirectoriesExist();

  const mediaPath = getMediaFilePath();

  if (!fs.existsSync(mediaPath)) {
    // Initialize with empty array if file doesn't exist
    fs.writeFileSync(mediaPath, JSON.stringify([], null, 2));
    return [];
  }

  try {
    const data = fs.readFileSync(mediaPath, 'utf8');
    return JSON.parse(data) as MediaItem[];
  } catch (err) {
    console.error('Error reading media data:', err);
    return [];
  }
}

// Add a new media item
export function addMedia(file: MulterFile, description?: string): MediaItem {
  ensureDirectoriesExist();

  const media = getAllMedia();
  
  // Create new media item
  const newMedia: MediaItem = {
    id: Date.now().toString(),
    filename: file.filename,
    originalname: file.originalname,
    mimetype: file.mimetype,
    size: file.size,
    path: `/uploads/${file.filename}`,
    description: description || '',
    uploadDate: new Date().toISOString(),
  };
  
  // Add to media array
  media.push(newMedia);
  
  // Save updated media data
  fs.writeFileSync(getMediaFilePath(), JSON.stringify(media, null, 2));
  
  return newMedia;
}

// Delete a media item
export function deleteMedia(id: string): boolean {
  const media = getAllMedia();
  let mediaToDelete: MediaItem | null = null;
  
  // Find the media item to delete
  const index = media.findIndex((item) => item.id === id);
  if (index !== -1) {
    mediaToDelete = media[index];
    media.splice(index, 1);
  }
  
  if (!mediaToDelete) {
    return false;
  }
  
  // Delete the file
  try {
    const filePath = path.join(process.cwd(), 'public', mediaToDelete.path);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (err) {
    console.error('Error deleting file:', err);
    // Continue even if file deletion fails
  }
  
  // Save updated media data
  fs.writeFileSync(getMediaFilePath(), JSON.stringify(media, null, 2));
  
  return true;
}

// Get a specific media item by ID
export function getMediaById(id: string): MediaItem | null {
  const media = getAllMedia();
  
  const found = media.find((item) => item.id === id);
  return found || null;
}

// Initialize media storage
export function initializeMediaStorage(): void {
  ensureDirectoriesExist();
  
  // Initialize with empty array if file doesn't exist
  const mediaPath = getMediaFilePath();
  if (!fs.existsSync(mediaPath)) {
    fs.writeFileSync(mediaPath, JSON.stringify([], null, 2));
  }
}
