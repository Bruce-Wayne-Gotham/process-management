import { query } from '../../lib/db';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const result = await query(
        'SELECT * FROM farmers ORDER BY created_at DESC'
      );
      return res.status(200).json(result.rows || []);
    } catch (error) {
      console.error('Database error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }


  if (req.method === 'POST') {
    try {
      const { farmer_id, assessment_date, quality_score, quantity_score, reliability_score, overall_score, assessment_notes, assessor_name } = req.body;

      if (!farmer_id || !assessment_date) {
        return res.status(400).json({ error: 'Farmer ID and assessment date are required' });
      }

      // Calculate overall score if not provided
      let calculatedOverallScore = overall_score;
      if (overall_score === undefined && quality_score && quantity_score && reliability_score) {
        calculatedOverallScore = ((parseFloat(quality_score) + parseFloat(quantity_score) + parseFloat(reliability_score)) / 3).toFixed(1);
      }

      const result = await query(
        `UPDATE farmers 
         SET efficacy_score = $1, efficacy_notes = $2 
         WHERE id = $3 
         RETURNING *`,
        [calculatedOverallScore || null, assessment_notes || null, farmer_id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Farmer not found' });
      }

      return res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Database error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
