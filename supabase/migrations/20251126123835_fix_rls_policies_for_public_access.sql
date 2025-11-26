/*
  # Fix RLS Policies for Public Access

  1. Changes
    - Update all policies to allow public access (anon role)
    - This is appropriate for internal equipment management tools
    - Removes authentication requirement while maintaining RLS structure

  2. Security
    - RLS remains enabled for future authentication integration
    - Policies updated to work with anonymous users
*/

-- Drop existing restrictive policies and create public-access policies

-- service_settings policies
DROP POLICY IF EXISTS "Anyone can read service settings" ON service_settings;
DROP POLICY IF EXISTS "Anyone can update service settings" ON service_settings;
DROP POLICY IF EXISTS "Anyone can insert service settings" ON service_settings;

CREATE POLICY "Public can read service settings"
  ON service_settings FOR SELECT
  USING (true);

CREATE POLICY "Public can update service settings"
  ON service_settings FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can insert service settings"
  ON service_settings FOR INSERT
  WITH CHECK (true);

-- task_categories policies
DROP POLICY IF EXISTS "Anyone can read task categories" ON task_categories;
DROP POLICY IF EXISTS "Anyone can insert task categories" ON task_categories;
DROP POLICY IF EXISTS "Anyone can update task categories" ON task_categories;
DROP POLICY IF EXISTS "Anyone can delete task categories" ON task_categories;

CREATE POLICY "Public can read task categories"
  ON task_categories FOR SELECT
  USING (true);

CREATE POLICY "Public can insert task categories"
  ON task_categories FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public can update task categories"
  ON task_categories FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can delete task categories"
  ON task_categories FOR DELETE
  USING (true);

-- service_tasks policies
DROP POLICY IF EXISTS "Anyone can read service tasks" ON service_tasks;
DROP POLICY IF EXISTS "Anyone can insert service tasks" ON service_tasks;
DROP POLICY IF EXISTS "Anyone can update service tasks" ON service_tasks;
DROP POLICY IF EXISTS "Anyone can delete service tasks" ON service_tasks;

CREATE POLICY "Public can read service tasks"
  ON service_tasks FOR SELECT
  USING (true);

CREATE POLICY "Public can insert service tasks"
  ON service_tasks FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public can update service tasks"
  ON service_tasks FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can delete service tasks"
  ON service_tasks FOR DELETE
  USING (true);

-- interval_presets policies
DROP POLICY IF EXISTS "Anyone can read interval presets" ON interval_presets;
DROP POLICY IF EXISTS "Anyone can insert interval presets" ON interval_presets;
DROP POLICY IF EXISTS "Anyone can update interval presets" ON interval_presets;
DROP POLICY IF EXISTS "Anyone can delete interval presets" ON interval_presets;

CREATE POLICY "Public can read interval presets"
  ON interval_presets FOR SELECT
  USING (true);

CREATE POLICY "Public can insert interval presets"
  ON interval_presets FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public can update interval presets"
  ON interval_presets FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can delete interval presets"
  ON interval_presets FOR DELETE
  USING (true);

-- service_templates policies
DROP POLICY IF EXISTS "Anyone can read service templates" ON service_templates;
DROP POLICY IF EXISTS "Anyone can insert service templates" ON service_templates;
DROP POLICY IF EXISTS "Anyone can update service templates" ON service_templates;
DROP POLICY IF EXISTS "Anyone can delete service templates" ON service_templates;

CREATE POLICY "Public can read service templates"
  ON service_templates FOR SELECT
  USING (true);

CREATE POLICY "Public can insert service templates"
  ON service_templates FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public can update service templates"
  ON service_templates FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can delete service templates"
  ON service_templates FOR DELETE
  USING (true);

-- template_tasks policies
DROP POLICY IF EXISTS "Anyone can read template tasks" ON template_tasks;
DROP POLICY IF EXISTS "Anyone can insert template tasks" ON template_tasks;
DROP POLICY IF EXISTS "Anyone can update template tasks" ON template_tasks;
DROP POLICY IF EXISTS "Anyone can delete template tasks" ON template_tasks;

CREATE POLICY "Public can read template tasks"
  ON template_tasks FOR SELECT
  USING (true);

CREATE POLICY "Public can insert template tasks"
  ON template_tasks FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public can update template tasks"
  ON template_tasks FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can delete template tasks"
  ON template_tasks FOR DELETE
  USING (true);

-- equipment policies
DROP POLICY IF EXISTS "Anyone can read equipment" ON equipment;
DROP POLICY IF EXISTS "Anyone can insert equipment" ON equipment;
DROP POLICY IF EXISTS "Anyone can update equipment" ON equipment;
DROP POLICY IF EXISTS "Anyone can delete equipment" ON equipment;

CREATE POLICY "Public can read equipment"
  ON equipment FOR SELECT
  USING (true);

CREATE POLICY "Public can insert equipment"
  ON equipment FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public can update equipment"
  ON equipment FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can delete equipment"
  ON equipment FOR DELETE
  USING (true);

-- service_records policies
DROP POLICY IF EXISTS "Anyone can read service records" ON service_records;
DROP POLICY IF EXISTS "Anyone can insert service records" ON service_records;
DROP POLICY IF EXISTS "Anyone can update service records" ON service_records;
DROP POLICY IF EXISTS "Anyone can delete service records" ON service_records;

CREATE POLICY "Public can read service records"
  ON service_records FOR SELECT
  USING (true);

CREATE POLICY "Public can insert service records"
  ON service_records FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public can update service records"
  ON service_records FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can delete service records"
  ON service_records FOR DELETE
  USING (true);
