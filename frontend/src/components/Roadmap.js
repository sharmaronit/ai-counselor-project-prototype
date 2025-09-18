import { useState } from 'react';
import './Roadmap.css';
import { supabase } from '../supabaseClient';

// Accept the onNewTextContent prop from the Dashboard
export default function Roadmap({ onNewTextContent }) {
  const [goal, setGoal] = useState('');
  const [skills, setSkills] = useState('');
  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(true);

  const handleGenerateRoadmap = async (e) => {
    e.preventDefault();
    if (!goal.trim()) {
      setError("Please enter a goal.");
      return;
    }

    setLoading(true);
    setError(null);
    setRoadmap(null);
    setShowForm(false);

    const skillsArray = skills.split(',').map(skill => skill.trim()).filter(skill => skill);

    try {
      const { data, error: funcError } = await supabase.functions.invoke('generate-roadmap', {
        body: { goal, skills: skillsArray },
      });

      if (funcError) throw funcError;

      if (data.roadmap) {
        setRoadmap(data.roadmap);
        
        // --- THIS IS THE CORRECTED PART ---
        // Combine the roadmap text and call the prop handler
        if (onNewTextContent) {
          const roadmapText = data.roadmap.map(step => `${step.title}: ${step.description}`).join("\n");
          // Pass the user's input AND the generated text to the handler
          const fullContent = `${goal} ${skills} ${roadmapText}`;
          onNewTextContent(fullContent);
        }
      } else {
        throw new Error("Roadmap data not found in the response.");
      }
    } catch (err) {
      console.error("Error generating roadmap:", err);
      setError("Failed to generate roadmap. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setShowForm(true);
    setRoadmap(null);
    setError(null);
    setGoal('');
    setSkills('');
  };

  return (
    <div className="roadmap-container">
      <div className="roadmap-header">
        <h3 className="widget-title">Roadmap Generator</h3>
        {!showForm && (
          <button onClick={handleReset} className="reset-button">
            Start Over
          </button>
        )}
      </div>

      {showForm ? (
        <form onSubmit={handleGenerateRoadmap} className="roadmap-form">
          <textarea
            className="roadmap-input textarea"
            placeholder="Enter your primary goal (e.g., 'Become a full-stack web developer')"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
          />
          <input
            type="text"
            className="roadmap-input"
            placeholder="List your current skills, separated by commas..."
            value={skills}
            onChange={(e) => setSkills(e.target.value)}
          />
          <button type="submit" className="generate-button" disabled={loading}>
            {loading ? 'Generating...' : 'Generate My Roadmap'}
          </button>
        </form>
      ) : (
        <div className="roadmap-result">
          {error && <p className="error-message">{error}</p>}
          {loading && <div className="loader"></div>}
          
          {roadmap && (
            <ol className="steps-list">
              {roadmap.map((step) => (
                <li key={step.step} className="step-item">
                  <strong>{step.title}</strong>
                  <p>{step.description}</p>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}
    </div>
  );
}