# Simple Form Example

Profile settings form with TanStack Form + Zod validation.

## File Structure

```
src/modules/account/
├── schemas/
│   └── profile.schema.ts
├── hooks/
│   ├── useProfileForm.ts          # createFormHook instance
│   └── useUpdateProfileMutation.ts
└── components/
    └── ProfileForm.tsx
```

## schemas/profile.schema.ts

```typescript
import { z } from 'zod';

export const profileSchema = z.object({
    name: z.string().min(1, 'Name is required').max(60),
    displayName: z.string().max(60),
});

export type ProfileFormData = z.infer<typeof profileSchema>;
```

## hooks/useUpdateProfileMutation.ts

```typescript
import { toast } from '@/components/ui';
import {
    type UseMutateFunction,
    useMutation,
    useQueryClient,
} from '@tanstack/react-query';
import { api } from '@/lib/api';
import { userKeys } from '@/utils/queryKeys';
import type { ProfileFormData } from '@/modules/account/schemas/profile.schema';

interface UseUpdateProfileMutationReturn {
    updateProfileMutation: UseMutateFunction<void, Error, ProfileFormData>;
    isPending: boolean;
}

export function useUpdateProfileMutation(): UseUpdateProfileMutationReturn {
    const queryClient = useQueryClient();

    const { mutate, isPending } = useMutation({
        mutationKey: [...userKeys.all, 'update'],
        mutationFn: async (data: ProfileFormData) =>
            api.users.updateProfile({ updateProfileRequest: data }),
        onSuccess: () => {
            toast.success('Profile updated');
            void queryClient.invalidateQueries({
                queryKey: userKeys.profile(),
            });
        },
        onError: (error) => {
            toast.error('Failed to update profile', {
                description: error.message,
            });
        },
    });

    return { updateProfileMutation: mutate, isPending };
}
```

## components/ProfileForm.tsx

```typescript
import { Card, CardContent, FieldGroup } from '@/components/ui';
import type { ReactElement, SubmitEvent } from 'react';
import { useProfileForm } from '@/modules/account/hooks/useProfileForm';
import { useUpdateProfileMutation } from '@/modules/account/hooks/useUpdateProfileMutation';
import { useAuthContext } from '@/modules/account/providers/AuthenticationContext';
import { profileSchema } from '@/modules/account/schemas/profile.schema';

export function ProfileForm(): ReactElement {
    const { user } = useAuthContext();
    const { updateProfileMutation } = useUpdateProfileMutation();

    const form = useProfileForm({
        defaultValues: {
            name: user?.name ?? '',
            displayName: user?.displayName ?? '',
        },
        validators: {
            onChange: profileSchema,
        },
        onSubmit: ({ value }) => {
            updateProfileMutation(value);
        },
    });

    function handleSubmit(e: SubmitEvent): void {
        e.preventDefault();
        e.stopPropagation();
        void form.handleSubmit();
    }

    if (!user) {
        return <div>Loading...</div>;
    }

    return (
        <Card>
            <CardContent>
                <form onSubmit={handleSubmit}>
                    <FieldGroup>
                        <form.AppField name="name">
                            {(field) => <field.TextField label="Name" />}
                        </form.AppField>

                        <form.AppField name="displayName">
                            {(field) => (
                                <field.TextField
                                    label="Display Name"
                                    required={false}
                                />
                            )}
                        </form.AppField>

                        <form.AppForm>
                            <div>
                                <form.SubmitButton
                                    label="Save Changes"
                                    pendingLabel="Saving..."
                                />
                            </div>
                        </form.AppForm>
                    </FieldGroup>
                </form>
            </CardContent>
        </Card>
    );
}
```

## Key Patterns

1. **Zod schema** defines validation + infers TypeScript type
2. **TanStack Form** via `createFormHook` with `AppField`/`SubmitButton`
3. **Mutation hook** handles API call + cache invalidation + toast
4. **`handleSubmit` wrapper** with `preventDefault` + `stopPropagation`
5. **Context for defaults** - user data from `useAuthContext`
6. **`validators.onChange`** for real-time validation
