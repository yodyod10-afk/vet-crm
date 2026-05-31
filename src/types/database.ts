export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string
          name: string
          slug: string
          plan: string
          settings: Json
          logo_url: string | null
          address: string | null
          phone: string | null
          email: string | null
          timezone: string
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['organizations']['Row'], 'id' | 'created_at' | 'updated_at'> & { id?: string }
        Update: Partial<Database['public']['Tables']['organizations']['Insert']>
      }
      profiles: {
        Row: {
          id: string
          organization_id: string
          role: 'owner' | 'veterinarian' | 'receptionist' | 'client'
          first_name: string
          last_name: string
          email: string
          phone: string | null
          avatar_url: string | null
          is_active: boolean
          mfa_enabled: boolean
          last_login_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }
      staff_profiles: {
        Row: {
          id: string
          profile_id: string
          organization_id: string
          employee_id: string | null
          specialization: string | null
          license_number: string | null
          license_state: string | null
          hire_date: string | null
          compensation_type: 'salary' | 'hourly' | 'commission' | 'mixed' | null
          base_salary: number | null
          hourly_rate: number | null
          commission_rate: number | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['staff_profiles']['Row'], 'id' | 'created_at' | 'updated_at'> & { id?: string }
        Update: Partial<Database['public']['Tables']['staff_profiles']['Insert']>
      }
      clients: {
        Row: {
          id: string
          organization_id: string
          profile_id: string | null
          primary_vet_id: string | null
          first_name: string
          last_name: string
          email: string | null
          phone_primary: string | null
          phone_secondary: string | null
          address_line1: string | null
          address_line2: string | null
          city: string | null
          state: string | null
          zip: string | null
          country: string
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          preferred_contact: 'email' | 'sms' | 'phone' | null
          notes: string | null
          lead_source: string | null
          status: 'active' | 'inactive' | 'lead' | 'deceased'
          balance_due: number
          portal_invite_sent_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['clients']['Row'], 'id' | 'created_at' | 'updated_at' | 'balance_due'> & { id?: string; balance_due?: number }
        Update: Partial<Database['public']['Tables']['clients']['Insert']>
      }
      pets: {
        Row: {
          id: string
          organization_id: string
          client_id: string
          primary_vet_id: string | null
          name: string
          species: string
          breed: string | null
          sex: 'male' | 'female' | 'male_neutered' | 'female_spayed' | 'unknown' | null
          date_of_birth: string | null
          weight: number | null
          weight_unit: 'lbs' | 'kg'
          color: string | null
          microchip_number: string | null
          insurance_provider: string | null
          insurance_policy: string | null
          is_deceased: boolean
          deceased_date: string | null
          avatar_url: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['pets']['Row'], 'id' | 'created_at' | 'updated_at' | 'is_deceased'> & { id?: string; is_deceased?: boolean }
        Update: Partial<Database['public']['Tables']['pets']['Insert']>
      }
      pet_allergies: {
        Row: {
          id: string
          pet_id: string
          allergen: string
          reaction: string | null
          severity: 'mild' | 'moderate' | 'severe' | null
          noted_at: string
          notes: string | null
        }
        Insert: Omit<Database['public']['Tables']['pet_allergies']['Row'], 'id'> & { id?: string }
        Update: Partial<Database['public']['Tables']['pet_allergies']['Insert']>
      }
      pet_medications: {
        Row: {
          id: string
          pet_id: string
          prescribed_by: string | null
          medication_name: string
          dosage: string | null
          frequency: string | null
          route: string | null
          start_date: string | null
          end_date: string | null
          is_active: boolean
          notes: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['pet_medications']['Row'], 'id' | 'created_at' | 'is_active'> & { id?: string; is_active?: boolean }
        Update: Partial<Database['public']['Tables']['pet_medications']['Insert']>
      }
      appointments: {
        Row: {
          id: string
          organization_id: string
          client_id: string
          pet_id: string
          veterinarian_id: string
          appointment_type: string
          title: string | null
          notes: string | null
          scheduled_at: string
          duration_minutes: number
          room: string | null
          status: 'scheduled' | 'confirmed' | 'checked_in' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'
          check_in_at: string | null
          check_out_at: string | null
          cancellation_reason: string | null
          reminder_24h_sent: boolean
          reminder_1h_sent: boolean
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['appointments']['Row'], 'id' | 'created_at' | 'updated_at' | 'reminder_24h_sent' | 'reminder_1h_sent'> & { id?: string; reminder_24h_sent?: boolean; reminder_1h_sent?: boolean }
        Update: Partial<Database['public']['Tables']['appointments']['Insert']>
      }
      medical_records: {
        Row: {
          id: string
          organization_id: string
          appointment_id: string | null
          pet_id: string
          veterinarian_id: string
          visit_date: string
          chief_complaint: string | null
          subjective: string | null
          objective: string | null
          assessment: string | null
          plan: string | null
          weight_at_visit: number | null
          temperature: number | null
          heart_rate: number | null
          respiratory_rate: number | null
          blood_pressure: string | null
          pain_score: number | null
          is_locked: boolean
          locked_at: string | null
          locked_by: string | null
          follow_up_required: boolean
          follow_up_in_days: number | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['medical_records']['Row'], 'id' | 'created_at' | 'updated_at' | 'is_locked' | 'follow_up_required'> & { id?: string; is_locked?: boolean; follow_up_required?: boolean }
        Update: Partial<Database['public']['Tables']['medical_records']['Insert']>
      }
      diagnoses: {
        Row: {
          id: string
          medical_record_id: string
          icd_code: string | null
          description: string
          diagnosis_type: 'primary' | 'secondary' | 'differential' | 'rule_out'
          status: 'active' | 'resolved' | 'chronic' | 'monitoring'
        }
        Insert: Omit<Database['public']['Tables']['diagnoses']['Row'], 'id'> & { id?: string }
        Update: Partial<Database['public']['Tables']['diagnoses']['Insert']>
      }
      treatments: {
        Row: {
          id: string
          medical_record_id: string
          pet_id: string
          treatment_type: string | null
          description: string
          performed_by: string | null
          performed_at: string
          notes: string | null
        }
        Insert: Omit<Database['public']['Tables']['treatments']['Row'], 'id'> & { id?: string }
        Update: Partial<Database['public']['Tables']['treatments']['Insert']>
      }
      prescriptions: {
        Row: {
          id: string
          medical_record_id: string
          pet_id: string
          prescribed_by: string
          medication_name: string
          dosage: string
          frequency: string
          route: string | null
          quantity: number | null
          refills: number
          start_date: string
          end_date: string | null
          instructions: string | null
          status: 'active' | 'completed' | 'cancelled' | 'on_hold'
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['prescriptions']['Row'], 'id' | 'created_at' | 'refills'> & { id?: string; refills?: number }
        Update: Partial<Database['public']['Tables']['prescriptions']['Insert']>
      }
      vaccinations: {
        Row: {
          id: string
          pet_id: string
          medical_record_id: string | null
          administered_by: string | null
          vaccine_name: string
          manufacturer: string | null
          lot_number: string | null
          serial_number: string | null
          administered_date: string
          expiry_date: string | null
          next_due_date: string | null
          site: string | null
          notes: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['vaccinations']['Row'], 'id' | 'created_at'> & { id?: string }
        Update: Partial<Database['public']['Tables']['vaccinations']['Insert']>
      }
      lab_results: {
        Row: {
          id: string
          organization_id: string
          medical_record_id: string | null
          pet_id: string
          ordered_by: string | null
          test_name: string
          test_type: string | null
          ordered_at: string
          resulted_at: string | null
          status: 'pending' | 'in_progress' | 'resulted' | 'cancelled'
          results: Json | null
          reference_range: string | null
          interpretation: string | null
          notes: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['lab_results']['Row'], 'id' | 'created_at'> & { id?: string }
        Update: Partial<Database['public']['Tables']['lab_results']['Insert']>
      }
      files: {
        Row: {
          id: string
          organization_id: string
          uploaded_by: string | null
          entity_type: string
          entity_id: string
          file_name: string
          file_type: string
          file_size: number | null
          storage_path: string
          is_public: boolean
          description: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['files']['Row'], 'id' | 'created_at' | 'is_public'> & { id?: string; is_public?: boolean }
        Update: Partial<Database['public']['Tables']['files']['Insert']>
      }
      invoices: {
        Row: {
          id: string
          organization_id: string
          client_id: string
          appointment_id: string | null
          invoice_number: string
          status: 'draft' | 'sent' | 'paid' | 'partial' | 'overdue' | 'void' | 'written_off'
          issue_date: string
          due_date: string
          subtotal: number
          tax_rate: number
          tax_amount: number
          discount_amount: number
          total_amount: number
          paid_amount: number
          balance_due: number
          notes: string | null
          internal_notes: string | null
          quickbooks_invoice_id: string | null
          qb_sync_status: string
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['invoices']['Row'], 'id' | 'created_at' | 'updated_at' | 'invoice_number' | 'subtotal' | 'tax_amount' | 'discount_amount' | 'total_amount' | 'paid_amount' | 'balance_due' | 'qb_sync_status'> & { id?: string; invoice_number?: string; subtotal?: number; tax_amount?: number; discount_amount?: number; total_amount?: number; paid_amount?: number; balance_due?: number; qb_sync_status?: string }
        Update: Partial<Database['public']['Tables']['invoices']['Insert']>
      }
      invoice_items: {
        Row: {
          id: string
          invoice_id: string
          description: string
          item_type: string | null
          quantity: number
          unit_price: number
          discount_percent: number
          total_price: number
          quickbooks_item_id: string | null
          sort_order: number
        }
        Insert: Omit<Database['public']['Tables']['invoice_items']['Row'], 'id' | 'discount_percent' | 'sort_order'> & { id?: string; discount_percent?: number; sort_order?: number }
        Update: Partial<Database['public']['Tables']['invoice_items']['Insert']>
      }
      payments: {
        Row: {
          id: string
          organization_id: string
          invoice_id: string
          client_id: string
          amount: number
          payment_method: string
          payment_date: string
          reference_number: string | null
          notes: string | null
          quickbooks_payment_id: string | null
          qb_sync_status: string | null
          processed_by: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['payments']['Row'], 'id' | 'created_at'> & { id?: string }
        Update: Partial<Database['public']['Tables']['payments']['Insert']>
      }
      payroll_records: {
        Row: {
          id: string
          organization_id: string
          staff_id: string
          pay_period_start: string
          pay_period_end: string
          regular_hours: number | null
          overtime_hours: number | null
          base_pay: number
          commission_pay: number
          overtime_pay: number
          bonus: number
          deductions: number
          gross_pay: number
          net_pay: number
          notes: string | null
          status: 'draft' | 'approved' | 'paid' | 'voided'
          quickbooks_payroll_id: string | null
          qb_sync_status: string | null
          approved_by: string | null
          approved_at: string | null
          paid_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['payroll_records']['Row'], 'id' | 'created_at' | 'updated_at'> & { id?: string }
        Update: Partial<Database['public']['Tables']['payroll_records']['Insert']>
      }
      leads: {
        Row: {
          id: string
          organization_id: string
          first_name: string
          last_name: string
          email: string | null
          phone: string | null
          lead_source: string | null
          pet_species: string | null
          notes: string | null
          status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost' | 'nurturing'
          assigned_to: string | null
          converted_client_id: string | null
          converted_at: string | null
          lost_reason: string | null
          follow_up_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['leads']['Row'], 'id' | 'created_at' | 'updated_at'> & { id?: string }
        Update: Partial<Database['public']['Tables']['leads']['Insert']>
      }
      communications: {
        Row: {
          id: string
          organization_id: string
          client_id: string | null
          type: 'sms' | 'email'
          direction: 'outbound' | 'inbound'
          to_address: string
          from_address: string | null
          subject: string | null
          body: string
          status: 'pending' | 'sent' | 'delivered' | 'failed' | 'opened' | 'bounced'
          provider_id: string | null
          template_id: string | null
          reference_type: string | null
          reference_id: string | null
          error_message: string | null
          sent_by: string | null
          sent_at: string | null
          delivered_at: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['communications']['Row'], 'id' | 'created_at'> & { id?: string }
        Update: Partial<Database['public']['Tables']['communications']['Insert']>
      }
      audit_logs: {
        Row: {
          id: string
          organization_id: string
          user_id: string | null
          action: string
          entity_type: string
          entity_id: string | null
          entity_label: string | null
          old_values: Json | null
          new_values: Json | null
          ip_address: string | null
          user_agent: string | null
          session_id: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['audit_logs']['Row'], 'id' | 'created_at'> & { id?: string }
        Update: Partial<Database['public']['Tables']['audit_logs']['Insert']>
      }
    }
    Views: {}
    Functions: {
      auth_role: { Args: Record<string, never>; Returns: string }
      auth_org_id: { Args: Record<string, never>; Returns: string }
    }
    Enums: {}
  }
}

// Convenience types
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

export type Profile = Tables<'profiles'>
export type Client = Tables<'clients'>
export type Pet = Tables<'pets'>
export type Appointment = Tables<'appointments'>
export type MedicalRecord = Tables<'medical_records'>
export type Invoice = Tables<'invoices'>
export type Payment = Tables<'payments'>
export type Lead = Tables<'leads'>
