# Referential Stability

`Item[]` and `(id: string) => void` describe shape, not identity. A new array or function literal each render is type-correct and still invalidates `memo`, effects, and context subscribers.

Treat stability as a contract at the component boundary. Source: [Making Referential Stability a Type](https://www.jovidecroock.com/blog/referential-stability-types/).

## Rules

- Never pass `{...}`, `[...]`, or inline functions to `memo` children, context `value`, or hook dependency lists
- Stabilize derived values with `useMemo` / `useCallback`; hoist true constants to module scope
- `useState` / `useReducer` values and dispatchers, and `useRef` objects, are already identity-stable when the value did not change
- Do not depend on `ref.current` — depend on the ref object
- Never `as Stable<T>` or sprinkle `stable()` to silence the compiler
- Do not silence `react-hooks/exhaustive-deps`

## Type contract

```ts
declare const stableBrand: unique symbol;

type Stable<T> = T extends object ? T & { readonly [stableBrand]: true } : T;
```

Primitives pass through (compared by value). Objects, arrays, and functions get a private phantom brand that callers cannot forge by shape.

```ts
type ItemListProps = {
    items: Stable<Item[]>;
    onSelect: Stable<(id: string) => void>;
    title: string;
};
```

`items.filter(isVisible)` or `(id) => select(id)` is then the wrong type. The boundary pushes memoization back to the owner.

## Producing Stable values

| Source                                            | Identity                                            |
| ------------------------------------------------- | --------------------------------------------------- |
| `useState` / `useReducer` state + dispatcher      | Stable (identity changes only on a real transition) |
| `useRef` container                                | Stable (do not depend on `.current`)                |
| `useMemo` / `useCallback` with proven stable deps | Stable                                              |
| Module-scope constant                             | Stable by construction                              |
| Inline object / array / function                  | Unstable                                            |

`Stable<State>` is not immutability. A real state transition should invalidate memos and re-run effects. The brand is about identity, not "this never changes."

```ts
export const EMPTY_ITEMS = stable([] as Item[]);
```

`stable()` is `x => x` at runtime. Use it only at module scope where the claim is true.

## Context

```tsx
// BAD — new object every render, whole subtree works for free
<ThemeContext.Provider value={{ theme, setTheme }}>

// GOOD — owner memoizes; consumers inherit the contract
const value = useMemo(() => ({ theme, setTheme }), [theme, setTheme]);
```

If the project uses [`stableref`](https://www.jovidecroock.com/blog/referential-stability-types/), `createStableContext` requires `Stable<T>` on the provider. Import hooks from `stableref/react` so an unproven dependency fails at the call site — do not augment `@types/react` (React's permissive overload swallows the proof).

## What this is not

- Not a replacement for the React Compiler. The compiler asks "can I preserve this identity." `Stable<T>` asks "can another component rely on this identity."
- A cast is an escape hatch. Review it.

Agents cannot see a re-render they never rendered. A type error at the unstable prop or dependency is the feedback loop that holds.
