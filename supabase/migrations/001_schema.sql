-- ================================================================
-- VetCRM — Core Schema Migration
-- Run in Supabase SQL Editor
-- ================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ================================================================
-- ORGANIZATIONS
-- ================================================================
CREATE TABLE organizations (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  slug        text UNIQUE NOT NULL,
  plan        text NOT NULL DEFAULT 'single' CHECK (plan IN ('single','pro','enterprise')),
  settings    jsonb NOT NULL DEFAULT '{}',
  logo_url    text,
  address     text,
  phone       text,
  email       text,
  timezone    text NOT NULL DEFAULT 'America/New_York',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- ================================================================
-- PROFILES
-- ================================================================
CREATE TABLE profiles (
  id              uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organizations(id),
  role            text NOT NULL CHECK (role IN ('owner','veterinarian','receptionist','client')),
  first_name      text NOT NULL,
  last_name       text NOT NULL,
  email           text NOT NULL,
  phone           text,
  avatar_url      text,
  is_active       boolean NOT NULL DEFAULT true,
  mfa_enabled     boolean NOT NULL DEFAULT false,
  last_login_at   timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_profiles_org_role ON profiles(organization_id, role);
CREATE INDEX idx_profiles_email ON profiles(email);

-- ================================================================
-- STAFF PROFILES
-- ================================================================
CREATE TABLE staff_profiles (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id        uuid NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  organization_id   uuid NOT NULL REFERENCES organizations(id),
  employee_id       text,
  specialization    text,
  license_number    text,
  license_state     text,
  hire_date         date,
  compensation_type text CHECK (compensation_type IN ('salary','hourly','commission','mixed')),
  base_salary       numeric(10,2),
  hourly_rate       numeric(8,2),
  commission_rate   numeric(5,4),
  notes             text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

-- ================================================================
-- CLIENTS
-- ================================================================
CREATE TABLE clients (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id         uuid NOT NULL REFERENCES organizations(id),
  profile_id              uuid REFERENCES profiles(id),
  primary_vet_id          uuid REFERENCES profiles(id),
  first_name              text NOT NULL,
  last_name               text NOT NULL,
  email                   text,
  phone_primary           text,
  phone_secondary         text,
  address_line1           text,
  address_line2           text,
  city                    text,
  state                   text,
  zip                     text,
  country                 text NOT NULL DEFAULT 'US',
  emergency_contact_name  text,
  emergency_contact_phone text,
  preferred_contact       text CHECK (preferred_contact IN ('email','sms','phone')),
  notes                   text,
  lead_source             text,
  status                  text NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','lead','deceased')),
  balance_due             numeric(10,2) NOT NULL DEFAULT 0,
  portal_invite_sent_at   timestamptz,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_clients_org ON clients(organization_id);
CREATE INDEX idx_clients_vet ON clients(primary_vet_id);
CREATE INDEX idx_clients_status ON clients(organization_id, status);
CREATE INDEX idx_clients_search ON clients USING gin(
  to_tsvector('english', first_name || ' ' || last_name || ' ' || coalesce(email,'') || ' ' || coalesce(phone_primary,''))
);

-- ================================================================
-- PETS
-- ================================================================
CREATE TABLE pets (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   uuid NOT NULL REFERENCES organizations(id),
  client_id         uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  primary_vet_id    uuid REFERENCES profiles(id),
  name              text NOT NULL,
  species           text NOT NULL,
  breed             text,
  sex               text CHECK (sex IN ('male','female','male_neutered','female_spayed','unknown')),
  date_of_birth     date,
  weight            numeric(6,2),
  weight_unit       text NOT NULL DEFAULT 'lbs' CHECK (weight_unit IN ('lbs','kg')),
  color             text,
  microchip_number  text,
  insurance_provider text,
  insurance_policy  text,
  is_deceased       boolean NOT NULL DEFAULT false,
  deceased_date     date,
  avatar_url        text,
  notes             text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_pets_client ON pets(client_id);
CREATE INDEX idx_pets_vet ON pets(primary_vet_id);
CREATE INDEX idx_pets_org ON pets(organization_id);

CREATE TABLE pet_allergies (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id    uuid NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  allergen  text NOT NULL,
  reaction  text,
  severity  text CHECK (severity IN ('mild','moderate','severe')),
  noted_at  date NOT NULL DEFAULT CURRENT_DATE,
  notes     text
);

CREATE TABLE pet_medications (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id          uuid NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  prescribed_by   uuid REFERENCES profiles(id),
  medication_name text NOT NULL,
  dosage          text,
  frequency       text,
  route           text,
  start_date      date,
  end_date        date,
  is_active       boolean NOT NULL DEFAULT true,
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- ================================================================
-- APPOINTMENTS
-- ================================================================
CREATE TABLE appointments (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id     uuid NOT NULL REFERENCES organizations(id),
  client_id           uuid NOT NULL REFERENCES clients(id),
  pet_id              uuid NOT NULL REFERENCES pets(id),
  veterinarian_id     uuid NOT NULL REFERENCES profiles(id),
  appointment_type    text NOT NULL CHECK (appointment_type IN (
                        'wellness','sick_visit','surgery','dental',
                        'follow_up','vaccine','emergency','boarding','grooming','other'
                      )),
  title               text,
  notes               text,
  scheduled_at        timestamptz NOT NULL,
  duration_minutes    int NOT NULL DEFAULT 30,
  room                text,
  status              text NOT NULL DEFAULT 'scheduled' CHECK (status IN (
                        'scheduled','confirmed','checked_in',
                        'in_progress','completed','cancelled','no_show'
                      )),
  check_in_at         timestamptz,
  check_out_at        timestamptz,
  cancellation_reason text,
  reminder_24h_sent   boolean NOT NULL DEFAULT false,
  reminder_1h_sent    boolean NOT NULL DEFAULT false,
  created_by          uuid REFERENCES profiles(id),
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_appointments_scheduled ON appointments(organization_id, scheduled_at);
CREATE INDEX idx_appointments_vet_date ON appointments(veterinarian_id, scheduled_at);
CREATE INDEX idx_appointments_status ON appointments(organization_id, status);
CREATE INDEX idx_appointments_client ON appointments(client_id);

-- ================================================================
-- MEDICAL RECORDS
-- ================================================================
CREATE TABLE medical_records (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   uuid NOT NULL REFERENCES organizations(id),
  appointment_id    uuid REFERENCES appointments(id),
  pet_id            uuid NOT NULL REFERENCES pets(id),
  veterinarian_id   uuid NOT NULL REFERENCES profiles(id),
  visit_date        date NOT NULL DEFAULT CURRENT_DATE,
  chief_complaint   text,
  subjective        text,
  objective         text,
  assessment        text,
  plan              text,
  weight_at_visit   numeric(6,2),
  temperature       numeric(4,1),
  heart_rate        int,
  respiratory_rate  int,
  blood_pressure    text,
  pain_score        int CHECK (pain_score BETWEEN 0 AND 10),
  is_locked         boolean NOT NULL DEFAULT false,
  locked_at         timestamptz,
  locked_by         uuid REFERENCES profiles(id),
  follow_up_required boolean NOT NULL DEFAULT false,
  follow_up_in_days  int,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_medical_records_pet ON medical_records(pet_id, visit_date DESC);
CREATE INDEX idx_medical_records_vet ON medical_records(veterinarian_id);

CREATE TABLE diagnoses (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  medical_record_id uuid NOT NULL REFERENCES medical_records(id) ON DELETE CASCADE,
  icd_code          text,
  description       text NOT NULL,
  diagnosis_type    text NOT NULL DEFAULT 'primary' CHECK (diagnosis_type IN ('primary','secondary','differential','rule_out')),
  status            text NOT NULL DEFAULT 'active' CHECK (status IN ('active','resolved','chronic','monitoring'))
);

CREATE TABLE treatments (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  medical_record_id uuid NOT NULL REFERENCES medical_records(id) ON DELETE CASCADE,
  pet_id            uuid NOT NULL REFERENCES pets(id),
  treatment_type    text,
  description       text NOT NULL,
  performed_by      uuid REFERENCES profiles(id),
  performed_at      timestamptz NOT NULL DEFAULT now(),
  notes             text
);

CREATE TABLE prescriptions (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  medical_record_id uuid NOT NULL REFERENCES medical_records(id) ON DELETE CASCADE,
  pet_id            uuid NOT NULL REFERENCES pets(id),
  prescribed_by     uuid NOT NULL REFERENCES profiles(id),
  medication_name   text NOT NULL,
  dosage            text NOT NULL,
  frequency         text NOT NULL,
  route             text CHECK (route IN ('oral','topical','injection','inhaled','ophthalmic','otic','other')),
  quantity          int,
  refills           int NOT NULL DEFAULT 0,
  start_date        date NOT NULL DEFAULT CURRENT_DATE,
  end_date          date,
  instructions      text,
  status            text NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed','cancelled','on_hold')),
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE vaccinations (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id            uuid NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  medical_record_id uuid REFERENCES medical_records(id),
  administered_by   uuid REFERENCES profiles(id),
  vaccine_name      text NOT NULL,
  manufacturer      text,
  lot_number        text,
  serial_number     text,
  administered_date date NOT NULL,
  expiry_date       date,
  next_due_date     date,
  site              text,
  notes             text,
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_vaccinations_next_due ON vaccinations(next_due_date) WHERE next_due_date IS NOT NULL;

CREATE TABLE lab_results (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   uuid NOT NULL REFERENCES organizations(id),
  medical_record_id uuid REFERENCES medical_records(id),
  pet_id            uuid NOT NULL REFERENCES pets(id),
  ordered_by        uuid REFERENCES profiles(id),
  test_name         text NOT NULL,
  test_type         text CHECK (test_type IN ('blood','urine','culture','cytology','imaging','pathology','fecal','other')),
  ordered_at        timestamptz NOT NULL DEFAULT now(),
  resulted_at       timestamptz,
  status            text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_progress','resulted','cancelled')),
  results           jsonb,
  reference_range   text,
  interpretation    text,
  notes             text,
  created_at        timestamptz NOT NULL DEFAULT now()
);

-- ================================================================
-- FILES
-- ================================================================
CREATE TABLE files (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  uploaded_by     uuid REFERENCES profiles(id),
  entity_type     text NOT NULL CHECK (entity_type IN ('pet','medical_record','lab_result','invoice','client','prescription')),
  entity_id       uuid NOT NULL,
  file_name       text NOT NULL,
  file_type       text NOT NULL,
  file_size       bigint,
  storage_path    text NOT NULL,
  is_public       boolean NOT NULL DEFAULT false,
  description     text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- ================================================================
-- BILLING
-- ================================================================
CREATE SEQUENCE invoice_number_seq START 1000;

CREATE TABLE invoices (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id       uuid NOT NULL REFERENCES organizations(id),
  client_id             uuid NOT NULL REFERENCES clients(id),
  appointment_id        uuid REFERENCES appointments(id),
  invoice_number        text NOT NULL,
  status                text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','sent','paid','partial','overdue','void','written_off')),
  issue_date            date NOT NULL DEFAULT CURRENT_DATE,
  due_date              date NOT NULL,
  subtotal              numeric(10,2) NOT NULL DEFAULT 0,
  tax_rate              numeric(5,4) NOT NULL DEFAULT 0,
  tax_amount            numeric(10,2) NOT NULL DEFAULT 0,
  discount_amount       numeric(10,2) NOT NULL DEFAULT 0,
  total_amount          numeric(10,2) NOT NULL DEFAULT 0,
  paid_amount           numeric(10,2) NOT NULL DEFAULT 0,
  balance_due           numeric(10,2) NOT NULL DEFAULT 0,
  notes                 text,
  internal_notes        text,
  quickbooks_invoice_id text,
  qb_sync_status        text DEFAULT 'not_synced' CHECK (qb_sync_status IN ('not_synced','synced','sync_failed','pending')),
  created_by            uuid REFERENCES profiles(id),
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organization_id, invoice_number)
);

CREATE INDEX idx_invoices_client ON invoices(client_id);
CREATE INDEX idx_invoices_status ON invoices(organization_id, status);
CREATE INDEX idx_invoices_due ON invoices(due_date) WHERE status IN ('sent','partial','overdue');

CREATE TABLE invoice_items (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id          uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description         text NOT NULL,
  item_type           text CHECK (item_type IN ('service','product','medication','lab','vaccine','surgery','exam','other')),
  quantity            numeric(8,2) NOT NULL DEFAULT 1,
  unit_price          numeric(10,2) NOT NULL,
  discount_percent    numeric(5,2) NOT NULL DEFAULT 0,
  total_price         numeric(10,2) NOT NULL,
  quickbooks_item_id  text,
  sort_order          int NOT NULL DEFAULT 0
);

CREATE TABLE payments (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id       uuid NOT NULL REFERENCES organizations(id),
  invoice_id            uuid NOT NULL REFERENCES invoices(id),
  client_id             uuid NOT NULL REFERENCES clients(id),
  amount                numeric(10,2) NOT NULL,
  payment_method        text NOT NULL CHECK (payment_method IN ('cash','credit_card','debit_card','check','ach','insurance','care_credit','online','other')),
  payment_date          date NOT NULL DEFAULT CURRENT_DATE,
  reference_number      text,
  notes                 text,
  quickbooks_payment_id text,
  qb_sync_status        text DEFAULT 'not_synced',
  processed_by          uuid REFERENCES profiles(id),
  created_at            timestamptz NOT NULL DEFAULT now()
);

-- ================================================================
-- PAYROLL
-- ================================================================
CREATE TABLE payroll_records (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id       uuid NOT NULL REFERENCES organizations(id),
  staff_id              uuid NOT NULL REFERENCES staff_profiles(id),
  pay_period_start      date NOT NULL,
  pay_period_end        date NOT NULL,
  regular_hours         numeric(6,2),
  overtime_hours        numeric(6,2),
  base_pay              numeric(10,2) NOT NULL DEFAULT 0,
  commission_pay        numeric(10,2) NOT NULL DEFAULT 0,
  overtime_pay          numeric(10,2) NOT NULL DEFAULT 0,
  bonus                 numeric(10,2) NOT NULL DEFAULT 0,
  deductions            numeric(10,2) NOT NULL DEFAULT 0,
  gross_pay             numeric(10,2) NOT NULL DEFAULT 0,
  net_pay               numeric(10,2) NOT NULL DEFAULT 0,
  notes                 text,
  status                text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','approved','paid','voided')),
  quickbooks_payroll_id text,
  qb_sync_status        text DEFAULT 'not_synced',
  approved_by           uuid REFERENCES profiles(id),
  approved_at           timestamptz,
  paid_at               timestamptz,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

-- ================================================================
-- CRM
-- ================================================================
CREATE TABLE leads (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id     uuid NOT NULL REFERENCES organizations(id),
  first_name          text NOT NULL,
  last_name           text NOT NULL,
  email               text,
  phone               text,
  lead_source         text CHECK (lead_source IN ('referral','website','google','facebook','instagram','walk_in','event','yelp','other')),
  pet_species         text,
  notes               text,
  status              text NOT NULL DEFAULT 'new' CHECK (status IN ('new','contacted','qualified','converted','lost','nurturing')),
  assigned_to         uuid REFERENCES profiles(id),
  converted_client_id uuid REFERENCES clients(id),
  converted_at        timestamptz,
  lost_reason         text,
  follow_up_date      date,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE lead_activities (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id     uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  activity    text NOT NULL,
  notes       text,
  created_by  uuid REFERENCES profiles(id),
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ================================================================
-- COMMUNICATIONS
-- ================================================================
CREATE TABLE notification_templates (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  name            text NOT NULL,
  type            text NOT NULL CHECK (type IN ('sms','email')),
  trigger_event   text NOT NULL,
  subject         text,
  body            text NOT NULL,
  is_active       boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE communications (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  client_id       uuid REFERENCES clients(id),
  type            text NOT NULL CHECK (type IN ('sms','email')),
  direction       text NOT NULL DEFAULT 'outbound' CHECK (direction IN ('outbound','inbound')),
  to_address      text NOT NULL,
  from_address    text,
  subject         text,
  body            text NOT NULL,
  status          text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sent','delivered','failed','opened','bounced')),
  provider_id     text,
  template_id     uuid REFERENCES notification_templates(id),
  reference_type  text,
  reference_id    uuid,
  error_message   text,
  sent_by         uuid REFERENCES profiles(id),
  sent_at         timestamptz,
  delivered_at    timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE reminders (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  uuid NOT NULL REFERENCES organizations(id),
  client_id        uuid NOT NULL REFERENCES clients(id),
  pet_id           uuid REFERENCES pets(id),
  reminder_type    text NOT NULL CHECK (reminder_type IN ('appointment','vaccine','follow_up','birthday','annual_wellness','custom')),
  channel          text NOT NULL DEFAULT 'both' CHECK (channel IN ('sms','email','both')),
  scheduled_for    timestamptz NOT NULL,
  status           text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sent','failed','cancelled','skipped')),
  reference_type   text,
  reference_id     uuid,
  communication_id uuid REFERENCES communications(id),
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_reminders_pending ON reminders(scheduled_for, status) WHERE status = 'pending';

-- ================================================================
-- QUICKBOOKS
-- ================================================================
CREATE TABLE quickbooks_connections (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   uuid NOT NULL UNIQUE REFERENCES organizations(id),
  realm_id          text NOT NULL,
  access_token      text NOT NULL,
  refresh_token     text NOT NULL,
  token_expires_at  timestamptz NOT NULL,
  company_name      text,
  is_active         boolean NOT NULL DEFAULT true,
  last_sync_at      timestamptz,
  connected_by      uuid REFERENCES profiles(id),
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE quickbooks_sync_log (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  sync_type       text NOT NULL CHECK (sync_type IN ('invoice','payment','expense','payroll','customer','item')),
  entity_id       uuid,
  quickbooks_id   text,
  direction       text NOT NULL DEFAULT 'push' CHECK (direction IN ('push','pull')),
  status          text NOT NULL CHECK (status IN ('success','failed','pending','skipped')),
  error_message   text,
  payload         jsonb,
  synced_at       timestamptz NOT NULL DEFAULT now()
);

-- ================================================================
-- AUDIT LOGS
-- ================================================================
CREATE TABLE audit_logs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  user_id         uuid REFERENCES profiles(id),
  action          text NOT NULL CHECK (action IN ('create','read','update','delete','login','logout','export','share','print')),
  entity_type     text NOT NULL,
  entity_id       uuid,
  entity_label    text,
  old_values      jsonb,
  new_values      jsonb,
  ip_address      inet,
  user_agent      text,
  session_id      text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_logs_org_date ON audit_logs(organization_id, created_at DESC);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id, created_at DESC);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
