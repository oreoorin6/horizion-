import { E621Post } from "./types";

export function getImageUrl(post: E621Post, size: 'preview' | 'sample' | 'full' = 'sample'): string | null {
  if (!post) {
    console.error('getImageUrl called with undefined post');
    return null;
  }
  
  try {
    switch (size) {
      case 'preview':
        return post.preview?.url || null;
      case 'sample':
        return (post.sample?.has && post.sample?.url) ? post.sample.url : (post.file?.url || null);
      case 'full':
        return post.file?.url || null;
      default:
        return null;
    }
  } catch (error) {
    console.error(`Error getting ${size} image URL for post ${post.id || 'unknown'}:`, error);
    console.log('Post structure:', JSON.stringify(post, null, 2).substring(0, 500));
    return null;
  }
}
