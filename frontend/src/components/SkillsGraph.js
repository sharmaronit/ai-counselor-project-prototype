import { useState } from 'react';
import './SkillsGraph.css';
import { Bar } from 'react-chartjs-2';
import { Chart, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

Chart.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function SkillsGraph({ skills, onAddSkill, loading, title }) {
  const [skillName, setSkillName] = useState('');
  const [proficiency, setProficiency] = useState(5);

  // --- THIS IS THE MISSING FUNCTION THAT CAUSED THE ERROR ---
  const handleManualAdd = (e) => {
    e.preventDefault();
    if (!skillName.trim() || !onAddSkill) return;
    // Call the function passed down from the parent (App.js)
    onAddSkill(skillName, proficiency);
    setSkillName('');
    setProficiency(5);
  };
  // -----------------------------------------------------------

  const chartData = {
    labels: skills.map(skill => skill.name),
    datasets: [
      {
        label: 'Skill Proficiency (out of 10)',
        data: skills.map(skill => skill.proficiency),
        backgroundColor: 'rgba(138, 43, 226, 0.6)',
        borderColor: 'rgba(138, 43, 226, 1)',
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    indexAxis: 'y',
    scales: { x: { beginAtZero: true, max: 10 } },
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
  };

  return (
    <div className="skills-container">
      <h3 className="widget-title">{title || 'My Skills'}</h3>
      <div className="chart-area">
        {loading && <p>Loading skills...</p>}
        {!loading && skills.length > 0 && <Bar options={chartOptions} data={chartData} />}
        {!loading && skills.length === 0 && <p className="empty-message">Add your first skill below!</p>}
      </div>
      
      {/* --- THIS IS THE UPDATED FORM STRUCTURE --- */}
      <form onSubmit={handleManualAdd} className="add-skill-form">
        <input
          type="text"
          placeholder="Skill name (e.g., React)"
          className="skill-input"
          value={skillName}
          onChange={(e) => setSkillName(e.target.value)}
        />
        
        {/* New container for the slider and its scale */}
        <div className="slider-container">
          <input
            type="range"
            min="0"
            max="10"
            className="skill-slider"
            value={proficiency}
            onChange={(e) => setProficiency(parseInt(e.target.value, 10))}
          />
          {/* This div will hold the numbers 0-10 */}
          <div className="slider-scale">
            {[...Array(11).keys()].map(i => <span key={i}>{i}</span>)}
          </div>
        </div>

        <button type="submit" className="add-skill-button">Add</button>
      </form>
    </div>
  );
}