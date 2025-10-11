# API References for E621 Horizon

## E621.net API

### Official Documentation
- **OpenAPI Specification**: https://e621.wiki/openapi.yaml
- **API Documentation**: https://e621.net/help/api
- **Wiki API Guide**: https://e621.wiki/help:api

### Base URLs
- **Production API**: `https://e621.net`
- **API Version**: v2 (current)
- **Rate Limit**: 1 request per second (2 requests/second for authenticated users)

### Authentication
- **Method**: HTTP Basic Authentication
- **Format**: `Authorization: Basic base64(username:api_key)`
- **API Key**: Obtained from user settings on e621.net
- **User Agent**: Required format: `ApplicationName/Version (contact_info)`

### Key Endpoints Used

#### Posts
- `GET /posts.json` - Search posts
  - Parameters: `tags`, `limit`, `page`, `md5`
  - Max limit: 320 posts per request
  - Max page: 750

#### Tags  
- `GET /tags.json` - Search tags
  - Parameters: `search[name_matches]`, `search[order]`, `limit`

#### Pools
- `GET /pools/{id}.json` - Get pool details
- `GET /pools.json` - Search pools

#### User Data (Authenticated)
- `GET /favorites.json` - User favorites
- `GET /users/index.json` - Current user info

### Response Structure
```typescript
interface E621ApiResponse<T> {
  posts?: T[];
  tags?: T[];
  // Other endpoint-specific fields
}
```

### Error Codes
- `401` - Unauthorized (invalid credentials)
- `403` - Forbidden (insufficient permissions)
- `422` - Unprocessable Entity (invalid parameters)
- `429` - Too Many Requests (rate limit exceeded)

## Implementation in E621 Horizon

### Proxy Route Pattern
```typescript
// Browser requests go through our proxy to avoid CORS
fetch('/api/proxy?endpoint=posts.json&tags=wolf&limit=50')

// Server-side can call directly
fetch('https://e621.net/posts.json?tags=wolf&limit=50')
```

### Rate Limiting Implementation
```typescript
// RateLimiter class enforces 1.8 requests/second
const rateLimiter = new RateLimiter(1000 / 1.8); // ~556ms between requests
```

### Authentication Setup
```typescript
// E621 - HTTP Basic Auth
const auth = btoa(`${username}:${apiKey}`);
e621api.setAuth({ 'Authorization': `Basic ${auth}` });

// FurAffinity - Cookie-based (future implementation)
faapi.setAuth({ 'Cookie': cookieString });
```

### Multi-API Client Pattern
```typescript
// Example of adding FurAffinity API client
export class FurAffinityApiClient extends ApiClient implements IApiClient {
  public readonly name = 'furaffinity';
  
  constructor() {
    super('https://furaffinity.net', 'E621Horizon/1.0', new RateLimiter(2000));
  }
  
  // Override auth for cookie-based authentication
  public setAuth(headers: Record<string, string>): void {
    super.setAuth(headers);
  }
  
  public async searchSubmissions(query: string): Promise<any[]> {
    return this.makeRequest('/search', { q: query });
  }
}

// Register with API manager
const faapi = new FurAffinityApiClient();
apiManager.registerClient(faapi);
```

## External APIs (Future Integration)

### FurAffinity API
- **GitHub Repository**: https://github.com/recallfuture/furaffinity-api
- **Purpose**: Access FurAffinity content and user data
- **Authentication**: Cookie-based authentication required
- **Status**: Potential integration for multi-platform support

#### Key FurAffinity Endpoints
- `GET /user/{username}` - User profile information
- `GET /user/{username}/gallery` - User gallery
- `GET /submission/{id}` - Submission details
- `GET /search` - Search submissions

#### Integration Considerations
- Requires handling FA's cookie-based auth system
- Different content structure than e621
- Rate limiting may differ from e621 patterns
- CORS handling needed similar to e621 implementation

### Google Gemini Vision (AI Analysis)
- **Endpoint**: Google AI Studio API
- **Purpose**: Image analysis and tag suggestion
- **Status**: Placeholder implementation in `src/ai/flows/`

### Other Potential APIs
- **Inkbunny API**: For additional furry art platform integration
- **Image Recognition Services**: For automated tagging
- **Translation APIs**: For tag translations

## Development Testing

### API Testing Endpoints
- `GET /api/ping` - Health check for our API routes
- `GET /api/proxy` - Test proxy functionality
- `/test` page - Interactive API testing interface

### Debug Tools
- Browser DevTools Network tab for request inspection
- `window.debugApiManager` - Access API manager in browser console
- Console logging enabled in development mode

## Security Considerations

### CORS Handling
- Electron app: `webSecurity: false` in BrowserWindow
- Browser: Use `/api/proxy` route for all e621.net requests
- Never expose API keys in client-side code

### Credential Storage
- Store in localStorage with error handling
- Clear on logout or authentication failure
- Never log credentials in console output

## Rate Limiting Best Practices

### Request Caching
- Cache identical requests for 2 seconds
- Cache tag searches for 500ms (autocomplete)
- Implement request deduplication

### Backoff Strategy
- 5-second delay after API errors
- Exponential backoff for repeated failures
- User feedback for rate limit issues

## Troubleshooting Common Issues

### CORS Errors
- Ensure requests go through `/api/proxy` in browser
- Check Electron webSecurity settings
- Verify User-Agent header is set

### Authentication Failures
- Validate API key format and permissions
- Check if account has API access enabled
- Test with minimal request (favorites endpoint)

### Rate Limiting
- Monitor request frequency in network tab
- Implement proper debouncing in UI
- Handle 429 responses gracefully

### Multi-Platform Integration
- Each API client needs separate proxy route if CORS issues exist
- Different authentication patterns require flexible `setAuth()` implementations
- Unify response formats through TypeScript interfaces
- Consider separate hook patterns: `useE621Search`, `useFASearch`, etc.