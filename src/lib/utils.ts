import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format bytes to a human readable string
 * @param bytes Number of bytes to format
 * @param decimals Number of decimal places to show
 * @returns Formatted string (e.g., "1.5 MB")
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Utility function to handle refreshing a failed image in a DOM element
 * @param img The image element that failed to load
 * @param imgUrl The URL of the image to try loading again
 * @param postId The ID of the post for logging purposes
 */
export function refreshImageElement(img: HTMLImageElement, imgUrl: string, postId: string | number) {
  console.log(`Refreshing image for post ${postId} with URL ${imgUrl}`);
  
  // Get the parent element
  const parent = img.parentElement;
  if (!parent) return;
  
  // Find and remove any existing error message or refresh button
  const existingErrorDiv = parent.querySelector('div.error-container');
  if (existingErrorDiv) {
    existingErrorDiv.remove();
  }
  
  // Create loading overlay
  const loadingOverlay = document.createElement('div');
  loadingOverlay.className = 'absolute inset-0 flex items-center justify-center bg-black/50 z-10';
  loadingOverlay.innerHTML = `
    <div class="animate-spin h-6 w-6 border-2 border-green-500 rounded-full border-t-transparent"></div>
  `;
  parent.appendChild(loadingOverlay);
  
  // Reset the image display
  img.style.display = 'block';
  
  // Set up onload and onerror handlers before changing the src
  const originalOnLoad = img.onload;
  const originalOnError = img.onerror;
  
  img.onload = (e) => {
    // Remove loading overlay when image loads
    loadingOverlay.remove();
    
    // Call original onload if it exists
    if (originalOnLoad) {
      originalOnLoad.call(img, e);
    }
  };
  
  img.onerror = (e) => {
    // Remove loading overlay
    loadingOverlay.remove();
    
    console.warn(`Failed to refresh image for post ${postId}`);
    
    // Call original onerror if it exists
    if (originalOnError) {
      originalOnError.call(img, e);
    }
  };
  
  // Add cache busting to force a fresh request
  const timestamp = Date.now();
  img.src = imgUrl.includes('?') 
    ? `${imgUrl}&refresh=${timestamp}` 
    : `${imgUrl}?refresh=${timestamp}`;
}

/**
 * Simpler refresh function for use in the modal
 * @param imgUrl The URL of the image to refresh
 * @returns Promise that resolves when refresh is complete
 */
export function refreshImage(imgUrl: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      resolve();
      return;
    }
    
    console.log(`Refreshing image: ${imgUrl}`);
    
    // Create a new image element to force cache refresh
    const img = new Image();
    
    img.onload = () => {
      console.log(`Successfully refreshed image: ${imgUrl}`);
      resolve();
    };
    
    img.onerror = (error) => {
      console.warn(`Failed to refresh image: ${imgUrl}`, error);
      resolve(); // Resolve anyway to not block UI
    };
    
    // Add cache busting to force a fresh request
    const timestamp = Date.now();
    img.src = imgUrl.includes('?') 
      ? `${imgUrl}&refresh=${timestamp}` 
      : `${imgUrl}?refresh=${timestamp}`;
  });
}