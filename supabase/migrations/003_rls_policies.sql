-- ================================================================
-- Row Level Security Policies
-- ================================================================

-- Enable RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE pet_allergies ENABLE ROW LEVEL SECURITY;
ALTER TABLE pet_medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnoses ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatments ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE vaccinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE quickbooks_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE quickbooks_sync_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ================================================================
-- ORGANIZATIONS
-- ================================================================
CREATE POLICY "users_see_own_org" ON organizations FOR SELECT USING (id = auth_org_id());
CREATE POLICY "owner_updates_org" ON organizations FOR UPDATE USING (id = auth_org_id() AND auth_role() = 'owner');

-- ================================================================
-- PROFILES
-- ================================================================
CREATE POLICY "staff_see_org_profiles" ON profiles FOR SELECT USING (organization_id = auth_org_id() AND auth_role() IN ('owner','veterinarian','receptionist'));
CREATE POLICY "client_sees_own_profile" ON profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "user_updates_own_profile" ON profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "owner_manages_profiles" ON profiles FOR ALL USING (organization_id = auth_org_id() AND auth_role() = 'owner');

-- ================================================================
-- STAFF PROFILES
-- ================================================================
CREATE POLICY "owner_manages_staff" ON staff_profiles FOR ALL USING (organization_id = auth_org_id() AND auth_role() = 'owner');
CREATE POLICY "staff_sees_own" ON staff_profiles FOR SELECT USING (profile_id = auth.uid());

-- ================================================================
-- CLIENTS
-- ================================================================
CREATE POLICY "owner_receptionist_all_clients" ON clients FOR ALL USING (
  organization_id = auth_org_id() AND auth_role() IN ('owner','receptionist')
);
CREATE POLICY "vet_sees_assigned_clients" ON clients FOR SELECT USING (
  organization_id = auth_org_id() AND auth_role() = 'veterinarian'
  AND (
    primary_vet_id = auth.uid()
    OR id IN (SELECT DISTINCT client_id FROM appointments WHERE veterinarian_id = auth.uid())
  )
);
CREATE POLICY "vet_updates_assigned_clients" ON clients FOR UPDATE USING (
  organization_id = auth_org_id() AND auth_role() = 'veterinarian'
  AND (
    primary_vet_id = auth.uid()
    OR id IN (SELECT DISTINCT client_id FROM appointments WHERE veterinarian_id = auth.uid())
  )
);
CREATE POLICY "client_sees_own_record" ON clients FOR SELECT USING (profile_id = auth.uid());

-- ================================================================
-- PETS
-- ================================================================
CREATE POLICY "owner_receptionist_all_pets" ON pets FOR ALL USING (
  organization_id = auth_org_id() AND auth_role() IN ('owner','receptionist')
);
CREATE POLICY "vet_manages_assigned_pets" ON pets FOR ALL USING (
  organization_id = auth_org_id() AND auth_role() = 'veterinarian'
  AND client_id IN (
    SELECT id FROM clients WHERE
      primary_vet_id = auth.uid()
      OR id IN (SELECT DISTINCT client_id FROM appointments WHERE veterinarian_id = auth.uid())
  )
);
CREATE POLICY "client_sees_own_pets" ON pets FOR SELECT USING (
  auth_role() = 'client'
  AND client_id IN (SELECT id FROM clients WHERE profile_id = auth.uid())
);

-- ================================================================
-- PET ALLERGIES & MEDICATIONS
-- ================================================================
CREATE POLICY "staff_manages_allergies" ON pet_allergies FOR ALL USING (
  auth_role() IN ('owner','veterinarian','receptionist')
  AND pet_id IN (SELECT id FROM pets WHERE organization_id = auth_org_id())
);
CREATE POLICY "client_sees_pet_allergies" ON pet_allergies FOR SELECT USING (
  pet_id IN (SELECT p.id FROM pets p JOIN clients c ON c.id = p.client_id WHERE c.profile_id = auth.uid())
);

CREATE POLICY "staff_manages_medications" ON pet_medications FOR ALL USING (
  auth_role() IN ('owner','veterinarian','receptionist')
  AND pet_id IN (SELECT id FROM pets WHERE organization_id = auth_org_id())
);
CREATE POLICY "client_sees_medications" ON pet_medications FOR SELECT USING (
  pet_id IN (SELECT p.id FROM pets p JOIN clients c ON c.id = p.client_id WHERE c.profile_id = auth.uid())
);

-- ================================================================
-- APPOINTMENTS
-- ================================================================
CREATE POLICY "owner_receptionist_all_appointments" ON appointments FOR ALL USING (
  organization_id = auth_org_id() AND auth_role() IN ('owner','receptionist')
);
CREATE POLICY "vet_manages_own_appointments" ON appointments FOR ALL USING (
  organization_id = auth_org_id() AND auth_role() = 'veterinarian'
  AND veterinarian_id = auth.uid()
);
CREATE POLICY "client_sees_own_appointments" ON appointments FOR SELECT USING (
  auth_role() = 'client'
  AND client_id IN (SELECT id FROM clients WHERE profile_id = auth.uid())
);
CREATE POLICY "client_cancels_own_appointments" ON appointments FOR UPDATE USING (
  auth_role() = 'client'
  AND client_id IN (SELECT id FROM clients WHERE profile_id = auth.uid())
);

-- ================================================================
-- MEDICAL RECORDS
-- ================================================================
CREATE POLICY "owner_reads_all_medical" ON medical_records FOR SELECT USING (
  organization_id = auth_org_id() AND auth_role() = 'owner'
);
CREATE POLICY "vet_manages_own_records" ON medical_records FOR ALL USING (
  organization_id = auth_org_id() AND auth_role() = 'veterinarian'
  AND veterinarian_id = auth.uid()
);
CREATE POLICY "client_reads_own_pet_records" ON medical_records FOR SELECT USING (
  auth_role() = 'client'
  AND pet_id IN (
    SELECT p.id FROM pets p JOIN clients c ON c.id = p.client_id WHERE c.profile_id = auth.uid()
  )
);

-- Diagnoses / Treatments / Prescriptions / Vaccinations — inherit from medical_records
CREATE POLICY "access_diagnoses" ON diagnoses FOR ALL USING (
  medical_record_id IN (
    SELECT id FROM medical_records WHERE
      (organization_id = auth_org_id() AND auth_role() IN ('owner','receptionist'))
      OR (veterinarian_id = auth.uid() AND auth_role() = 'veterinarian')
      OR (pet_id IN (SELECT p.id FROM pets p JOIN clients c ON c.id = p.client_id WHERE c.profile_id = auth.uid()))
  )
);

CREATE POLICY "access_treatments" ON treatments FOR ALL USING (
  medical_record_id IN (
    SELECT id FROM medical_records WHERE
      (organization_id = auth_org_id() AND auth_role() IN ('owner','receptionist'))
      OR (veterinarian_id = auth.uid() AND auth_role() = 'veterinarian')
  )
);

CREATE POLICY "access_prescriptions" ON prescriptions FOR ALL USING (
  medical_record_id IN (
    SELECT id FROM medical_records WHERE
      (organization_id = auth_org_id() AND auth_role() IN ('owner'))
      OR (veterinarian_id = auth.uid() AND auth_role() = 'veterinarian')
  )
);
CREATE POLICY "client_reads_prescriptions" ON prescriptions FOR SELECT USING (
  pet_id IN (SELECT p.id FROM pets p JOIN clients c ON c.id = p.client_id WHERE c.profile_id = auth.uid())
);

CREATE POLICY "staff_manages_vaccinations" ON vaccinations FOR ALL USING (
  auth_role() IN ('owner','veterinarian','receptionist')
  AND pet_id IN (SELECT id FROM pets WHERE organization_id = auth_org_id())
);
CREATE POLICY "client_reads_vaccinations" ON vaccinations FOR SELECT USING (
  pet_id IN (SELECT p.id FROM pets p JOIN clients c ON c.id = p.client_id WHERE c.profile_id = auth.uid())
);

CREATE POLICY "staff_manages_lab_results" ON lab_results FOR ALL USING (
  organization_id = auth_org_id() AND auth_role() IN ('owner','veterinarian')
);
CREATE POLICY "client_reads_lab_results" ON lab_results FOR SELECT USING (
  pet_id IN (SELECT p.id FROM pets p JOIN clients c ON c.id = p.client_id WHERE c.profile_id = auth.uid())
);

-- ================================================================
-- FILES
-- ================================================================
CREATE POLICY "staff_manages_files" ON files FOR ALL USING (
  organization_id = auth_org_id() AND auth_role() IN ('owner','veterinarian','receptionist')
);
CREATE POLICY "client_reads_own_files" ON files FOR SELECT USING (
  is_public = true
  OR uploaded_by = auth.uid()
);

-- ================================================================
-- INVOICES & PAYMENTS
-- ================================================================
CREATE POLICY "owner_receptionist_manages_invoices" ON invoices FOR ALL USING (
  organization_id = auth_org_id() AND auth_role() IN ('owner','receptionist')
);
CREATE POLICY "client_reads_own_invoices" ON invoices FOR SELECT USING (
  client_id IN (SELECT id FROM clients WHERE profile_id = auth.uid())
);

CREATE POLICY "access_invoice_items" ON invoice_items FOR ALL USING (
  invoice_id IN (SELECT id FROM invoices WHERE organization_id = auth_org_id())
  AND auth_role() IN ('owner','receptionist')
);
CREATE POLICY "client_reads_invoice_items" ON invoice_items FOR SELECT USING (
  invoice_id IN (
    SELECT id FROM invoices WHERE client_id IN (SELECT id FROM clients WHERE profile_id = auth.uid())
  )
);

CREATE POLICY "staff_manages_payments" ON payments FOR ALL USING (
  organization_id = auth_org_id() AND auth_role() IN ('owner','receptionist')
);
CREATE POLICY "client_reads_own_payments" ON payments FOR SELECT USING (
  client_id IN (SELECT id FROM clients WHERE profile_id = auth.uid())
);

-- ================================================================
-- PAYROLL (owner only)
-- ================================================================
CREATE POLICY "owner_manages_payroll" ON payroll_records FOR ALL USING (
  organization_id = auth_org_id() AND auth_role() = 'owner'
);

-- ================================================================
-- CRM LEADS
-- ================================================================
CREATE POLICY "owner_receptionist_manages_leads" ON leads FOR ALL USING (
  organization_id = auth_org_id() AND auth_role() IN ('owner','receptionist')
);
CREATE POLICY "access_lead_activities" ON lead_activities FOR ALL USING (
  lead_id IN (SELECT id FROM leads WHERE organization_id = auth_org_id())
  AND auth_role() IN ('owner','receptionist')
);

-- ================================================================
-- COMMUNICATIONS
-- ================================================================
CREATE POLICY "staff_manages_communications" ON communications FOR ALL USING (
  organization_id = auth_org_id() AND auth_role() IN ('owner','receptionist')
);
CREATE POLICY "vet_sees_own_client_comms" ON communications FOR SELECT USING (
  organization_id = auth_org_id() AND auth_role() = 'veterinarian'
  AND client_id IN (
    SELECT DISTINCT client_id FROM appointments WHERE veterinarian_id = auth.uid()
  )
);

CREATE POLICY "staff_manages_templates" ON notification_templates FOR ALL USING (
  organization_id = auth_org_id() AND auth_role() IN ('owner','receptionist')
);

CREATE POLICY "staff_manages_reminders" ON reminders FOR ALL USING (
  organization_id = auth_org_id() AND auth_role() IN ('owner','receptionist')
);

-- ================================================================
-- QUICKBOOKS (owner only)
-- ================================================================
CREATE POLICY "owner_quickbooks" ON quickbooks_connections FOR ALL USING (
  organization_id = auth_org_id() AND auth_role() = 'owner'
);
CREATE POLICY "owner_qb_sync_log" ON quickbooks_sync_log FOR ALL USING (
  organization_id = auth_org_id() AND auth_role() = 'owner'
);

-- ================================================================
-- AUDIT LOGS (owner reads only)
-- ================================================================
CREATE POLICY "owner_reads_audit" ON audit_logs FOR SELECT USING (
  organization_id = auth_org_id() AND auth_role() = 'owner'
);
-- Service role inserts audit logs (bypasses RLS)
