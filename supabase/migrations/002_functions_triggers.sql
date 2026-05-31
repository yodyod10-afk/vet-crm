-- ================================================================
-- Functions, Triggers, and RLS Helpers
-- ================================================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON staff_profiles FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON pets FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON appointments FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON medical_records FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON payroll_records FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON leads FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- Auto-generate invoice number
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
    NEW.invoice_number := 'INV-' || LPAD(nextval('invoice_number_seq')::text, 5, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_invoice_number BEFORE INSERT ON invoices
  FOR EACH ROW EXECUTE FUNCTION generate_invoice_number();

-- Recalculate invoice totals when items change
CREATE OR REPLACE FUNCTION recalculate_invoice_totals()
RETURNS TRIGGER AS $$
DECLARE
  v_invoice_id uuid;
  v_subtotal numeric(10,2);
  v_tax_rate numeric(5,4);
  v_discount numeric(10,2);
BEGIN
  v_invoice_id := COALESCE(NEW.invoice_id, OLD.invoice_id);
  SELECT COALESCE(SUM(total_price), 0) INTO v_subtotal
  FROM invoice_items WHERE invoice_id = v_invoice_id;
  SELECT tax_rate, discount_amount INTO v_tax_rate, v_discount
  FROM invoices WHERE id = v_invoice_id;
  UPDATE invoices SET
    subtotal = v_subtotal,
    tax_amount = ROUND(v_subtotal * v_tax_rate, 2),
    total_amount = ROUND(v_subtotal + (v_subtotal * v_tax_rate) - COALESCE(v_discount, 0), 2),
    balance_due = ROUND(v_subtotal + (v_subtotal * v_tax_rate) - COALESCE(v_discount, 0) - paid_amount, 2),
    updated_at = now()
  WHERE id = v_invoice_id;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER recalc_invoice AFTER INSERT OR UPDATE OR DELETE ON invoice_items
  FOR EACH ROW EXECUTE FUNCTION recalculate_invoice_totals();

-- Update invoice paid_amount and balance when payment added
CREATE OR REPLACE FUNCTION update_invoice_on_payment()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE invoices SET
      paid_amount = paid_amount + NEW.amount,
      balance_due = balance_due - NEW.amount,
      status = CASE
        WHEN balance_due - NEW.amount <= 0 THEN 'paid'
        WHEN paid_amount + NEW.amount > 0 THEN 'partial'
        ELSE status
      END,
      updated_at = now()
    WHERE id = NEW.invoice_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_invoice_payment AFTER INSERT ON payments
  FOR EACH ROW EXECUTE FUNCTION update_invoice_on_payment();

-- Update client balance_due when invoice changes
CREATE OR REPLACE FUNCTION sync_client_balance()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE clients SET
    balance_due = (
      SELECT COALESCE(SUM(balance_due), 0)
      FROM invoices
      WHERE client_id = COALESCE(NEW.client_id, OLD.client_id)
        AND status NOT IN ('void','written_off','paid')
    ),
    updated_at = now()
  WHERE id = COALESCE(NEW.client_id, OLD.client_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_client_balance AFTER INSERT OR UPDATE OR DELETE ON invoices
  FOR EACH ROW EXECUTE FUNCTION sync_client_balance();

-- Auto-create profile when user signs up (via Supabase Auth trigger)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Profile is created via invite flow, not auto-created here
  -- This function handles updating last_login_at
  UPDATE profiles SET last_login_at = now()
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================================
-- RLS HELPER FUNCTIONS
-- ================================================================

CREATE OR REPLACE FUNCTION auth_org_id() RETURNS uuid AS $$
  SELECT organization_id FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION auth_role() RETURNS text AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION auth_is_active() RETURNS boolean AS $$
  SELECT is_active FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;
