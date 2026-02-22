# Mutation Hook Template

TanStack Mutation hook for create/update/delete operations.

## Simple Mutation

```typescript
import { toast } from '@superit/ui-core';
import {
    type UseMutateFunction,
    useMutation,
    useQueryClient,
} from '@tanstack/react-query';
import { api } from '@/lib/api';
import { {feature}Keys } from '@/utils/queryKeys';

interface {Action}{Feature}Params {
    teamKey: string;
    {feature}Key: string;
}

interface Use{Action}{Feature}MutationReturn {
    {action}{Feature}Mutation: UseMutateFunction<void, Error, {Action}{Feature}Params>;
    isPending: boolean;
}

async function {action}{Feature}({
    teamKey: _teamKey,
    {feature}Key,
}: {Action}{Feature}Params): Promise<void> {
    return api.{resource}.{action}{Feature}({ {feature}Key });
}

export function use{Action}{Feature}Mutation(): Use{Action}{Feature}MutationReturn {
    const queryClient = useQueryClient();

    const { mutate, isPending } = useMutation({
        mutationKey: [...{feature}Keys.all, '{action}'],
        mutationFn: {action}{Feature},
        onSuccess: () => {
            toast.success('{Feature} {action}d');
            void queryClient.invalidateQueries({
                queryKey: {feature}Keys.lists(),
            });
        },
        onError: (error) => {
            toast.error('Failed to {action} {feature}', {
                description: error.message,
            });
        },
    });

    return {
        {action}{Feature}Mutation: mutate,
        isPending,
    };
}
```

## Mutation with Async + Multiple Returns

For mutations needing `mutateAsync` or richer return:

```typescript
import { toast } from '@superit/ui-core';
import { ResponseError } from '@superit/ui-superit-api';
import {
    type UseMutateAsyncFunction,
    type UseMutateFunction,
    useMutation,
} from '@tanstack/react-query';
import type { {ResponseType} } from '@/lib/api';
import { api } from '@/lib/api';
import { {feature}Keys } from '@/utils/queryKeys';

interface {Action}{Feature}Params {
    // params here
}

interface Use{Action}{Feature}MutationReturn {
    {action}{Feature}Mutation: UseMutateFunction<{ResponseType}, Error, {Action}{Feature}Params>;
    {action}{Feature}MutationAsync: UseMutateAsyncFunction<{ResponseType}, Error, {Action}{Feature}Params>;
    is{Action}Pending: boolean;
    is{Action}Success: boolean;
}

async function {action}{Feature}Request(params: {Action}{Feature}Params): Promise<{ResponseType}> {
    try {
        return await api.{resource}.{action}{Feature}(params);
    } catch (error) {
        if (error instanceof ResponseError) {
            const body = (await error.response.json()) as { detail?: string };
            throw new Error(body.detail ?? '{Action} failed', { cause: error });
        }
        throw error;
    }
}

export function use{Action}{Feature}Mutation(): Use{Action}{Feature}MutationReturn {
    const { mutate, mutateAsync, isPending, isSuccess } = useMutation({
        mutationKey: {feature}Keys.all,
        mutationFn: {action}{Feature}Request,
        onSuccess: (data) => {
            toast.success('{Feature} {action}d');
        },
        onError: (error) => {
            toast.error('{Action} failed', {
                description: error.message,
            });
        },
    });

    return {
        {action}{Feature}Mutation: mutate,
        {action}{Feature}MutationAsync: mutateAsync,
        is{Action}Pending: isPending,
        is{Action}Success: isSuccess,
    };
}
```

## Key Patterns

1. **Separate async function** for mutation logic (not inline)
2. **`useQueryClient()`** for cache invalidation in `onSuccess`
3. **Toast notifications** for success/error feedback
4. **`ResponseError` handling** - extract server error details
5. **Naming**: `{action}{Feature}Mutation` for the mutate fn, `is{Action}Pending` for state
6. **Unused params** prefixed with underscore: `_teamKey`
