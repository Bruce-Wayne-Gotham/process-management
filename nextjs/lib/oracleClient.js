import oracledb from 'oracledb';

// Oracle Autonomous Database connection configuration
const config = {
  user: process.env.ORACLE_DB_USER,
  password: process.env.ORACLE_DB_PASSWORD,
  connectionString: process.env.ORACLE_DB_CONNECTION_STRING,
  walletLocation: process.env.ORACLE_WALLET_DIR,
  walletPassword: process.env.ORACLE_WALLET_PASSWORD,
  // Connection pool settings for better performance
  poolMax: 10,
  poolMin: 2,
  poolIncrement: 2,
  poolTimeout: 60,
  stmtCacheSize: 23
};

/**
 * Get Oracle database connection from pool
 */
export async function getConnection() {
  try {
    return await oracledb.getConnection(config);
  } catch (error) {
    console.error('Error getting database connection:', error);
    throw error;
  }
}

/**
 * Execute SELECT query and return results
 */
export async function executeQuery(sql, params = []) {
  let connection;
  try {
    connection = await getConnection();
    const result = await connection.execute(sql, params, {
      outFormat: oracledb.OUT_FORMAT_OBJECT,
      fetchArraySize: 1000
    });
    return result.rows;
  } catch (error) {
    console.error('Query execution error:', error);
    throw error;
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (closeError) {
        console.error('Error closing connection:', closeError);
      }
    }
  }
}

/**
 * Execute INSERT/UPDATE/DELETE query with auto-commit
 */
export async function executeInsert(sql, params = []) {
  let connection;
  try {
    connection = await getConnection();
    const result = await connection.execute(sql, params, {
      autoCommit: true,
      outFormat: oracledb.OUT_FORMAT_OBJECT
    });
    return {
      success: true,
      rowsAffected: result.rowsAffected,
      insertId: result.lastRowid
    };
  } catch (error) {
    console.error('Insert execution error:', error);
    throw error;
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (closeError) {
        console.error('Error closing connection:', closeError);
      }
    }
  }
}

/**
 * Execute transaction with multiple statements
 */
export async function executeTransaction(queries) {
  let connection;
  try {
    connection = await getConnection();
    
    const results = [];
    for (const query of queries) {
      const result = await connection.execute(query.sql, query.params, {
        outFormat: oracledb.OUT_FORMAT_OBJECT
      });
      results.push(result);
    }
    
    await connection.commit();
    return { success: true, results };
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error('Transaction execution error:', error);
    throw error;
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (closeError) {
        console.error('Error closing connection:', closeError);
      }
    }
  }
}

/**
 * Initialize Oracle client with proper configuration
 */
export async function initializeOracleClient() {
  try {
    // Initialize Oracle client with any additional configuration
    await oracledb.createPool(config);
    console.log('Oracle connection pool created successfully');
  } catch (error) {
    console.error('Error initializing Oracle client:', error);
    throw error;
  }
}

/**
 * Test database connection
 */
export async function testConnection() {
  try {
    const result = await executeQuery('SELECT 1 as test FROM DUAL');
    return result && result.length > 0 && result[0].TEST === 1;
  } catch (error) {
    console.error('Database connection test failed:', error);
    return false;
  }
}

/**
 * Format Oracle date to JavaScript Date
 */
export function formatOracleDate(oracleDate) {
  if (!oracleDate) return null;
  return new Date(oracleDate);
}

/**
 * Format JavaScript Date to Oracle date string
 */
export function formatJsDate(jsDate) {
  if (!jsDate) return null;
  return jsDate.toISOString().slice(0, 19).replace('T', ' ');
}

// Helper function to convert boolean to Oracle NUMBER(1)
export function booleanToNumber(bool) {
  return bool ? 1 : 0;
}

// Helper function to convert Oracle NUMBER(1) to boolean
export function numberToBoolean(num) {
  return num === 1;
}
