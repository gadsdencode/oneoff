# AI Chat Application

## Overview

This is a modern AI chat application built with React, TypeScript, and Express.js. The application features a futuristic chat interface with Azure AI integration for intelligent conversation capabilities. It uses a full-stack architecture with a React frontend and Node.js backend, utilizing PostgreSQL for data persistence and Drizzle ORM for database operations.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **Styling**: Tailwind CSS with shadcn/ui component library
- **State Management**: React hooks with TanStack Query for server state
- **Animation**: Framer Motion for smooth UI transitions
- **UI Components**: Radix UI primitives with custom styling

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **Session Management**: Express sessions with connect-pg-simple
- **Development**: Hot reloading with tsx and Vite integration

### Key Components

#### Chat Interface
- **Main Chat View**: Futuristic chat interface with particle effects and animations
- **Message Components**: Supports markdown rendering with code syntax highlighting
- **Input System**: Multi-modal input supporting text, voice, and file uploads
- **Sidebar**: Navigation and chat history management

#### AI Integration
- **Azure AI Service**: Integration with Azure AI Inference API
- **Streaming Support**: Real-time message streaming capabilities
- **Message Types**: Support for system, user, and assistant messages
- **Configuration**: Environment-based API configuration

#### Storage Layer
- **Database Schema**: User management with username/password authentication
- **ORM**: Drizzle ORM for type-safe database operations
- **In-Memory Fallback**: MemStorage class for development without database
- **Connection**: Neon Database serverless PostgreSQL connection

## Data Flow

1. **User Input**: User types message in the chat interface
2. **Frontend Processing**: React components handle input validation and UI updates
3. **API Communication**: Frontend sends requests to Express backend via fetch
4. **AI Processing**: Backend forwards messages to Azure AI service
5. **Response Handling**: Streaming responses are processed and displayed in real-time
6. **Persistence**: Chat history and user data stored in PostgreSQL
7. **State Management**: TanStack Query manages server state and caching

## External Dependencies

### Core Dependencies
- **@azure-rest/ai-inference**: Azure AI service integration
- **@neondatabase/serverless**: PostgreSQL database connection
- **drizzle-orm**: Type-safe database operations
- **@radix-ui/react-***: Accessible UI component primitives
- **@tanstack/react-query**: Server state management
- **framer-motion**: Animation library

### Development Tools
- **tsx**: TypeScript execution for development
- **esbuild**: Fast bundling for production
- **vite**: Development server and build tool
- **tailwindcss**: Utility-first CSS framework

## Deployment Strategy

### Build Process
1. Frontend builds to `dist/public` directory via Vite
2. Backend bundles to `dist/index.js` via esbuild
3. Database migrations handled via Drizzle Kit

### Environment Setup
- **DATABASE_URL**: PostgreSQL connection string required
- **Azure AI credentials**: API endpoint and key configuration
- **NODE_ENV**: Environment-specific configuration

### Production Deployment
- **Static Assets**: Frontend served from `dist/public`
- **API Server**: Express server serves API routes and static files
- **Database**: PostgreSQL instance with Drizzle migrations
- **Sessions**: Persistent session storage in PostgreSQL

### Development Workflow
- **Hot Reloading**: Vite middleware integrated with Express
- **Type Safety**: Full TypeScript coverage across frontend and backend
- **Database**: Drizzle push for schema synchronization
- **Error Handling**: Runtime error overlay for development debugging

The application follows a modern full-stack architecture with clear separation of concerns, type safety throughout, and production-ready deployment capabilities.