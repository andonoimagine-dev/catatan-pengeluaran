# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**catatan-pengeluaran** is a web application for tracking daily expenses. The project is in early-stage development.

## Technology Stack (Recommended)

This project should use a modern web stack suitable for a personal finance app:

- **Frontend Framework**: React or Vue.js for interactive UI
- **Build Tool**: Vite for fast development and optimized builds
- **Language**: TypeScript for type safety
- **Styling**: CSS Modules or Tailwind CSS
- **State Management**: React Context API or Zustand (if needed)
- **Database**: SQLite (local), PostgreSQL (if deployed), or IndexedDB (client-side only)
- **Backend** (optional): Node.js/Express if server-side functionality is needed

## Development Commands

Once the project is set up, these will be the standard commands:

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview

# Run tests (when test suite is added)
npm run test

# Lint code
npm run lint

# Format code
npm run format
```

## Project Structure (Planned)

```
src/
├── components/          # Reusable React/Vue components
├── pages/              # Page-level components (routing)
├── hooks/              # Custom React hooks (if using React)
├── utils/              # Utility functions
├── services/           # API calls and external service integrations
├── styles/             # Global styles
├── types/              # TypeScript type definitions
└── App.tsx/App.vue     # Root component

public/                 # Static assets
tests/                  # Test files
```

## Key Development Patterns

### State Management
- Start simple with React Context API or component state
- If the app grows, migrate to Zustand or similar lightweight solution
- For expense data: consider local storage or a database depending on deployment model

### API Integration
- If this has a backend: keep API calls in `services/` directory
- Use environment variables for API endpoints (`.env` files)
- Handle loading and error states consistently

### Expense Tracking Features
Core features to implement:
- Add/edit/delete expenses
- Categorize expenses
- Filter by date, category, amount
- Generate basic statistics (total spending, category breakdown)
- Export or view reports

## Git Workflow

- **Branch naming**: Use descriptive names (feature/add-categories, fix/date-picker-bug)
- **Commits**: Keep commits atomic and descriptive
- **PR reviews**: Required before merging to main

## Important Notes

- This project handles financial data—ensure proper validation and error handling
- Consider privacy and security if this ever connects to external services
- Start with localStorage for simplicity; migrate to a database if persistence across devices is needed
- Keep the UI responsive for mobile use cases
