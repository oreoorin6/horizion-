import { RateLimiter } from './rate-limiter';

export class ApiClient {
  private baseUrl: string;
  private userAgent: string;
  private rateLimiter?: RateLimiter;
  private authHeaders: Record<string, string> = {};

  constructor(baseUrl: string, userAgent: string, rateLimiter?: RateLimiter) {
    this.baseUrl = baseUrl;
    this.userAgent = userAgent;
    this.rateLimiter = rateLimiter;
  }

  public setAuth(headers: Record<string, string>) {
    this.authHeaders = headers;
  }

  protected async makeRequest<T>(endpoint: string, params?: Record<string, any>, method: 'GET' | 'POST' | 'PATCH' | 'DELETE' = 'GET', body?: any): Promise<T> {
    const task = async () => {
      const url = new URL(`${this.baseUrl}${endpoint}`);
      
      if (params && method === 'GET') {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            if (Array.isArray(value)) {
              url.searchParams.set(key, value.join(' '));
            } else {
              url.searchParams.set(key, String(value));
            }
          }
        });
      }

      const headers: Record<string, string> = {
        'User-Agent': this.userAgent,
        'Accept': 'application/json',
        ...this.authHeaders,
      };

      if (method !== 'GET' && body) {
        headers['Content-Type'] = 'application/json';
      }

      // Log the request details for debugging
      console.log(`[API] Making request to: ${url.toString()}`);
      console.log(`[API] Request headers:`, headers);
      
      try {
        const response = await fetch(url.toString(), {
          method,
          headers,
          body: body ? JSON.stringify(body) : undefined,
          mode: 'cors', // Explicitly set CORS mode
          credentials: 'omit', // Don't send cookies with the request
        });

        console.log(`[API] Response status: ${response.status} ${response.statusText}`);
        
        // Log headers that might help debug CORS issues
        console.log(`[API] Response headers:`, {
          'content-type': response.headers.get('content-type'),
          'access-control-allow-origin': response.headers.get('access-control-allow-origin'),
          'cache-control': response.headers.get('cache-control')
        });

        if (!response.ok) {
          let errorMessage = `API request failed: ${response.status} ${response.statusText}`;
          
          // Handle rate limiting specifically
          if (response.status === 429) {
            const retryAfter = response.headers.get('Retry-After');
            errorMessage = `Rate limit exceeded. ${retryAfter ? `Try again after ${retryAfter} seconds.` : 'Try again later.'}`;
          } else if (response.status === 403) {
            errorMessage = 'Forbidden access. The API may be blocking requests from this application.';
          } else if (response.status === 0 || !response.status) {
            errorMessage = 'Network error: Could not connect to the API. This may be due to CORS restrictions or network connectivity issues.';
          } else {
            try {
              const errorData = await response.json();
              if (errorData.message) {
                errorMessage = errorData.message;
              } else if (errorData.reason) {
                errorMessage = errorData.reason;
              }
            } catch {
              // Ignore if error response is not JSON
            }
          }
          throw new Error(errorMessage);
        }

        if (response.status === 204) {
          return null as T;
        }

        const responseText = await response.text();
        console.log(`[API] Response length: ${responseText.length} characters`);
        
        try {
          // Try to parse as JSON
          const jsonData = JSON.parse(responseText);
          console.log('[API] Response parsed successfully as JSON');
          
          // Log the structure of the response
          if (typeof jsonData === 'object' && jsonData !== null) {
            console.log('[API] Response structure:', Object.keys(jsonData));
            
            // If it has a posts array, log some details about it
            if (Array.isArray(jsonData.posts)) {
              console.log(`[API] Found ${jsonData.posts.length} posts in response`);
            }
          }
          
          return jsonData;
        } catch (e) {
          console.error('[API] Failed to parse response as JSON:', e);
          console.log('[API] Raw response text sample:', responseText.substring(0, 1000) + (responseText.length > 1000 ? '...' : ''));
          throw new Error(`Failed to parse API response as JSON: ${e}`);
        }
      } catch (error: unknown) {
        console.error('[API] Network or fetch error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Could not connect to API';
        throw new Error(`Network error: ${errorMessage}`);
      }
    };

    if (this.rateLimiter) {
      return this.rateLimiter.enqueue(task);
    }
    return task();
  }
}
