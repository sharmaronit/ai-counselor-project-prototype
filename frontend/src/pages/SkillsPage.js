import { useState } from 'react';
import { Link } from 'react-router-dom';
import SkillsGraph from '../components/SkillsGraph';
import GlassCard from '../components/GlassCard';
import { supabase } from '../supabaseClient';
import './SkillsPage.css';

export default function SkillsPage({ session, userSkills, onAddSkill, loadingSkills }) {
  const [isClearing, setIsClearing] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Handler to show the custom modal
  const handleClearData = async () => {
    setShowModal(true);
  };

  // Handler to confirm and clear data
  const confirmClearData = async () => {
    setShowModal(false);
    setIsClearing(true);
    try {
      const { error } = await supabase.functions.invoke('clear-user-data');
      if (error) throw error;
      
      // Show success message (you can replace this with a toast notification)
      setTimeout(() => {
        alert("Your data has been cleared successfully.");
      }, 100);
      
      window.location.reload();
    } catch (error) {
      setTimeout(() => {
        alert(`Failed to clear data: ${error.message}`);
      }, 100);
    } finally {
      setIsClearing(false);
    }
  };

  // Handler to cancel and close modal
  const cancelClearData = () => {
    setShowModal(false);
  };

  return (
    <div className="skills-page-container">
      <header className="skills-page-header">
        <Link to="/" className="back-link">&larr; Back to Dashboard</Link>
        <h1>My Skills Profile</h1>
      </header>
      
      <div className="skills-page-content">
        <p>Manage your skills and track your proficiency. Add new skills or update your proficiency for existing ones.</p>
        
        <div className="skills-graph-full-container">
            <GlassCard>
                <SkillsGraph 
                    skills={userSkills} 
                    onAddSkill={onAddSkill} 
                    loading={loadingSkills}
                    title="Current Skill Proficiency"
                />
            </GlassCard>
        </div>

        <div className="danger-zone">
          <h3>Reset Profile</h3>
          <p>This will permanently delete all of your saved skills, chat history, and generated roadmaps. Your account login will not be affected.</p>
          <button onClick={handleClearData} className="danger-button" disabled={isClearing}>
            {isClearing ? 'Clearing...' : 'Clear All My Data'}
          </button>
        </div>
      </div>

      {/* Custom Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h2 className="modal-title">Confirm Data Deletion</h2>
            </div>
            <div className="modal-body">
              <p>Are you absolutely sure you want to clear all your data? This action cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button 
                className="modal-button modal-button-primary"
                onClick={confirmClearData}
                disabled={isClearing}
              >
                {isClearing ? 'Clearing...' : 'OK'}
              </button>
              <button 
                className="modal-button modal-button-secondary"
                onClick={cancelClearData}
                disabled={isClearing}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}