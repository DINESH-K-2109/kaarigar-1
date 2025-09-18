import { useState } from 'react';
import WorkingAreas from './WorkingAreas';

interface WorkingArea {
  areaName: string;
  priority: number;
}

interface User {
  name: string;
  email: string;
  phone: string;
  city: string;
  role: string;
  workingAreas?: WorkingArea[];
}

interface Props {
  user: User;
}

const TradesmanProfile: React.FC<Props> = ({ user }) => {
  const [workingAreas, setWorkingAreas] = useState(user.workingAreas || []);

  const handleUpdateAreas = async (newAreas: WorkingArea[]) => {
    try {
      // Update in database
      const response = await fetch('/api/user/update-areas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ areas: newAreas }),
      });

      if (response.ok) {
        setWorkingAreas(newAreas);
      }
    } catch (error) {
      console.error('Failed to update areas:', error);
    }
  };

  return (
    <div className="tradesman-profile">
      {/* ... existing profile content ... */}
      
      {user.role === 'tradesman' && (
        <WorkingAreas
          areas={workingAreas}
          onUpdate={handleUpdateAreas}
        />
      )}
    </div>
  );
};

export default TradesmanProfile; 