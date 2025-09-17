import Chatbot from '../components/Chatbot';
import GlassCard from '../components/GlassCard';
import './PageStyles.css'; // A shared stylesheet for pages

export default function HomePage({ onNewTextContent }) {
  return (
  <div className="page-container page-container--center">      <div className="homepage-chatbot-container">
        <GlassCard>
          <Chatbot onNewTextContent={onNewTextContent} />
        </GlassCard>
      </div>
    </div>
  );
}