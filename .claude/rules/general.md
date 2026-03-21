# General Rules

## Linting & Formatting
<!-- Biome でリント・フォーマットを統一する -->
- Follow Biome rules. Run `pnpm lint` before committing.
- Auto-fix with `pnpm lint:fix` or `pnpm format`.

## Import
<!-- @/ パスエイリアスを使う。相対パスは使わない -->
- Use `@/` path alias for all imports. Do not use relative paths.
- Example: `import { cn } from "@/utils"` (not `../../utils`)

## File Placement
<!-- 各ファイルの配置ルール -->
- Atoms → `src/stores/`
- Shared types → `src/types/`
- Reusable hooks → `src/hooks/`
- Utility functions → `src/utils/`
- Project docs → `docs/`

## Styling
<!-- クラス結合には cn() を使う -->
- Use `cn()` from `@/utils` for conditional class merging.
- Example: `cn("base-class", isActive && "active-class")`
- Use Tailwind CSS utility classes. Avoid inline styles and CSS modules.

## Comments
<!-- 関数にはコメントを書く。自明なコードには不要 -->
- Add a brief comment above every function explaining its purpose.
- Do not comment obvious code (e.g., `// increment counter` above `count++`).

```tsx
// Good
/** Fetch the current user and format display name */
const useCurrentUser = () => { ... };

/** Calculate the total price including tax */
const calculateTotalPrice = (items: CartItem[], taxRate: number): number => { ... };
```

## TypeScript
<!-- type を使う。any は原則禁止 -->
- Use `type` for all type definitions. Do not use `interface`.
- Never use `any`. Use `unknown` if the type is truly uncertain, then narrow it.

```tsx
// Good
type User = {
  id: string;
  name: string;
};

// Bad
interface User { ... }
const data: any = ...;
```

## Exports
<!-- バレルエクスポートを使う。import 時の別名（as）は避ける -->
- Use barrel exports (`index.ts`) to re-export from directories.
- Avoid renaming imports with `as`. If a name conflicts, make the export name more specific instead.

```tsx
// src/hooks/index.ts — barrel export
export { useAuth } from "./use-auth";
export { useUser } from "./use-user";

// Good: import from barrel
import { useAuth, useUser } from "@/hooks";

// Bad: renaming on import
import { useUser as useCurrentUser } from "@/hooks/use-user";
```

## Coding Style
<!-- 関数コンポーネント + アロー関数を使う。クラスコンポーネントは使わない -->
- Use function components only. Never use class components.
- Use arrow functions for components, hooks, and handlers.
- Exception: Next.js file conventions (`page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx`) use `function` with `export default`.

```tsx
// Good: arrow function component
const UserProfile = () => {
  return <div>...</div>;
};

// Bad: class component
class UserProfile extends React.Component { ... }
```

## Naming
<!-- 命名は具体的に。曖昧な名前を避ける -->
- Be specific with names. Avoid generic names like `data`, `info`, `item`, `handle`, `temp`.
- Components: describe what it renders — `UserAvatar`, `PaymentForm`, `NotificationBell`
- Hooks: describe what it does — `useAuth`, `useInfiniteScroll`, `useDebounce`
- Handlers: describe the action — `handleSubmitPayment`, `handleDeleteComment`
- Booleans: use `is`/`has`/`should` prefix — `isLoading`, `hasPermission`, `shouldRedirect`

```tsx
// Good: specific names
const TaskDueDatePicker = () => { ... };
const handleMarkTaskComplete = () => { ... };
const isTaskOverdue = dueDate < now;

// Bad: vague names
const Picker = () => { ... };
const handleClick = () => { ... };
const flag = dueDate < now;
```

## Separation of Concerns
<!-- UI とロジックを分離する -->
- **Components** handle rendering only. Keep business logic out of JSX.
- **Hooks** (`src/hooks/`) encapsulate logic: data fetching, state management, event handling.
- **Utils** (`src/utils/`) holds pure utility functions with no React dependency.

### Pattern
<!-- コンポーネントはシンプルに保ち、ロジックは hooks に切り出す -->
- Extract complex logic into custom hooks. Components should call hooks and render the result.
- If a component has more than ~10 lines of logic before the return statement, extract a hook.

```tsx
// Good: logic in hook, component only renders
const UserProfile = () => {
  const { user, isLoading } = useUser();
  if (isLoading) return <Skeleton />;
  return <ProfileCard user={user} />;
};

// Bad: logic mixed into component
const UserProfile = () => {
  const [user, setUser] = useState(null);
  useEffect(() => { /* fetch logic */ }, []);
  const formatted = useMemo(() => { /* transform */ }, [user]);
  // ... more logic
  return <div>...</div>;
};
```

## Language
<!-- コード・コメントは英語。ユーザー向けテキスト（UI ラベル等）は日本語 -->
- Code and comments in English.
- User-facing text (UI labels, messages) in Japanese.
