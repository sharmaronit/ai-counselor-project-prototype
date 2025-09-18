import Notifications from '../components/Notifications';
import GlassCard from '../components/GlassCard';
import './PageStyles.css';

export default function NewsPage() {
  return (
    <div className="page-container">
      <h1>Opportunities & News</h1>
      <p>Stay updated with the latest news on scholarships, career development, and industry trends.</p>
      <div className="page-card-container">
        <GlassCard>
          <Notifications />
        </GlassCard>
      </div>
    </div>
  );
}