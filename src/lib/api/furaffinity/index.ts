import { ApiClient } from '../api-client';
import { RateLimiter } from '../rate-limiter';
import { FASubmission, FASearchParams, FASearchResult, FAUser, FAUserGallery, FACredentials } from './types';
import { IFAApiClient } from '../IApiClient';
import { apiManager } from '../ApiManager';

// Constants for FurAffinity API access
const APP_NAME = 'E621Horizon';
const APP_VERSION = '1.0';
const CONTACT = 'https://github.com/yourusername/e621horizon';

// Detect if running in Electron
const isElectron = typeof window !== 'undefined' && 
  typeof (window as any).process !== 'undefined' && 
  (window as any).process.versions && 
  (window as any).process.versions.electron;

// Use direct API in Electron (webSecurity is disabled), proxy in browser
const API_BASE = typeof window !== 'undefined' && !isElectron
  ? '/api/proxy-fa' // Proxy endpoint for browser use to avoid CORS issues
  : 'https://www.furaffinity.net'; // Direct API access for Electron and SSR

const DIRECT_API_BASE = 'https://www.furaffinity.net'; // Always the direct URL

// User agent string for FA requests
const USER_AGENT = `${APP_NAME}/${APP_VERSION} (${CONTACT})`;

// Create a global request cache to prevent duplicate API calls
interface RequestCache {
  [key: string]: {
    promise: Promise<any>;
    timestamp: number;
  }
}

const requestCache: RequestCache = {};

export class FurAffinityApiClient extends ApiClient implements IFAApiClient {
  public readonly name = 'furaffinity';

  constructor() {
    // FA typically allows 2-3 requests per second, so we'll be conservative
    super(API_BASE, USER_AGENT, new RateLimiter(1000));
  }
  
  /**
   * Set authentication credentials for FA API requests
   * FA uses cookie-based authentication
   */
  public setAuth(headers: Record<string, string>): void;
  public setAuth(cookieA: string, cookieB: string): void;
  public setAuth(cookieAOrHeaders: string | Record<string, string>, cookieB?: string): void {
    if (typeof cookieAOrHeaders === 'string' && cookieB) {
      // Cookie-based authentication for FA
      const cookieString = `a=${cookieAOrHeaders}; b=${cookieB}`;
      super.setAuth({
        'Cookie': cookieString
      });
      console.log('[FAAPI] Cookie-based auth credentials set');
    } else if (typeof cookieAOrHeaders === 'object') {
      // If it's an object, pass it through to the parent method
      super.setAuth(cookieAOrHeaders);
      console.log('[FAAPI] Auth headers set directly');
    }
  }
  
  /**
   * Clear authentication credentials
   */
  public clearAuth(): void {
    super.setAuth({});
    console.log('[FAAPI] Auth credentials cleared');
  }

  /**
   * Test if the current credentials are valid
   * @returns Promise resolving to true if credentials are valid
   */
  public async testCredentials(): Promise<boolean> {
    try {
      // Try to access a user-specific endpoint that requires authentication
      const result = await this.makeRequest('/msg/others/');
      return true;
    } catch (error) {
      if (error instanceof Error && error.message.includes('401')) {
        console.error('[FAAPI] Authentication failed: Invalid credentials');
      } else {
        console.error('[FAAPI] Credential test failed:', error);
      }
      return false;
    }
  }

  /**
   * Search for submissions based on provided parameters
   * @param params Search parameters
   * @returns Promise with submissions array
   */
  public async searchSubmissions(params: FASearchParams = {}): Promise<FASearchResult> {
    const searchParams: Record<string, any> = {
      page: Math.max(params.page || 1, 1),
      perpage: Math.min(params.perpage || 72, 72), // FA max is 72
    };
    
    console.log(`[FAAPI] Searching submissions with page=${searchParams.page}, perpage=${searchParams.perpage}`);

    if (params.q) {
      searchParams.q = params.q;
    }
    
    if (params.order_by) {
      searchParams.order_by = params.order_by;
    }
    
    if (params.order_direction) {
      searchParams.order_direction = params.order_direction;
    }
    
    if (params.range) {
      searchParams.range = params.range;
    }
    
    if (params.mode) {
      searchParams.mode = params.mode;
    }
    
    // Handle rating filters
    if (params.rating && params.rating.length > 0) {
      searchParams.rating = params.rating.join(',');
    }
    
    // Handle type filters
    if (params.type && params.type.length > 0) {
      searchParams.type = params.type.join(',');
    }
    
    // Generate a cache key from the search parameters
    const cacheKey = JSON.stringify({
      endpoint: typeof window !== 'undefined' ? 'proxy-fa-search' : '/search/',
      params: searchParams
    });
    
    // Check if we have a recent cached request (within 2 seconds)
    const now = Date.now();
    const cachedRequest = requestCache[cacheKey];
    
    if (cachedRequest && now - cachedRequest.timestamp < 2000) {
      console.log('[FAAPI] Using cached search API request for:', params.q);
      return cachedRequest.promise;
    }
    
    console.log(`[FAAPI] Making new API request: query=${params.q}, page=${searchParams.page}`);
    
    try {
      let requestPromise;
      
      // In the browser, use our FA proxy to avoid CORS issues
      if (typeof window !== 'undefined') {
        console.log('[FAAPI] Using proxy for browser request');
        
        const proxyUrl = new URL('/api/proxy-fa', window.location.origin);
        proxyUrl.searchParams.set('endpoint', 'search');
        
        // Add all the search parameters
        Object.entries(searchParams).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            proxyUrl.searchParams.set(key, String(value));
          }
        });
        
        console.log('[FAAPI] Proxy URL:', proxyUrl.toString());
        
        requestPromise = fetch(proxyUrl.toString(), {
          headers: {
            'Accept': 'application/json'
          },
          cache: 'no-store'
        })
        .then(async response => {
          console.log('[FAAPI] Proxy response status:', response.status);
          
          if (!response.ok) {
            let errorDetails = '';
            try {
              const errorJson = await response.json();
              errorDetails = JSON.stringify(errorJson);
            } catch (e) {
              try {
                errorDetails = await response.text();
              } catch (textError) {
                errorDetails = 'Could not parse error response';
              }
            }
            
            throw new Error(`FA API proxy request failed: ${response.status} ${response.statusText}${errorDetails ? ` - ${errorDetails}` : ''}`);
          }
          
          return response.json();
        })
        .then(result => {
          console.log('[FAAPI] Received proxy response');
          
          if (!result) {
            console.error('[FAAPI] Received null or undefined response from proxy');
            return { 
              submissions: [],
              page: Number(searchParams.page) || 1,
              has_more: false
            };
          }
          
          const submissions = Array.isArray(result.submissions) ? result.submissions : [];
          console.log(`[FAAPI] Proxy request completed: query=${params.q}, got ${submissions.length} submissions`);
          
          return {
            submissions,
            page: Number(searchParams.page) || 1,
            pages: result.pages || 1,
            has_more: result.has_more || false,
            total_results: result.total_results
          };
        });
      } else {
        // For server-side rendering, use the direct API client
        console.log('[FAAPI] Using direct API client for server request');
        requestPromise = this.makeRequest<any>('/search/', searchParams)
          .then(result => {
            if (!result) {
              console.error('[FAAPI] Received null or undefined response');
              return { 
                submissions: [],
                page: Number(searchParams.page) || 1,
                has_more: false
              };
            }
            
            const submissions = Array.isArray(result.submissions) ? result.submissions : [];
            console.log(`[FAAPI] Request completed: query=${params.q}, got ${submissions.length} submissions`);
            
            return {
              submissions,
              page: Number(searchParams.page) || 1,
              pages: result.pages || 1,
              has_more: result.has_more || false,
              total_results: result.total_results
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
        console.error(`[FAAPI] Search error for query=${params.q}:`, error);
        return {
          submissions: [],
          page: Number(searchParams.page) || 1,
          has_more: false,
          error: String(error)
        } as any;
      });
    } catch (error) {
      console.error(`[FAAPI] Error creating request for query=${params.q}:`, error);
      throw error;
    }
  }

  /**
   * Get a specific submission by ID
   * @param id Submission ID
   * @returns Promise with submission details
   */
  public async getSubmission(id: string): Promise<FASubmission | null> {
    try {
      const result = await this.makeRequest<FASubmission>(`/view/${id}/`);
      return result;
    } catch (error) {
      console.error(`[FAAPI] Error fetching submission ${id}:`, error);
      return null;
    }
  }

  /**
   * Get user profile information
   * @param username Username to fetch
   * @returns Promise with user profile
   */
  public async getUserProfile(username: string): Promise<FAUser | null> {
    try {
      const result = await this.makeRequest<FAUser>(`/user/${username}/`);
      return result;
    } catch (error) {
      console.error(`[FAAPI] Error fetching user profile ${username}:`, error);
      return null;
    }
  }

  /**
   * Get user gallery
   * @param username Username
   * @param page Page number
   * @returns Promise with user gallery
   */
  public async getUserGallery(username: string, page: number = 1): Promise<FAUserGallery> {
    try {
      const result = await this.makeRequest<FAUserGallery>(`/gallery/${username}/${page}/`);
      return result || { submissions: [], page, has_more: false };
    } catch (error) {
      console.error(`[FAAPI] Error fetching gallery for ${username}:`, error);
      return { submissions: [], page, has_more: false };
    }
  }
}

console.log('Creating FurAffinityApiClient instance');
const faapi = new FurAffinityApiClient();
console.log('Registering faapi with apiManager');
apiManager.registerClient(faapi);
console.log('FurAffinityApiClient registration complete');

export { faapi };