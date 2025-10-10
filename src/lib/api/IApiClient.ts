// Base interface that all API clients must implement
export interface IApiClient {
  readonly name: string;
  setAuth(headers: Record<string, string>): void;
  testCredentials(): Promise<boolean>;
}

// E621-specific interface extending the base
export interface IE621ApiClient extends IApiClient {
  searchPosts(params: any): Promise<any>;
  searchTags(query: string): Promise<any[]>;
  getPost(id: number): Promise<any>;
  getPool(id: number): Promise<any>;
}

// FurAffinity-specific interface extending the base
export interface IFAApiClient extends IApiClient {
  searchSubmissions(params: any): Promise<any>;
  getSubmission(id: string): Promise<any>;
  getUserProfile(username: string): Promise<any>;
  getUserGallery(username: string, page?: number): Promise<any>;
}
