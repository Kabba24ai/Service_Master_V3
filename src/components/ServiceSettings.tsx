import { useState, useEffect } from 'react';
import { Info, Plus, Trash2, Pencil, X, Check, Lock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type ServiceSettings = Database['public']['Tables']['service_settings']['Row'];
type TaskCategory = Database['public']['Tables']['task_categories']['Row'];

export default function ServiceSettings() {
  const [settings, setSettings] = useState<ServiceSettings | null>(null);
  const [pendingBefore, setPendingBefore] = useState(20);
  const [pendingAfter, setPendingAfter] = useState(15);
  const [masterAdminCode, setMasterAdminCode] = useState('1234');
  const [isSaving, setIsSaving] = useState(false);
  const [categories, setCategories] = useState<TaskCategory[]>([]);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#3B82F6');
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editCategoryName, setEditCategoryName] = useState('');
  const [editCategoryColor, setEditCategoryColor] = useState('');

  useEffect(() => {
    loadSettings();
    loadCategories();
  }, []);

  const loadSettings = async () => {
    const { data, error } = await supabase
      .from('service_settings')
      .select('*')
      .maybeSingle();

    if (error) {
      console.error('Error loading settings:', error);
      return;
    }

    if (data) {
      setSettings(data);
      setPendingBefore(data.pending_before_hours);
      setPendingAfter(data.pending_after_hours);
      setMasterAdminCode(data.master_admin_code || '1234');
    }
  };

  const loadCategories = async () => {
    const { data, error } = await supabase
      .from('task_categories')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error loading categories:', error);
      return;
    }

    if (data) {
      setCategories(data);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;

    const { error } = await supabase
      .from('task_categories')
      .insert([{
        name: newCategoryName,
        color: newCategoryColor,
      }]);

    if (error) {
      console.error('Error adding category:', error);
      return;
    }

    setNewCategoryName('');
    setNewCategoryColor('#3B82F6');
    setIsAddingCategory(false);
    loadCategories();
  };

  const handleStartEdit = (category: TaskCategory) => {
    setEditingCategoryId(category.id);
    setEditCategoryName(category.name);
    setEditCategoryColor(category.color);
  };

  const handleCancelEdit = () => {
    setEditingCategoryId(null);
    setEditCategoryName('');
    setEditCategoryColor('');
  };

  const handleSaveEdit = async (categoryId: string) => {
    if (!editCategoryName.trim()) return;

    const { error } = await supabase
      .from('task_categories')
      .update({
        name: editCategoryName,
        color: editCategoryColor,
      })
      .eq('id', categoryId);

    if (error) {
      console.error('Error updating category:', error);
      return;
    }

    handleCancelEdit();
    loadCategories();
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm('Are you sure you want to delete this category? Tasks in this category will become uncategorized.')) {
      return;
    }

    const { error } = await supabase
      .from('task_categories')
      .delete()
      .eq('id', categoryId);

    if (error) {
      console.error('Error deleting category:', error);
      return;
    }

    loadCategories();
  };

  const handleSave = async () => {
    setIsSaving(true);

    if (settings) {
      const { error } = await supabase
        .from('service_settings')
        .update({
          pending_before_hours: pendingBefore,
          pending_after_hours: pendingAfter,
          master_admin_code: masterAdminCode,
          updated_at: new Date().toISOString(),
        })
        .eq('id', settings.id);

      if (error) {
        console.error('Error updating settings:', error);
      }
    } else {
      const { error } = await supabase
        .from('service_settings')
        .insert([{
          pending_before_hours: pendingBefore,
          pending_after_hours: pendingAfter,
          master_admin_code: masterAdminCode,
        }]);

      if (error) {
        console.error('Error creating settings:', error);
      }
    }

    setIsSaving(false);
    loadSettings();
  };

  const exampleServiceInterval = 250;
  const notDueThreshold = exampleServiceInterval - pendingBefore;
  const pendingStart = exampleServiceInterval - pendingBefore;
  const pendingEnd = exampleServiceInterval + pendingAfter;
  const overdueStart = exampleServiceInterval + pendingAfter;

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
        <p className="text-gray-600 mt-1">Configure interval presets and notification thresholds</p>
      </div>

      <div className="bg-white rounded-lg p-6 mb-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Notification Settings</h3>
        <p className="text-gray-600 mb-6">Configure when service status changes between conditions</p>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-blue-900 mb-2">How Service Status Works</h4>
              <ul className="space-y-2 text-sm text-blue-800">
                <li>
                  <span className="font-semibold">Not Due (Gray):</span> Service is not yet due (equipment hours are more than "Before" threshold away from service interval)
                </li>
                <li>
                  <span className="font-semibold">Pending (Yellow):</span> Service is due soon or slightly overdue (equipment hours are within the "Before" threshold or up to the "After" threshold past the service interval)
                </li>
                <li>
                  <span className="font-semibold">Overdue (Red):</span> Service is significantly overdue (equipment hours exceed service interval by more than the "After" threshold)
                </li>
                <li>
                  <span className="font-semibold">Completed (Green):</span> Service has been completed and recorded
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pending Before (Yellow) - Hours
            </label>
            <input
              type="number"
              value={pendingBefore}
              onChange={(e) => setPendingBefore(parseInt(e.target.value) || 0)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-sm text-gray-500 mt-2">
              Hours before service is due to show yellow status
            </p>
            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-700">
                <span className="font-semibold">Example:</span> If set to {pendingBefore} hours, equipment at {pendingStart} hours will show yellow for a {exampleServiceInterval}-hour service ({pendingBefore} hours before due).
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pending After (Yellow) - Hours
            </label>
            <input
              type="number"
              value={pendingAfter}
              onChange={(e) => setPendingAfter(parseInt(e.target.value) || 0)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-sm text-gray-500 mt-2">
              Hours after service is due to continue showing yellow before turning red
            </p>
            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-700">
                <span className="font-semibold">Example:</span> If set to {pendingAfter} hours, equipment at {pendingEnd} hours will show yellow for a {exampleServiceInterval}-hour service ({pendingAfter} hours overdue), but {overdueStart} hours will show red.
              </p>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Master Admin Code
          </label>
          <div className="flex items-center gap-3">
            <Lock className="w-5 h-5 text-gray-600" />
            <input
              type="text"
              value={masterAdminCode}
              onChange={(e) => setMasterAdminCode(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter admin code"
            />
          </div>
          <p className="text-sm text-gray-500 mt-2">
            This code is required to edit completed service records
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
        >
          {isSaving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      <div className="bg-white rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-900">Task Categories</h3>
          <button
            onClick={() => setIsAddingCategory(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Add Category
          </button>
        </div>

        {isAddingCategory && (
          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category Name</label>
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Enter category name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
                <input
                  type="color"
                  value={newCategoryColor}
                  onChange={(e) => setNewCategoryColor(e.target.value)}
                  className="w-full h-10 px-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAddCategory}
                disabled={!newCategoryName.trim()}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setIsAddingCategory(false);
                  setNewCategoryName('');
                  setNewCategoryColor('#3B82F6');
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {categories.map((category) => (
            <div key={category.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              {editingCategoryId === category.id ? (
                <div className="flex-1 grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    value={editCategoryName}
                    onChange={(e) => setEditCategoryName(e.target.value)}
                    className="px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <input
                    type="color"
                    value={editCategoryColor}
                    onChange={(e) => setEditCategoryColor(e.target.value)}
                    className="h-8 px-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div
                    className="w-6 h-6 rounded"
                    style={{ backgroundColor: category.color }}
                  ></div>
                  <span className="font-medium text-gray-900">{category.name}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                {editingCategoryId === category.id ? (
                  <>
                    <button
                      onClick={() => handleSaveEdit(category.id)}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => handleStartEdit(category)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(category.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Status Example Based on Current Settings</h3>

        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-24 h-12 bg-gray-500 rounded-lg flex items-center justify-center text-white font-semibold">
              Grey
            </div>
            <div>
              <div className="font-semibold text-gray-900">Service Not Due</div>
              <div className="text-sm text-gray-600">
                For a {exampleServiceInterval}h service: Equipment has &lt; {notDueThreshold} hours (more than {pendingBefore} hours away)
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-24 h-12 bg-yellow-500 rounded-lg flex items-center justify-center text-white font-semibold">
              Yellow
            </div>
            <div>
              <div className="font-semibold text-gray-900">Service Pending</div>
              <div className="text-sm text-gray-600">
                For a {exampleServiceInterval}h service: Equipment has {pendingStart} - {pendingEnd} hours (within {pendingBefore}h before to {pendingAfter}h after)
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-24 h-12 bg-red-500 rounded-lg flex items-center justify-center text-white font-semibold">
              Red
            </div>
            <div>
              <div className="font-semibold text-gray-900">Service Overdue</div>
              <div className="text-sm text-gray-600">
                For a {exampleServiceInterval}h service: Equipment has &gt; {pendingEnd} hours (more than {pendingAfter} hours overdue)
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-24 h-12 bg-green-500 rounded-lg flex items-center justify-center text-white font-semibold">
              Green
            </div>
            <div>
              <div className="font-semibold text-gray-900">Service Completed</div>
              <div className="text-sm text-gray-600">
                Service has been completed and recorded in the system
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
