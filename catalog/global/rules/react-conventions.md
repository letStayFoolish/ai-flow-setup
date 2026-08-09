# React / Frontend Conventions

Applies when: creating or modifying React components, hooks, or frontend build configuration.

## TypeScript

- Strict TypeScript — no `any`, no unused imports, no implicit `any`.
- Prefer `type` over `interface` for local shapes; `interface` for things that get extended.
- Use `satisfies` instead of type assertions where possible.
- All component props typed explicitly — no inferred props from component usage.

## Component structure

- One component per file. File name matches component name (`OrderList.tsx`).
- Prefer functional components with hooks — no class components.
- Keep components small; extract logic into custom hooks.
- Co-locate hooks and helpers with the component they serve — no global `utils/` dumping ground.

## Naming

| Element | Convention | Example |
|---|---|---|
| Components | `PascalCase` | `OrderList` |
| Hooks | `useCamelCase` | `useOrderList` |
| Files | `PascalCase.tsx` / `useCamelCase.ts` | `OrderList.tsx` |
| CSS modules | `camelCase` | `styles.orderCard` |

## State management

- Local state with `useState` / `useReducer` first.
- Context for app-wide state that is mostly read (theme, auth user).
- Server state with a data-fetching library (React Query / SWR) — do not hand-roll fetch caching.
- No Redux unless the project already uses it.

## API calls

- All API calls go through a typed client layer — no inline `fetch` in components.
- Return typed response shapes derived from the backend contract.
- Handle loading, error, and empty states explicitly — no silent swallowed errors.

## Styling

- Tailwind CSS or CSS Modules — do not mix both in the same project.
- No inline `style` attributes except for values computed at runtime.
- No `!important` in custom styles.

## What NOT to do

- No unused imports or variables — the linter should catch these; fix them, do not disable.
- No `// @ts-ignore` or `// eslint-disable` unless you add a comment explaining why.
- No direct DOM manipulation — use React state and refs.
