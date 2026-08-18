# Form Component Template

TanStack Form component using `createFormHook` pattern with Zod validation.

## Schema (schemas/{feature}.schema.ts)

```typescript
import { z } from 'zod';

export const {feature}Schema = z.object({
    name: z.string().min(1, 'Name is required').max(60),
    description: z.string().min(1, 'Description is required'),
    status: z.enum(['active', 'inactive']),
    tags: z.array(z.string()).default([]),
    isEnabled: z.boolean().default(true),
});

export type {Feature}FormData = z.infer<typeof {feature}Schema>;
```

## Simple Form

```tsx
import {
    Button,
    Card,
    CardContent,
    FieldGroup,
} from '@/components/ui';
import type { ReactElement, SubmitEvent } from 'react';
import { use{Feature}Form } from '@/modules/{feature}/hooks/use{Feature}Form';
import { use{Action}{Feature}Mutation } from '@/modules/{feature}/hooks/use{Action}{Feature}Mutation';
import { {feature}Schema } from '@/modules/{feature}/schemas/{feature}.schema';

interface {Feature}FormProps {
    className?: string;
    onSuccess?: () => void;
}

export function {Feature}Form({
    className,
    onSuccess,
}: {Feature}FormProps): ReactElement {
    const { {action}{Feature}MutationAsync } = use{Action}{Feature}Mutation();

    const form = use{Feature}Form({
        defaultValues: {
            name: '',
            description: '',
            status: 'active',
            tags: [],
            isEnabled: true,
        },
        validators: {
            onChange: {feature}Schema,
        },
        onSubmit: async ({ value }) => {
            await {action}{Feature}MutationAsync(value, { onSuccess });
        },
    });

    function handleSubmit(e: SubmitEvent): void {
        e.preventDefault();
        e.stopPropagation();
        void form.handleSubmit();
    }

    return (
        <Card className={className}>
            <CardContent>
                <form onSubmit={handleSubmit}>
                    <FieldGroup>
                        <form.AppField name="name">
                            {(field) => <field.TextField label="Name" />}
                        </form.AppField>

                        <form.AppField name="description">
                            {(field) => (
                                <field.TextField label="Description" />
                            )}
                        </form.AppField>

                        <form.AppForm>
                            <form.SubmitButton
                                label="Save"
                                pendingLabel="Saving..."
                            />
                        </form.AppForm>
                    </FieldGroup>
                </form>
            </CardContent>
        </Card>
    );
}
```

## Edit Form with Controller Hook

For forms handling both create and edit:

```tsx
import {
    Button,
    Card,
    CardContent,
    FieldGroup,
} from '@/components/ui';
import type { {Feature}Detail } from '@/lib/api';
import type { ReactElement, SubmitEvent } from 'react';
import { use{Feature}Form } from '@/modules/{feature}/hooks/use{Feature}Form';
import { use{Feature}FormController } from '@/modules/{feature}/hooks/use{Feature}FormController';
import type { {Feature}FormData } from '@/modules/{feature}/schemas/{feature}.schema';
import { useActiveTeam } from '@/modules/team';

interface {Feature}FormProps {
    {feature}?: {Feature}Detail;
}

export function {Feature}Form({ {feature} }: {Feature}FormProps): ReactElement {
    const { teamKey } = useActiveTeam();
    const { isEditing, isReadOnly, handleCancel, handleSubmitForm } =
        use{Feature}FormController({ {feature}, teamKey });

    const form = use{Feature}Form({
        defaultValues: {
            name: {feature}?.name ?? '',
            description: {feature}?.description ?? '',
        } satisfies {Feature}FormData,
        onSubmit: ({ value }) => {
            handleSubmitForm(value);
        },
    });

    function handleSubmit(e: SubmitEvent): void {
        e.preventDefault();
        e.stopPropagation();
        void form.handleSubmit();
    }

    return (
        <form onSubmit={handleSubmit}>
            <Card>
                <CardContent className="flex flex-col gap-6 pt-6">
                    <form.AppField name="name">
                        {(field) => (
                            <field.TextField label="Name" disabled={isReadOnly} />
                        )}
                    </form.AppField>

                    <form.AppField name="description">
                        {(field) => (
                            <field.TextField
                                label="Description"
                                disabled={isReadOnly}
                            />
                        )}
                    </form.AppField>

                    {!isReadOnly && (
                        <div className="flex justify-end gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleCancel}
                            >
                                Cancel
                            </Button>
                            <form.AppForm>
                                <form.SubmitButton
                                    label={isEditing ? 'Save Changes' : 'Create'}
                                    pendingLabel="Saving..."
                                />
                            </form.AppForm>
                        </div>
                    )}
                </CardContent>
            </Card>
        </form>
    );
}
```

## Custom Field Renderers

For complex fields (Select, Switch, Textarea), extract to `{feature}FormFieldRenderers.tsx`:

```tsx
import {
    Field,
    FieldDescription,
    FieldLabel,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    Switch,
} from '@/components/ui';
import type { ReactElement } from 'react';

interface SelectField {
    state: { value: string };
    handleChange: (value: string) => void;
}

interface BooleanField {
    state: { value: boolean };
    handleChange: (value: boolean) => void;
}

export function render{Feature}StatusField(
    field: SelectField,
    isReadOnly: boolean,
): ReactElement {
    return (
        <Field>
            <FieldLabel>Status</FieldLabel>
            <Select
                value={field.state.value}
                onValueChange={field.handleChange}
                disabled={isReadOnly}
            >
                <SelectTrigger>
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
            </Select>
        </Field>
    );
}

export function render{Feature}EnabledField(
    field: BooleanField,
    isReadOnly: boolean,
): ReactElement {
    return (
        <Field orientation="horizontal" className="justify-between">
            <div>
                <FieldLabel>Enabled</FieldLabel>
                <FieldDescription>Toggle feature on/off</FieldDescription>
            </div>
            <Switch
                checked={field.state.value}
                onCheckedChange={field.handleChange}
                disabled={isReadOnly}
            />
        </Field>
    );
}
```

## Key Patterns

1. **Form hook** from `createFormHook` with `AppField`/`AppForm`/`SubmitButton`
2. **Zod validators** passed to `validators.onChange`
3. **`satisfies` operator** on `defaultValues` for type safety
4. **`handleSubmit` wrapper** prevents default + stops propagation
5. **Custom renderers** in separate file for complex field types
6. **Controller hook** separates create/edit business logic from form UI
