import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';

const app = express();
app.use(cors());
app.use(express.json());

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

app.get('/health', (req, res) => {
  res.json({ ok: true });
});

app.get('/farmers', async (req, res) => {
  const { data, error } = await supabase
    .from('farmers')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
});

const port = process.env.PORT || 3001;
app.listen(port, () => {
  // no-op
});
