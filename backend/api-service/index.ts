import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { connectDB } from './src/db.js';
import { routes } from './src/routes.js';

// Connect to MongoDB
connectDB().catch(console.error);

const app = new Elysia()
  .use(cors())
  .use(routes)
  .listen(3001);

console.log(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`);