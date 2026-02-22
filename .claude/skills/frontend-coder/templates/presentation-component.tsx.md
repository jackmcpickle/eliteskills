# Presentation Component Template

Pure UI components with no hooks, no data fetching. Live in `src/components/`.

## Basic Variant Component

```tsx
import { cn } from '@superit/ui-core';
import type { ReactElement, ReactNode } from 'react';

type {Component}Variant = 'default' | 'accent' | 'muted';

interface {Component}Props {
    children: ReactNode;
    variant?: {Component}Variant;
    className?: string;
}

const variantStyles = {
    default: 'bg-white border-border',
    accent: 'bg-blue-50 border-blue-200',
    muted: 'bg-muted border-muted-foreground/20',
} as const satisfies Record<{Component}Variant, string>;

export function {Component}({
    children,
    variant = 'default',
    className,
}: {Component}Props): ReactElement {
    return (
        <div
            className={cn(
                'rounded-xl border px-6 py-4',
                variantStyles[variant],
                className,
            )}
        >
            {children}
        </div>
    );
}
```

## Polymorphic Component

```tsx
import { cn } from '@superit/ui-core';
import type { ComponentProps, ReactElement } from 'react';

type {Component}Element = 'h1' | 'h2' | 'h3' | 'h4';
type {Component}Size = '2xl' | 'xl' | 'lg' | 'base';

const sizeClasses: Record<{Component}Size, string> = {
    '2xl': 'text-2xl font-bold leading-snug',
    xl: 'text-xl font-semibold leading-normal',
    lg: 'text-lg font-semibold leading-normal',
    base: 'text-base font-medium leading-normal',
};

interface {Component}Props extends ComponentProps<'h1'> {
    size?: {Component}Size;
    as?: {Component}Element;
}

export function {Component}({
    size = '2xl',
    as: Element = 'h2',
    className,
    children,
    ...props
}: {Component}Props): ReactElement {
    return (
        <Element
            className={cn('text-foreground', sizeClasses[size], className)}
            {...props}
        >
            {children}
        </Element>
    );
}
```

## Size-Variant Layout Component

```tsx
import { cn } from '@superit/ui-core';
import type { ReactElement, ReactNode } from 'react';

type ContainerSize = 'none' | 'sm' | 'md' | 'lg';

interface ContainerProps {
    children: ReactNode;
    size?: ContainerSize;
    padding?: ContainerSize;
    centred?: boolean;
    className?: string;
}

export function Container({
    children,
    size = 'lg',
    padding = 'lg',
    centred = true,
    className,
}: ContainerProps): ReactElement {
    const sizes = {
        none: '',
        sm: 'max-w-3xl',
        md: 'max-w-5xl',
        lg: 'max-w-7xl',
    } satisfies Record<ContainerSize, string>;

    const paddings = {
        none: '',
        sm: 'p-2 md:p-4 lg:p-6',
        md: 'p-4 md:p-4 lg:p-8',
        lg: 'p-4 md:p-8 lg:p-10',
    } satisfies Record<ContainerSize, string>;

    return (
        <div
            className={cn(
                sizes[size],
                paddings[padding],
                { 'mx-auto': centred },
                className,
            )}
        >
            {children}
        </div>
    );
}
```

## Key Patterns

1. **No hooks** - except minimal `useState` for UI toggles
2. **`type` for variants** - string unions for style options
3. **`interface` for props** - always with explicit types
4. **`satisfies Record<>`** for style mappings - type-safe without assertion
5. **`cn()` from `@superit/ui-core`** for className merging
6. **`children: ReactNode`** for composable components
7. **`ComponentProps<'element'>`** for extending native HTML props
8. **Named exports only** - never default exports
9. **Explicit `ReactElement` return type**
10. **Spread `{...props}`** for polymorphic/passthrough components
