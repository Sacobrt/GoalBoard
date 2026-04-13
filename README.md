# GoalBoard

A kanban-style project management app built with React. Organize work across multiple boards, track tasks through customizable columns, and collaborate with teammates.

## Features

- **Kanban boards** — drag-and-drop tasks across columns
- **Multiple boards** — create and manage separate boards per project
- **Task details** — rich markdown descriptions, due dates, priorities, and labels
- **Dashboard** — overview of all boards with progress stats and charts
- **Board collaboration** — invite members via email, assign roles
- **Command palette** — quick navigation with `Ctrl+K`
- **Role-based access** — admin and user roles with permission gates
- **Admin panel** — manage demo requests and users
- **Settings** — update profile, avatar (with crop), bio, and account info

## Tech Stack

| Layer            | Library                     |
| ---------------- | --------------------------- |
| UI framework     | React + Vite                |
| Routing          | React Router                |
| State management | Zustand                     |
| Styling          | Tailwind CSS v4 + shadcn/ui |
| Drag and drop    | dnd-kit                     |
| Rich text editor | Tiptap                      |
| Charts           | Recharts                    |
| Animations       | Framer Motion               |
| Auth             | bcryptjs (hashed passwords) |

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build
```

The app runs at `http://localhost:5173` by default.

## First Run

Register an account — the **first registered user automatically becomes Admin**. All subsequent users get the standard User role.

## Project Structure

```
src/
├── app/            # Root router
├── components/     # Shared UI (layout, patterns, shadcn components)
├── features/       # Feature modules (auth, board, kanban, dashboard, ...)
├── shared/         # Auth guards, permissions, hooks, utilities
└── lib/            # Tailwind class helpers
```

## Notes

- All data lives in the browser's `localStorage` — clearing site data resets everything.
- There is no real backend; authentication is client-side only and not suitable for production use.
