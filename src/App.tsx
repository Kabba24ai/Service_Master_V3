import { useState } from 'react';
import { Wrench, ClipboardList } from 'lucide-react';
import ServiceMaster from './components/ServiceMaster';
import EquipmentView from './components/EquipmentView';

function App() {
  const [activeTab, setActiveTab] = useState<'service-master' | 'equipment-view'>('service-master');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex">
            <button
              onClick={() => setActiveTab('service-master')}
              className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-colors ${
                activeTab === 'service-master'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Wrench className="w-5 h-5" />
              <span className="font-medium">Service Master</span>
            </button>
            <button
              onClick={() => setActiveTab('equipment-view')}
              className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-colors ${
                activeTab === 'equipment-view'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <ClipboardList className="w-5 h-5" />
              <span className="font-medium">Equipment View</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {activeTab === 'service-master' ? <ServiceMaster /> : <EquipmentView />}
      </div>
    </div>
  );
}

export default App;
