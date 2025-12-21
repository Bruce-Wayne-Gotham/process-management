import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const { data: efficacyRecords, error } = await supabase
        .from('farmer_efficacy')
        .select(`
          *,
          farmers (
            farmer_code,
            name,
            village,
            contact_number
          )
        `)
        .order('assessment_date', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json(efficacyRecords || []);
    } catch (error) {
      console.error('API error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { 
        farmer_id, 
        assessment_date,
        quality_score,
        quantity_score,
        reliability_score,
        overall_score,
        assessment_notes,
        assessor_name
      } = req.body;

      // Validation
      if (!farmer_id || !assessment_date) {
        return res.status(400).json({ 
          error: 'Farmer ID and assessment date are required' 
        });
      }

      // Validate score ranges
      const scores = { quality_score, quantity_score, reliability_score, overall_score };
      for (const [key, value] of Object.entries(scores)) {
        if (value !== undefined && (value < 0 || value > 10)) {
          return res.status(400).json({ 
            error: `${key} must be between 0 and 10` 
          });
        }
      }

      // Calculate overall score if not provided
      let calculatedOverallScore = overall_score;
      if (overall_score === undefined && quality_score !== undefined && quantity_score !== undefined && reliability_score !== undefined) {
        calculatedOverallScore = ((parseFloat(quality_score) + parseFloat(quantity_score) + parseFloat(reliability_score)) / 3).toFixed(1);
      }

      const { data: efficacyRecord, error } = await supabase
        .from('farmer_efficacy')
        .insert([{
          farmer_id: parseInt(farmer_id),
          assessment_date,
          quality_score: quality_score ? parseFloat(quality_score) : null,
          quantity_score: quantity_score ? parseFloat(quantity_score) : null,
          reliability_score: reliability_score ? parseFloat(reliability_score) : null,
          overall_score: calculatedOverallScore ? parseFloat(calculatedOverallScore) : null,
          assessment_notes: assessment_notes || null,
          assessor_name: assessor_name || null
        }])
        .select(`
          *,
          farmers (
            farmer_code,
            name,
            village
          )
        `)
        .single();

      if (error) {
        console.error('Supabase error:', error);
        return res.status(500).json({ error: error.message });
      }

      // Update farmer's efficacy score with latest assessment
      if (calculatedOverallScore !== null) {
        await supabase
          .from('farmers')
          .update({ 
            efficacy_score: parseFloat(calculatedOverallScore),
            efficacy_notes: assessment_notes || null
          })
          .eq('id', farmer_id);
      }

      return res.status(201).json(efficacyRecord);
    } catch (error) {
      console.error('API error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
