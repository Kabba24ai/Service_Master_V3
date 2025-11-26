export interface Database {
  public: {
    Tables: {
      service_settings: {
        Row: {
          id: string;
          pending_before_hours: number;
          pending_after_hours: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          pending_before_hours?: number;
          pending_after_hours?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          pending_before_hours?: number;
          pending_after_hours?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      task_categories: {
        Row: {
          id: string;
          name: string;
          description: string;
          color: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string;
          color?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          color?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      service_tasks: {
        Row: {
          id: string;
          name: string;
          description: string;
          estimated_duration: number;
          category_id: string | null;
          auto_apply: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string;
          estimated_duration?: number;
          category_id?: string | null;
          auto_apply?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          estimated_duration?: number;
          category_id?: string | null;
          auto_apply?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      interval_presets: {
        Row: {
          id: string;
          name: string;
          description: string;
          intervals: number[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string;
          intervals: number[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          intervals?: number[];
          created_at?: string;
          updated_at?: string;
        };
      };
      service_templates: {
        Row: {
          id: string;
          name: string;
          description: string;
          preset_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string;
          preset_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          preset_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      template_tasks: {
        Row: {
          id: string;
          template_id: string;
          task_id: string;
          intervals: number[];
          created_at: string;
        };
        Insert: {
          id?: string;
          template_id: string;
          task_id: string;
          intervals: number[];
          created_at?: string;
        };
        Update: {
          id?: string;
          template_id?: string;
          task_id?: string;
          intervals?: number[];
          created_at?: string;
        };
      };
      equipment: {
        Row: {
          id: string;
          name: string;
          serial_number: string;
          current_hours: number;
          template_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          serial_number: string;
          current_hours?: number;
          template_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          serial_number?: string;
          current_hours?: number;
          template_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      service_records: {
        Row: {
          id: string;
          equipment_id: string;
          task_id: string;
          scheduled_interval: number;
          performed_by: string;
          service_date: string;
          actual_hours: number;
          notes: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          equipment_id: string;
          task_id: string;
          scheduled_interval: number;
          performed_by: string;
          service_date: string;
          actual_hours: number;
          notes?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          equipment_id?: string;
          task_id?: string;
          scheduled_interval?: number;
          performed_by?: string;
          service_date?: string;
          actual_hours?: number;
          notes?: string;
          created_at?: string;
        };
      };
    };
  };
}
