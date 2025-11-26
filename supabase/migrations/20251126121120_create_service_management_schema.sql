/*
  # Equipment Service Management System

  1. New Tables
    - `service_settings`
      - `id` (uuid, primary key)
      - `pending_before_hours` (integer) - Hours before service due to show yellow status
      - `pending_after_hours` (integer) - Hours after service due to continue showing yellow before turning red
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `task_categories`
      - `id` (uuid, primary key)
      - `name` (text) - Category name (e.g., "Engine", "Hydraulics")
      - `description` (text) - Category description
      - `color` (text) - Color for visual identification
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `service_tasks`
      - `id` (uuid, primary key)
      - `name` (text) - Task name (e.g., "Oil Change", "Battery Check")
      - `description` (text) - Task description
      - `estimated_duration` (integer) - Duration in minutes
      - `category_id` (uuid) - Foreign key to task_categories
      - `auto_apply` (boolean) - Auto-apply to all intervals when added to template
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `interval_presets`
      - `id` (uuid, primary key)
      - `name` (text) - Preset name (e.g., "Boom Lifts", "Small Generator")
      - `description` (text) - When to use this preset
      - `intervals` (integer[]) - Array of hour intervals
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `service_templates`
      - `id` (uuid, primary key)
      - `name` (text) - Template name (e.g., "Boom Lifts", "Excavators")
      - `description` (text) - Template description
      - `preset_id` (uuid) - Foreign key to interval_presets
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `template_tasks`
      - `id` (uuid, primary key)
      - `template_id` (uuid) - Foreign key to service_templates
      - `task_id` (uuid) - Foreign key to service_tasks
      - `intervals` (integer[]) - Which hour intervals this task applies to
      - `created_at` (timestamptz)
    
    - `equipment`
      - `id` (uuid, primary key)
      - `name` (text) - Equipment name
      - `serial_number` (text) - Serial/asset number
      - `current_hours` (integer) - Current equipment hours
      - `template_id` (uuid) - Foreign key to service_templates
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `service_records`
      - `id` (uuid, primary key)
      - `equipment_id` (uuid) - Foreign key to equipment
      - `task_id` (uuid) - Foreign key to service_tasks
      - `scheduled_interval` (integer) - The hour interval this service was scheduled for
      - `performed_by` (text) - Technician name/identifier
      - `service_date` (date) - Date service was performed
      - `actual_hours` (integer) - Equipment hours when service was performed
      - `notes` (text) - Service notes
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their data
*/

-- Create service_settings table
CREATE TABLE IF NOT EXISTS service_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pending_before_hours integer NOT NULL DEFAULT 20,
  pending_after_hours integer NOT NULL DEFAULT 15,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create task_categories table
CREATE TABLE IF NOT EXISTS task_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  color text DEFAULT '#64748b',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create service_tasks table
CREATE TABLE IF NOT EXISTS service_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  estimated_duration integer DEFAULT 0,
  category_id uuid REFERENCES task_categories(id) ON DELETE SET NULL,
  auto_apply boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create interval_presets table
CREATE TABLE IF NOT EXISTS interval_presets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  intervals integer[] NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create service_templates table
CREATE TABLE IF NOT EXISTS service_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  preset_id uuid REFERENCES interval_presets(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create template_tasks table
CREATE TABLE IF NOT EXISTS template_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES service_templates(id) ON DELETE CASCADE,
  task_id uuid NOT NULL REFERENCES service_tasks(id) ON DELETE CASCADE,
  intervals integer[] NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create equipment table
CREATE TABLE IF NOT EXISTS equipment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  serial_number text NOT NULL,
  current_hours integer DEFAULT 0,
  template_id uuid REFERENCES service_templates(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create service_records table
CREATE TABLE IF NOT EXISTS service_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id uuid NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
  task_id uuid NOT NULL REFERENCES service_tasks(id) ON DELETE CASCADE,
  scheduled_interval integer NOT NULL,
  performed_by text NOT NULL,
  service_date date NOT NULL,
  actual_hours integer NOT NULL,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE service_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE interval_presets ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_records ENABLE ROW LEVEL SECURITY;

-- Create policies for service_settings
CREATE POLICY "Anyone can read service settings"
  ON service_settings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can update service settings"
  ON service_settings FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can insert service settings"
  ON service_settings FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create policies for task_categories
CREATE POLICY "Anyone can read task categories"
  ON task_categories FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can insert task categories"
  ON task_categories FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can update task categories"
  ON task_categories FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete task categories"
  ON task_categories FOR DELETE
  TO authenticated
  USING (true);

-- Create policies for service_tasks
CREATE POLICY "Anyone can read service tasks"
  ON service_tasks FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can insert service tasks"
  ON service_tasks FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can update service tasks"
  ON service_tasks FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete service tasks"
  ON service_tasks FOR DELETE
  TO authenticated
  USING (true);

-- Create policies for interval_presets
CREATE POLICY "Anyone can read interval presets"
  ON interval_presets FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can insert interval presets"
  ON interval_presets FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can update interval presets"
  ON interval_presets FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete interval presets"
  ON interval_presets FOR DELETE
  TO authenticated
  USING (true);

-- Create policies for service_templates
CREATE POLICY "Anyone can read service templates"
  ON service_templates FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can insert service templates"
  ON service_templates FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can update service templates"
  ON service_templates FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete service templates"
  ON service_templates FOR DELETE
  TO authenticated
  USING (true);

-- Create policies for template_tasks
CREATE POLICY "Anyone can read template tasks"
  ON template_tasks FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can insert template tasks"
  ON template_tasks FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can update template tasks"
  ON template_tasks FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete template tasks"
  ON template_tasks FOR DELETE
  TO authenticated
  USING (true);

-- Create policies for equipment
CREATE POLICY "Anyone can read equipment"
  ON equipment FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can insert equipment"
  ON equipment FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can update equipment"
  ON equipment FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete equipment"
  ON equipment FOR DELETE
  TO authenticated
  USING (true);

-- Create policies for service_records
CREATE POLICY "Anyone can read service records"
  ON service_records FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can insert service records"
  ON service_records FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can update service records"
  ON service_records FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete service records"
  ON service_records FOR DELETE
  TO authenticated
  USING (true);

-- Insert default service settings
INSERT INTO service_settings (pending_before_hours, pending_after_hours)
VALUES (20, 15)
ON CONFLICT DO NOTHING;

-- Insert default task categories
INSERT INTO task_categories (name, description, color) VALUES
  ('Engine', 'Engine maintenance and repairs', '#ef4444'),
  ('Hydraulics', 'Hydraulic system maintenance', '#f97316'),
  ('Electrical', 'Electrical system maintenance', '#eab308'),
  ('Filters', 'Filter replacements and inspections', '#10b981'),
  ('Lubrication', 'Lubrication and fluid services', '#3b82f6'),
  ('General Maintenance', 'General inspections and maintenance', '#64748b')
ON CONFLICT DO NOTHING;
