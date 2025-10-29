import { ApiClient } from '../api-client';
import { RateLimiter } from '../rate-limiter';
import { E621Post, E621Pool, SearchParams, E621Tag, E621Comment, CommentSearchParams } from './types';
import { IE621ApiClient } from '../IApiClient';
import { apiManager } from '../ApiManager';

// Constants for API access
const API_VERSION = 2; // e621 API is currently v2
const APP_NAME = 'E621Horizon';
const APP_VERSION = '1.0';
const CONTACT = 'https://github.com/yourusername/e621horizon'; // Update this with your actual contact info

// Detect if running in Electron (renderer) safely without nodeIntegration
const isElectron = typeof window !== 'undefined' && (
  // Packaged app uses our custom app:// scheme
  ((window.location && ((window.location as any).protocol?.startsWith('app') || (window.location as any).origin?.startsWith('app://'))) ||
  // Dev builds include 'Electron' in UA
  (typeof navigator !== 'undefined' && /Electron/i.test(navigator.userAgent || '')))
);

// Debug log to confirm environment detection at runtime
try {
  if (typeof window !== 'undefined') {
    console.log('[E621API] Env detection:', {
      href: window.location.href,
      origin: (window.location as any).origin,
      protocol: (window.location as any).protocol,
      ua: typeof navigator !== 'undefined' ? navigator.userAgent : 'n/a',
      isElectron
    })
  }
} catch {}

// Use direct API in Electron (CORS disabled), proxy in regular browser
const API_BASE = typeof window !== 'undefined' && !isElectron
  ? '/api/proxy' // Proxy endpoint for browser use to avoid CORS issues
  : 'https://e621.net'; // Direct API access for Electron and SSR

const DIRECT_API_BASE = 'https://e621.net'; // Always the direct URL for testing

// User agent string following e621's requirements: 
// "name/version (by username on e621)" or "name/version (website)"
const USER_AGENT = `${APP_NAME}/${APP_VERSION} (${CONTACT})`;

// Create a global request cache to prevent duplicate API calls
interface RequestCache {
  [key: string]: {
    promise: Promise<any>;
    timestamp: number;
  }
}

const requestCache: RequestCache = {};

export class E621ApiClient extends ApiClient implements IE621ApiClient {
  public readonly name = 'e621';

  constructor() {
    // e621 allows 1.8 requests per second, so we'll use a slightly more conservative delay
    super(API_BASE, USER_AGENT, new RateLimiter(1000 / 1.8));
  }
  
  // Test method to check the API using both direct and proxied access
  public async testDirectApiAccess(): Promise<any> {
    try {
      console.log('[E621API] Testing API access...');
      
      // Try both direct access and our proxy
      const results = {
        direct: null as any,
        proxy: null as any
      };
      
      // Test direct access to e621.net (likely to fail due to CORS)
      try {
        console.log('[E621API] Testing direct API access to e621.net...');
        const directResponse = await fetch(`${DIRECT_API_BASE}/posts.json?limit=2&tags=safe`, {
          headers: {
            'User-Agent': USER_AGENT,
            'Accept': 'application/json'
          },
          mode: 'cors',
          credentials: 'omit'
        });
        
        console.log('[E621API] Direct response status:', directResponse.status, directResponse.statusText);
        
        if (!directResponse.ok) {
          throw new Error(`Direct API access failed: ${directResponse.status} ${directResponse.statusText}`);
        }
        
        const directText = await directResponse.text();
        const directData = JSON.parse(directText);
        results.direct = directData;
        console.log('[E621API] Direct access succeeded:', directData);
      } catch (directError) {
        console.log('[E621API] Direct access failed (expected):', directError);
        results.direct = { error: String(directError) };
      }
      
      // Test our proxy access (should work)
      try {
        console.log('[E621API] Testing proxied API access...');
        const proxyUrl = typeof window !== 'undefined' 
          ? `/api/proxy?endpoint=posts.json&limit=2&tags=safe` // This should match our API route path
          : `${API_BASE}/posts.json?limit=2&tags=safe`;
          
        console.log('[E621API] Proxy URL:', proxyUrl);
        
        // Log the full URL for debugging
        if (typeof window !== 'undefined') {
          console.log('[E621API] Full proxy URL:', new URL(proxyUrl, window.location.origin).toString());
        }
        
        const proxyResponse = await fetch(proxyUrl, {
          headers: {
            'Accept': 'application/json'
          }
        });
        
        console.log('[E621API] Proxy response status:', proxyResponse.status, proxyResponse.statusText);
        
        if (!proxyResponse.ok) {
          throw new Error(`Proxy API access failed: ${proxyResponse.status} ${proxyResponse.statusText}`);
        }
        
        const proxyText = await proxyResponse.text();
        console.log('[E621API] Proxy response text sample:', 
          proxyText.substring(0, 200) + (proxyText.length > 200 ? '...' : ''));
        
        try {
          const proxyData = JSON.parse(proxyText);
          results.proxy = proxyData;
          
          // Analyze response structure
          if (proxyData && typeof proxyData === 'object') {
            console.log('[E621API] Proxy response keys:', Object.keys(proxyData));
            
            if (proxyData.posts && Array.isArray(proxyData.posts)) {
              console.log(`[E621API] Found ${proxyData.posts.length} posts in proxy response`);
              
              if (proxyData.posts.length > 0) {
                const firstPost = proxyData.posts[0];
                console.log('[E621API] First post structure:', Object.keys(firstPost));
                console.log('[E621API] First post sample:', {
                  id: firstPost.id,
                  file: firstPost.file ? {
                    ext: firstPost.file.ext,
                    url: firstPost.file.url
                  } : 'No file data',
                  preview: firstPost.preview ? {
                    url: firstPost.preview.url
                  } : 'No preview data'
                });
              }
            } else {
              console.warn('[E621API] Proxy response does not contain posts array');
            }
          }
        } catch (e) {
          console.error('[E621API] Failed to parse proxy response as JSON:', e);
          results.proxy = { error: 'Failed to parse response', rawText: proxyText.substring(0, 500) };
        }
      } catch (proxyError) {
        console.error('[E621API] Proxy access failed:', proxyError);
        results.proxy = { error: String(proxyError) };
      }
      
      return {
        results,
        recommendation: results.proxy && !results.proxy.error 
          ? 'Use the proxy configuration for API access'
          : results.direct && !results.direct.error
            ? 'Direct access works but may face CORS issues in browser'
            : 'Both access methods failed, check network configuration and API status'
      };
    } catch (error) {
      console.error('[E621API] API test failed:', error);
      return { error: String(error) };
    }
  }

  /**
   * Set authentication credentials for API requests
   * Override the base setAuth method to maintain interface compatibility
   */
  public setAuth(headers: Record<string, string>): void;
  public setAuth(username: string, apiKey: string): void;
  public setAuth(usernameOrHeaders: string | Record<string, string>, apiKey?: string): void {
    // If first parameter is a string, treat it as username/apiKey auth
    if (typeof usernameOrHeaders === 'string' && apiKey) {
      if (!usernameOrHeaders || !apiKey) {
        console.warn('[E621API] Invalid credentials provided');
        return;
      }
      
      // e621 uses HTTP Basic Auth with username and API key
      const base64Credentials = btoa(`${usernameOrHeaders}:${apiKey}`);
      super.setAuth({
        'Authorization': `Basic ${base64Credentials}`
      });
      
      console.log(`[E621API] Auth credentials set for user: ${usernameOrHeaders}`);
    } else if (typeof usernameOrHeaders === 'object') {
      // If it's an object, pass it through to the parent method
      super.setAuth(usernameOrHeaders);
      console.log('[E621API] Auth headers set directly');
    }
  }
  
  /**
   * Clear authentication credentials
   */
  public clearAuth(): void {
    super.setAuth({});
    console.log('[E621API] Auth credentials cleared');
  }

  /**
   * Override makeRequest to handle proxy vs direct API calls properly
   */
  protected async makeRequest<T>(endpoint: string, params?: Record<string, any>, method: 'GET' | 'POST' | 'PATCH' | 'DELETE' = 'GET', body?: any): Promise<T> {
    const inBrowser = typeof window !== 'undefined'
    const useProxy = inBrowser && !isElectron
    // In regular browser, use our custom proxy logic; in Electron, use direct base
    if (useProxy) {
      // Use proxy approach for browser requests
      const proxyUrl = new URL('/api/proxy', window.location.origin);
      proxyUrl.searchParams.set('endpoint', endpoint.startsWith('/') ? endpoint.slice(1) : endpoint);
      
      // Add all the parameters to the proxy URL
      if (params && method === 'GET') {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            if (Array.isArray(value)) {
              proxyUrl.searchParams.set(key, value.join(','));
            } else {
              proxyUrl.searchParams.set(key, String(value));
            }
          }
        });
      }
      
      const headers: Record<string, string> = {
        'Accept': 'application/json'
      };
      
      if (method !== 'GET' && body) {
        headers['Content-Type'] = 'application/json';
      }
      
      const response = await fetch(proxyUrl.toString(), {
        method,
        headers,
        body: method !== 'GET' ? JSON.stringify(body) : undefined,
        cache: 'no-store'
      });
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }
      
      return response.json();
    } else {
      // For Electron renderer and server-side, use the base class with direct URL
      return super.makeRequest(endpoint, params, method, body);
    }
  }

  /**
   * Test if the current credentials are valid
   * @returns Promise resolving to true if credentials are valid
   */
  public async testCredentials(): Promise<boolean> {
    try {
      // Using a simple posts endpoint with authentication to test credentials
      // The favorites endpoint might not exist or require different permissions
      console.log('[E621API] Testing credentials with posts endpoint...');
      const result = await this.makeRequest('/posts.json', { limit: 1 });
      
      // If we get here without an error, the credentials are working
      console.log('[E621API] Credential test successful');
      return true;
    } catch (error) {
      console.error('[E621API] Credential test failed:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('401') || error.message.includes('403')) {
          console.error('[E621API] Authentication failed: Invalid credentials');
          return false;
        } else if (error.message.includes('404')) {
          console.error('[E621API] Endpoint not found, but this might not indicate invalid credentials');
          // A 404 on posts.json would be very unusual, so let's try a different approach
          try {
            // Try with a different endpoint that should always exist
            console.log('[E621API] Trying alternative credential test...');
            const fallbackResult = await this.makeRequest('/tags.json', { limit: 1 });
            console.log('[E621API] Fallback credential test successful');
            return true;
          } catch (fallbackError) {
            console.error('[E621API] Fallback credential test also failed:', fallbackError);
            return false;
          }
        }
      }
      
      return false;
    }
  }
  
  /**
   * Get information about the current authenticated user
   * @returns Promise with user information or null if not authenticated
   */
  public async getCurrentUser(): Promise<any> {
    try {
      return await this.makeRequest('/users/index.json');
    } catch (error) {
      console.error('[E621API] Failed to get current user:', error);
      return null;
    }
  }

  /**
   * Search for posts based on provided parameters
   * @param params Search parameters
   * @returns Promise with posts array
   */
  public async searchPosts(params: SearchParams = {}): Promise<{ posts: E621Post[], page: number, totalPages?: number }> {
    // E621 API limits: max 320 posts per page, max page 750
    const searchParams: Record<string, any> = {
      limit: Math.min(params.limit || 50, 320),
      page: Math.min(params.page || 1, 750),
    };
    
    console.log(`[E621API] Searching posts with page=${searchParams.page}, limit=${searchParams.limit}`);

    let tags = params.tags || '';
    
    // Handle rating tags (s = safe, q = questionable, e = explicit)
    if (params.rating && params.rating.length > 0) {
      // Instead of including ratings, we'll exclude the ones not in the list
      const allRatings: ('s' | 'q' | 'e')[] = ['s', 'q', 'e'];
      const excludedRatings = allRatings.filter(r => !params.rating?.includes(r));
      
      // If we're excluding ratings, add them as -rating:X tags
      if (excludedRatings.length > 0) {
        const ratingTags = excludedRatings.map(r => `-rating:${r}`).join(' ');
        tags = tags ? `${tags} ${ratingTags}` : ratingTags;
      }
    }

    // Handle blacklisted tags
    if (params.blacklist && params.blacklist.length > 0) {
      const blacklistTags = params.blacklist.map(tag => `-${tag}`).join(' ');
      tags = tags ? `${tags} ${blacklistTags}` : blacklistTags;
    }

    if (tags) {
      searchParams.tags = tags;
    }
    
    // Optional search by MD5 hash
    if (params.md5) {
      searchParams.md5 = params.md5;
    }
  
    // Random post selection - the API accepts 'true' or '1'
    if (params.random) {
      searchParams.random = typeof params.random === 'boolean' ? 'true' : params.random;
    }

    // Support for additional API parameters
    if (params.order) {
      searchParams.order = params.order;
    }
    
    // Include deleted or flagged content
    if (params.include_deleted) {
      searchParams.include_deleted = params.include_deleted;
    }
    
    if (params.include_flagged) {
      searchParams.include_flagged = params.include_flagged;
    }
    
    // Generate a cache key from the search parameters
    const cacheKey = JSON.stringify({
      endpoint: typeof window !== 'undefined' ? 'proxy-posts' : '/posts.json',
      params: searchParams
    });
    
    // Check if we have a recent cached request (within 2 seconds)
    const now = Date.now();
    const cachedRequest = requestCache[cacheKey];
    
    if (cachedRequest && now - cachedRequest.timestamp < 2000) {
      console.log('[E621API] Using cached search API request for:', tags);
      return cachedRequest.promise;
    }
    
    console.log(`[E621API] Making new API request: tags=${tags}, page=${searchParams.page}`);
    
    try {
      let requestPromise;
      
      // Track the last error time to avoid hammering a failing API
      const lastErrorTime = (this as any)._lastErrorTime || 0;
      const now = Date.now();
      
      // If there was an error in the last 5 seconds, delay additional requests
      if ((this as any)._lastErrorTime && (now - lastErrorTime) < 5000) {
        console.log('[E621API] Recent error detected, adding delay before retrying');
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
      }
      
      // In the browser, use our API proxy to avoid CORS issues
  if (typeof window !== 'undefined' && !isElectron) {
        console.log('[E621API] Using proxy for browser request');
        
        // For the proxy, we need to transform the params to query parameters
        // Use the App Router API route path
        const proxyUrl = new URL('/api/proxy', window.location.origin);
        
        // Set the correct endpoint
        proxyUrl.searchParams.set('endpoint', 'posts.json');
        
        // Add all the search parameters
        Object.entries(searchParams).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            // Make sure we're properly formatting array values
            if (Array.isArray(value)) {
              // For arrays, join with commas or handle as needed by the API
              proxyUrl.searchParams.set(key, value.join(','));
            } else {
              proxyUrl.searchParams.set(key, String(value));
            }
          }
        });
        
        console.log('[E621API] Proxy URL:', proxyUrl.toString());
        console.log('[E621API] Full proxy URL:', proxyUrl.href);
        
        requestPromise = fetch(proxyUrl.toString(), {
          headers: {
            'Accept': 'application/json'
          },
          // Disable cache to prevent stale responses
          cache: 'no-store'
        })
        .then(async response => {
          console.log('[E621API] Proxy response status:', response.status);
          
          if (!response.ok) {
            // Try to get more detailed error information
            let errorDetails = '';
            try {
              const errorJson = await response.json();
              errorDetails = JSON.stringify(errorJson);
            } catch (e) {
              // If it's not JSON, try to get text
              try {
                errorDetails = await response.text();
              } catch (textError) {
                errorDetails = 'Could not parse error response';
              }
            }
            
            throw new Error(`API proxy request failed: ${response.status} ${response.statusText}${errorDetails ? ` - ${errorDetails}` : ''}`);
          }
          
          return response.json();
        })
        .then(result => {
          // Process and validate the response
          console.log('[E621API] Received proxy response');
          
          if (!result) {
            console.error('[E621API] Received null or undefined response from proxy');
            return { 
              posts: [],
              page: Number(searchParams.page) || 1,
              totalPages: 0
            };
          }
          
          if (!result.posts) {
            console.error('[E621API] Proxy response missing posts array:', result);
            return { 
              posts: [],
              page: Number(searchParams.page) || 1,
              totalPages: 0
            };
          }
          
          if (!Array.isArray(result.posts)) {
            console.error('[E621API] Proxy posts is not an array:', typeof result.posts);
            return { 
              posts: [],
              page: Number(searchParams.page) || 1,
              totalPages: 0
            };
          }
          
          const validPosts = result.posts.filter((post: any) => post && typeof post === 'object' && post.id);
          console.log(`[E621API] Proxy request completed: tags=${tags}, got ${validPosts.length} valid posts`);
          
          if (validPosts.length > 0) {
            console.log('[E621API] Sample post from proxy:', {
              id: validPosts[0].id,
              hasPreview: Boolean(validPosts[0].preview?.url)
            });
          } else {
            console.log('[E621API] No posts found for query:', tags);
          }
          
          // Calculate total pages based on E621 API behavior
          // E621 API returns up to 'limit' posts per page
          // If we get a full page, there are likely more pages available
          const postsPerPage = searchParams.limit || 50;
          const hasMorePages = validPosts.length >= postsPerPage;
          
          // E621 has a max of 750 pages, so we cap at that
          // If we got a full page, assume there are many more pages (estimate conservatively)
          let estimatedTotalPages;
          if (hasMorePages) {
            // If we're getting full pages, estimate based on current page
            // E621 typically has thousands of results for popular tags
            if (Number(searchParams.page) < 10) {
              estimatedTotalPages = 750; // Max pages allowed by E621
            } else {
              estimatedTotalPages = Math.min(Number(searchParams.page) + 100, 750);
            }
          } else {
            // If we got less than a full page, this is likely the last page
            estimatedTotalPages = Number(searchParams.page);
          }
          
          console.log(`[E621API] Estimated total pages: ${estimatedTotalPages} (current page: ${searchParams.page}, posts: ${validPosts.length}/${postsPerPage}, hasMorePages: ${hasMorePages})`);
          
          return { 
            posts: validPosts,
            page: Number(searchParams.page) || 1,
            totalPages: estimatedTotalPages
          };
        });
      } else {
        // For server-side rendering, use the direct API client
        console.log('[E621API] Using direct API client for server request');
        requestPromise = this.makeRequest<{ posts: E621Post[] }>('/posts.json', searchParams)
          .then(result => {
            // Validate the response structure
            if (!result) {
              console.error('[E621API] Received null or undefined response');
              return { 
                posts: [],
                page: Number(searchParams.page) || 1,
                totalPages: 0 
              };
            }
            
            if (!result.posts) {
              console.error('[E621API] Response missing posts array:', result);
              return { 
                posts: [],
                page: Number(searchParams.page) || 1,
                totalPages: 0 
              };
            }
            
            if (!Array.isArray(result.posts)) {
              console.error('[E621API] Posts is not an array:', typeof result.posts);
              return { 
                posts: [],
                page: Number(searchParams.page) || 1,
                totalPages: 0 
              };
            }
            
            // Filter out invalid posts (missing required fields)
            const validPosts = result.posts.filter(post => post && typeof post === 'object' && post.id);
            console.log(`[E621API] Request completed: tags=${tags}, got ${validPosts.length} valid posts`);
            
            // Server-side estimation for total pages
            const postsPerPage = searchParams.limit || 50;
            const hasMorePages = validPosts.length >= postsPerPage;
            
            let estimatedTotalPages;
            if (hasMorePages) {
              if (Number(searchParams.page) < 10) {
                estimatedTotalPages = 750; // Max pages allowed by E621
              } else {
                estimatedTotalPages = Math.min(Number(searchParams.page) + 100, 750);
              }
            } else {
              estimatedTotalPages = Number(searchParams.page);
            }
            
            return { 
              posts: validPosts,
              page: Number(searchParams.page) || 1,
              totalPages: estimatedTotalPages
            };
          });
      }
      
      // Cache the request
      requestCache[cacheKey] = {
        promise: requestPromise,
        timestamp: now
      };
      
      // Clean up old cache entries after 5 seconds
      setTimeout(() => {
        delete requestCache[cacheKey];
      }, 5000);
      
      return requestPromise.catch(error => {
        // Store the error time to implement backoff
        (this as any)._lastErrorTime = Date.now();
        // Return an error object with correct type structure
        return {
          posts: [],
          page: Number(searchParams.page) || 1, 
          totalPages: 0,
          error: String(error)
        } as any;
      });
    } catch (error) {
      console.error(`[E621API] Error creating request for tags=${tags}:`, error);
      // Store the error time to implement backoff
      (this as any)._lastErrorTime = Date.now();
      throw error;
    }
  }

  public async getPost(id: number): Promise<{ post: E621Post }> {
    return this.makeRequest<{ post: E621Post }>(`/posts/${id}.json`);
  }

  /**
   * Get adjacent posts in sequence (next/previous)
   * @param id Post ID to get adjacent posts for
   * @param direction Direction to get adjacent post ('next' or 'prev')
   * @returns Promise with adjacent post or null if none exists
   */
  public async getAdjacentPost(id: number, direction: 'next' | 'prev'): Promise<E621Post | null> {
    try {
      console.log(`[E621API] Getting ${direction} post for ID: ${id}`);
      
      let requestPromise;
      
      if (typeof window !== 'undefined') {
        // Use proxy for browser requests
        const proxyUrl = new URL('/api/proxy', window.location.origin);
        proxyUrl.searchParams.set('endpoint', `posts/${id}/show_seq.json`);
        proxyUrl.searchParams.set('seq', direction);
        
        console.log('[E621API] Adjacent post proxy URL:', proxyUrl.toString());
        
        requestPromise = fetch(proxyUrl.toString(), {
          headers: {
            'Accept': 'application/json'
          },
          cache: 'no-store'
        })
        .then(async response => {
          if (response.status === 404) {
            // No adjacent post exists
            console.log(`[E621API] No ${direction} post found for ID: ${id}`);
            return null;
          }
          
          if (!response.ok) {
            throw new Error(`Adjacent post request failed: ${response.status} ${response.statusText}`);
          }
          
          const result = await response.json();
          return result.post || result; // API may return the post directly or wrapped
        });
      } else {
        // Direct API access for server-side
        requestPromise = this.makeRequest<{ post: E621Post } | E621Post>(`/posts/${id}/show_seq.json`, { seq: direction })
          .then(result => {
            if (!result) return null;
            return (result as any).post || result;
          });
      }
      
      const adjacentPost = await requestPromise;
      
      if (adjacentPost && adjacentPost.id) {
        console.log(`[E621API] Found ${direction} post:`, adjacentPost.id);
        return adjacentPost;
      }
      
      console.log(`[E621API] No ${direction} post available for ID: ${id}`);
      return null;
      
    } catch (error) {
      console.error(`[E621API] Error getting ${direction} post for ID ${id}:`, error);
      return null;
    }
  }

  public async getPool(id: number): Promise<E621Pool> {
    return this.makeRequest<E621Pool>(`/pools/${id}.json`);
  }

  public async getComments(params: CommentSearchParams = {}): Promise<E621Comment[]> {
    console.log(`[E621API] Fetching comments with params:`, params);
    
    const searchParams: Record<string, any> = {
      limit: Math.min(params.limit || 50, 320),
      page: params.page || 1,
    };

    if (params.post_id) {
      searchParams['search[post_id]'] = params.post_id;
    }
    
    if (params.creator_id) {
      searchParams['search[creator_id]'] = params.creator_id;
    }
    
    if (params.creator_name) {
      searchParams['search[creator_name]'] = params.creator_name;
    }
    
    if (params.body_matches) {
      searchParams['search[body_matches]'] = params.body_matches;
    }
    
    if (params.order) {
      searchParams['search[order]'] = params.order;
    }

    try {
      // Generate a cache key from the comment search parameters
      const cacheKey = JSON.stringify({
        endpoint: '/comments.json',
        params: searchParams
      });
      
      // Check if we have a recent cached request (within 5 seconds for comments)
      const now = Date.now();
      const cachedRequest = requestCache[cacheKey];
      
      if (cachedRequest && now - cachedRequest.timestamp < 5000) {
        console.log('[E621API] Using cached comment search for post:', params.post_id);
        return cachedRequest.promise;
      }
      
      console.log('[E621API] Making new comment API request for post:', params.post_id);
      
      let requestPromise;
      
  // In browser environment, use our proxy; in Electron, use direct
  if (typeof window !== 'undefined' && !isElectron) {
        const proxyUrl = new URL('/api/proxy', window.location.origin);
        proxyUrl.searchParams.set('endpoint', 'comments.json');
        
        // Add search parameters to the query string
        Object.entries(searchParams).forEach(([key, value]) => {
          proxyUrl.searchParams.set(key, String(value));
        });
        
        console.log('[E621API] Comment search proxy URL:', proxyUrl.toString());
        
        requestPromise = fetch(proxyUrl.toString(), {
          headers: {
            'Accept': 'application/json'
          },
          cache: 'no-store'
        })
        .then(response => {
          if (!response.ok) {
            throw new Error(`Comment search failed: ${response.status} ${response.statusText}`);
          }
          return response.json();
        });
      } else {
        // For server environment, use direct API client
        requestPromise = this.makeRequest<E621Comment[]>('/comments.json', searchParams);
      }
      
      // Store in cache
      requestCache[cacheKey] = {
        promise: requestPromise,
        timestamp: now
      };
      
      // Clean up old cache entries after 10 seconds
      setTimeout(() => {
        delete requestCache[cacheKey];
      }, 10000);
      
      const results = await requestPromise;
      
      // Handle different response formats from e621 API
      let comments: E621Comment[];
      
      // Handle empty object first (common case for posts with no comments)
      if (results && typeof results === 'object' && !Array.isArray(results) && Object.keys(results).length === 0) {
        // Empty object response - no comments for this post
        console.log(`[E621API] No comments found for post ${params.post_id} (empty object response)`);
        return [];
      } else if (Array.isArray(results)) {
        // Direct array response
        comments = results;
      } else if (results && typeof results === 'object' && Array.isArray(results.comments)) {
        // Object response with comments property
        comments = results.comments;
      } else if (results && typeof results === 'object' && results.data && Array.isArray(results.data)) {
        // Some APIs wrap data in a data property
        comments = results.data;
      } else {
        console.error('[E621API] Invalid comment search results structure:', results);
        console.error('[E621API] Expected array or object with comments property, got:', typeof results, results);
        return [];
      }
      
      console.log(`[E621API] Comment search for post ${params.post_id} returned ${comments.length} results`);
      return comments;
      
    } catch (error) {
      console.error('[E621API] Comment search error:', error);
      return [];
    }
  }

  public async searchTags(query: string): Promise<{ id: number; name: string; post_count: number; category: number }[]> {
    if (!query) {
      console.log('[E621API] Empty tag search query, returning empty results');
      return [];
    }
    
    console.log(`[E621API] Searching tags for: "${query}"`);
    
    const params = {
      'search[name_matches]': `${query}*`,
      'search[order]': 'count',
      'search[hide_empty]': 'yes',
      limit: 10,
    };
    
    try {
      // Generate a cache key from the tag search parameters
      const cacheKey = JSON.stringify({
        endpoint: '/tags.json',
        params
      });
      
      // Check if we have a recent cached request (within 500ms for tag autocomplete)
      const now = Date.now();
      const cachedRequest = requestCache[cacheKey];
      
      if (cachedRequest && now - cachedRequest.timestamp < 500) {
        console.log('[E621API] Using cached tag search for:', query);
        return cachedRequest.promise;
      }
      
      console.log('[E621API] Making new tag search request for:', query);
      
  // In browser environment, use our proxy; in Electron, use direct
  let requestPromise;
  if (typeof window !== 'undefined' && !isElectron) {
        const proxyUrl = new URL('/api/proxy', window.location.origin);
        proxyUrl.searchParams.set('endpoint', 'tags.json');
        
        // Add search parameters to the query string
        Object.entries(params).forEach(([key, value]) => {
          proxyUrl.searchParams.set(key, String(value));
        });
        
        console.log('[E621API] Tag search proxy URL:', proxyUrl.toString());
        
        requestPromise = fetch(proxyUrl.toString(), {
          headers: {
            'Accept': 'application/json'
          },
          cache: 'no-store'
        })
        .then(response => {
          if (!response.ok) {
            throw new Error(`Tag search failed: ${response.status} ${response.statusText}`);
          }
          return response.json();
        });
      } else {
        // For server environment, use direct API client
        requestPromise = this.makeRequest<any[]>('/tags.json', params);
      }
      
      // Store in cache
      requestCache[cacheKey] = {
        promise: requestPromise,
        timestamp: now
      };
      
      // Clean up old cache entries after 2 seconds
      setTimeout(() => {
        delete requestCache[cacheKey];
      }, 2000);
      
      const results = await requestPromise;
      
      if (!results || !Array.isArray(results)) {
        console.error('[E621API] Invalid tag search results:', results);
        return [];
      }
      
      console.log(`[E621API] Tag search for "${query}" returned ${results.length} results`);
      return results;
      
    } catch (error) {
      console.error('[E621API] Tag search error:', error);
      return [];
    }
  }
  
  // ... other methods from the old e621-api.ts can be migrated here
}

console.log('Creating E621ApiClient instance');
const e621api = new E621ApiClient();
console.log('Registering e621api with apiManager');
apiManager.registerClient(e621api);
console.log('E621ApiClient registration complete');

export { e621api };
