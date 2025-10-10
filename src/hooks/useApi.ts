'use client'

import { useContext } from 'react';
import { IApiClient } from '@/lib/api/IApiClient';
import { ApiContext } from '@/context/ApiProvider';

export function useApi<T extends IApiClient = IApiClient>(name: string): T {
    const context = useContext(ApiContext);
    if (!context) {
        console.error("useApi error: ApiProvider not found");
        throw new Error("useApi must be used within an ApiProvider");
    }
    
    const client = context.getClient<T>(name);
    if (!client) {
        console.error(`API client "${name}" has not been registered`);
        throw new Error(`API client "${name}" has not been registered.`);
    }
    
    // Type assertion to ensure the compiler knows this is a valid client
    const typedClient = client as T;
    console.log(`API client "${name}" successfully obtained`);
    return typedClient;
}
