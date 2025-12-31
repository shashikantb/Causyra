import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppService } from '../services/api';
import Card from '../components/common/Card';

const CreateProject: React.FC = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [type, setType] = useState('Java');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    setLoading(true);
    try {
      const newApp = await AppService.createApplication(name, type);
      navigate(`/projects/${newApp.id}`);
    } catch (e) {
      console.error("Failed to create project", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <Card title="Create New Project">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Project Name</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Payment Service"
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: 'var(--border-radius)',
                border: '1px solid var(--border-color)',
                fontSize: '1rem'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Project Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: 'var(--border-radius)',
                border: '1px solid var(--border-color)',
                fontSize: '1rem',
                backgroundColor: 'white'
              }}
            >
              <option value="Java">Java</option>
              <option value="Python">Python</option>
              <option value="NodeJS">NodeJS</option>
              <option value="Go">Go</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button 
              type="button" 
              onClick={() => navigate('/dashboard')}
              style={{
                padding: '0.75rem 1.5rem',
                borderRadius: 'var(--border-radius)',
                border: '1px solid var(--border-color)',
                background: 'white',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading}
              style={{
                padding: '0.75rem 1.5rem',
                borderRadius: 'var(--border-radius)',
                border: 'none',
                background: 'var(--primary)',
                color: 'white',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default CreateProject;
