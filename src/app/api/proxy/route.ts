import { NextRequest, NextResponse } from 'next/server';

const USER_AGENT = 'E621Horizon/1.0 (https://github.com/yourusername/e621horizon)';
const API_BASE = 'https://e621.net';
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
    
    // Build the target URL
    const url = new URL(`${API_BASE}/${endpoint}`);
    
    // Copy all other query parameters
    searchParams.forEach((value, key) => {
      if (key !== 'endpoint') {
        url.searchParams.append(key, value);
      }
    });
    
    if (DEBUG) console.log(`[API Proxy] Proxying request to: ${url.toString()}`);
    
    // Make the request to e621.net
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    try {
      const response = await fetch(url.toString(), {
        headers: {
          'User-Agent': USER_AGENT,
          'Accept': 'application/json'
        },
        // Add cache control to prevent stale responses
        cache: 'no-store',
        // Add signal for timeout
        signal: controller.signal
      });
      
      // Clear the timeout since the request completed
      clearTimeout(timeoutId);
      
      // Log response details for debugging
      if (DEBUG) {
        console.log(`[API Proxy] Response from e621: 
          Status: ${response.status} ${response.statusText}
          Content-Type: ${response.headers.get('content-type')}
          Content-Length: ${response.headers.get('content-length')}
        `);
      }
      
      if (!response.ok) {
        console.error(`[API Proxy] e621.net API error: ${response.status} ${response.statusText}`);
        return NextResponse.json(
          { error: `API returned an error: ${response.status} ${response.statusText}` },
          { status: response.status }
        );
      }
      
      try {
        // Get the response as JSON
        const data = await response.json();
        
        // Add validation to ensure the response is what we expect
        if (!data) {
          console.error('[API Proxy] API returned null or undefined data');
          return NextResponse.json(
            { error: 'API returned invalid data structure', details: 'Null or undefined response' },
            { status: 500 }
          );
        }
        
        // Log successful response
        if (DEBUG) console.log('[API Proxy] Successfully proxied request, returning data');
        
        // Return the response
        return NextResponse.json(data);
      } catch (jsonError) {
        console.error('[API Proxy] Error parsing JSON response:', jsonError);
        return NextResponse.json(
          { 
            error: 'Failed to parse API response as JSON',
            details: jsonError instanceof Error ? jsonError.message : String(jsonError)
          },
          { status: 500 }
        );
      }
    } catch (fetchError) {
      console.error('[API Proxy] Fetch error:', fetchError);
      // Clean up the timeout if there's an error
      clearTimeout(timeoutId);
      
      // Handle timeout specifically
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        return NextResponse.json(
          { error: 'Request timed out while connecting to e621.net API', details: 'Request exceeded 10 seconds' },
          { status: 504 } // Gateway Timeout
        );
      }
      
      // Handle other fetch errors
      return NextResponse.json(
        { error: 'Error fetching from e621.net API', details: fetchError instanceof Error ? fetchError.message : String(fetchError) },
        { status: 502 } // Bad Gateway
      );
    }
  } catch (error) {
    console.error('[API Proxy] Error:', error);
    // Add more detailed error information
    const errorDetails = {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      type: error instanceof Error ? error.constructor.name : typeof error
    };
    console.error('[API Proxy] Error details:', errorDetails);
    
    return NextResponse.json(
      { 
        error: 'An error occurred while proxying the request',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}