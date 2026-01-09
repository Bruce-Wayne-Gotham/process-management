import { query } from '../db';

/**
 * DatabaseService
 * A centralized service to handle all database operations for the Tobacco Tracker app.
 * This abstracts the raw SQL logic away from the API routes.
 */
class DatabaseService {
    // --- FARMERS ---

    async getAllFarmers() {
        const sql = 'SELECT * FROM farmers ORDER BY created_at DESC';
        const result = await query(sql);
        return result.rows || [];
    }

    async getFarmerById(id) {
        const sql = 'SELECT * FROM farmers WHERE id = $1';
        const result = await query(sql, [id]);
        return result.rows?.[0] || null;
    }

    async createFarmer(data) {
        const {
            farmer_code, name, village, contact_number, aadhaar_no, dob,
            account_holder_name, bank_name, branch_name, account_number,
            ifsc_code, upi_id, efficacy_score, efficacy_notes
        } = data;

        const sql = `
      INSERT INTO farmers (
        farmer_code, name, village, contact_number, aadhaar_no, dob,
        account_holder_name, bank_name, branch_name, account_number,
        ifsc_code, upi_id, efficacy_score, efficacy_notes
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
      )
      RETURNING *
    `;

        const values = [
            farmer_code, name, village || null, contact_number || null,
            aadhaar_no || null, dob || null, account_holder_name || null,
            bank_name || null, branch_name || null, account_number || null,
            ifsc_code || null, upi_id || null,
            efficacy_score || 0, efficacy_notes || null
        ];

        const result = await query(sql, values);
        return result.rows?.[0];
    }

    // --- PURCHASES ---

    async getAllPurchases() {
        const sql = `
      SELECT p.*, f.name as farmer_name, f.farmer_code 
      FROM purchases p
      LEFT JOIN farmers f ON p.farmer_id = f.id
      ORDER BY p.purchase_date DESC
    `;
        const result = await query(sql);
        return result.rows || [];
    }

    async createPurchase(data) {
        const {
            farmer_id, purchase_date, packaging_type,
            process_weight, packaging_weight, rate_per_kg, remarks
        } = data;

        const sql = `
      INSERT INTO purchases (
        farmer_id, purchase_date, packaging_type,
        process_weight, packaging_weight, rate_per_kg, remarks
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

        const values = [
            farmer_id, purchase_date, packaging_type,
            process_weight, packaging_weight || 0, rate_per_kg, remarks || null
        ];

        const result = await query(sql, values);
        return result.rows?.[0];
    }

    // --- DASHBOARD & ANALYTICS ---

    async getDashboardStats() {
        const stats = {};

        // Total Farmers
        const farmerRes = await query('SELECT COUNT(*) as count FROM farmers');
        stats.totalFarmers = parseInt(farmerRes.rows[0].count);

        // Total Purchases Value
        const purchaseRes = await query('SELECT SUM(total_amount) as total FROM purchases');
        stats.totalPurchaseAmount = parseFloat(purchaseRes.rows[0].total || 0);

        // Recent Activity
        const recentRes = await query(`
      SELECT 'purchase' as type, p.total_amount as amount, f.name as party, p.created_at
      FROM purchases p
      JOIN farmers f ON p.farmer_id = f.id
      ORDER BY p.created_at DESC
      LIMIT 5
    `);
        stats.recentActivity = recentRes.rows;

        return stats;
    }
}

export const dbService = new DatabaseService();
