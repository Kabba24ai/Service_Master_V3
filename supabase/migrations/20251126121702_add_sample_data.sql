/*
  # Add Sample Data for Equipment Service Management

  1. Sample Data
    - Sample service tasks with different categories
    - Sample interval presets for different equipment types
    - Sample service templates
    - Sample equipment with assigned templates
    - Link tasks to templates with specific intervals

  This migration adds realistic sample data to demonstrate the system.
*/

-- Insert sample service tasks (if they don't already exist)
INSERT INTO service_tasks (name, description, estimated_duration, category_id, auto_apply)
SELECT 
  'Battery Check',
  'Test battery and clean terminals',
  15,
  (SELECT id FROM task_categories WHERE name = 'Engine'),
  false
WHERE NOT EXISTS (SELECT 1 FROM service_tasks WHERE name = 'Battery Check');

INSERT INTO service_tasks (name, description, estimated_duration, category_id, auto_apply)
SELECT 
  'Air Filter Replacement',
  'Replace air filter element',
  15,
  (SELECT id FROM task_categories WHERE name = 'Filters'),
  false
WHERE NOT EXISTS (SELECT 1 FROM service_tasks WHERE name = 'Air Filter Replacement');

INSERT INTO service_tasks (name, description, estimated_duration, category_id, auto_apply)
SELECT 
  'Coolant System Check',
  'Inspect coolant level and condition',
  15,
  (SELECT id FROM task_categories WHERE name = 'Engine'),
  false
WHERE NOT EXISTS (SELECT 1 FROM service_tasks WHERE name = 'Coolant System Check');

INSERT INTO service_tasks (name, description, estimated_duration, category_id, auto_apply)
SELECT 
  'Bearing Inspection',
  'Inspect and lubricate bearings',
  30,
  (SELECT id FROM task_categories WHERE name = 'Lubrication'),
  false
WHERE NOT EXISTS (SELECT 1 FROM service_tasks WHERE name = 'Bearing Inspection');

INSERT INTO service_tasks (name, description, estimated_duration, category_id, auto_apply)
SELECT 
  'Belt Inspection',
  'Check belts for wear and tension',
  20,
  (SELECT id FROM task_categories WHERE name = 'General Maintenance'),
  false
WHERE NOT EXISTS (SELECT 1 FROM service_tasks WHERE name = 'Belt Inspection');

INSERT INTO service_tasks (name, description, estimated_duration, category_id, auto_apply)
SELECT 
  'Wiper Blade Inspection',
  'Inspect wiper blades for wear',
  10,
  (SELECT id FROM task_categories WHERE name = 'General Maintenance'),
  false
WHERE NOT EXISTS (SELECT 1 FROM service_tasks WHERE name = 'Wiper Blade Inspection');

-- Insert sample interval presets
INSERT INTO interval_presets (name, description, intervals)
SELECT 
  'Skid Steer',
  'Large construction equipment',
  ARRAY[50, 100, 250, 500, 750, 1000, 1250, 1500, 1750, 2000, 2250, 2500, 2750, 3000]
WHERE NOT EXISTS (SELECT 1 FROM interval_presets WHERE name = 'Skid Steer');

INSERT INTO interval_presets (name, description, intervals)
SELECT 
  'Boom Lifts',
  'Towable Only',
  ARRAY[5, 50, 100, 250, 500, 750, 1000, 1250, 1500, 1750, 2000, 2250, 2500, 2750, 3000]
WHERE NOT EXISTS (SELECT 1 FROM interval_presets WHERE name = 'Boom Lifts');

INSERT INTO interval_presets (name, description, intervals)
SELECT 
  'Small Generator',
  'Light duty generators under 10kW',
  ARRAY[50, 250, 500, 1000, 2000]
WHERE NOT EXISTS (SELECT 1 FROM interval_presets WHERE name = 'Small Generator');

INSERT INTO interval_presets (name, description, intervals)
SELECT 
  'Large Generator',
  'Heavy duty generators 10kW+',
  ARRAY[50, 100, 250, 500, 1000, 2000]
WHERE NOT EXISTS (SELECT 1 FROM interval_presets WHERE name = 'Large Generator');

-- Insert sample service templates
INSERT INTO service_templates (name, description, preset_id)
SELECT 
  'Skid Steer',
  'Large construction equipment',
  (SELECT id FROM interval_presets WHERE name = 'Skid Steer')
WHERE NOT EXISTS (SELECT 1 FROM service_templates WHERE name = 'Skid Steer');

INSERT INTO service_templates (name, description, preset_id)
SELECT 
  'Boom Lifts',
  'Towable boom lifts',
  (SELECT id FROM interval_presets WHERE name = 'Boom Lifts')
WHERE NOT EXISTS (SELECT 1 FROM service_templates WHERE name = 'Boom Lifts');

-- Insert sample equipment
INSERT INTO equipment (name, serial_number, current_hours, template_id)
SELECT 
  'Skid Steer #1',
  'SS-2024-001',
  245,
  (SELECT id FROM service_templates WHERE name = 'Skid Steer')
WHERE NOT EXISTS (SELECT 1 FROM equipment WHERE serial_number = 'SS-2024-001');

INSERT INTO equipment (name, serial_number, current_hours, template_id)
SELECT 
  'Boom Lift #1',
  'BL-2024-001',
  75,
  (SELECT id FROM service_templates WHERE name = 'Boom Lifts')
WHERE NOT EXISTS (SELECT 1 FROM equipment WHERE serial_number = 'BL-2024-001');

INSERT INTO equipment (name, serial_number, current_hours, template_id)
SELECT 
  'Skid Steer #2',
  'SS-2024-002',
  520,
  (SELECT id FROM service_templates WHERE name = 'Skid Steer')
WHERE NOT EXISTS (SELECT 1 FROM equipment WHERE serial_number = 'SS-2024-002');

-- Link tasks to Skid Steer template
DO $$
DECLARE
  v_template_id uuid;
  v_task_id uuid;
BEGIN
  -- Get Skid Steer template ID
  SELECT id INTO v_template_id FROM service_templates WHERE name = 'Skid Steer';
  
  -- Wiper Blade Inspection at 50, 100 hours
  SELECT id INTO v_task_id FROM service_tasks WHERE name = 'Wiper Blade Inspection';
  IF v_task_id IS NOT NULL THEN
    INSERT INTO template_tasks (template_id, task_id, intervals)
    SELECT v_template_id, v_task_id, ARRAY[50, 100]
    WHERE NOT EXISTS (
      SELECT 1 FROM template_tasks 
      WHERE template_id = v_template_id AND task_id = v_task_id
    );
  END IF;

  -- Battery Check at 250 hours
  SELECT id INTO v_task_id FROM service_tasks WHERE name = 'Battery Check';
  IF v_task_id IS NOT NULL THEN
    INSERT INTO template_tasks (template_id, task_id, intervals)
    SELECT v_template_id, v_task_id, ARRAY[250]
    WHERE NOT EXISTS (
      SELECT 1 FROM template_tasks 
      WHERE template_id = v_template_id AND task_id = v_task_id
    );
  END IF;

  -- Bearing Inspection at 250, 500 hours
  SELECT id INTO v_task_id FROM service_tasks WHERE name = 'Bearing Inspection';
  IF v_task_id IS NOT NULL THEN
    INSERT INTO template_tasks (template_id, task_id, intervals)
    SELECT v_template_id, v_task_id, ARRAY[250, 500]
    WHERE NOT EXISTS (
      SELECT 1 FROM template_tasks 
      WHERE template_id = v_template_id AND task_id = v_task_id
    );
  END IF;

  -- Belt Inspection at 500 hours
  SELECT id INTO v_task_id FROM service_tasks WHERE name = 'Belt Inspection';
  IF v_task_id IS NOT NULL THEN
    INSERT INTO template_tasks (template_id, task_id, intervals)
    SELECT v_template_id, v_task_id, ARRAY[500]
    WHERE NOT EXISTS (
      SELECT 1 FROM template_tasks 
      WHERE template_id = v_template_id AND task_id = v_task_id
    );
  END IF;
END $$;

-- Link tasks to Boom Lifts template
DO $$
DECLARE
  v_template_id uuid;
  v_task_id uuid;
BEGIN
  -- Get Boom Lifts template ID
  SELECT id INTO v_template_id FROM service_templates WHERE name = 'Boom Lifts';
  
  -- Wiper Blade Inspection at 50, 100, 250 hours
  SELECT id INTO v_task_id FROM service_tasks WHERE name = 'Wiper Blade Inspection';
  IF v_task_id IS NOT NULL THEN
    INSERT INTO template_tasks (template_id, task_id, intervals)
    SELECT v_template_id, v_task_id, ARRAY[50, 100, 250]
    WHERE NOT EXISTS (
      SELECT 1 FROM template_tasks 
      WHERE template_id = v_template_id AND task_id = v_task_id
    );
  END IF;

  -- Air Filter Replacement at 100 hours
  SELECT id INTO v_task_id FROM service_tasks WHERE name = 'Air Filter Replacement';
  IF v_task_id IS NOT NULL THEN
    INSERT INTO template_tasks (template_id, task_id, intervals)
    SELECT v_template_id, v_task_id, ARRAY[100]
    WHERE NOT EXISTS (
      SELECT 1 FROM template_tasks 
      WHERE template_id = v_template_id AND task_id = v_task_id
    );
  END IF;
END $$;

-- Add a completed service record for Skid Steer #1
DO $$
DECLARE
  v_equipment_id uuid;
  v_task_id uuid;
BEGIN
  SELECT id INTO v_equipment_id FROM equipment WHERE serial_number = 'SS-2024-001';
  SELECT id INTO v_task_id FROM service_tasks WHERE name = 'Wiper Blade Inspection';
  
  IF v_equipment_id IS NOT NULL AND v_task_id IS NOT NULL THEN
    INSERT INTO service_records (equipment_id, task_id, scheduled_interval, performed_by, service_date, actual_hours, notes)
    SELECT v_equipment_id, v_task_id, 50, 'John Doe', CURRENT_DATE - 10, 52, 'Replaced worn wiper blades'
    WHERE NOT EXISTS (
      SELECT 1 FROM service_records 
      WHERE equipment_id = v_equipment_id AND task_id = v_task_id AND scheduled_interval = 50
    );
    
    INSERT INTO service_records (equipment_id, task_id, scheduled_interval, performed_by, service_date, actual_hours, notes)
    SELECT v_equipment_id, v_task_id, 100, 'Jane Smith', CURRENT_DATE - 5, 103, 'Wiper blades in good condition'
    WHERE NOT EXISTS (
      SELECT 1 FROM service_records 
      WHERE equipment_id = v_equipment_id AND task_id = v_task_id AND scheduled_interval = 100
    );
  END IF;
END $$;
