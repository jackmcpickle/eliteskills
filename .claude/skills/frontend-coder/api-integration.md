# API Integration

How to fetch data and interact with the FastAPI backend from the frontend.

## Generated API Client

The API client is auto-generated from OpenAPI spec into `src/ui-superit-api/`. Import as `@superit/superit-api`.

```typescript
import { TicketsApi, Configuration } from '@superit/superit-api';

const api = new TicketsApi(new Configuration({ basePath: '/api' }));
```

## TanStack Query for Data Fetching

### Query Hook Pattern

```typescript
// hooks/useTicketsQuery.ts
import { useQuery } from '@tanstack/react-query';

export function useTicketsQuery(teamKey: string) {
    return useQuery({
        queryKey: ['tickets', teamKey],
        queryFn: () => api.listTickets(teamKey),
    });
}
```

### Mutation Hook Pattern

```typescript
// hooks/useCreateTicketMutation.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useCreateTicketMutation(teamKey: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateTicketBody) => api.createTicket(teamKey, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tickets', teamKey] });
        },
    });
}
```

### Usage in Components

```typescript
function TicketsList(): ReactElement {
    const { data, isLoading, error } = useTicketsQuery('team-key')

    if (isLoading) return <Spinner />
    if (error) return <ErrorMessage error={error} />

    return (
        <ul>
            {data?.map(ticket => (
                <TicketItem key={ticket.key} ticket={ticket} />
            ))}
        </ul>
    )
}
```

## Response Validation with Zod

For non-generated API calls, validate at boundaries:

```typescript
import { z } from 'zod';

const TicketSchema = z.object({
    key: z.string(),
    title: z.string(),
    status: z.string(),
    createdAt: z.string().datetime(),
});

type Ticket = z.infer<typeof TicketSchema>;

async function fetchTicket(key: string): Promise<Ticket | null> {
    const response = await fetch(`/api/tickets/${key}`);
    const json = await response.json();
    const result = TicketSchema.safeParse(json);

    if (!result.success) {
        console.error('Invalid response:', result.error.format());
        return null;
    }

    return result.data;
}
```

## API Client Regeneration

After backend API changes:

```bash
make build-superit-api
```

This requires a running FastAPI server (`make start-bg` first). Regeneration touches all files in `src/ui-superit-api/`.
