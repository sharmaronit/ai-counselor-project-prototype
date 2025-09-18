import { Outlet, NavLink, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import './SharedLayout.css';

// This component no longer needs theme props
export default function SharedLayout({ session }) {
  return (
    <div className="app-layout">
      <header className="top-navbar">
        <div className="nav-content">
          <div className="nav-left">
            <Link to="/" className="nav-brand">
              <img src="/images/logo.png" alt="AI Counsellor Logo" className="nav-logo" />
              <span>AI Counsellor</span>
            </Link>
          </div>
          <nav className="nav-center">
            <ul className="nav-links">
              <li><NavLink to="/" end>Chat</NavLink></li>
              <li><NavLink to="/roadmap">Roadmap</NavLink></li>
              <li><NavLink to="/skills">My Skills</NavLink></li>
              <li><NavLink to="/news">News And Scholarships</NavLink></li>
            </ul>
          </nav>
          <div className="nav-right">
            {/* The ThemeToggle component is now removed */}
            <span className="nav-user">{session.user.email.split('@')[0]}</span>
            <button className="signout-button-pill" onClick={() => supabase.auth.signOut()}>
              Sign Out
            </button>
          </div>
        </div>
      </header>
      <main className="content-area">
        <Outlet />
      </main>
    </div>
  );
}