import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { supabase } from './supabaseClient';

// Import all pages and layouts
import Auth from './Auth';
import SkillsPage from './pages/SkillsPage';
import HomePage from './pages/HomePage';
import RoadmapPage from './pages/RoadmapPage';
import NewsPage from './pages/NewsPage';
import SharedLayout from './components/SharedLayout';

// Import styles and assets
import './App.css';
import backgroundImage from './assets/background.jpg';

function App() {
  const [session, setSession] = useState(null);
  const [userSkills, setUserSkills] = useState([]);
  const [loadingSkills, setLoadingSkills] = useState(true);

  // Effect to set the background image
  useEffect(() => {
    document.body.style.backgroundImage = `url(${backgroundImage})`;
    document.body.style.backgroundSize = 'cover';
    document.body.style.backgroundPosition = 'center';
    document.body.style.backgroundAttachment = 'fixed';
    return () => { document.body.style.backgroundImage = ''; };
  }, []);

  // Dot cursor effect
  useEffect(() => {
    // Create dot cursor
    const cursorDot = document.createElement('div');
    cursorDot.className = 'cursor-dot';
    document.body.appendChild(cursorDot);

    // Mouse move handler for dot cursor
    const handleMouseMove = (e) => {
      cursorDot.style.left = e.clientX + 'px';
      cursorDot.style.top = e.clientY + 'px';
    };

    // Add event listener
    document.addEventListener('mousemove', handleMouseMove);

    // Cleanup function
    return () => {
      if (document.body.contains(cursorDot)) {
        document.body.removeChild(cursorDot);
      }
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  // Auth listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    });
    return () => subscription.unsubscribe();
  }, []);
  
  // Effect for fetching user skills from the database
  useEffect(() => {
    // 1. If there's no user session, we're not loading, so stop here.
    if (!session) {
        setLoadingSkills(false);
        return;
    };

    const fetchUserSkills = async () => {
      setLoadingSkills(true); // 2. Set loading to true before we start fetching.
      try {
        // 3. Fetch all skills related to the logged-in user's ID.
        //    This query joins the 'user_skills' and 'skills' tables.
        const { data, error } = await supabase
          .from('user_skills')
          .select(`proficiency, skills(name)`) // Select proficiency and the name from the related skills table
          .eq('user_id', session.user.id);
        
        if (error) throw error; // If there's a database error, stop and log it.

        // 4. If data is successfully returned, format it and update our state.
        if (data) {
          const formattedSkills = data.map(us => ({ 
            name: us.skills.name, 
            proficiency: us.proficiency 
          }));
          // Sort alphabetically and set the state
          setUserSkills(formattedSkills.sort((a, b) => a.name.localeCompare(b.name)));
        }
      } catch (err) {
        console.error("Error fetching skills:", err);
      } finally {
        // 5. CRITICAL: No matter what happens (success or failure), set loading to false.
        setLoadingSkills(false);
      }
    };

    fetchUserSkills();
  }, [session]);

  // Function to add or update a skill
  const addOrUpdateSkill = async (skillName, proficiency) => {
    try {
      // First, check if the skill already exists in the skills table
      let { data: skillData, error: skillError } = await supabase
        .from('skills')
        .select('id')
        .eq('name', skillName)
        .single();

      // If skill doesn't exist, create it
      if (!skillData) {
        const { data, error } = await supabase
          .from('skills')
          .insert({ name: skillName })
          .select()
          .single();
        
        if (error) throw error;
        skillData = data;
      }

      // Now upsert (insert or update) the user_skill entry
      const { error: upsertError } = await supabase
        .from('user_skills')
        .upsert({
          user_id: session.user.id,
          skill_id: skillData.id,
          proficiency: proficiency
        }, { onConflict: 'user_id,skill_id' });

      if (upsertError) throw upsertError;

      // Update local state to reflect the change
      setUserSkills(prevSkills => {
        const existingSkillIndex = prevSkills.findIndex(s => s.name === skillName);
        if (existingSkillIndex !== -1) {
          // Update existing skill
          const updatedSkills = [...prevSkills];
          updatedSkills[existingSkillIndex] = { name: skillName, proficiency };
          return updatedSkills.sort((a, b) => a.name.localeCompare(b.name));
        } else {
          // Add new skill
          return [...prevSkills, { name: skillName, proficiency }]
            .sort((a, b) => a.name.localeCompare(b.name));
        }
      });
    } catch (error) {
      console.error('Error adding/updating skill:', error);
    }
  };

  // Function to handle new text content
  const handleNewTextContent = async (text) => {
    try {
      const { error } = await supabase
        .from('user_content')
        .insert({
          user_id: session.user.id,
          content: text
        });
      
      if (error) throw error;
    } catch (error) {
      console.error('Error saving content:', error);
    }
  };

if (!session) {
    return <Auth />;
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<SharedLayout session={session} />}>
          <Route index element={<HomePage onNewTextContent={handleNewTextContent} />} />
          <Route path="roadmap" element={<RoadmapPage onNewTextContent={handleNewTextContent} />} />
          <Route 
            path="skills" 
            element={<SkillsPage userSkills={userSkills} onAddSkill={addOrUpdateSkill} loadingSkills={loadingSkills} />} 
          />
          <Route path="news" element={<NewsPage />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;