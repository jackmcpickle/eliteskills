# Query Hook Template

TanStack Query hook for fetching data.

```typescript
import type { {ResponseType} } from '@superit/ui-superit-api';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { {feature}Keys } from '@/utils/queryKeys';

interface Use{Feature}QueryReturn {
    {feature}: {ResponseType} | undefined;
    is{Feature}Loading: boolean;
    is{Feature}Error: boolean;
}

export function use{Feature}Query(teamKey: string): Use{Feature}QueryReturn {
    const { data, isPending, isError } = useQuery({
        queryKey: {feature}Keys.detail(teamKey),
        queryFn: async () => api.{resource}.get{Feature}({ teamKey }),
        enabled: Boolean(teamKey),
    });

    return {
        {feature}: data,
        is{Feature}Loading: isPending,
        is{Feature}Error: isError,
    };
}
```

## Parameterized Query Variant

For queries with filters/pagination:

```typescript
import type { {ResponseType} } from '@superit/ui-superit-api';
import type { UseQueryOptions } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { {feature}Keys } from '@/utils/queryKeys';

export interface {Feature}QueryParams {
    teamKey: string;
    search?: string;
    status?: string;
    page?: number;
    pageSize?: number;
}

interface Use{Feature}QueryReturn {
    {featurePlural}: {ResponseType}[] | undefined;
    {featurePlural}Count: number | undefined;
    is{Feature}Loading: boolean;
}

export function use{Feature}Query(
    params: {Feature}QueryParams,
    options?: Pick<UseQueryOptions, 'enabled'>,
): Use{Feature}QueryReturn {
    const { data, isPending } = useQuery({
        queryKey: {feature}Keys.list(params),
        queryFn: async () => api.{resource}.list{Feature}(params),
        enabled: options?.enabled ?? Boolean(params.teamKey),
    });

    return {
        {featurePlural}: data?.items,
        {featurePlural}Count: data?.totalCount,
        is{Feature}Loading: isPending,
    };
}
```

## Key Patterns

1. **Named return interface** - `Use{Feature}QueryReturn`
2. **Renamed state props** - `isPending` → `is{Feature}Loading`
3. **Centralized query keys** - from `@/utils/queryKeys`
4. **API client only** - never use `fetch()` directly
5. **Conditional queries** - `enabled` flag for dependent queries
