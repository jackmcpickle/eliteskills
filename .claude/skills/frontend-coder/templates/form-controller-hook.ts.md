# Form Controller Hook Template

Separates form business logic (create/edit/delete + navigation) from form UI.

```typescript
import type { {Feature}Detail } from '@superit/ui-superit-api';
import { useNavigate } from '@tanstack/react-router';
import { useCreate{Feature}Mutation } from '@/modules/{feature}/hooks/useCreate{Feature}Mutation';
import { useUpdate{Feature}Mutation } from '@/modules/{feature}/hooks/useUpdate{Feature}Mutation';
import type { {Feature}FormData } from '@/modules/{feature}/schemas/{feature}.schema';

interface Use{Feature}FormControllerParams {
    {feature}: {Feature}Detail | undefined;
    teamKey: string;
}

interface Use{Feature}FormControllerReturn {
    isEditing: boolean;
    isReadOnly: boolean;
    handleCancel: () => void;
    handleSubmitForm: (value: {Feature}FormData) => void;
}

export function use{Feature}FormController({
    {feature},
    teamKey,
}: Use{Feature}FormControllerParams): Use{Feature}FormControllerReturn {
    const navigate = useNavigate();
    const { create{Feature}Mutation } = useCreate{Feature}Mutation();
    const { update{Feature}Mutation } = useUpdate{Feature}Mutation();

    const isEditing = !!{feature};
    const isReadOnly = {feature}?.scope === 'global';

    function handleSubmitForm(value: {Feature}FormData): void {
        if (isReadOnly) return;

        if (isEditing && {feature}) {
            update{Feature}Mutation({
                teamKey,
                {feature}Key: {feature}.key ?? '',
                data: value,
            });
            return;
        }

        create{Feature}Mutation(
            { teamKey, data: value },
            {
                onSuccess: (result) => {
                    const {feature}Key = result.key ?? null;
                    if (!{feature}Key) return;

                    void navigate({
                        to: '/t/$teamKey/{feature}/${{feature}Key}',
                        params: { teamKey, {feature}Key },
                    });
                },
            },
        );
    }

    function handleCancel(): void {
        void navigate({
            to: '/t/$teamKey/{feature}',
            params: { teamKey },
        });
    }

    return {
        isEditing,
        isReadOnly,
        handleCancel,
        handleSubmitForm,
    };
}
```

## Key Patterns

1. **Separate from form UI** - form component stays thin
2. **Handles create vs edit** branching via `isEditing` flag
3. **Navigation on success** - `useNavigate()` for routing after create
4. **Read-only guard** - prevents submission for read-only items
5. **Named return interface** - `Use{Feature}FormControllerReturn`
