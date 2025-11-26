/*
  # Add Master Admin Code to Service Settings

  1. Changes
    - Add `master_admin_code` column to `service_settings` table
    - This code will be required to edit completed service records
    - Default value set to '1234' for initial setup
  
  2. Security
    - No changes to RLS policies needed
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'service_settings' AND column_name = 'master_admin_code'
  ) THEN
    ALTER TABLE service_settings ADD COLUMN master_admin_code text DEFAULT '1234';
  END IF;
END $$;
