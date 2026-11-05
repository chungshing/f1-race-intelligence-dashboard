'use client';

import { CACHE_MAX_AGE, STALE } from '@/lib/cacheTimes';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { del, get, set } from 'idb-keyval';
import { useState } from 'react';

// Saved data is thrown away on every new deploy. In development it is never reused,
// so changing a data shape can't leave stale objects in the cache.
const BUSTER =
    process.env.NODE_ENV === 'production'
        ? (process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ?? 'prod')
        : `dev-${Date.now()}`;

export function Providers({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        staleTime: STALE.standings,
                        gcTime: CACHE_MAX_AGE,
                        refetchOnWindowFocus: false,
                    },
                },
            })
    );

    const [persister] = useState(() =>
        createAsyncStoragePersister({
            storage:
                typeof window === 'undefined'
                    ? undefined
                    : {
                          getItem: (key) => get<string>(key),
                          setItem: (key, value) => set(key, value),
                          removeItem: (key) => del(key),
                      },
            key: 'f1-dashboard-cache',
            throttleTime: 2000,
        })
    );

    return (
        <PersistQueryClientProvider
            client={queryClient}
            persistOptions={{
                persister,
                maxAge: CACHE_MAX_AGE,
                buster: BUSTER,
                dehydrateOptions: {
                    // Lap data is large and only worth keeping in memory.
                    shouldDehydrateQuery: (query) =>
                        query.state.status === 'success' && query.queryKey[0] !== 'sessionLaps',
                },
            }}
        >
            {children}
        </PersistQueryClientProvider>
    );
}
