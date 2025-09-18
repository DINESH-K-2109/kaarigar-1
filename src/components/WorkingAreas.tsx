import React, { useState } from 'react';

interface WorkingArea {
  areaName: string;
  priority: number;
}

interface WorkingAreasProps {
  areas: WorkingArea[];
  onUpdate: (areas: WorkingArea[]) => void;
}

const WorkingAreas: React.FC<WorkingAreasProps> = ({ areas, onUpdate }) => {
  const [newArea, setNewArea] = useState('');

  const handleAddArea = () => {
    if (newArea.trim()) {
      const updatedAreas = [
        ...areas,
        { areaName: newArea.trim(), priority: areas.length }
      ];
      onUpdate(updatedAreas);
      setNewArea('');
    }
  };

  const handleRemoveArea = (index: number) => {
    const updatedAreas = areas.filter((_, i) => i !== index);
    // Update priorities after removal
    const reorderedAreas = updatedAreas.map((area, idx) => ({
      ...area,
      priority: idx
    }));
    onUpdate(reorderedAreas);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddArea();
    }
  };

  return (
    <div className="working-areas">
      <div className="flex gap-2 mb-6">
        <input
          type="text"
          value={newArea}
          onChange={(e) => setNewArea(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Enter area name"
          className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
        />
        <button
          onClick={handleAddArea}
          className="w-auto flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          Add Area
        </button>
      </div>

      {areas.length > 0 ? (
        <ul className="space-y-2">
          {areas.map((area, index) => (
            <li
              key={index}
              className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors duration-200"
            >
              <span className="text-gray-700">{area.areaName}</span>
              <button
                onClick={() => handleRemoveArea(index)}
                className="text-gray-400 hover:text-red-500 transition-colors duration-200"
                title="Remove area"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-500 text-sm text-center py-4">No working areas added yet.</p>
      )}
    </div>
  );
};

export default WorkingAreas; 