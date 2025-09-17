import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';

// --- CORRECTED IMPORTS ---
// We need to go up one level (`../`) from the `pages` folder to find the `components` folder.
import SkillsGraph from '../components/SkillsGraph';
import GlassCard from '../components/GlassCard';
import Modal from '../components/Modal';

// This path is also corrected to go up one level.
import './SkillsPage.css';

export default function SkillsPage({ session, userSkills, onAddSkill, loadingSkills }) {
  const [isClearing, setIsClearing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // This function is called when the user confirms the action in the modal
  const confirmClearData = async () => {
    setIsModalOpen(false); // Close the modal first
    setIsClearing(true);
    try {
      const { error } = await supabase.functions.invoke('clear-user-data');
      if (error) throw error;
      alert("Your data has been cleared successfully."); // We can keep this simple alert for success
      window.location.reload(); // Reload the page to reflect the cleared data
    } catch (error) {
      alert(`Failed to clear data: ${error.message}`);
    } finally {
      setIsClearing(false);
    }
  };

  // This function now only opens the modal
  const handleClearDataClick = () => {
    setIsModalOpen(true);
  };

  return (
    // Use a React Fragment <> to render the page and the modal as siblings
    <>
      <div className="skills-page-container">
        <header className="skills-page-header">
          <Link to="/" className="back-link">&larr; Back to Dashboard</Link>
          <h1>My Skills Profile</h1>
        </header>
        
        <div className="skills-page-content">
          <p>Manage your skills and track your proficiency. Add new skills or update your proficiency for existing ones.</p>
          
          <div className="skills-graph-full-container">
            {/* The GlassCard wrapper was missing here in the previous version */}
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
            <button onClick={handleClearDataClick} className="danger-button" disabled={isClearing}>
              {isClearing ? 'Clearing...' : 'Clear All My Data'}
            </button>
          </div>
        </div>
      </div>

      {/* This renders our custom, styled modal instead of the browser default */}
      <Modal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={confirmClearData}
        title="Confirm Data Deletion"
      >
        <p>Are you absolutely sure you want to clear all your data? This action is permanent and cannot be undone.</p>
      </Modal>
    </>
  );
}