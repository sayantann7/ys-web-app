# YS Sales Repository - Admin Portal

This is the admin application for the Yes Securities Sales Repository system.

## Features

### Admin-Only Features
- **Dashboard**: System-wide metrics and analytics overview
- **Analytics**: Detailed charts and performance metrics
- **Comments Management**: Global comment moderation across all documents
- **User Management**: Bulk user import/export via Excel files
- **Document Management**: Full CRUD operations on documents and folders
- **Bookmark Management**: Personal bookmarks

## Development

### Port Configuration
- Runs on port **3001**

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