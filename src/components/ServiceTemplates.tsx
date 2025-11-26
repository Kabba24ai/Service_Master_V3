import { useState, useEffect } from 'react';
import { Plus, Trash2, ChevronRight, ArrowLeft, Pencil } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type IntervalPreset = Database['public']['Tables']['interval_presets']['Row'];
type TaskCategory = Database['public']['Tables']['task_categories']['Row'];
type ServiceTemplate = Database['public']['Tables']['service_templates']['Row'] & {
  interval_presets?: IntervalPreset | null;
};
type ServiceTask = Database['public']['Tables']['service_tasks']['Row'] & {
  task_categories?: TaskCategory | null;
};
type TemplateTask = Database['public']['Tables']['template_tasks']['Row'] & {
  service_tasks?: ServiceTask;
};

type CreationStep = 'name' | 'interval' | 'tasks' | 'assign';

export default function ServiceTemplates() {
  const [templates, setTemplates] = useState<ServiceTemplate[]>([]);
  const [presets, setPresets] = useState<IntervalPreset[]>([]);
  const [categories, setCategories] = useState<TaskCategory[]>([]);
  const [tasks, setTasks] = useState<ServiceTask[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<ServiceTemplate | null>(null);
  const [templateTasks, setTemplateTasks] = useState<TemplateTask[]>([]);
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);
  const [creationStep, setCreationStep] = useState<CreationStep>('name');
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateDescription, setNewTemplateDescription] = useState('');
  const [selectedPresetId, setSelectedPresetId] = useState('');
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [taskSelections, setTaskSelections] = useState<Record<string, number[]>>({});
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  const [isEditingTemplate, setIsEditingTemplate] = useState(false);
  const [isCreatingIntervalPreset, setIsCreatingIntervalPreset] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [newPresetDescription, setNewPresetDescription] = useState('');
  const [newPresetIntervals, setNewPresetIntervals] = useState<number[]>([]);
  const [intervalInput, setIntervalInput] = useState('');

  useEffect(() => {
    loadPresets();
    loadCategories();
    loadTemplates();
    loadTasks();
  }, []);

  useEffect(() => {
    if (selectedTemplate) {
      loadTemplateTasks(selectedTemplate.id);
    }
  }, [selectedTemplate]);

  const loadPresets = async () => {
    const { data, error } = await supabase
      .from('interval_presets')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error loading presets:', error);
      return;
    }

    setPresets(data || []);
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

    setCategories(data || []);
  };

  const loadTemplates = async () => {
    const { data, error } = await supabase
      .from('service_templates')
      .select('*, interval_presets(*)')
      .order('name');

    if (error) {
      console.error('Error loading templates:', error);
      return;
    }

    setTemplates(data || []);
    if (data && data.length > 0 && !selectedTemplate) {
      setSelectedTemplate(data[0]);
    }
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

  const loadTemplateTasks = async (templateId: string) => {
    const { data, error } = await supabase
      .from('template_tasks')
      .select('*, service_tasks(*, task_categories(*))')
      .eq('template_id', templateId);

    if (error) {
      console.error('Error loading template tasks:', error);
      return;
    }

    setTemplateTasks(data || []);
  };

  const handleStartNewTemplate = () => {
    setIsCreatingTemplate(true);
    setCreationStep('name');
    setNewTemplateName('');
    setNewTemplateDescription('');
    setSelectedPresetId('');
    setSelectedCategoryIds([]);
    setTaskSelections({});
  };

  const handleCancelCreation = () => {
    setIsCreatingTemplate(false);
    setCreationStep('name');
    setNewTemplateName('');
    setNewTemplateDescription('');
    setSelectedPresetId('');
    setSelectedCategoryIds([]);
    setTaskSelections({});
    setSelectedTaskIds(new Set());
  };

  const handleNextStep = () => {
    if (creationStep === 'name') {
      setCreationStep('interval');
    } else if (creationStep === 'interval') {
      setCreationStep('tasks');
    } else if (creationStep === 'tasks') {
      const intervals = getSelectedPresetIntervals();
      const newTaskSelections: Record<string, number[]> = {};

      tasks.filter(task => selectedTaskIds.has(task.id)).forEach(task => {
        if (task.auto_apply) {
          newTaskSelections[task.id] = intervals;
        } else {
          newTaskSelections[task.id] = [];
        }
      });

      setTaskSelections(newTaskSelections);
      setCreationStep('assign');
    }
  };

  const handlePreviousStep = () => {
    if (creationStep === 'assign') {
      setCreationStep('tasks');
    } else if (creationStep === 'tasks') {
      setCreationStep('interval');
    } else if (creationStep === 'interval') {
      setCreationStep('name');
    }
  };

  const handleSaveTemplate = async () => {
    const { data: newTemplate, error: templateError } = await supabase
      .from('service_templates')
      .insert([{
        name: newTemplateName,
        description: newTemplateDescription,
        preset_id: selectedPresetId || null,
      }])
      .select()
      .single();

    if (templateError || !newTemplate) {
      console.error('Error creating template:', templateError);
      return;
    }

    const templateTasksToInsert = Object.entries(taskSelections)
      .filter(([taskId, intervals]) => selectedTaskIds.has(taskId) && intervals.length > 0)
      .map(([taskId, intervals]) => ({
        template_id: newTemplate.id,
        task_id: taskId,
        intervals,
      }));

    if (templateTasksToInsert.length > 0) {
      const { error: tasksError } = await supabase
        .from('template_tasks')
        .insert(templateTasksToInsert);

      if (tasksError) {
        console.error('Error adding tasks to template:', tasksError);
      }
    }

    handleCancelCreation();
    loadTemplates();
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    const { error } = await supabase
      .from('service_templates')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting template:', error);
      return;
    }

    if (selectedTemplate?.id === id) {
      setSelectedTemplate(null);
    }
    loadTemplates();
  };

  const handleToggleInterval = async (templateTask: TemplateTask, interval: number) => {
    const newIntervals = templateTask.intervals.includes(interval)
      ? templateTask.intervals.filter(i => i !== interval)
      : [...templateTask.intervals, interval].sort((a, b) => a - b);

    if (newIntervals.length === 0) {
      const { error } = await supabase
        .from('template_tasks')
        .delete()
        .eq('id', templateTask.id);

      if (error) {
        console.error('Error removing task:', error);
        return;
      }
    } else {
      const { error } = await supabase
        .from('template_tasks')
        .update({ intervals: newIntervals })
        .eq('id', templateTask.id);

      if (error) {
        console.error('Error updating intervals:', error);
        return;
      }
    }

    if (selectedTemplate) {
      loadTemplateTasks(selectedTemplate.id);
    }
  };

  const handleToggleIntervalInCreation = (taskId: string, interval: number) => {
    setTaskSelections(prev => {
      const currentIntervals = prev[taskId] || [];
      const newIntervals = currentIntervals.includes(interval)
        ? currentIntervals.filter(i => i !== interval)
        : [...currentIntervals, interval].sort((a, b) => a - b);

      if (newIntervals.length === 0) {
        const { [taskId]: _, ...rest } = prev;
        return rest;
      }

      return {
        ...prev,
        [taskId]: newIntervals,
      };
    });
  };

  const handleAddTaskToTemplate = async (taskId: string) => {
    if (!selectedTemplate) return;

    const task = tasks.find(t => t.id === taskId);
    const intervals = task?.auto_apply ? getAvailableIntervals() : [];

    const { error } = await supabase
      .from('template_tasks')
      .insert([{
        template_id: selectedTemplate.id,
        task_id: taskId,
        intervals,
      }]);

    if (error) {
      console.error('Error adding task:', error);
      return;
    }

    loadTemplateTasks(selectedTemplate.id);
  };

  const getAvailableIntervals = () => {
    if (!selectedTemplate?.interval_presets) return [];
    return selectedTemplate.interval_presets.intervals;
  };

  const getSelectedPresetIntervals = () => {
    const preset = presets.find(p => p.id === selectedPresetId);
    return preset?.intervals || [];
  };

  const getTasksNotInTemplate = () => {
    const templateTaskIds = templateTasks.map(tt => tt.task_id);
    let availableTasks = tasks.filter(task => !templateTaskIds.includes(task.id));

    // Apply category filter if any categories are selected
    if (selectedCategoryIds.length > 0) {
      availableTasks = availableTasks.filter(task => {
        if (selectedCategoryIds.includes('uncategorized') && !task.category_id) {
          return true;
        }
        return task.category_id && selectedCategoryIds.includes(task.category_id);
      });
    }

    return availableTasks;
  };

  const getFilteredTasks = () => {
    if (selectedCategoryIds.length === 0) return tasks;

    return tasks.filter(task => {
      if (selectedCategoryIds.includes('uncategorized') && !task.category_id) {
        return true;
      }
      return task.category_id && selectedCategoryIds.includes(task.category_id);
    });
  };

  const getFilteredTemplateTasks = () => {
    if (selectedCategoryIds.length === 0) return templateTasks;

    return templateTasks.filter(tt => {
      if (selectedCategoryIds.includes('uncategorized') && !tt.service_tasks?.category_id) {
        return true;
      }
      return tt.service_tasks?.category_id && selectedCategoryIds.includes(tt.service_tasks.category_id);
    });
  };

  if (isCreatingTemplate) {
    return (
      <div>
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={handleCancelCreation}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Create New Template</h2>
              <p className="text-gray-600 mt-1">
                Step {creationStep === 'name' ? '1' : creationStep === 'interval' ? '2' : creationStep === 'tasks' ? '3' : '4'} of 4
              </p>
            </div>
          </div>
        </div>

        {creationStep === 'name' && (
          <div className="bg-white rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Template Information</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Template Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
                placeholder="e.g., Boom Lifts, Skid Steer"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={newTemplateDescription}
                onChange={(e) => setNewTemplateDescription(e.target.value)}
                placeholder="Template description..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleCancelCreation}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleNextStep}
                disabled={!newTemplateName}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
              >
                Next: Select Service Intervals
              </button>
            </div>
          </div>
        )}

        {creationStep === 'interval' && !isCreatingIntervalPreset && (
          <div className="bg-white rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Select Service Intervals</h3>
                <p className="text-gray-600 mt-1">Choose an interval preset for this template</p>
              </div>
              <button
                onClick={() => setIsCreatingIntervalPreset(true)}
                className="flex items-center gap-2 px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50"
              >
                <Plus className="w-4 h-4" />
                Interval Template
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              {presets.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => setSelectedPresetId(preset.id)}
                  className={`p-4 border-2 rounded-lg text-left transition-colors ${
                    selectedPresetId === preset.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-semibold text-gray-900 mb-1">{preset.name}</div>
                  {preset.description && (
                    <div className="text-sm text-gray-500 mb-3">{preset.description}</div>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {preset.intervals.map((interval) => (
                      <span
                        key={interval}
                        className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs"
                      >
                        {interval}h
                      </span>
                    ))}
                  </div>
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={handlePreviousStep}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Previous
              </button>
              <button
                onClick={handleNextStep}
                disabled={!selectedPresetId}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
              >
                Next: Assign Tasks
              </button>
            </div>
          </div>
        )}

        {creationStep === 'interval' && isCreatingIntervalPreset && (
          <div className="bg-white rounded-lg p-6">
            <div className="mb-6">
              <button
                onClick={() => {
                  setIsCreatingIntervalPreset(false);
                  setNewPresetName('');
                  setNewPresetDescription('');
                  setNewPresetIntervals([]);
                  setIntervalInput('');
                }}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Select Intervals
              </button>
            </div>

            <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Interval Template</h3>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Template Name</label>
                <input
                  type="text"
                  value={newPresetName}
                  onChange={(e) => setNewPresetName(e.target.value)}
                  placeholder="e.g., Custom Equipment"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description (Optional)</label>
                <input
                  type="text"
                  value={newPresetDescription}
                  onChange={(e) => setNewPresetDescription(e.target.value)}
                  placeholder="e.g., Custom maintenance schedule"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Service Intervals (hours)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={intervalInput}
                    onChange={(e) => setIntervalInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && intervalInput) {
                        e.preventDefault();
                        const values = intervalInput
                          .split(',')
                          .map(v => parseInt(v.trim()))
                          .filter(v => !isNaN(v) && v > 0);

                        const uniqueValues = [...new Set([...newPresetIntervals, ...values])].sort((a, b) => a - b);
                        setNewPresetIntervals(uniqueValues);
                        setIntervalInput('');
                      }
                    }}
                    placeholder="Enter hours (comma separated, e.g., 50, 100, 250)"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={() => {
                      if (intervalInput) {
                        const values = intervalInput
                          .split(',')
                          .map(v => parseInt(v.trim()))
                          .filter(v => !isNaN(v) && v > 0);

                        const uniqueValues = [...new Set([...newPresetIntervals, ...values])].sort((a, b) => a - b);
                        setNewPresetIntervals(uniqueValues);
                        setIntervalInput('');
                      }
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Add
                  </button>
                </div>
                {newPresetIntervals.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {newPresetIntervals.map((interval) => (
                      <span
                        key={interval}
                        className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                      >
                        {interval}h
                        <button
                          onClick={() => setNewPresetIntervals(newPresetIntervals.filter((i) => i !== interval))}
                          className="hover:text-blue-900"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={async () => {
                if (!newPresetName || newPresetIntervals.length === 0) return;

                const { data, error } = await supabase
                  .from('interval_presets')
                  .insert({
                    name: newPresetName,
                    description: newPresetDescription || null,
                    intervals: newPresetIntervals,
                  })
                  .select()
                  .single();

                if (error) {
                  console.error('Error creating interval preset:', error);
                  return;
                }

                await loadPresets();
                setSelectedPresetId(data.id);
                setIsCreatingIntervalPreset(false);
                setNewPresetName('');
                setNewPresetDescription('');
                setNewPresetIntervals([]);
                setIntervalInput('');
              }}
              disabled={!newPresetName || newPresetIntervals.length === 0}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            >
              Create Interval Template
            </button>
          </div>
        )}

        {creationStep === 'tasks' && (
          <div className="bg-white rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Assign Tasks to Intervals</h3>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Task Categories</label>
              <p className="text-sm text-gray-500 mb-3">Choose one or more categories to show tasks from. Click to toggle selection.</p>
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => {
                  const isSelected = selectedCategoryIds.includes(category.id);
                  return (
                    <button
                      key={category.id}
                      onClick={() => {
                        if (isSelected) {
                          setSelectedCategoryIds(selectedCategoryIds.filter(id => id !== category.id));
                          const tasksInCategory = tasks.filter(t => t.category_id === category.id);
                          const newSelectedTaskIds = new Set(selectedTaskIds);
                          tasksInCategory.forEach(t => newSelectedTaskIds.delete(t.id));
                          setSelectedTaskIds(newSelectedTaskIds);
                        } else {
                          setSelectedCategoryIds([...selectedCategoryIds, category.id]);
                          const tasksInCategory = tasks.filter(t => t.category_id === category.id);
                          const newSelectedTaskIds = new Set(selectedTaskIds);
                          tasksInCategory.forEach(t => newSelectedTaskIds.add(t.id));
                          setSelectedTaskIds(newSelectedTaskIds);
                        }
                      }}
                      className={`px-4 py-2 rounded-lg transition-colors ${
                        isSelected
                          ? 'text-white ring-2 ring-offset-2'
                          : 'hover:opacity-80'
                      }`}
                      style={{
                        backgroundColor: isSelected ? category.color : `${category.color}33`,
                        color: isSelected ? 'white' : category.color,
                        ringColor: isSelected ? category.color : 'transparent',
                      }}
                    >
                      {category.name}
                    </button>
                  );
                })}
                <button
                  onClick={() => {
                    const isSelected = selectedCategoryIds.includes('uncategorized');
                    if (isSelected) {
                      setSelectedCategoryIds(selectedCategoryIds.filter(id => id !== 'uncategorized'));
                      const uncategorizedTasks = tasks.filter(t => !t.category_id);
                      const newSelectedTaskIds = new Set(selectedTaskIds);
                      uncategorizedTasks.forEach(t => newSelectedTaskIds.delete(t.id));
                      setSelectedTaskIds(newSelectedTaskIds);
                    } else {
                      setSelectedCategoryIds([...selectedCategoryIds, 'uncategorized']);
                      const uncategorizedTasks = tasks.filter(t => !t.category_id);
                      const newSelectedTaskIds = new Set(selectedTaskIds);
                      uncategorizedTasks.forEach(t => newSelectedTaskIds.add(t.id));
                      setSelectedTaskIds(newSelectedTaskIds);
                    }
                  }}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    selectedCategoryIds.includes('uncategorized')
                      ? 'bg-gray-400 text-white ring-2 ring-gray-400 ring-offset-2'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Uncategorized
                </button>
                {selectedCategoryIds.length > 0 && (
                  <button
                    onClick={() => setSelectedCategoryIds([])}
                    className="px-4 py-2 rounded-lg bg-gray-700 text-white hover:bg-gray-800"
                  >
                    Clear Selection (Show All)
                  </button>
                )}
              </div>
            </div>

            <div className="overflow-x-auto mb-6">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-center px-4 py-3 text-sm font-medium text-gray-700 w-12">
                      <input
                        type="checkbox"
                        checked={getFilteredTasks().length > 0 && getFilteredTasks().every(t => selectedTaskIds.has(t.id))}
                        onChange={(e) => {
                          const newSelectedTaskIds = new Set(selectedTaskIds);
                          if (e.target.checked) {
                            getFilteredTasks().forEach(t => newSelectedTaskIds.add(t.id));
                          } else {
                            getFilteredTasks().forEach(t => newSelectedTaskIds.delete(t.id));
                          }
                          setSelectedTaskIds(newSelectedTaskIds);
                        }}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                    </th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Task</th>
                    {getSelectedPresetIntervals().map((interval) => (
                      <th key={interval} className="text-center px-4 py-3 text-sm font-medium text-gray-700">
                        {interval}h
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {getFilteredTasks().map((task) => {
                    const isTaskSelected = selectedTaskIds.has(task.id);
                    return (
                      <tr key={task.id} className={`border-b border-gray-100 hover:bg-gray-50 ${!isTaskSelected ? 'opacity-40' : ''}`}>
                        <td className="text-center px-4 py-3">
                          <input
                            type="checkbox"
                            checked={isTaskSelected}
                            onChange={(e) => {
                              const newSelectedTaskIds = new Set(selectedTaskIds);
                              if (e.target.checked) {
                                newSelectedTaskIds.add(task.id);
                              } else {
                                newSelectedTaskIds.delete(task.id);
                              }
                              setSelectedTaskIds(newSelectedTaskIds);
                            }}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div className="font-medium text-gray-900">{task.name}</div>
                          {task.task_categories && (
                            <div
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs mt-1"
                              style={{
                                backgroundColor: `${task.task_categories.color}20`,
                                color: task.task_categories.color,
                              }}
                            >
                              <span
                                className="w-1.5 h-1.5 rounded-full"
                                style={{ backgroundColor: task.task_categories.color }}
                              ></span>
                              {task.task_categories.name}
                            </div>
                          )}
                        </td>
                        {getSelectedPresetIntervals().map((interval) => (
                          <td key={interval} className="text-center px-4 py-3">
                            <input
                              type="checkbox"
                              disabled={!isTaskSelected}
                              checked={taskSelections[task.id]?.includes(interval) || false}
                              onChange={() => handleToggleIntervalInCreation(task.id, interval)}
                              className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 disabled:opacity-30"
                            />
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handlePreviousStep}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Previous
              </button>
              <button
                onClick={handleNextStep}
                disabled={selectedTaskIds.size === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
              >
                Next: Assign Intervals
              </button>
            </div>
          </div>
        )}

        {creationStep === 'assign' && (
          <div className="bg-white rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Assign Tasks to Intervals</h3>
            <p className="text-sm text-gray-500 mb-6">Select which intervals each task should be performed at. Tasks marked as "Auto Apply" will have all intervals pre-selected.</p>

            <div className="overflow-x-auto mb-6">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Task</th>
                    {getSelectedPresetIntervals().map((interval) => (
                      <th key={interval} className="text-center px-4 py-3 text-sm font-medium text-gray-700">
                        {interval}h
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tasks.filter(task => selectedTaskIds.has(task.id)).map((task) => (
                    <tr key={task.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-2">
                          <div className="font-medium text-gray-900">{task.name}</div>
                          {task.auto_apply && (
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">Auto Apply</span>
                          )}
                        </div>
                        {task.task_categories && (
                          <div
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs mt-1"
                            style={{
                              backgroundColor: `${task.task_categories.color}20`,
                              color: task.task_categories.color,
                            }}
                          >
                            <span
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ backgroundColor: task.task_categories.color }}
                            ></span>
                            {task.task_categories.name}
                          </div>
                        )}
                      </td>
                      {getSelectedPresetIntervals().map((interval) => (
                        <td key={interval} className="text-center px-4 py-3">
                          <input
                            type="checkbox"
                            checked={taskSelections[task.id]?.includes(interval) || false}
                            onChange={() => handleToggleIntervalInCreation(task.id, interval)}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handlePreviousStep}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Previous
              </button>
              <button
                onClick={handleSaveTemplate}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Create Template
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-4 gap-6">
      <div className="col-span-1">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Templates</h3>
          <button
            onClick={handleStartNewTemplate}
            className="flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg font-medium"
          >
            <Plus className="w-4 h-4" />
            New
          </button>
        </div>

        <div className="space-y-2">
          {templates.map((template) => (
            <button
              key={template.id}
              onClick={() => setSelectedTemplate(template)}
              className={`w-full text-left p-3 rounded-lg border transition-colors ${
                selectedTemplate?.id === template.id
                  ? 'bg-blue-50 border-blue-200'
                  : 'bg-white border-gray-200 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">{template.name}</div>
                  {template.description && (
                    <div className="text-xs text-gray-500 mt-1">{template.description}</div>
                  )}
                </div>
                <ChevronRight className={`w-4 h-4 text-gray-400 ${
                  selectedTemplate?.id === template.id ? 'text-blue-600' : ''
                }`} />
              </div>
              <div className="flex items-center gap-2 mt-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteTemplate(template.id);
                  }}
                  className="p-1 text-red-600 hover:bg-red-50 rounded"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="col-span-3">
        {selectedTemplate ? (
          <div>
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{selectedTemplate.name}</h2>
                <p className="text-gray-600 mt-1">{selectedTemplate.description || 'Service template'}</p>
              </div>
              {!isEditingTemplate && (
                <button
                  onClick={() => setIsEditingTemplate(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Pencil className="w-4 h-4" />
                  Edit Template
                </button>
              )}
              {isEditingTemplate && (
                <button
                  onClick={() => {
                    setIsEditingTemplate(false);
                    setSelectedCategoryIds([]);
                  }}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  Done Editing
                </button>
              )}
            </div>

            {selectedTemplate.interval_presets && (
              <div className="bg-white rounded-lg p-6">
                {isEditingTemplate && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Category</label>
                    <p className="text-sm text-gray-500 mb-3">Choose one or more categories to show tasks from. Click to toggle selection.</p>
                    <div className="flex flex-wrap gap-2">
                      {categories.map((category) => {
                        const isSelected = selectedCategoryIds.includes(category.id);
                        return (
                          <button
                            key={category.id}
                            onClick={() => {
                              if (isSelected) {
                                setSelectedCategoryIds(selectedCategoryIds.filter(id => id !== category.id));
                              } else {
                                setSelectedCategoryIds([...selectedCategoryIds, category.id]);
                              }
                            }}
                            className={`px-4 py-2 rounded-lg transition-colors ${
                              isSelected
                                ? 'text-white ring-2 ring-offset-2'
                                : 'hover:opacity-80'
                            }`}
                            style={{
                              backgroundColor: isSelected ? category.color : `${category.color}33`,
                              color: isSelected ? 'white' : category.color,
                              ringColor: isSelected ? category.color : 'transparent',
                            }}
                          >
                            {category.name}
                          </button>
                        );
                      })}
                      <button
                        onClick={() => {
                          const isSelected = selectedCategoryIds.includes('uncategorized');
                          if (isSelected) {
                            setSelectedCategoryIds(selectedCategoryIds.filter(id => id !== 'uncategorized'));
                          } else {
                            setSelectedCategoryIds([...selectedCategoryIds, 'uncategorized']);
                          }
                        }}
                        className={`px-4 py-2 rounded-lg transition-colors ${
                          selectedCategoryIds.includes('uncategorized')
                            ? 'bg-gray-400 text-white ring-2 ring-gray-400 ring-offset-2'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        Uncategorized
                      </button>
                      {selectedCategoryIds.length > 0 && (
                        <button
                          onClick={() => setSelectedCategoryIds([])}
                          className="px-4 py-2 rounded-lg bg-gray-700 text-white hover:bg-gray-800"
                        >
                          Clear Selection (Show All)
                        </button>
                      )}
                    </div>
                  </div>
                )}

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        {isEditingTemplate && (
                          <th className="text-center px-4 py-3 text-sm font-medium text-gray-700 w-12"></th>
                        )}
                        <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Task</th>
                        {getAvailableIntervals().map((interval) => (
                          <th key={interval} className="text-center px-4 py-3 text-sm font-medium text-gray-700">
                            {interval}h
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(isEditingTemplate ? getFilteredTemplateTasks() : templateTasks)
                        .sort((a, b) => {
                          const nameA = a.service_tasks?.name || '';
                          const nameB = b.service_tasks?.name || '';
                          return nameA.localeCompare(nameB);
                        })
                        .map((templateTask) => (
                        <tr key={templateTask.id} className="border-b border-gray-100 hover:bg-gray-50">
                          {isEditingTemplate && (
                            <td className="text-center px-4 py-3">
                              <input
                                type="checkbox"
                                checked={true}
                                onChange={async () => {
                                  const { error } = await supabase
                                    .from('template_tasks')
                                    .delete()
                                    .eq('id', templateTask.id);

                                  if (error) {
                                    console.error('Error removing task:', error);
                                    return;
                                  }

                                  loadTemplateTasks(selectedTemplate.id);
                                }}
                                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                              />
                            </td>
                          )}
                          <td className="px-4 py-3 text-sm">
                            <div className="font-medium text-gray-900">{templateTask.service_tasks?.name}</div>
                          </td>
                          {getAvailableIntervals().map((interval) => (
                            <td key={interval} className="text-center px-4 py-3">
                              <input
                                type="checkbox"
                                checked={templateTask.intervals.includes(interval)}
                                onChange={() => isEditingTemplate && handleToggleInterval(templateTask, interval)}
                                disabled={!isEditingTemplate}
                                className={`w-4 h-4 text-blue-600 rounded ${
                                  isEditingTemplate ? 'focus:ring-2 focus:ring-blue-500 cursor-pointer' : 'cursor-default'
                                }`}
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {isEditingTemplate && getTasksNotInTemplate().length > 0 && (
                  <div className="mt-6">
                    <h4 className="font-medium text-gray-900 mb-3">Add Tasks</h4>
                    <div className="space-y-1">
                      {getTasksNotInTemplate()
                        .sort((a, b) => a.name.localeCompare(b.name))
                        .map((task) => (
                        <button
                          key={task.id}
                          onClick={() => handleAddTaskToTemplate(task.id)}
                          className="w-full text-left px-4 py-2 bg-gray-50 text-gray-700 text-sm rounded-lg hover:bg-gray-100 flex items-center gap-2"
                        >
                          <Plus className="w-4 h-4 text-gray-500" />
                          {task.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-64 text-gray-500">
            Select a template to configure
          </div>
        )}
      </div>
    </div>
  );
}
