#!/usr/bin/env node

/**
 * Database Verification Script for Tobacco Tracker
 * Verifies that all tables and data are set up correctly
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing required environment variables: SUPABASE_URL and SUPABASE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyDatabase() {
  console.log('🔍 Verifying Tobacco Tracker Database Setup...');
  console.log('=' .repeat(50));

  try {
    // Check table existence and counts
    const tables = ['farmers', 'purchases', 'lots', 'process_status', 'process', 'jardi_output', 'payments', 'farmer_efficacy'];
    
    for (const table of tables) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          console.log(`❌ ${table}: Error - ${error.message}`);
        } else {
          console.log(`✅ ${table}: ${count} records`);
        }
      } catch (err) {
        console.log(`❌ ${table}: Exception - ${err.message}`);
      }
    }

    // Test computed columns
    console.log('\n🧮 Testing computed columns...');
    const { data: purchases, error: purchasesError } = await supabase
      .from('purchases')
      .select('id, process_weight, packaging_weight, total_weight, rate_per_kg, total_amount')
      .limit(3);

    if (purchasesError) {
      console.log('❌ Error testing computed columns:', purchasesError.message);
    } else {
      purchases.forEach(p => {
        const expectedTotal = p.process_weight + p.packaging_weight;
        const expectedAmount = p.process_weight * p.rate_per_kg;
        
        console.log(`   Purchase ${p.id}: Weight ${expectedTotal === p.total_weight ? '✅' : '❌'}, Amount ${expectedAmount === p.total_amount ? '✅' : '❌'}`);
      });
    }

    // Test relationships
    console.log('\n🔗 Testing relationships...');
    const { data: purchasesWithFarmers, error: relationError } = await supabase
      .from('purchases')
      .select(`
        id,
        farmers (
          farmer_code,
          name
        )
      `)
      .limit(3);

    if (relationError) {
      console.log('❌ Error testing relationships:', relationError.message);
    } else {
      console.log(`✅ Farmer-Purchase relationships: ${purchasesWithFarmers.length} purchases linked to farmers`);
    }

    console.log('\n🎉 Database verification completed!');

  } catch (error) {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  }
}

verifyDatabase();
