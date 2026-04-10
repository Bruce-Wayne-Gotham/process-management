// Thin wrapper used by routes that import dbService.
// Delegates to the D1-backed query() in db.js.
import { query as dbQuery } from './db.js';

class DatabaseService {
  async query(sql, params) {
    return dbQuery(sql, params);
  }
}

export default new DatabaseService();
