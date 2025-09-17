import Roadmap from '../components/Roadmap';
import GlassCard from '../components/GlassCard';
import './PageStyles.css';

export default function RoadmapPage({ onNewTextContent }) {
  return (
    <div className="page-card-container roadmap-page-card-container">
      <h1>Roadmap Generator</h1>
      <p>Define your career aspirations and current skill set to receive a personalized, step-by-step guide to success.</p>
      <div className="page-card-container">
        <GlassCard>
          <Roadmap onNewTextContent={onNewTextContent} />
        </GlassCard>
      </div>
    </div>
  );
}