# Viastud

This is a monorepo for the Viastud project.

## Getting Started

### Database

This project uses PostgreSQL as the database. You can run a PostgreSQL instance using Docker:

```bash
docker compose up -d
```

### Installation

To get started, clone the repository and install the dependencies:

```bash
pnpm install
```

### Run the project

To run the project, you can use the following command:

```bash
pnpm dev
```

this will start the backend and web servers. If you want to run only the backend or web, you can use the following commands:

```bash
pnpm dev --filter @viastud//backend  # to run only the backend
pnpm dev --filter @viastud//web # to run only the web app
```

## What's inside?

This Turborepo includes the following packages/apps:

### Apps and Packages

- `@viastud//web`: a [Vite.js](https://vitejs.dev/) and [React](https://react.dev) app
- `@viastud//backend`: an [Adonis.js](https://adonisjs.com/) app
- `@viastud//ui`: a stub React component shared by all frontend applications, using [Tailwind CSS](https://tailwindcss.com/) and [shadcn UI](https://ui.shadcn.com/)

Each package/app is 100% [TypeScript](https://www.typescriptlang.org/).

### Utilities

This Turborepo has some additional tools already setup for you:

- [TypeScript](https://www.typescriptlang.org/) for static type checking
- [Biome](https://biomejs.dev/) for code linting and code formatting
- [Lefthook](https://github.com/evilmartians/lefthook) for commit hooks
