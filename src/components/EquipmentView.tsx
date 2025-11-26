import { useState, useEffect } from 'react';
import { Clock, Wrench, X, Save, Edit2, Lock, AlertCircle, AlertTriangle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type Equipment = Database['public']['Tables']['equipment']['Row'] & {
  service_templates?: {
    id: string;
    name: string;
    interval_presets?: {
      intervals: number[];
    } | null;
  } | null;
};
type ServiceTask = Database['public']['Tables']['service_tasks']['Row'];
type TemplateTask = Database['public']['Tables']['template_tasks']['Row'] & {
  service_tasks?: ServiceTask;
};
type ServiceRecord = Database['public']['Tables']['service_records']['Row'];
type ServiceSettings = Database['public']['Tables']['service_settings']['Row'];

type ServiceStatus = 'not-due' | 'pending' | 'overdue' | 'completed';

interface TaskStatus {
  task: ServiceTask;
  interval: number;
  status: ServiceStatus;
  lastService?: ServiceRecord;
}

export default function EquipmentView() {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [templateTasks, setTemplateTasks] = useState<TemplateTask[]>([]);
  const [taskStatuses, setTaskStatuses] = useState<TaskStatus[]>([]);
  const [serviceRecords, setServiceRecords] = useState<ServiceRecord[]>([]);
  const [settings, setSettings] = useState<ServiceSettings | null>(null);
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [adminCode, setAdminCode] = useState('');
  const [authError, setAuthError] = useState('');
  const [selectedTaskStatus, setSelectedTaskStatus] = useState<TaskStatus | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [recordFormData, setRecordFormData] = useState({
    performed_by: '',
    service_date: new Date().toISOString().split('T')[0],
    actual_hours: 0,
    notes: '',
  });

  useEffect(() => {
    loadSettings();
    loadEquipment();
  }, []);

  useEffect(() => {
    if (selectedEquipment) {
      loadTemplateTasksAndRecords();
    }
  }, [selectedEquipment]);

  useEffect(() => {
    if (selectedEquipment && templateTasks.length > 0 && settings) {
      calculateTaskStatuses();
    }
  }, [selectedEquipment, templateTasks, serviceRecords, settings]);

  const loadSettings = async () => {
    const { data, error } = await supabase
      .from('service_settings')
      .select('*')
      .maybeSingle();

    if (error) {
      console.error('Error loading settings:', error);
      return;
    }

    setSettings(data);
  };

  const loadEquipment = async () => {
    const { data, error } = await supabase
      .from('equipment')
      .select(`
        *,
        service_templates (
          id,
          name,
          interval_presets (
            intervals
          )
        )
      `)
      .order('name');

    if (error) {
      console.error('Error loading equipment:', error);
      return;
    }

    setEquipment(data || []);
    if (data && data.length > 0 && !selectedEquipment) {
      setSelectedEquipment(data[0]);
    }
  };

  const loadTemplateTasksAndRecords = async () => {
    if (!selectedEquipment?.template_id) {
      setTemplateTasks([]);
      setServiceRecords([]);
      return;
    }

    const { data: tasksData, error: tasksError } = await supabase
      .from('template_tasks')
      .select('*, service_tasks(*)')
      .eq('template_id', selectedEquipment.template_id);

    if (tasksError) {
      console.error('Error loading template tasks:', tasksError);
      return;
    }

    setTemplateTasks(tasksData || []);

    const { data: recordsData, error: recordsError } = await supabase
      .from('service_records')
      .select('*')
      .eq('equipment_id', selectedEquipment.id)
      .order('actual_hours', { ascending: false });

    if (recordsError) {
      console.error('Error loading service records:', error);
      return;
    }

    setServiceRecords(recordsData || []);
  };

  const calculateTaskStatuses = () => {
    if (!selectedEquipment || !settings) return;

    const statuses: TaskStatus[] = [];

    templateTasks.forEach((templateTask) => {
      if (!templateTask.service_tasks) return;

      templateTask.intervals.forEach((interval) => {
        const lastService = serviceRecords.find(
          (record) =>
            record.task_id === templateTask.task_id &&
            record.scheduled_interval === interval
        );

        let status: ServiceStatus = 'not-due';

        if (lastService) {
          status = 'completed';
        } else {
          const hoursUntilDue = interval - selectedEquipment.current_hours;

          if (hoursUntilDue > settings.pending_before_hours) {
            status = 'not-due';
          } else if (hoursUntilDue >= -settings.pending_after_hours) {
            status = 'pending';
          } else {
            status = 'overdue';
          }
        }

        statuses.push({
          task: templateTask.service_tasks,
          interval,
          status,
          lastService,
        });
      });
    });

    setTaskStatuses(statuses);
  };

  const getStatusColor = (status: ServiceStatus) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 border-green-300';
      case 'pending':
        return 'bg-yellow-100 border-yellow-300';
      case 'overdue':
        return 'bg-red-100 border-red-300';
      default:
        return 'bg-gray-100 border-gray-300';
    }
  };

  const getStatusIcon = (status: ServiceStatus) => {
    switch (status) {
      case 'completed':
        return <Wrench className="w-5 h-5 text-green-600" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'overdue':
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-600" />;
    }
  };

  const getUniqueIntervals = () => {
    if (!selectedEquipment?.service_templates?.interval_presets) return [];
    return selectedEquipment.service_templates.interval_presets.intervals;
  };

  const getUniqueTasks = () => {
    const taskMap = new Map<string, ServiceTask>();
    templateTasks.forEach((tt) => {
      if (tt.service_tasks) {
        taskMap.set(tt.service_tasks.id, tt.service_tasks);
      }
    });
    return Array.from(taskMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  };

  const getTaskStatusForCell = (taskId: string, interval: number): TaskStatus | undefined => {
    return taskStatuses.find(
      (ts) => ts.task.id === taskId && ts.interval === interval
    );
  };

  const handleOpenRecordModal = (taskStatus: TaskStatus) => {
    setSelectedTaskStatus(taskStatus);

    if (taskStatus.status === 'completed' && taskStatus.lastService) {
      setRecordFormData({
        performed_by: taskStatus.lastService.performed_by,
        service_date: taskStatus.lastService.service_date,
        actual_hours: taskStatus.lastService.actual_hours,
        notes: taskStatus.lastService.notes || '',
      });
      setIsEditMode(false);
      setShowViewModal(true);
    } else {
      setRecordFormData({
        performed_by: '',
        service_date: new Date().toISOString().split('T')[0],
        actual_hours: selectedEquipment?.current_hours || 0,
        notes: '',
      });
      setIsEditMode(false);
      setShowRecordModal(true);
    }
  };

  const handleRequestEdit = () => {
    setShowViewModal(false);
    setAdminCode('');
    setAuthError('');
    setShowAuthModal(true);
  };

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!settings?.master_admin_code) {
      setAuthError('Admin code not configured');
      return;
    }

    if (adminCode === settings.master_admin_code) {
      setShowAuthModal(false);
      setIsEditMode(true);
      setShowRecordModal(true);
      setAdminCode('');
      setAuthError('');
    } else {
      setAuthError('Invalid admin code');
    }
  };

  const handleSaveServiceRecord = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedEquipment || !selectedTaskStatus) return;

    if (isEditMode && selectedTaskStatus.lastService) {
      const { error } = await supabase
        .from('service_records')
        .update({
          performed_by: recordFormData.performed_by,
          service_date: recordFormData.service_date,
          actual_hours: recordFormData.actual_hours,
          notes: recordFormData.notes,
        })
        .eq('id', selectedTaskStatus.lastService.id);

      if (error) {
        console.error('Error updating service record:', error);
        return;
      }
    } else {
      const { error } = await supabase
        .from('service_records')
        .insert([{
          equipment_id: selectedEquipment.id,
          task_id: selectedTaskStatus.task.id,
          scheduled_interval: selectedTaskStatus.interval,
          performed_by: recordFormData.performed_by,
          service_date: recordFormData.service_date,
          actual_hours: recordFormData.actual_hours,
          notes: recordFormData.notes,
        }]);

      if (error) {
        console.error('Error saving service record:', error);
        return;
      }
    }

    setShowRecordModal(false);
    setSelectedTaskStatus(null);
    setIsEditMode(false);
    loadTemplateTasksAndRecords();
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-900">Equipment Service Schedule</h2>
        <p className="text-gray-600 mt-1">View and manage service history for equipment</p>
      </div>

      <div className="bg-white rounded-lg p-6 mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Equipment:</label>
        <select
          value={selectedEquipment?.id || ''}
          onChange={(e) => {
            const eq = equipment.find((eq) => eq.id === e.target.value);
            setSelectedEquipment(eq || null);
          }}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {equipment.map((eq) => (
            <option key={eq.id} value={eq.id}>
              {eq.name} ({eq.serial_number}) - {eq.current_hours} hrs
            </option>
          ))}
        </select>
      </div>

      {selectedEquipment && (
        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-3">
            <Wrench className="w-5 h-5 text-blue-600" />
            <div>
              <div className="font-semibold text-blue-900">{selectedEquipment.service_templates?.name || 'No Template'}</div>
            </div>
          </div>
          <div className="flex items-center gap-3 mt-2">
            <Clock className="w-5 h-5 text-blue-600" />
            <div className="font-semibold text-blue-900">Current Hours: {selectedEquipment.current_hours}</div>
          </div>
        </div>
      )}

      {selectedEquipment?.service_templates && getUniqueIntervals().length > 0 ? (
        <>
          <div className="bg-white rounded-lg overflow-x-auto mb-6">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left px-6 py-3 bg-gray-50 font-medium text-gray-700 w-[300px] sticky left-0 z-10">
                    Service Task
                  </th>
                  {getUniqueIntervals().map((interval) => (
                    <th key={interval} className="text-center px-6 py-3 bg-gray-50 font-medium text-gray-700">
                      {interval}h
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {getUniqueTasks().map((task) => (
                  <tr key={task.id} className="border-b border-gray-100">
                    <td className="px-6 py-4 font-medium text-gray-900 w-[300px] sticky left-0 bg-white z-10">{task.name}</td>
                    {getUniqueIntervals().map((interval) => {
                      const taskStatus = getTaskStatusForCell(task.id, interval);
                      return (
                        <td key={interval} className="px-6 py-4 text-center">
                          {taskStatus ? (
                            <button
                              onClick={() => handleOpenRecordModal(taskStatus)}
                              className={`w-12 h-12 rounded-lg border-2 transition-colors hover:opacity-80 flex items-center justify-center ${getStatusColor(
                                taskStatus.status
                              )}`}
                              title={`${task.name} at ${interval}h - Status: ${taskStatus.status}`}
                            >
                              {getStatusIcon(taskStatus.status)}
                            </button>
                          ) : (
                            <div className="w-12 h-12" />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-white rounded-lg p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Status Legend</h3>
            <div className="grid grid-cols-4 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 border-2 border-green-300 rounded-lg flex items-center justify-center">
                  <Wrench className="w-5 h-5 text-green-600" />
                </div>
                <span className="text-sm text-gray-700">Completed</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-yellow-100 border-2 border-yellow-300 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-yellow-600" />
                </div>
                <span className="text-sm text-gray-700">Pending</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-red-100 border-2 border-red-300 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <span className="text-sm text-gray-700">Overdue</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-100 border-2 border-gray-300 rounded-lg flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-gray-600" />
                </div>
                <span className="text-sm text-gray-700">Not Due</span>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white rounded-lg p-12 text-center">
          <p className="text-gray-500">
            {selectedEquipment
              ? 'No service template assigned to this equipment'
              : 'Select equipment to view service schedule'}
          </p>
        </div>
      )}

      {showViewModal && selectedTaskStatus && selectedEquipment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Service Record (Read Only)</h3>
              <button
                onClick={() => setShowViewModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-sm text-gray-600 mb-6">
              {selectedTaskStatus.task.name} - {selectedTaskStatus.interval}h
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 text-green-900">
                <Wrench className="w-5 h-5" />
                <div className="font-semibold">Service Completed</div>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Performed By</label>
                <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                  {recordFormData.performed_by}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Service Date</label>
                  <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                    {recordFormData.service_date}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Actual Machine Hours</label>
                  <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                    {recordFormData.actual_hours}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 min-h-[100px]">
                  {recordFormData.notes || 'No notes'}
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setShowViewModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleRequestEdit}
                className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                <Edit2 className="w-4 h-4" />
                Edit Record
              </button>
            </div>
          </div>
        </div>
      )}

      {showAuthModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Master Admin Authorization</h3>
              <button
                onClick={() => {
                  setShowAuthModal(false);
                  setAdminCode('');
                  setAuthError('');
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 text-orange-900">
                <Lock className="w-5 h-5" />
                <div>
                  <div className="font-semibold">Authorization Required</div>
                  <div className="text-sm">Enter master admin code to edit completed service record</div>
                </div>
              </div>
            </div>

            <form onSubmit={handleAuthSubmit}>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Master Admin Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={adminCode}
                  onChange={(e) => {
                    setAdminCode(e.target.value);
                    setAuthError('');
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Enter admin code"
                  required
                  autoFocus
                />
                {authError && (
                  <p className="text-red-600 text-sm mt-1">{authError}</p>
                )}
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowAuthModal(false);
                    setAdminCode('');
                    setAuthError('');
                  }}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                >
                  <Lock className="w-4 h-4" />
                  Authorize
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showRecordModal && selectedTaskStatus && selectedEquipment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">
                {isEditMode ? 'Edit Service Record' : 'Record Service'}
              </h3>
              <button
                onClick={() => {
                  setShowRecordModal(false);
                  setIsEditMode(false);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-sm text-gray-600 mb-6">
              {selectedTaskStatus.task.name} - {selectedTaskStatus.interval}h
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 text-blue-900">
                <Clock className="w-5 h-5" />
                <div>
                  <div className="font-semibold">Scheduled Service: {selectedTaskStatus.interval}h</div>
                  <div className="text-sm">Current equipment hours: {selectedEquipment.current_hours}</div>
                </div>
              </div>
            </div>

            <form onSubmit={handleSaveServiceRecord}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Performed By <span className="text-red-500">*</span>
                </label>
                <select
                  value={recordFormData.performed_by}
                  onChange={(e) =>
                    setRecordFormData({ ...recordFormData, performed_by: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select employee...</option>
                  <option value="John Doe">John Doe</option>
                  <option value="Jane Smith">Jane Smith</option>
                  <option value="Mike Johnson">Mike Johnson</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Service Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={recordFormData.service_date}
                    onChange={(e) =>
                      setRecordFormData({ ...recordFormData, service_date: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Actual Machine Hours <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={recordFormData.actual_hours}
                    onChange={(e) =>
                      setRecordFormData({
                        ...recordFormData,
                        actual_hours: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={recordFormData.notes}
                  onChange={(e) =>
                    setRecordFormData({ ...recordFormData, notes: e.target.value })
                  }
                  placeholder="Add any notes about the service..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={4}
                />
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowRecordModal(false);
                    setIsEditMode(false);
                  }}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  {isEditMode ? 'Update Service Record' : 'Save Service Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
