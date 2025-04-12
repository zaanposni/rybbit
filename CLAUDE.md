# FrogStats Code Guidelines

## Commands
### Client (Next.js)
- Build: `npm run build`
- Dev: `npm run dev` (port 3002 with turbopack)
- Lint: `npm run lint`
- Start: `npm run start` (port 3002)

### Server
- Build: `npm run build`
- Dev: `npm run dev` (builds and runs)
- DB: `npm run db:generate|migrate|push|pull|check|drop`

## Code Style
- **TypeScript**: Strict typing, interfaces for API/props
- **React**: Functional components, Tanstack Query, Zustand
- **Formatting**: Arrow functions, async/await, named exports
- **Naming**: camelCase for functions/variables, PascalCase for components
- **Structure**: Client (Next.js + Tailwind + Shadcn), Server (Fastify + Drizzle + ClickHouse)
- **Error Handling**: Proper checking in API endpoints, appropriate messages in UI
- **Documentation**: JSDoc for utilities, descriptive function names
- **Theme**: Dark mode by default

FrogStats is a self-hostable open source Google Analytics alternative.