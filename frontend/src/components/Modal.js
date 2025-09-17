import React from 'react';
import './Modal.css';

// This component takes several props:
// `isOpen`: boolean to control visibility
// `onClose`: function to call when the user clicks cancel or the background
// `onConfirm`: function to call when the user clicks the confirm button
// `title`, `children`: the content to display inside the modal
export default function Modal({ isOpen, onClose, onConfirm, title, children }) {
  // If the modal isn't open, render nothing
  if (!isOpen) {
    return null;
  }

  return (
    // The modal-backdrop is the semi-transparent dark background
    <div className="modal-backdrop" onClick={onClose}>
      {/* We stop clicks inside the modal from closing it */}
      <div className="modal-content glass-card" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
        </div>
        <div className="modal-body">
          {children} {/* This is where the confirmation message will go */}
        </div>
        <div className="modal-footer">
          <button onClick={onClose} className="modal-button secondary">
            Cancel
          </button>
          <button onClick={onConfirm} className="modal-button danger">
            Yes, I'm Sure
          </button>
        </div>
      </div>
    </div>
  );
}