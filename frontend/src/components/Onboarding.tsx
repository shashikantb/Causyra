import React, { useState, useEffect } from 'react';
import { AppService, type Application } from '../services/api';

interface OnboardingProps {
  onAppSelect: (app: Application) => void;
  userRole: string;
}

const Onboarding: React.FC<OnboardingProps> = ({ onAppSelect, userRole }) => {
  const [apps, setApps] = useState<Application[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [newAppName, setNewAppName] = useState('');
  const [newAppType, setNewAppType] = useState('Java');

  useEffect(() => {
    fetchApps();
  }, []);

  const fetchApps = async () => {
    try {
      const data = await AppService.getApplications();
      setApps(data);
    } catch (error) {
      console.error('Failed to fetch apps', error);
    }
  };

  const handleCreateApp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAppName) return;
    
    try {
      const newApp = await AppService.createApplication(newAppName, newAppType);
      setApps([...apps, newApp]);
      setShowForm(false);
      setNewAppName('');
      // Don't auto-select, let them see it in list or click it (or we could)
      onAppSelect(newApp); 
    } catch (error) {
      console.error('Failed to create app', error);
    }
  };

  return (
    <div className="onboarding">
      <h2>Select an Application</h2>
      
      {apps.length === 0 && !showForm ? (
        <div className="no-apps">
          <p>No applications found.</p>
          {userRole !== 'READ' && (
            <button onClick={() => setShowForm(true)}>Onboard Application</button>
          )}
        </div>
      ) : (
        <div className="app-list-container">
          <ul className="app-list">
            {apps.map(app => (
              <li key={app.id} onClick={() => onAppSelect(app)}>
                <span className="app-name">{app.name}</span>
                <span className="app-type">{app.type}</span>
                {userRole !== 'READ' && (
                  <button 
                    className="delete-app-btn" 
                    onClick={async (e) => {
                      e.stopPropagation();
                      try {
                        await AppService.deleteApplication(app.id);
                        setApps(apps.filter(a => a.id !== app.id));
                      } catch (error) {
                        console.error('Failed to delete app', error);
                      }
                    }}
                  >
                    Remove
                  </button>
                )}
              </li>
            ))}
          </ul>
          {!showForm && userRole !== 'READ' && (
            <button className="add-app-btn" onClick={() => setShowForm(true)}>
              + Add New App
            </button>
          )}
        </div>
      )}

      {showForm && (
        <div className="app-form">
          <h3>Onboard New Application</h3>
          <form onSubmit={handleCreateApp}>
            <div className="form-group">
              <label>Application Name</label>
              <input 
                type="text" 
                value={newAppName} 
                onChange={(e) => setNewAppName(e.target.value)} 
                placeholder="e.g., Payment Service"
              />
            </div>
            <div className="form-group">
              <label>Tech Stack</label>
              <select value={newAppType} onChange={(e) => setNewAppType(e.target.value)}>
                <option value="Java">Java</option>
                <option value="Node.js">Node.js</option>
                <option value="Python">Python</option>
                <option value="Go">Go</option>
                <option value="Kubernetes">Kubernetes</option>
              </select>
            </div>
            <div className="form-actions">
              <button type="submit">Create & Configure</button>
              <button type="button" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Onboarding;
