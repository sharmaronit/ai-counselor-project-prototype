import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import './Notifications.css';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch the 10 most recent notifications
        const { data, error: fetchError } = await supabase
          .from('notifications')
          .select('id, title, content, source_url, category')
          .order('created_at', { ascending: false })
          .limit(10);

        if (fetchError) throw fetchError;
        
        setNotifications(data);
      } catch (err) {
        setError("Could not fetch notifications.");
        console.error("Error fetching notifications:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  return (
    <div className="notifications-container">
      <h3 className="widget-title">Opportunities & News</h3>
      <div className="notifications-list">
        {loading && <p>Loading notifications...</p>}
        {error && <p className="error-message">{error}</p>}
        {!loading && notifications.length === 0 && (
          <p className="empty-message">No new notifications at the moment.</p>
        )}
        {!loading && notifications.map((note) => (
          <a href={note.source_url} target="_blank" rel="noopener noreferrer" key={note.id} className="notification-item">
            <span className="notification-category">{note.category}</span>
            <h4 className="notification-title">{note.title}</h4>
            <p className="notification-content">{note.content}</p>
          </a>
        ))}
      </div>
    </div>
  );
}