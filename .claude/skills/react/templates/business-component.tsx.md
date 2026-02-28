# Business Component Template

Components with hooks, data fetching, state management, and event handlers. Live in `modules/*/components/`.

```tsx
import { Button } from '@/components/ui';
import { useNavigate } from '@tanstack/react-router';
import { Loader2 } from 'lucide-react';
import { type ReactElement, useState } from 'react';
import { Heading } from '@/components/Heading';
import { use{Action}{Feature}Mutation } from '@/modules/{feature}/hooks/use{Action}{Feature}Mutation';
import { useActiveTeam } from '@/modules/team';
import { use{Feature}Query } from '@/modules/{feature}/hooks/use{Feature}Query';
import type { {Feature} } from '@/modules/{feature}/types';

interface {Feature}SectionProps {
    parentKey: string;
}

export function {Feature}Section({
    parentKey,
}: {Feature}SectionProps): ReactElement {
    const { teamKey } = useActiveTeam();
    const navigate = useNavigate();
    const { {action}{Feature}Mutation } = use{Action}{Feature}Mutation();
    const [dialogOpen, setDialogOpen] = useState(false);

    const {
        {featurePlural},
        {featurePlural}Count,
        is{Feature}Loading,
    } = use{Feature}Query(teamKey, parentKey);

    function handleCreate(): void {
        {action}{Feature}Mutation(
            { teamKey, parentKey },
            {
                onSuccess: (data) => {
                    void navigate({
                        to: '/t/$teamKey/{feature}/${{feature}Key}',
                        params: { teamKey, {feature}Key: data.key },
                    });
                },
            },
        );
    }

    function handleSelect({feature}Key: string): void {
        setDialogOpen(false);
        void navigate({
            to: '/t/$teamKey/{feature}/${{feature}Key}',
            params: { teamKey, {feature}Key },
        });
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex justify-between gap-4">
                <Heading as="h3" size="lg">
                    {featurePlural}Count} items
                </Heading>
                <div className="flex gap-4">
                    <Button
                        size="sm"
                        variant="neutral"
                        onClick={() => { setDialogOpen(true); }}
                    >
                        Browse existing
                    </Button>
                    <Button
                        size="sm"
                        variant="secondary"
                        onClick={handleCreate}
                    >
                        Create new
                    </Button>
                </div>
            </div>

            <div className="flex flex-col gap-2">
                {is{Feature}Loading && (
                    <div className="flex items-center justify-center py-4">
                        <Loader2 className="size-4 animate-spin text-muted-foreground" />
                    </div>
                )}
                {!is{Feature}Loading && {featurePlural}.length === 0 && (
                    <div className="text-sm text-muted-foreground">
                        No items linked yet.
                    </div>
                )}
                {/* Map items to presentation components */}
            </div>
        </div>
    );
}
```

## Key Patterns

1. **Multiple hooks** - query, mutation, navigation, team context, local state
2. **`handle*` prefix** on event handlers
3. **Mutation with `onSuccess` callback** for navigation after create
4. **Loading state** with `Loader2` spinner
5. **Empty state** handled inline
6. **Props** use `on*` prefix for callback props passed to children
7. **Return type** always `ReactElement` (or `ReactElement | null` with guards)
8. **Imports** from hooks/, modules/, utils/ (not from external APIs directly)
