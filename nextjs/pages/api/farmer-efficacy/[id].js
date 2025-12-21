import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      const { data: efficacyRecord, error } = await supabase
        .from('farmer_efficacy')
        .select(`
          *,
          farmers (
            farmer_code,
            name,
            village,
            contact_number,
            efficacy_score
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('Supabase error:', error);
        if (error.code === 'PGRST116') {
          return res.status(404).json({ error: 'Efficacy record not found' });
        }
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json(efficacyRecord);
    } catch (error) {
      console.error('API error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  if (req.method === 'PUT') {
    try {
      const { 
        assessment_date,
        quality_score,
        quantity_score,
        reliability_score,
        overall_score,
        assessment_notes,
        assessor_name
      } = req.body;

      // Validate score ranges
      const scores = { quality_score, quantity_score, reliability_score, overall_score };
      for (const [key, value] of Object.entries(scores)) {
        if (value !== undefined && (value < 0 || value > 10)) {
          return res.status(400).json({ 
            error: `${key} must be between 0 and 10` 
          });
        }
      }

      const updateData = {};
      if (assessment_date !== undefined) updateData.assessment_date = assessment_date;
      if (quality_score !== undefined) updateData.quality_score = quality_score ? parseFloat(quality_score) : null;
      if (quantity_score !== undefined) updateData.quantity_score = quantity_score ? parseFloat(quantity_score) : null;
      if (reliability_score !== undefined) updateData.reliability_score = reliability_score ? parseFloat(reliability_score) : null;
      if (assessment_notes !== undefined) updateData.assessment_notes = assessment_notes || null;
      if (assessor_name !== undefined) updateData.assessor_name = assessor_name || null;

      // Calculate overall score if not provided but individual scores are
      if (overall_score !== undefined) {
        updateData.overall_score = parseFloat(overall_score);
      } else if (quality_score !== undefined && quantity_score !== undefined && reliability_score !== undefined) {
        updateData.overall_score = ((parseFloat(quality_score) + parseFloat(quantity_score) + parseFloat(reliability_score)) / 3).toFixed(1);
      }

      const { data: efficacyRecord, error } = await supabase
        .from('farmer_efficacy')
        .update(updateData)
        .eq('id', id)
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
        if (error.code === 'PGRST116') {
          return res.status(404).json({ error: 'Efficacy record not found' });
        }
        return res.status(500).json({ error: error.message });
      }

      // Update farmer's efficacy score if overall score changed
      if (updateData.overall_score !== undefined) {
        await supabase
          .from('farmers')
          .update({ 
            efficacy_score: parseFloat(updateData.overall_score),
            efficacy_notes: updateData.assessment_notes || null
          })
          .eq('id', efficacyRecord.farmer_id);
      }

      return res.status(200).json(efficacyRecord);
    } catch (error) {
      console.error('API error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      // Get efficacy record info before deletion
      const { data: efficacyRecord, error: fetchError } = await supabase
        .from('farmer_efficacy')
        .select('farmer_id')
        .eq('id', id)
        .single();

      if (fetchError) {
        return res.status(404).json({ error: 'Efficacy record not found' });
      }

      const { error } = await supabase
        .from('farmer_efficacy')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Sup error:', error);
        return res.status(500).json({ error: error.message });
      }

      // Update farmer's efficacy score to the most recent assessment or null
      const { data: latestAssessment } = await supabase
        .from('farmer_efficacy')
        .select('overall_score, assessment_notes')
        .eq('farmer_id', efficacyRecord.farmer_id)
        .order('assessment_date', { ascending: false })
        .limit(1)
        .single();

      if (latestAssessment) {
        await supabase
          .from('farmers')
          .update({ 
            efficacy_score: latestAssessment.overall_score,
            efficacy_notes: latestAssessment.assessment_notes
          })
          .eq('id', efficacyRecord.farmer_id);
      } else {
        await supabase
          .from('farmers')
          .update({ 
            efficacy_score: null,
            efficacy_notes: null
          })
          .eq('id', efficacyRecord.farmer_id);
      }

      return res.status(204).send();
    } catch (error) {
      console.error('API error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
