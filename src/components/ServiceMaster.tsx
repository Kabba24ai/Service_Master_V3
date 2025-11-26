import { useState } from 'react';
import { Wrench, FileText, Settings } from 'lucide-react';
import ServiceTasks from './ServiceTasks';
import ServiceTemplates from './ServiceTemplates';
import ServiceSettings from './ServiceSettings';

export default function ServiceMaster() {
  const [activeTab, setActiveTab] = useState<'tasks' | 'templates' | 'settings'>('tasks');

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Service Master</h1>
        <p className="text-gray-600 mt-1">Manage equipment service schedules, templates, and maintenance tracking</p>
      </div>

      <div className="border-b border-gray-200 mb-6">
        <div className="flex gap-6">
          <button
            onClick={() => setActiveTab('tasks')}
            className={`flex items-center gap-2 pb-3 border-b-2 transition-colors ${
              activeTab === 'tasks'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <Wrench className="w-4 h-4" />
            <span className="font-medium">Service Tasks</span>
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className={`flex items-center gap-2 pb-3 border-b-2 transition-colors ${
              activeTab === 'templates'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span className="font-medium">Service Templates</span>
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 pb-3 border-b-2 transition-colors ${
              activeTab === 'settings'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span className="font-medium">Settings</span>
          </button>
        </div>
      </div>

      {activeTab === 'tasks' && <ServiceTasks />}
      {activeTab === 'templates' && <ServiceTemplates />}
      {activeTab === 'settings' && <ServiceSettings />}
    </div>
  );
}
