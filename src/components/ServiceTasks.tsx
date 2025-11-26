import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type TaskCategory = Database['public']['Tables']['task_categories']['Row'];
type ServiceTask = Database['public']['Tables']['service_tasks']['Row'] & {
  task_categories?: TaskCategory | null;
};

export default function ServiceTasks() {
  const [tasks, setTasks] = useState<ServiceTask[]>([]);
  const [categories, setCategories] = useState<TaskCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showNewTaskForm, setShowNewTaskForm] = useState(false);
  const [showNewCategoryForm, setShowNewCategoryForm] = useState(false);
  const [editingTask, setEditingTask] = useState<ServiceTask | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    estimated_duration: 0,
    category_id: '',
    auto_apply: false,
  });
  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    description: '',
    color: '#64748b',
  });

  useEffect(() => {
    loadCategories();
    loadTasks();
  }, []);

  const loadCategories = async () => {
    const { data, error } = await supabase
      .from('task_categories')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error loading categories:', error);
      return;
    }

    setCategories(data || []);
  };

  const loadTasks = async () => {
    const { data, error } = await supabase
      .from('service_tasks')
      .select('*, task_categories(*)');

    if (error) {
      console.error('Error loading tasks:', error);
      return;
    }

    const sortedData = (data || []).sort((a, b) => {
      const categoryA = a.task_categories?.name || 'zzz';
      const categoryB = b.task_categories?.name || 'zzz';

      if (categoryA !== categoryB) {
        return categoryA.localeCompare(categoryB);
      }

      return a.name.localeCompare(b.name);
    });

    setTasks(sortedData);
  };

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();

    const taskData = {
      ...formData,
      category_id: formData.category_id || null,
    };

    if (editingTask) {
      const { error } = await supabase
        .from('service_tasks')
        .update(taskData)
        .eq('id', editingTask.id);

      if (error) {
        console.error('Error updating task:', error);
        return;
      }
    } else {
      const { error } = await supabase
        .from('service_tasks')
        .insert([taskData]);

      if (error) {
        console.error('Error creating task:', error);
        return;
      }
    }

    setShowNewTaskForm(false);
    setEditingTask(null);
    setFormData({
      name: '',
      description: '',
      estimated_duration: 0,
      category_id: '',
      auto_apply: false,
    });
    loadTasks();
  };

  const handleDeleteTask = async (id: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    const { error } = await supabase
      .from('service_tasks')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting task:', error);
      return;
    }

    loadTasks();
  };

  const handleEditTask = (task: ServiceTask) => {
    setEditingTask(task);
    setFormData({
      name: task.name,
      description: task.description,
      estimated_duration: task.estimated_duration,
      category_id: task.category_id || '',
      auto_apply: task.auto_apply,
    });
    setShowNewTaskForm(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();

    const { error } = await supabase
      .from('task_categories')
      .insert([categoryFormData]);

    if (error) {
      console.error('Error creating category:', error);
      return;
    }

    setShowNewCategoryForm(false);
    setCategoryFormData({
      name: '',
      description: '',
      color: '#64748b',
    });
    loadCategories();
  };

  const filteredTasks = selectedCategory === 'all'
    ? tasks
    : selectedCategory === 'uncategorized'
    ? tasks.filter(task => !task.category_id)
    : tasks.filter(task => task.category_id === selectedCategory);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Service Tasks Repository</h2>
          <p className="text-gray-600 mt-1">Manage service tasks that can be added to templates</p>
        </div>
        <button
          onClick={() => {
            setEditingTask(null);
            setFormData({
              name: '',
              description: '',
              estimated_duration: 0,
              category_id: '',
              auto_apply: false,
            });
            setShowNewTaskForm(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Task
        </button>
      </div>

      {showNewTaskForm && (
        <div className="bg-white rounded-lg border-2 border-blue-500 p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">{editingTask ? 'Edit Service Task' : 'New Service Task'}</h3>
          <form onSubmit={handleSaveTask}>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Task Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Oil Change"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estimated Duration (minutes)
                </label>
                <input
                  type="number"
                  value={formData.estimated_duration}
                  onChange={(e) => setFormData({ ...formData, estimated_duration: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Task description..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Uncategorized</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.auto_apply}
                  onChange={(e) => setFormData({ ...formData, auto_apply: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">Apply to all intervals by default</span>
              </label>
              <p className="text-sm text-gray-500 ml-6 mt-1">
                When checked, this task will be automatically selected for all time intervals when added to a template
              </p>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowNewTaskForm(false);
                  setEditingTask(null);
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Task Categories</h3>
          <button
            onClick={() => setShowNewCategoryForm(!showNewCategoryForm)}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-3 h-3" />
            New Task Category
          </button>
        </div>

        {showNewCategoryForm && (
          <form onSubmit={handleSaveCategory} className="mb-4 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-3 gap-4">
              <input
                type="text"
                value={categoryFormData.name}
                onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
                placeholder="Category name"
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <input
                type="text"
                value={categoryFormData.description}
                onChange={(e) => setCategoryFormData({ ...categoryFormData, description: e.target.value })}
                placeholder="Description"
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <div className="flex gap-2">
                <input
                  type="color"
                  value={categoryFormData.color}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, color: e.target.value })}
                  className="w-16 h-10 border border-gray-300 rounded-lg"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewCategoryForm(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        )}

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              selectedCategory === 'all'
                ? 'bg-gray-700 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-gray-700"></span>
              All Tasks
            </span>
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                selectedCategory === category.id
                  ? 'bg-opacity-100 text-white'
                  : 'bg-opacity-20 hover:bg-opacity-30'
              }`}
              style={{
                backgroundColor: selectedCategory === category.id ? category.color : `${category.color}33`,
                color: selectedCategory === category.id ? 'white' : category.color,
              }}
            >
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: category.color }}></span>
                {category.name}
              </span>
            </button>
          ))}
          <button
            onClick={() => setSelectedCategory('uncategorized')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              selectedCategory === 'uncategorized'
                ? 'bg-gray-400 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-gray-400"></span>
              Uncategorized
            </span>
          </button>
        </div>

        <p className="text-sm text-gray-500 mt-2">{filteredTasks.length} tasks</p>
      </div>

      <div className="bg-white rounded-lg overflow-hidden border border-gray-200">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Task Name
              </th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Task Category
              </th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Duration (Min)
              </th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Auto-Apply
              </th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredTasks.map((task) => (
              <tr key={task.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {task.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {task.task_categories ? (
                    <span
                      className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm"
                      style={{
                        backgroundColor: `${task.task_categories.color}20`,
                        color: task.task_categories.color,
                      }}
                    >
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: task.task_categories.color }}></span>
                      {task.task_categories.name}
                    </span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                  {task.description || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {task.estimated_duration}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {task.auto_apply ? 'Yes' : 'No'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEditTask(task)}
                      className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
