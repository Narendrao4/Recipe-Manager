import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import net from 'net';
import { MongoMemoryReplSet } from 'mongodb-memory-server';

dotenv.config();

const PORT = process.env.PORT || 3001;

let mongoMemoryReplSet: MongoMemoryReplSet | null = null;

function isLocalMongoUrl(url: string): boolean {
  return url.includes('localhost') || url.includes('127.0.0.1');
}

async function canConnectToLocalMongo(url: string): Promise<boolean> {
  const parsed = new URL(url);
  const host = parsed.hostname;
  const port = Number(parsed.port || '27017');

  return new Promise((resolve) => {
    const socket = net.createConnection({ host, port });

    socket.setTimeout(1500);
    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.on('error', () => resolve(false));
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
  });
}

async function ensureMongoUrl(): Promise<void> {
  const configuredUrl = process.env.DATABASE_URL;

  if (!configuredUrl) {
    throw new Error('DATABASE_URL is required');
  }

  if (process.env.NODE_ENV === 'production' || !isLocalMongoUrl(configuredUrl)) {
    return;
  }

  const localAvailable = await canConnectToLocalMongo(configuredUrl);
  if (localAvailable) {
    return;
  }

  mongoMemoryReplSet = await MongoMemoryReplSet.create({
    replSet: { count: 1, storageEngine: 'wiredTiger', dbName: 'recipedb' },
  });

  const memoryUrl = mongoMemoryReplSet.getUri('recipedb');
  process.env.DATABASE_URL = memoryUrl;
  console.warn('Local MongoDB not found on localhost:27017. Using in-memory MongoDB replica set for development.');
}

async function bootstrap(): Promise<void> {
  await ensureMongoUrl();

  const [
    authRoutesModule,
    recipeRoutesModule,
    pantryRoutesModule,
    mealPlanRoutesModule,
    collectionRoutesModule,
    statsRoutesModule,
  ] = await Promise.all([
    import('./routes/auth'),
    import('./routes/recipes'),
    import('./routes/pantry'),
    import('./routes/mealPlans'),
    import('./routes/collections'),
    import('./routes/stats'),
  ]);

  const authRoutes = authRoutesModule.default;
  const recipeRoutes = recipeRoutesModule.default;
  const pantryRoutes = pantryRoutesModule.default;
  const mealPlanRoutes = mealPlanRoutesModule.default;
  const collectionRoutes = collectionRoutesModule.default;
  const statsRoutes = statsRoutesModule.default;

  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Static file serving for uploads
  app.use('/uploads', express.static('uploads'));

  // Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/recipes', recipeRoutes);
  app.use('/api/pantry', pantryRoutes);
  app.use('/api/meal-plans', mealPlanRoutes);
  app.use('/api/collections', collectionRoutes);
  app.use('/api/stats', statsRoutes);

  // Health check
  app.get('/api/health', (req, res) => {
    const currentDbUrl = process.env.DATABASE_URL || '';
    const database =
      currentDbUrl.startsWith('mongodb+srv://')
        ? 'mongodb-atlas'
        : currentDbUrl.startsWith('mongodb://localhost') || currentDbUrl.startsWith('mongodb://127.0.0.1')
          ? 'mongodb-local'
          : 'mongodb-memory';

    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database,
    });
  });

  // Error handling middleware
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
      error: err.message || 'Internal Server Error',
    });
  });

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

void bootstrap();

process.on('SIGINT', async () => {
  if (mongoMemoryReplSet) {
    await mongoMemoryReplSet.stop();
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  if (mongoMemoryReplSet) {
    await mongoMemoryReplSet.stop();
  }
  process.exit(0);
});
