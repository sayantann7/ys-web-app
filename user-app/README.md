# YS Sales Repository - User Portal

This is the user application for the Yes Securities Sales Repository system.

## Features

### User Features
- **Document Browser**: View and navigate document repository
- **Document Viewer**: View documents with embedded viewer
- **Comments**: Add and manage comments on documents
- **Bookmarks**: Personal bookmark management
- **Search**: Search through documents and folders

### Limitations
- **No Delete Access**: Users cannot delete documents or folders
- **No Admin Features**: No access to analytics, user management, or system-wide data

## Development

### Port Configuration
- Runs on port **3002**

### Start Development Server
```bash
npm install
npm run dev
```

### Build for Production
```bash
npm run build
```

### Linting
```bash
npm run lint
```

## Environment Variables
- `VITE_API_URL`: Backend API URL (defaults to `http://localhost:3000`)

## Architecture
Built with React 18, TypeScript, Vite, Tailwind CSS, and shadcn/ui components. Uses TanStack Query for server state management and React Router for navigation.

## Navigation
- **Home**: Redirects to Documents page
- **Documents**: Main document browsing interface
- **Bookmarks**: Personal bookmarked items