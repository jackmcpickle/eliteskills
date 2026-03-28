# Schemas Template

Standard Zod validation schemas for API boundaries.

```typescript
/**
 * {FeatureName} Validation Schemas
 *
 * Zod schemas for validating API responses at the boundary.
 * Type inference via z.infer<> ensures TypeScript types match validation.
 */
import { z } from 'zod';

// =============================================================================
// Data Schemas
// =============================================================================

export const ItemSchema = z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    createdAt: z.string(), // ISO datetime string
});

// Infer TypeScript type from schema
export type Item = z.infer<typeof ItemSchema>;

// =============================================================================
// Form Validation Schemas
// =============================================================================

export const ItemDraftSchema = z.object({
    name: z
        .string()
        .min(1, 'Name is required')
        .max(100, 'Name must be 100 characters or less'),
    description: z
        .string()
        .max(1000, 'Description must be 1000 characters or less'),
});

export type ItemDraft = z.infer<typeof ItemDraftSchema>;

// =============================================================================
// API Response Schemas
// =============================================================================

const SuccessResponseSchema = z.object({
    success: z.literal(true),
    data: ItemSchema,
});

const ListSuccessResponseSchema = z.object({
    success: z.literal(true),
    data: z.array(ItemSchema),
});

const ErrorResponseSchema = z.object({
    success: z.literal(false),
    error: z.string(),
});

// Single item response (create, update, get)
export const ItemResponseSchema = z.discriminatedUnion('success', [
    SuccessResponseSchema,
    ErrorResponseSchema,
]);

// List response
export const ItemListResponseSchema = z.discriminatedUnion('success', [
    ListSuccessResponseSchema,
    ErrorResponseSchema,
]);

export type ItemResponse = z.infer<typeof ItemResponseSchema>;
export type ItemListResponse = z.infer<typeof ItemListResponseSchema>;

// =============================================================================
// Validation Helpers
// =============================================================================

/**
 * Validate form data and return field-level errors
 */
export function validateDraft(data: unknown):
    | {
          success: true;
          data: ItemDraft;
      }
    | {
          success: false;
          errors: Record<string, string>;
      } {
    const result = ItemDraftSchema.safeParse(data);

    if (result.success) {
        return { success: true, data: result.data };
    }

    // Convert Zod errors to field-level error map
    const errors: Record<string, string> = {};
    for (const issue of result.error.issues) {
        const path = issue.path.join('.');
        if (!errors[path]) {
            errors[path] = issue.message;
        }
    }

    return { success: false, errors };
}

/**
 * Parse API response with validation
 */
export function parseItemResponse(json: unknown): Item {
    const result = ItemResponseSchema.safeParse(json);

    if (!result.success) {
        throw new Error('Invalid server response');
    }

    if (!result.data.success) {
        throw new Error(result.data.error);
    }

    return result.data.data;
}

export function parseItemListResponse(json: unknown): Item[] {
    const result = ItemListResponseSchema.safeParse(json);

    if (!result.success) {
        throw new Error('Invalid server response');
    }

    if (!result.data.success) {
        throw new Error(result.data.error);
    }

    return result.data.data;
}
```

## Key Patterns

1. **Schema-first types** - Define Zod schema, infer TypeScript type
2. **Discriminated unions for responses** - `success: true | false`
3. **Validation helpers** - `validateDraft()` for forms, `parseXxxResponse()` for API
4. **Field-level errors** - Convert Zod issues to `Record<string, string>`

## Zod Best Practices

### `.default()` usage

Use `.default()` only for truly optional fields where omission is valid. Do NOT use `.default('')` on required strings — TanStack Form sets initial values via `defaultValues`, not Zod defaults.

```typescript
// GOOD — optional array with sensible default
tags: z.array(z.string()).default([]),

// BAD — hides missing required value
name: z.string().min(1).default(''),

// GOOD — required field, no default
name: z.string().min(1, 'Name is required'),
```

### Schema <-> API mapping

Form schema field names should match API request body fields exactly. Do field mapping in the mutation function, not the schema.

## Customize For Your Feature

1. Replace `Item` and `ItemDraft` with your data schemas
2. Add validation rules (min, max, regex, etc.) to draft schema
3. Match API response structure to your backend views
4. Add additional response schemas for different endpoints
