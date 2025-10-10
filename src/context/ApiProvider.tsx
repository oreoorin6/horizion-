'use client'

import { apiManager, ApiManager } from "@/lib/api/ApiManager";
import { createContext, useEffect }from "react";

// Ensure e621 client is registered - this line is critical
import '@/lib/api/e621'; 

// Ensure FurAffinity client is registered
import '@/lib/api/furaffinity';

// Direct import to verify they're loaded
import { e621api } from '@/lib/api/e621';
import { faapi } from '@/lib/api/furaffinity';

// Check if the API client is registered correctly
console.log('ApiProvider module imported');
console.log('API clients registered:', apiManager.getAllClients().map(client => client.name));
console.log('e621api name:', e621api.name);
console.log('faapi name:', faapi.name);

export const ApiContext = createContext<ApiManager>(apiManager);

export default function ApiProvider({ children }: { children: React.ReactNode }) {
    console.log('ApiProvider initialized', apiManager.getAllClients().map(client => client.name));
    return (
        <ApiContext.Provider value={apiManager}>
            {children}
        </ApiContext.Provider>
    )
}
