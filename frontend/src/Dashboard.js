import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import './Dashboard.css'; // Correct: Imports its own CSS
import Chatbot from './components/Chatbot';
import Roadmap from './components/Roadmap';
import SkillsGraph from './components/SkillsGraph';
import Notifications from './components/Notifications';

export default function Dashboard({ session }) {
  const [userSkills, setUserSkills] = useState([]);
  const [loadingSkills, setLoadingSkills] = useState(true);

  useEffect(() => {
    const fetchUserSkills = async () => {
      setLoadingSkills(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("User not found.");

        const { data, error } = await supabase
          .from('user_skills')
          .select(`proficiency, skills ( name )`)
          .eq('user_id', user.id);

        if (error) throw error;
        if (data) {
          const formattedSkills = data.map(us => ({ name: us.skills.name, proficiency: us.proficiency }));
          setUserSkills(formattedSkills.sort((a, b) => a.name.localeCompare(b.name)));
        }
      } catch (err) {
        console.error("Error fetching user skills:", err);
      } finally {
        setLoadingSkills(false);
      }
    };
    fetchUserSkills();
  }, []);

  const addSkill = async (skillName, proficiency = 1) => {
    const trimmedSkillName = skillName.trim();
    if (userSkills.some(s => s.name.toLowerCase() === trimmedSkillName.toLowerCase())) {
      console.log(`Skill "${trimmedSkillName}" already exists.`);
      return;
    }
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not found.");

      let { data: existingSkill } = await supabase.from('skills').select('id').ilike('name', trimmedSkillName).single();

      if (!existingSkill) {
        const { data: newSkill, error } = await supabase.from('skills').insert({ name: trimmedSkillName }).select('id').single();
        if (error) throw error;
        existingSkill = newSkill;
      }
      
      const { error } = await supabase.from('user_skills').insert({ user_id: user.id, skill_id: existingSkill.id, proficiency: proficiency });
      if (error) throw error;

      const newSkillList = [...userSkills, { name: trimmedSkillName, proficiency }];
      setUserSkills(newSkillList.sort((a, b) => a.name.localeCompare(b.name)));
    } catch (error) {
      console.error(`Failed to add skill "${trimmedSkillName}":`, error);
    }
  };

  const handleNewTextContent = async (text) => {
    try {
      const { data, error } = await supabase.functions.invoke('extract-skills', {
        body: { content: text },
      });
      if (error) throw error;

      if (data.skills && data.skills.length > 0) {
        console.log("Extracted Skills:", data.skills);
        await Promise.all(data.skills.map(skillName => addSkill(skillName)));
      }
    } catch (error) {
      console.error("Could not extract skills:", error);
    }
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Welcome, {session.user.email.split('@')[0]}</h1>
        <button className="signout-button" onClick={() => supabase.auth.signOut()}>
          Sign Out
        </button>
      </header>
      <main className="dashboard-grid">
        <div className="chatbot-widget glass-card">
          <Chatbot onNewTextContent={handleNewTextContent} />
        </div>
        <div className="roadmap-widget glass-card">
          <Roadmap onNewTextContent={handleNewTextContent} />
        </div>
        <div className="skills-widget glass-card">
          <SkillsGraph skills={userSkills} onAddSkill={addSkill} loading={loadingSkills} />
        </div>
        <div className="notifications-widget glass-card">
          <Notifications />
        </div>
      </main>
    </div>
  );
}