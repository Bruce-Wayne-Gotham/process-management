# Oracle Cloud Database Migration Guide

## 🎯 Migration Overview

This guide helps you migrate from Supabase (PostgreSQL) to Oracle Cloud Autonomous Database with minimal application changes.

## 📋 Migration Steps

### Step 1: Set Up Oracle Cloud Autonomous Database

#### 1.1 Create Autonomous Database
1. Sign in to [Oracle Cloud Console](https://console.oracle.com)
2. Navigate to **Bare Metal, VMs, and Exadata** → **Autonomous Databases**
3. Click **Create Autonomous Database**
4. Configure:
   - **Display name**: `tobacco-tracker-db`
   - **Database name**: `TOBACCO_DB`
   - **Workload type**: **Transaction Processing**
   - **Deployment type**: **Shared Infrastructure** (cost-effective)
   - **Compute model**: **Serverless**
   - **Auto-scaling**: Enabled
   - **ECPU count**: 2 (minimum)
   - **Storage**: 20 GB (scalable)
   - **License type**: **License Included**
   - **Password**: Generate strong password
5. Click **Create Autonomous Database**

#### 1.2 Get Connection Details
1. Once created, click on your database
2. Go to **Database connection** tab
3. Download **Wallet** (required for secure connections)
4. Note the following:
   - **Connection string**
   - **Username**: `ADMIN`
   - **Password** (created above)

### Step 2: Configure Network Access

#### 2.1 Allow Access from Your Application
1. In your Autonomous Database, go to **Security** → **Access Control**
2. Add your Render service IP address to allowed IPs
3. Or configure VCN peering for production

### Step 3: Migrate Database Schema

#### 3.1 Create Oracle-Compatible Schema
Run the following SQL in Oracle Cloud SQL Developer Web or any Oracle SQL client:

```sql
-- Oracle Autonomous Database Schema for Tobacco Processing App
-- Compatible with PostgreSQL features used in Supabase

-- Create sequence for auto-increment IDs
CREATE SEQUENCE seq_farmers START WITH 1 INCREMENT BY 1;

-- farmers table
CREATE TABLE farmers (
  id NUMBER(10) PRIMARY KEY,
  farmer_code VARCHAR2(20) UNIQUE,
  name VARCHAR2(100) NOT NULL,
  village VARCHAR2(100),
  contact_number VARCHAR2(20),
  aadhaar_no VARCHAR2(20),
  dob DATE,
  account_holder_name VARCHAR2(100),
  bank_name VARCHAR2(100),
  branch_name VARCHAR2(100),
  account_number VARCHAR2(30),
  ifsc_code VARCHAR2(15),
  upi_id VARCHAR2(50),
  efficacy_score NUMBER(5,2) DEFAULT 0,
  efficacy_notes CLOB,
  is_active NUMBER(1) DEFAULT 1 CHECK (is_active IN (0,1)),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT SYSTIMESTAMP
);

-- Create trigger for auto-increment
CREATE OR REPLACE TRIGGER trg_farmers_id
BEFORE INSERT ON farmers
FOR EACH ROW
BEGIN
  :NEW.id := seq_farmers.NEXTVAL;
END;
/

-- Similar sequences and triggers for other tables
CREATE SEQUENCE seq_purchases START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE seq_lots START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE seq_lot_purchases START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE seq_process_status START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE seq_process START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE seq_jardi_output START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE seq_payments START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE seq_farmer_efficacy START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE seq_process_status_history START WITH 1 INCREMENT BY 1;

-- purchases table
CREATE TABLE purchases (
  id NUMBER(10) PRIMARY KEY,
  farmer_id NUMBER(10) REFERENCES farmers(id),
  purchase_date DATE NOT NULL,
  packaging_type VARCHAR2(10) CHECK (packaging_type IN ('BODH','BAG')),
  process_weight NUMBER(10,2) NOT NULL,
  packaging_weight NUMBER(10,2) DEFAULT 0,
  total_weight NUMBER(10,2) GENERATED ALWAYS AS (process_weight + packaging_weight) VIRTUAL,
  rate_per_kg NUMBER(10,2),
  total_amount NUMBER(12,2) GENERATED ALWAYS AS (process_weight * rate_per_kg) VIRTUAL,
  remarks CLOB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT SYSTIMESTAMP
);

CREATE OR REPLACE TRIGGER trg_purchases_id
BEFORE INSERT ON purchases
FOR EACH ROW
BEGIN
  :NEW.id := seq_purchases.NEXTVAL;
END;
/

-- lots table
CREATE TABLE lots (
  id NUMBER(10) PRIMARY KEY,
  lot_code VARCHAR2(20) UNIQUE NOT NULL,
  lot_date DATE NOT NULL,
  total_input_weight NUMBER(10,2) DEFAULT 0,
  remarks CLOB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT SYSTIMESTAMP
);

CREATE OR REPLACE TRIGGER trg_lots_id
BEFORE INSERT ON lots
FOR EACH ROW
BEGIN
  :NEW.id := seq_lots.NEXTVAL;
END;
/

-- lot_purchases junction table
CREATE TABLE lot_purchases (
  id NUMBER(10) PRIMARY KEY,
  lot_id NUMBER(10) NOT NULL REFERENCES lots(id),
  purchase_id NUMBER(10) NOT NULL REFERENCES purchases(id),
  used_weight NUMBER(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT SYSTIMESTAMP,
  CONSTRAINT uk_lot_purchases UNIQUE (lot_id, purchase_id)
);

CREATE OR REPLACE TRIGGER trg_lot_purchases_id
BEFORE INSERT ON lot_purchases
FOR EACH ROW
BEGIN
  :NEW.id := seq_lot_purchases.NEXTVAL;
END;
/

-- process_status master table
CREATE TABLE process_status (
  id NUMBER(10) PRIMARY KEY,
  status_code VARCHAR2(40) UNIQUE NOT NULL,
  label VARCHAR2(50) NOT NULL,
  description CLOB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT SYSTIMESTAMP
);

CREATE OR REPLACE TRIGGER trg_process_status_id
BEFORE INSERT ON process_status
FOR EACH ROW
BEGIN
  :NEW.id := seq_process_status.NEXTVAL;
END;
/

-- process table
CREATE TABLE process (
  id NUMBER(10) PRIMARY KEY,
  process_code VARCHAR2(20) UNIQUE NOT NULL,
  lot_id NUMBER(10) NOT NULL UNIQUE REFERENCES lots(id),
  status_id NUMBER(10) REFERENCES process_status(id) DEFAULT 1,
  process_date DATE NOT NULL,
  input_weight NUMBER(10,2) NOT NULL,
  kadi_mati_weight NUMBER(10,2) DEFAULT 0,
  dhas_weight NUMBER(10,2) DEFAULT 0,
  total_wastage_weight NUMBER(10,2) GENERATED ALWAYS AS (kadi_mati_weight + dhas_weight) VIRTUAL,
  net_loss_weight NUMBER(10,2) GENERATED ALWAYS AS (input_weight - total_wastage_weight) VIRTUAL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT SYSTIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT SYSTIMESTAMP
);

CREATE OR REPLACE TRIGGER trg_process_id
BEFORE INSERT ON process
FOR EACH ROW
BEGIN
  :NEW.id := seq_process.NEXTVAL;
END;
/

-- jardi_output table
CREATE TABLE jardi_output (
  id NUMBER(10) PRIMARY KEY,
  process_id NUMBER(10) NOT NULL UNIQUE REFERENCES process(id),
  jardi_weight NUMBER(10,2) NOT NULL,
  grade VARCHAR2(20),
  packaging_type VARCHAR2(20),
  num_packages NUMBER(10),
  avg_package_weight NUMBER(10,2),
  total_packed_weight NUMBER(10,2) GENERATED ALWAYS AS (COALESCE(num_packages,0) * COALESCE(avg_package_weight,0)) VIRTUAL,
  remarks CLOB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT SYSTIMESTAMP
);

CREATE OR REPLACE TRIGGER trg_jardi_output_id
BEFORE INSERT ON jardi_output
FOR EACH ROW
BEGIN
  :NEW.id := seq_jardi_output.NEXTVAL;
END;
/

-- payments table
CREATE TABLE payments (
  id NUMBER(10) PRIMARY KEY,
  purchase_id NUMBER(10) NOT NULL REFERENCES purchases(id),
  payment_date DATE NOT NULL,
  amount_paid NUMBER(12,2) NOT NULL,
  payment_mode VARCHAR2(20),
  transaction_ref VARCHAR2(50),
  remarks CLOB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT SYSTIMESTAMP
);

CREATE OR REPLACE TRIGGER trg_payments_id
BEFORE INSERT ON payments
FOR EACH ROW
BEGIN
  :NEW.id := seq_payments.NEXTVAL;
END;
/

-- farmer_efficacy table
CREATE TABLE farmer_efficacy (
  id NUMBER(10) PRIMARY KEY,
  farmer_id NUMBER(10) NOT NULL REFERENCES farmers(id),
  evaluation_date DATE NOT NULL,
  efficacy_score NUMBER(5,2) NOT NULL,
  remarks CLOB,
  evaluator VARCHAR2(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT SYSTIMESTAMP
);

CREATE OR REPLACE TRIGGER trg_farmer_efficacy_id
BEFORE INSERT ON farmer_efficacy
FOR EACH ROW
BEGIN
  :NEW.id := seq_farmer_efficacy.NEXTVAL;
END;
/

-- process_status_history table
CREATE TABLE process_status_history (
  id NUMBER(10) PRIMARY KEY,
  process_id NUMBER(10) NOT NULL REFERENCES process(id),
  from_status_id NUMBER(10) REFERENCES process_status(id),
  to_status_id NUMBER(10) REFERENCES process_status(id),
  changed_by VARCHAR2(100),
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT SYSTIMESTAMP,
  notes CLOB
);

CREATE OR REPLACE TRIGGER trg_process_status_history_id
BEFORE INSERT ON process_status_history
FOR EACH ROW
BEGIN
  :NEW.id := seq_process_status_history.NEXTVAL;
END;
/
```

#### 3.2 Insert Seed Data
```sql
-- Insert default process statuses
INSERT INTO process_status (status_code, label, description) VALUES
('PENDING', 'Pending', 'Process not yet started'),
('IN_PROGRESS', 'In Progress', 'Process is currently running'),
('COMPLETED', 'Completed', 'Process has been completed'),
('ON_HOLD', 'On Hold', 'Process is temporarily paused'),
('CANCELLED', 'Cancelled', 'Process has been cancelled');

-- Create indexes for better performance
CREATE INDEX idx_purchases_farmer_id ON purchases(farmer_id);
CREATE INDEX idx_purchases_date ON purchases(purchase_date);
CREATE INDEX idx_lot_purchases_lot_id ON lot_purchases(lot_id);
CREATE INDEX idx_lot_purchases_purchase_id ON lot_purchases(purchase_id);
CREATE INDEX idx_process_lot_id ON process(lot_id);
CREATE INDEX idx_payments_purchase_id ON payments(purchase_id);
CREATE INDEX idx_farmer_efficacy_farmer_id ON farmer_efficacy(farmer_id);

-- Insert sample farmers for testing
INSERT INTO farmers (farmer_code, name, village, contact_number, efficacy_score) VALUES
('F001', 'Rajesh Kumar', 'Khandwa', '9876543210', 8.5),
('F002', 'Suresh Patel', 'Dewas', '9876543211', 7.2),
('F003', 'Mahesh Singh', 'Ujjain', '9876543212', 9.1),
('F004', 'Ramesh Sharma', 'Indore', '9876543213', 6.8),
('F005', 'Dinesh Verma', 'Bhopal', '9876543214', 8.9);

-- Insert sample purchases for testing
INSERT INTO purchases (farmer_id, purchase_date, packaging_type, process_weight, packaging_weight, rate_per_kg, remarks) VALUES
(1, TO_DATE('2024-11-01', 'YYYY-MM-DD'), 'BODH', 50.5, 2.0, 150.00, 'Good quality tobacco'),
(2, TO_DATE('2024-11-02', 'YYYY-MM-DD'), 'BAG', 75.2, 3.5, 145.00, 'Premium grade'),
(1, TO_DATE('2024-11-03', 'YYYY-MM-DD'), 'BODH', 60.0, 2.5, 150.00, 'Regular quality'),
(3, TO_DATE('2024-11-04', 'YYYY-MM-DD'), 'BAG', 80.5, 4.0, 155.00, 'Excellent quality'),
(4, TO_DATE('2024-11-05', 'YYYY-MM-DD'), 'BODH', 45.0, 1.8, 140.00, 'Average quality');

COMMIT;
```

### Step 4: Update Application Configuration

#### 4.1 Install Oracle Database Driver
```bash
cd nextjs
npm install oracledb
```

#### 4.2 Update Environment Variables
In your Render service environment variables:
```bash
# Remove Supabase variables
# NEXT_PUBLIC_SUPABASE_URL=xxx
# NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx

# Add Oracle Cloud variables
ORACLE_DB_USER=ADMIN
ORACLE_DB_PASSWORD=your_password
ORACLE_DB_CONNECTION_STRING=your_connection_string
ORACLE_WALLET_DIR=/opt/render/project/src/wallet
```

#### 4.3 Update Database Client
Replace `lib/supabaseClient.js` with Oracle database client:

```javascript
// lib/oracleClient.js
import oracledb from 'oracledb';

const config = {
  user: process.env.ORACLE_DB_USER,
  password: process.env.ORACLE_DB_PASSWORD,
  connectionString: process.env.ORACLE_DB_CONNECTION_STRING,
  walletLocation: process.env.ORACLE_WALLET_DIR,
  walletPassword: process.env.ORACLE_WALLET_PASSWORD
};

export async function getConnection() {
  return await oracledb.getConnection(config);
}

export async function executeQuery(sql, params = []) {
  let connection;
  try {
    connection = await getConnection();
    const result = await connection.execute(sql, params, {
      outFormat: oracledb.OUT_FORMAT_OBJECT
    });
    return result.rows;
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}

export async function executeInsert(sql, params = []) {
  let connection;
  try {
    connection = await getConnection();
    const result = await connection.execute(sql, params, {
      autoCommit: true
    });
    return result;
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}
```

### Step 5: Update API Endpoints

#### 5.1 Example: Update Farmers API
Replace `pages/api/farmers.js` with Oracle-compatible version:

```javascript
// pages/api/farmers.js
import { executeQuery, executeInsert } from '../../lib/oracleClient';

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const sql = `
        SELECT id, farmer_code, name, village, contact_number, 
               aadhaar_no, dob, account_holder_name, bank_name, 
               branch_name, account_number, ifsc_code, upi_id, 
               efficacy_score, efficacy_notes, is_active, 
               TO_CHAR(created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as created_at
        FROM farmers 
        WHERE is_active = 1 
        ORDER BY name
      `;
      const farmers = await executeQuery(sql);
      res.status(200).json(farmers);
    } else if (req.method === 'POST') {
      const { farmer_code, name, village, contact_number, ...otherFields } = req.body;
      
      const sql = `
        INSERT INTO farmers (farmer_code, name, village, contact_number, 
                           aadhaar_no, dob, account_holder_name, bank_name, 
                           branch_name, account_number, ifsc_code, upi_id, 
                           efficacy_score, efficacy_notes)
        VALUES (:farmer_code, :name, :village, :contact_number, 
                :aadhaar_no, :dob, :account_holder_name, :bank_name, 
                :branch_name, :account_number, :ifsc_code, :upi_id, 
                :efficacy_score, :efficacy_notes)
      `;
      
      await executeInsert(sql, req.body);
      res.status(201).json({ message: 'Farmer created successfully' });
    }
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Database operation failed' });
  }
}
```

### Step 6: Deploy Oracle Wallet

#### 6.1 Upload Wallet to Render
1. Extract the downloaded wallet ZIP file
2. Upload wallet files to your project root `/wallet` directory
3. Ensure wallet files are included in your deployment

### Step 7: Test Migration

#### 7.1 Verify Database Connection
```javascript
// test-oracle-connection.js
import { executeQuery } from './lib/oracleClient';

async function testConnection() {
  try {
    const result = await executeQuery('SELECT COUNT(*) as count FROM farmers');
    console.log('Connection successful! Farmers count:', result[0].COUNT);
  } catch (error) {
    console.error('Connection failed:', error);
  }
}

testConnection();
```

#### 7.2 Test Application
1. Deploy updated application to Render
2. Test all CRUD operations
3. Verify data integrity
4. Monitor performance

## 🔧 Troubleshooting

### Common Issues

#### Connection Errors
- **ORA-12154**: Check connection string format
- **ORA-28009**: Verify wallet configuration
- **Network issues**: Ensure IP whitelisting is correct

#### Data Type Issues
- **Boolean**: Oracle uses NUMBER(1) instead of BOOLEAN
- **JSON**: Use CLOB instead of JSONB
- **Arrays**: Use nested tables or VARRAYs

#### Performance Issues
- Add appropriate indexes
- Use connection pooling
- Optimize SQL queries

## 📊 Migration Benefits

### Oracle Cloud Advantages
- ✅ **Auto-scaling** performance
- ✅ **99.995%** uptime SLA
- ✅ **Built-in** security and encryption
- ✅ **Automated** backups and patching
- ✅ **Pay-per-use** pricing model
- ✅ **Global** infrastructure

### Cost Comparison
- **Supabase Pro**: ~$25/month
- **Oracle Autonomous Database**: ~$0.15/hour (~$108/month for 24/7)
- **Oracle Serverless**: Pay per OCPU-hour (potentially cheaper)

## 🚀 Post-Migration Steps

1. **Monitor** database performance
2. **Set up** monitoring alerts
3. **Configure** automated backups
4. **Optimize** query performance
5. **Train** team on Oracle tools

## 📞 Support

- **Oracle Cloud Documentation**: https://docs.oracle.com/en/cloud/
- **Oracle Autonomous Database**: https://docs.oracle.com/en/cloud/paas/autonomous-database/
- **Node.js Oracle Driver**: https://github.com/oracle/node-oracledb
