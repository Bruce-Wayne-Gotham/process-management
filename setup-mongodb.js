#!/usr/bin/env node

/**
 * MongoDB Setup Script for Tobacco Tracker
 * Initializes collections and indexes when app starts
 */

const { MongoClient, ServerApiVersion } = require('mongodb');

async function setupDatabase() {
  const mongoUrl = process.env.MONGODB_URL || 'mongodb://admin:admin123@localhost:27017/tobacco_tracker?authSource=admin';

  console.log('🚀 MongoDB Setup: Tobacco Tracker');
  console.log('===================================');
  console.log('📋 Connecting to MongoDB...');

  const client = new MongoClient(mongoUrl, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
  });

  try {
    await client.connect();
    const db = client.db('tobacco_tracker');

    console.log('✅ Connected to MongoDB');

    // Create collections with schema validation
    const collections = {
      farmers: {
        validator: {
          $jsonSchema: {
            bsonType: 'object',
            required: ['name'],
            properties: {
              _id: { bsonType: 'objectId' },
              farmer_code: { bsonType: 'string' },
              name: { bsonType: 'string' },
              village: { bsonType: 'string' },
              contact_number: { bsonType: 'string' },
              aadhaar_no: { bsonType: 'string' },
              dob: { bsonType: 'date' },
              account_holder_name: { bsonType: 'string' },
              bank_name: { bsonType: 'string' },
              branch_name: { bsonType: 'string' },
              account_number: { bsonType: 'string' },
              ifsc_code: { bsonType: 'string' },
              upi_id: { bsonType: 'string' },
              efficacy_score: { bsonType: 'double' },
              efficacy_notes: { bsonType: 'string' },
              is_active: { bsonType: 'bool' },
              created_at: { bsonType: 'date' },
            },
          },
        },
      },
      purchases: {
        validator: {
          $jsonSchema: {
            bsonType: 'object',
            required: ['purchase_code', 'purchase_date', 'packaging_type', 'process_weight'],
            properties: {
              _id: { bsonType: 'objectId' },
              purchase_code: { bsonType: 'string' },
              farmer_id: { bsonType: 'objectId' },
              purchase_date: { bsonType: 'date' },
              packaging_type: { bsonType: 'string' },
              process_weight: { bsonType: 'double' },
              packaging_weight: { bsonType: 'double' },
              total_weight: { bsonType: 'double' },
              rate_per_kg: { bsonType: 'double' },
              total_amount: { bsonType: 'double' },
              remarks: { bsonType: 'string' },
              created_at: { bsonType: 'date' },
            },
          },
        },
      },
      lots: {
        validator: {
          $jsonSchema: {
            bsonType: 'object',
            required: ['lot_code', 'lot_date'],
            properties: {
              _id: { bsonType: 'objectId' },
              lot_code: { bsonType: 'string' },
              lot_date: { bsonType: 'date' },
              total_input_weight: { bsonType: 'double' },
              remarks: { bsonType: 'string' },
              created_at: { bsonType: 'date' },
            },
          },
        },
      },
      lot_purchases: {},
      process_status: {},
      process: {},
      jardi_output: {},
      payments: {},
      users: {
        validator: {
          $jsonSchema: {
            bsonType: 'object',
            required: ['username', 'password_hash', 'role'],
            properties: {
              _id: { bsonType: 'objectId' },
              username: { bsonType: 'string' },
              password_hash: { bsonType: 'string' },
              role: { bsonType: 'string' },
              full_name: { bsonType: 'string' },
              email: { bsonType: 'string' },
              permissions: { bsonType: 'array' },
              is_active: { bsonType: 'bool' },
              created_at: { bsonType: 'date' },
              last_login: { bsonType: 'date' },
            },
          },
        },
      },
      eway_bills: {},
    };

    // Create collections
    for (const [name, config] of Object.entries(collections)) {
      try {
        // Drop if exists to ensure clean state
        try {
          await db.collection(name).drop();
          console.log(`🗑️  Dropped existing collection: ${name}`);
        } catch (e) {
          // Collection doesn't exist, that's fine
        }

        if (Object.keys(config).length > 0) {
          await db.createCollection(name, config);
        } else {
          await db.createCollection(name);
        }
        console.log(`✅ Created collection: ${name}`);
      } catch (err) {
        if (err.codeName === 'NamespaceExists') {
          console.log(`⏭️  Collection already exists: ${name}`);
        } else {
          console.error(`❌ Failed to create collection ${name}:`, err.message);
        }
      }
    }

    // Create indexes
    const indexesByCollection = {
      farmers: [
        { key: { farmer_code: 1 }, unique: true },
        { key: { name: 1 } },
      ],
      purchases: [
        { key: { purchase_code: 1 }, unique: true },
        { key: { farmer_id: 1 } },
        { key: { purchase_date: 1 } },
      ],
      lots: [
        { key: { lot_code: 1 }, unique: true },
        { key: { lot_date: 1 } },
      ],
      users: [
        { key: { username: 1 }, unique: true },
      ],
      eway_bills: [
        { key: { eway_bill_no: 1 }, unique: true },
      ],
    };

    for (const [collName, indexes] of Object.entries(indexesByCollection)) {
      const collection = db.collection(collName);
      for (const idx of indexes) {
        try {
          await collection.createIndex(idx.key, { unique: idx.unique });
          console.log(`📇 Created index on ${collName}: ${JSON.stringify(idx.key)}`);
        } catch (err) {
          console.log(`⏭️  Index already exists on ${collName}`);
        }
      }
    }

    // Insert default users
    const usersCollection = db.collection('users');
    const existingUsers = await usersCollection.countDocuments();
    if (existingUsers === 0) {
      await usersCollection.insertMany([
        {
          username: 'owner',
          password_hash: 'admin123',
          role: 'owner',
          full_name: 'Owner Admin',
          is_active: true,
          created_at: new Date(),
        },
        {
          username: 'manager',
          password_hash: 'admin123',
          role: 'manager',
          full_name: 'Manager User',
          permissions: ['farmers', 'purchases', 'lots', 'process', 'payments'],
          is_active: true,
          created_at: new Date(),
        },
      ]);
      console.log('👥 Inserted default users (owner, manager)');
    }

    console.log('\n✅ Database setup complete!');
    console.log('🗃️  Collections created and indexes established');
  } catch (err) {
    console.error('❌ Setup failed:', err.message);
    process.exit(1);
  } finally {
    await client.close();
  }
}

setupDatabase();
