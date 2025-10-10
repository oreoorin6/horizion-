import { NextRequest, NextResponse } from 'next/server';

const USER_AGENT = 'E621Horizon/1.0 (https://github.com/yourusername/e621horizon)';
const API_BASE = 'https://www.furaffinity.net';
const DEBUG = true; // Enable for detailed logging

export async function GET(request: NextRequest) {
  try {
    // Get the URL from the request
    const { searchParams } = new URL(request.url);
    
    // Get the endpoint parameter
    const endpoint = searchParams.get('endpoint');
    
    if (!endpoint) {
      return NextResponse.json(
        { error: 'Missing endpoint parameter' },
        { status: 400 }
      );
    }
    
    // Build the target URL based on endpoint
    let targetPath = '';
    switch (endpoint) {
      case 'search':
        targetPath = '/search/';
        break;
      case 'view':
        const id = searchParams.get('id');
        if (!id) {
          return NextResponse.json(
            { error: 'Missing id parameter for view endpoint' },
            { status: 400 }
          );
        }
        targetPath = `/view/${id}/`;
        break;
      case 'user':
        const username = searchParams.get('username');
        if (!username) {
          return NextResponse.json(
            { error: 'Missing username parameter for user endpoint' },
            { status: 400 }
          );
        }
        targetPath = `/user/${username}/`;
        break;
      case 'gallery':
        const galleryUser = searchParams.get('username');
        const page = searchParams.get('page') || '1';
        if (!galleryUser) {
          return NextResponse.json(
            { error: 'Missing username parameter for gallery endpoint' },
            { status: 400 }
          );
        }
        targetPath = `/gallery/${galleryUser}/${page}/`;
        break;
      default:
        return NextResponse.json(
          { error: `Unsupported endpoint: ${endpoint}` },
          { status: 400 }
        );
    }
    
    const url = new URL(`${API_BASE}${targetPath}`);
    
    // Copy relevant query parameters for search
    if (endpoint === 'search') {
      const searchFields = ['q', 'page', 'perpage', 'order_by', 'order_direction', 'range', 'mode', 'rating', 'type'];
      searchFields.forEach(field => {
        const value = searchParams.get(field);
        if (value) {
          url.searchParams.append(field, value);
        }
      });
    }
    
    if (DEBUG) console.log(`[FA API Proxy] Proxying request to: ${url.toString()}`);
    
    // Make the request to FurAffinity
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout (FA can be slow)
    
    try {
      // Get any auth cookies from the request headers
      const authCookie = request.headers.get('cookie');
      
      const headers: Record<string, string> = {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      };
      
      // Add auth cookie if provided
      if (authCookie) {
        headers['Cookie'] = authCookie;
      }
      
      const response = await fetch(url.toString(), {
        headers,
        // Add cache control to prevent stale responses
        cache: 'no-store',
        // Add signal for timeout
        signal: controller.signal
      });
      
      // Clear the timeout since the request completed
      clearTimeout(timeoutId);
      
      // Log response details for debugging
      if (DEBUG) {
        console.log(`[FA API Proxy] Response from FurAffinity: 
          Status: ${response.status} ${response.statusText}
          Content-Type: ${response.headers.get('content-type')}
          Content-Length: ${response.headers.get('content-length')}
        `);
      }
      
      if (!response.ok) {
        console.error(`[FA API Proxy] FurAffinity API error: ${response.status} ${response.statusText}`);
        return NextResponse.json(
          { error: `FA API returned an error: ${response.status} ${response.statusText}` },
          { status: response.status }
        );
      }
      
      try {
        // Get the response as text first (FA returns HTML, not JSON)
        const htmlContent = await response.text();
        
        if (DEBUG) console.log('[FA API Proxy] Received HTML response, length:', htmlContent.length);
        
        // For now, we'll return a placeholder JSON structure
        // In a real implementation, you'd parse the HTML to extract data
        // This would require implementing HTML parsing for each endpoint
        const mockResponse = {
          success: true,
          endpoint,
          message: 'FA API integration is a placeholder - HTML parsing not implemented',
          htmlLength: htmlContent.length,
          // For search endpoint, return mock structure
          ...(endpoint === 'search' && {
            submissions: [],
            page: parseInt(searchParams.get('page') || '1'),
            has_more: false,
            total_results: 0
          })
        };
        
        if (DEBUG) console.log('[FA API Proxy] Returning mock response structure');
        
        // Return the mock response
        return NextResponse.json(mockResponse);
      } catch (parseError) {
        console.error('[FA API Proxy] Error processing FA response:', parseError);
        return NextResponse.json(
          { 
            error: 'Failed to process FA API response',
            details: parseError instanceof Error ? parseError.message : String(parseError),
            note: 'FA returns HTML that requires parsing - not yet implemented'
          },
          { status: 500 }
        );
      }
    } catch (fetchError) {
      console.error('[FA API Proxy] Fetch error:', fetchError);
      // Clean up the timeout if there's an error
      clearTimeout(timeoutId);
      
      // Handle timeout specifically
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        return NextResponse.json(
          { error: 'Request timed out while connecting to FurAffinity API', details: 'Request exceeded 15 seconds' },
          { status: 504 } // Gateway Timeout
        );
      }
      
      // Handle other fetch errors
      return NextResponse.json(
        { error: 'Error fetching from FurAffinity API', details: fetchError instanceof Error ? fetchError.message : String(fetchError) },
        { status: 502 } // Bad Gateway
      );
    }
  } catch (error) {
    console.error('[FA API Proxy] Error:', error);
    const errorDetails = {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      type: error instanceof Error ? error.constructor.name : typeof error
    };
    console.error('[FA API Proxy] Error details:', errorDetails);
    
    return NextResponse.json(
      { 
        error: 'An error occurred while proxying the FA request',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}