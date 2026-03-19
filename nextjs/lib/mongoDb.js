import { MongoClient, ServerApiVersion } from 'mongodb';

let client = null;
let db = null;
let initialized = false;

async function initializeDatabase() {
  if (initialized) return;

  const mongoUrl = process.env.MONGODB_URL || 'mongodb://admin:admin123@localhost:27017/tobacco_tracker?authSource=admin';

  console.log('[MongoDB] Connecting to:', mongoUrl.split('@')[1] || 'localhost');

  try {
    client = new MongoClient(mongoUrl, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      },
      connectTimeoutMS: 10000,
      serverSelectionTimeoutMS: 10000,
    });

    await client.connect();
    db = client.db('tobacco_tracker');
    
    // Test connection
    await db.admin().ping();
    console.log('[MongoDB] ✅ Connected successfully');
    
    initialized = true;
  } catch (err) {
    console.error('[MongoDB] ❌ Connection failed:', err.message);
    throw err;
  }
}

export async function getDb() {
  if (!initialized) {
    await initializeDatabase();
  }
  return db;
}

export async function query(collectionName, operation, params = {}) {
  try {
    const database = await getDb();
    const collection = database.collection(collectionName);
    const start = Date.now();

    let result;
    switch (operation) {
      case 'findOne':
        result = await collection.findOne(params);
        break;
      case 'find':
        result = await collection.find(params).toArray();
        break;
      case 'insertOne':
        result = await collection.insertOne(params);
        break;
      case 'insertMany':
        result = await collection.insertMany(params);
        break;
      case 'updateOne':
        result = await collection.updateOne(params.filter, { $set: params.update });
        break;
      case 'updateMany':
        result = await collection.updateMany(params.filter, { $set: params.update });
        break;
      case 'deleteOne':
        result = await collection.deleteOne(params);
        break;
      case 'deleteMany':
        result = await collection.deleteMany(params);
        break;
      case 'countDocuments':
        result = await collection.countDocuments(params);
        break;
      default:
        throw new Error(`Unknown operation: ${operation}`);
    }

    const duration = Date.now() - start;
    console.log('[MongoDB] Query executed', { collection: collectionName, operation, duration: `${duration}ms` });
    return result;
  } catch (err) {
    console.error('[MongoDB] Query error', { operation, message: err.message });
    throw err;
  }
}

export async function closeConnection() {
  if (client) {
    await client.close();
    console.log('[MongoDB] Connection closed');
  }
}
