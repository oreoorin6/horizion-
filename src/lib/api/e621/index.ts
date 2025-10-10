import { ApiClient } from '../api-client';
import { RateLimiter } from '../rate-limiter';
import { E621Post, E621Pool, SearchParams, E621Tag } from './types';
import { IE621ApiClient } from '../IApiClient';
import { apiManager } from '../ApiManager';

// Constants for API access
const API_VERSION = 2; // e621 API is currently v2
const APP_NAME = 'E621Horizon';
const APP_VERSION = '1.0';
const CONTACT = 'https://github.com/yourusername/e621horizon'; // Update this with your actual contact info

// Use our API proxy in the browser, direct API access in Node.js
const API_BASE = typeof window !== 'undefined' 
  ? '/api/proxy' // Proxy endpoint for browser use to avoid CORS issues
  : 'https://e621.net'; // Direct API access for server-side rendering

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
   * Test if the current credentials are valid
   * @returns Promise resolving to true if credentials are valid
   */
  public async testCredentials(): Promise<boolean> {
    try {
      // Using the favorites endpoint as it requires authentication
      const result = await this.makeRequest('/favorites.json', { limit: 1 });
      return true;
    } catch (error) {
      if (error instanceof Error && error.message.includes('401')) {
        console.error('[E621API] Authentication failed: Invalid credentials');
      } else {
        console.error('[E621API] Credential test failed:', error);
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
      if (typeof window !== 'undefined') {
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
          
          // Calculate a more accurate total pages value
          // E621 typically returns a specific number of posts per page (up to the limit)
          // If we get a full page of results (same as limit), there are likely more pages
          const postsPerPage = searchParams.limit || 50;
          const hasMorePages = validPosts.length >= postsPerPage;
          const estimatedTotalPages = hasMorePages ? 
            Math.max(Number(searchParams.page) + 20, 50) :   // If we have a full page, there are likely many more pages
            Math.max(Number(searchParams.page), 1);          // Otherwise, this is likely the last page
          
          console.log(`[E621API] Estimated total pages: ${estimatedTotalPages} (current page: ${searchParams.page}, posts: ${validPosts.length}/${postsPerPage})`);
          
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
            
            return { 
              posts: validPosts,
              page: Number(searchParams.page) || 1,
              totalPages: validPosts.length > 0 ? Math.max(Number(searchParams.page) + 1, 10) : 0 
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

  public async getPool(id: number): Promise<E621Pool> {
    return this.makeRequest<E621Pool>(`/pools/${id}.json`);
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
      
      // In browser environment, use our proxy
      let requestPromise;
      if (typeof window !== 'undefined') {
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
