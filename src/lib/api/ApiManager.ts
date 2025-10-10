import { IApiClient } from "./IApiClient";

export class ApiManager {
  private clients: Map<string, IApiClient> = new Map();

  public registerClient(client: IApiClient) {
    this.clients.set(client.name, client);
  }

  public getClient<T extends IApiClient>(name: string): T | undefined {
    return this.clients.get(name) as T | undefined;
  }

  public getAllClients(): IApiClient[] {
    return Array.from(this.clients.values());
  }
}

export const apiManager = new ApiManager();

// Debug helper - only run in browser context
if (typeof window !== 'undefined') {
  (window as any).debugApiManager = apiManager;
}
