-- Oracle Autonomous Database Schema for Tobacco Processing App
-- Compatible with PostgreSQL features used in Supabase
-- Run this script in Oracle Cloud SQL Developer Web or any Oracle SQL client

-- Drop existing tables if they exist (for clean re-creation)
BEGIN
  EXECUTE IMMEDIATE 'DROP TABLE process_status_history PURGE';
EXCEPTION
  WHEN OTHERS THEN NULL;
END;
/

BEGIN
  EXECUTE IMMEDIATE 'DROP TABLE farmer_efficacy PURGE';
EXCEPTION
  WHEN OTHERS THEN NULL;
END;
/

BEGIN
  EXECUTE IMMEDIATE 'DROP TABLE payments PURGE';
EXCEPTION
  WHEN OTHERS THEN NULL;
END;
/

BEGIN
  EXECUTE IMMEDIATE 'DROP TABLE jardi_output PURGE';
EXCEPTION
  WHEN OTHERS THEN NULL;
END;
/

BEGIN
  EXECUTE IMMEDIATE 'DROP TABLE process PURGE';
EXCEPTION
  WHEN OTHERS THEN NULL;
END;
/

BEGIN
  EXECUTE IMMEDIATE 'DROP TABLE process_status PURGE';
EXCEPTION
  WHEN OTHERS THEN NULL;
END;
/

BEGIN
  EXECUTE IMMEDIATE 'DROP TABLE lot_purchases PURGE';
EXCEPTION
  WHEN OTHERS THEN NULL;
END;
/

BEGIN
  EXECUTE IMMEDIATE 'DROP TABLE lots PURGE';
EXCEPTION
  WHEN OTHERS THEN NULL;
END;
/

BEGIN
  EXECUTE IMMEDIATE 'DROP TABLE purchases PURGE';
EXCEPTION
  WHEN OTHERS THEN NULL;
END;
/

BEGIN
  EXECUTE IMMEDIATE 'DROP TABLE farmers PURGE';
EXCEPTION
  WHEN OTHERS THEN NULL;
END;
/

-- Drop sequences
BEGIN
  EXECUTE IMMEDIATE 'DROP SEQUENCE seq_farmers PURGE';
EXCEPTION
  WHEN OTHERS THEN NULL;
END;
/

BEGIN
  EXECUTE IMMEDIATE 'DROP SEQUENCE seq_purchases PURGE';
EXCEPTION
  WHEN OTHERS THEN NULL;
END;
/

BEGIN
  EXECUTE IMMEDIATE 'DROP SEQUENCE seq_lots PURGE';
EXCEPTION
  WHEN OTHERS THEN NULL;
END;
/

BEGIN
  EXECUTE IMMEDIATE 'DROP SEQUENCE seq_lot_purchases PURGE';
EXCEPTION
  WHEN OTHERS THEN NULL;
END;
/

BEGIN
  EXECUTE IMMEDIATE 'DROP SEQUENCE seq_process_status PURGE';
EXCEPTION
  WHEN OTHERS THEN NULL;
END;
/

BEGIN
  EXECUTE IMMEDIATE 'DROP SEQUENCE seq_process PURGE';
EXCEPTION
  WHEN OTHERS THEN NULL;
END;
/

BEGIN
  EXECUTE IMMEDIATE 'DROP SEQUENCE seq_jardi_output PURGE';
EXCEPTION
  WHEN OTHERS THEN NULL;
END;
/

BEGIN
  EXECUTE IMMEDIATE 'DROP SEQUENCE seq_payments PURGE';
EXCEPTION
  WHEN OTHERS THEN NULL;
END;
/

BEGIN
  EXECUTE IMMEDIATE 'DROP SEQUENCE seq_farmer_efficacy PURGE';
EXCEPTION
  WHEN OTHERS THEN NULL;
END;
/

BEGIN
  EXECUTE IMMEDIATE 'DROP SEQUENCE seq_process_status_history PURGE';
EXCEPTION
  WHEN OTHERS THEN NULL;
END;
/

-- Create sequences for auto-increment IDs
CREATE SEQUENCE seq_farmers START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;
CREATE SEQUENCE seq_purchases START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;
CREATE SEQUENCE seq_lots START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;
CREATE SEQUENCE seq_lot_purchases START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;
CREATE SEQUENCE seq_process_status START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;
CREATE SEQUENCE seq_process START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;
CREATE SEQUENCE seq_jardi_output START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;
CREATE SEQUENCE seq_payments START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;
CREATE SEQUENCE seq_farmer_efficacy START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;
CREATE SEQUENCE seq_process_status_history START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;

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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT SYSTIMESTAMP,
  CONSTRAINT chk_farmers_score CHECK (efficacy_score >= 0 AND efficacy_score <= 10)
);

-- Create trigger for auto-increment
CREATE OR REPLACE TRIGGER trg_farmers_id
BEFORE INSERT ON farmers
FOR EACH ROW
BEGIN
  :NEW.id := seq_farmers.NEXTVAL;
END;
/

-- purchases table
CREATE TABLE purchases (
  id NUMBER(10) PRIMARY KEY,
  farmer_id NUMBER(10) REFERENCES farmers(id),
  purchase_date DATE NOT NULL,
  packaging_type VARCHAR2(10) CHECK (packaging_type IN ('BODH','BAG')),
  process_weight NUMBER(10,2) NOT NULL CHECK (process_weight > 0),
  packaging_weight NUMBER(10,2) DEFAULT 0 CHECK (packaging_weight >= 0),
  total_weight NUMBER(10,2) GENERATED ALWAYS AS (process_weight + packaging_weight) VIRTUAL,
  rate_per_kg NUMBER(10,2) DEFAULT 0 CHECK (rate_per_kg >= 0),
  total_amount NUMBER(12,2) GENERATED ALWAYS AS (process_weight * rate_per_kg) VIRTUAL,
  remarks CLOB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT SYSTIMESTAMP,
  CONSTRAINT chk_purchases_date CHECK (purchase_date <= SYSDATE)
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
  total_input_weight NUMBER(10,2) DEFAULT 0 CHECK (total_input_weight >= 0),
  remarks CLOB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT SYSTIMESTAMP,
  CONSTRAINT chk_lots_date CHECK (lot_date <= SYSDATE)
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
  lot_id NUMBER(10) NOT NULL REFERENCES lots(id) ON DELETE CASCADE,
  purchase_id NUMBER(10) NOT NULL REFERENCES purchases(id) ON DELETE RESTRICT,
  used_weight NUMBER(10,2) NOT NULL CHECK (used_weight > 0),
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
  lot_id NUMBER(10) NOT NULL UNIQUE REFERENCES lots(id) ON DELETE CASCADE,
  status_id NUMBER(10) REFERENCES process_status(id) DEFAULT 1,
  process_date DATE NOT NULL,
  input_weight NUMBER(10,2) NOT NULL CHECK (input_weight > 0),
  kadi_mati_weight NUMBER(10,2) DEFAULT 0 CHECK (kadi_mati_weight >= 0),
  dhas_weight NUMBER(10,2) DEFAULT 0 CHECK (dhas_weight >= 0),
  total_wastage_weight NUMBER(10,2) GENERATED ALWAYS AS (kadi_mati_weight + dhas_weight) VIRTUAL,
  net_loss_weight NUMBER(10,2) GENERATED ALWAYS AS (input_weight - total_wastage_weight) VIRTUAL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT SYSTIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT SYSTIMESTAMP,
  CONSTRAINT chk_process_date CHECK (process_date <= SYSDATE),
  CONSTRAINT chk_process_weights CHECK (total_wastage_weight <= input_weight)
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
  process_id NUMBER(10) NOT NULL UNIQUE REFERENCES process(id) ON DELETE CASCADE,
  jardi_weight NUMBER(10,2) NOT NULL CHECK (jardi_weight > 0),
  grade VARCHAR2(20),
  packaging_type VARCHAR2(20),
  num_packages NUMBER(10),
  avg_package_weight NUMBER(10,2) CHECK (avg_package_weight > 0),
  total_packed_weight NUMBER(10,2) GENERATED ALWAYS AS (COALESCE(num_packages,0) * COALESCE(avg_package_weight,0)) VIRTUAL,
  remarks CLOB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT SYSTIMESTAMP,
  CONSTRAINT chk_jardi_packages CHECK (num_packages IS NULL OR num_packages >= 0)
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
  purchase_id NUMBER(10) NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
  payment_date DATE NOT NULL,
  amount_paid NUMBER(12,2) NOT NULL CHECK (amount_paid > 0),
  payment_mode VARCHAR2(20),
  transaction_ref VARCHAR2(50),
  remarks CLOB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT SYSTIMESTAMP,
  CONSTRAINT chk_payments_date CHECK (payment_date <= SYSDATE)
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
  farmer_id NUMBER(10) NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
  evaluation_date DATE NOT NULL,
  efficacy_score NUMBER(5,2) NOT NULL CHECK (efficacy_score >= 0 AND efficacy_score <= 10),
  remarks CLOB,
  evaluator VARCHAR2(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT SYSTIMESTAMP,
  CONSTRAINT chk_efficacy_date CHECK (evaluation_date <= SYSDATE)
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
  process_id NUMBER(10) NOT NULL REFERENCES process(id) ON DELETE CASCADE,
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

COMMIT;
/
