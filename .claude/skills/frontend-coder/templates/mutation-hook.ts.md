# Mutation Hook Template

TanStack Mutation hook for create/update/delete operations.

## Simple Mutation

```typescript
import { toast } from '@/components/ui';
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
import { toast } from '@/components/ui';
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
        if (error instanceof Error) {
            throw new Error(error.message ?? '{Action} failed', { cause: error });
        }
        throw error;
    }
}

export function use{Action}{Feature}Mutation(): Use{Action}{Feature}MutationReturn {
    const { mutate, mutateAsync, isPending, isSuccess } = useMutation({
        mutationKey: {feature}Keys.all,
        mutationFn: {action}{Feature}Request,
        onSuccess: (_result) => {
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
4. **Error handling** - extract server error details from response
5. **Naming**: `{action}{Feature}Mutation` for the mutate fn, `is{Action}Pending` for state
6. **Underscore prefix** — `_teamKey` is correct here because `teamKey` is destructured but not forwarded to the API. Remove the underscore if the param is later used
7. **`onSuccess` params** — use `_result` (with underscore) only if truly unused. If accessing the response (e.g., to navigate), use `result` without underscore
