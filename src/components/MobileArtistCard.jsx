import React from 'react';
import { Button } from 'react-bootstrap';
import { Trash, EnvelopeAt } from 'react-bootstrap-icons';

function MobileArtistCard({ artist, onDelete }) {
  return (
    <div className="mobile-artist-card">
      <div className="mobile-artist-content">
        <div className="mobile-artist-primary">
          <div className="mobile-artist-name">{artist.name}</div>
          <div className="mobile-artist-role">{artist.role}</div>
        </div>
        <div className="mobile-artist-email">
          <EnvelopeAt size={14} className="email-icon" />
          <span className="email-text">{artist.email}</span>
        </div>
      </div>
      <div className="mobile-artist-actions">
        <Button
          variant="outline-danger"
          className="mobile-delete-btn"
          onClick={() => onDelete(artist.calendar, artist.email)}
          aria-label="Künstler löschen"
        >
          <Trash size={18} />
        </Button>
      </div>
    </div>
  );
}

export default React.memo(MobileArtistCard);
