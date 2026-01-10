const dbService = require('../../lib/dbService');
const ewayBillService = require('../../lib/ewayBillService');

module.exports = async (req, res) => {
  if (req.method === 'POST') {
    try {
      const { lotId, buyerDetails, transportDetails, taxDetails } = req.body;

      // Get lot details
      const lotResult = await dbService.query(
        'SELECT * FROM lots WHERE id = $1',
        [lotId]
      );

      if (lotResult.rows.length === 0) {
        return res.status(404).json({ error: 'Lot not found' });
      }

      const lot = lotResult.rows[0];

      // Prepare e-Way Bill data
      const ewayData = {
        lot_code: lot.lot_code,
        lot_date: lot.lot_date,
        total_input_weight: lot.total_input_weight,
        ...buyerDetails,
        ...transportDetails,
        ...taxDetails
      };

      // Generate e-Way Bill
      const result = await ewayBillService.generateEWayBill(ewayData);

      if (result.success) {
        // Store e-Way Bill details in database
        await dbService.query(
          `INSERT INTO eway_bills (lot_id, eway_bill_no, eway_bill_date, valid_upto, status, details)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            lotId,
            result.ewayBillNo,
            result.ewayBillDate,
            result.validUpto,
            'ACTIVE',
            JSON.stringify(result.data)
          ]
        );

        return res.status(200).json(result);
      } else {
        return res.status(400).json(result);
      }
    } catch (error) {
      console.error('[API] E-Way Bill generation error:', error);
      return res.status(500).json({ error: error.message });
    }
  } else if (req.method === 'GET') {
    try {
      const { lotId } = req.query;

      const result = await dbService.query(
        'SELECT * FROM eway_bills WHERE lot_id = $1 ORDER BY created_at DESC',
        [lotId]
      );

      return res.status(200).json(result.rows);
    } catch (error) {
      console.error('[API] Fetch error:', error);
      return res.status(500).json({ error: error.message });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }
};
