# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Start development server**: `npm run dev` (runs on port 8080)
- **Build for production**: `npm run build`
- **Build for development**: `npm run build:dev`
- **Lint code**: `npm run lint`
- **Preview production build**: `npm run preview`

## Architecture Overview

This is a React-based admin portal for "Yes Securities Sales Repository" built with modern web technologies:

### Core Tech Stack
- **Frontend Framework**: React 18 with TypeScript
- **Build Tool**: Vite with SWC for fast compilation
- **UI Library**: Radix UI components with shadcn/ui design system
- **Styling**: Tailwind CSS with custom animations
- **State Management**: React Context (AuthContext) + TanStack Query for server state
- **Routing**: React Router DOM v6 with role-based route protection
- **Forms**: React Hook Form with Zod validation

### Key Architecture Patterns

**Authentication & Authorization**: 
- JWT token-based auth stored in localStorage
- Role-based access control (admin vs regular users)
- AuthGuard component protects routes
- AuthContext provides user state throughout app

**API Communication**:
- Centralized ApiService class in `src/services/api.ts`
- RESTful endpoints with proper error handling
- Token-based authentication headers
- File upload/download functionality for documents

**UI Layout**:
- Sidebar-based layout using shadcn/ui Sidebar component
- Responsive design with mobile support
- Role-based navigation (admins see more menu items)
- Toast notifications (dual system: shadcn/ui + Sonner)

**File Structure**:
- `src/components/ui/` - Reusable UI components (shadcn/ui)
- `src/pages/` - Route components (Dashboard, Documents, Analytics, etc.)
- `src/context/` - React Context providers
- `src/services/` - API and external service integrations
- `src/types/` - TypeScript type definitions
- `src/hooks/` - Custom React hooks

### Environment Configuration
- API base URL: `VITE_API_URL` (defaults to `http://localhost:3000`)
- Development server runs on port 8080

### Key Features
- Document management with folder structure
- User analytics and metrics tracking
- Comments system on documents
- Bookmarking functionality
- Admin user management with CSV import
- File upload/download with AWS S3 integration

The application follows modern React patterns with proper separation of concerns, type safety with TypeScript, and a clean component architecture using shadcn/ui design system.