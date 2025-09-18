import React from 'react';
import './GlassCard.css';

// This is a "wrapper" component. The `children` prop is a special
// prop that lets us render whatever we put inside the <GlassCard> tags.
export default function GlassCard({ children }) {
  return (
    <div className="glass-card">
      {/* These divs create the layered glass effect */}
      <div className="glass-overlay"></div>
      <div className="glass-specular"></div>
      
      {/* The `glass-content` div will now hold our actual components (Chatbot, Roadmap, etc.) */}
      <div className="glass-content">
        {children}
      </div>

      {/* The SVG filter for the distortion effect (optional but recommended for the full effect) */}
      <svg width="0" height="0">
        <filter id="glass-distortion">
          <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="3" result="noise"/>
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="10" />
        </filter>
      </svg>
    </div>
  );
}