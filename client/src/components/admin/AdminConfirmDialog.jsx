import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

const AdminConfirmDialog = ({ isOpen, title = 'Confirm Action', message, onConfirm, onCancel, confirmText = 'Confirm', cancelText = 'Cancel', danger = false }) => {
  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '1.75rem', width: '90%', maxWidth: '450px', boxShadow: '0 10px 25px rgba(0,0,0,0.15)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#1b4332', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertTriangle size={20} color={danger ? '#e63946' : '#f59e0b'} /> {title}
          </h3>
          <button onClick={onCancel} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#5c6e63' }}>
            <X size={20} />
          </button>
        </div>

        <p style={{ color: '#5c6e63', fontSize: '0.95rem', marginBottom: '1.5rem', lineHeight: 1.4 }}>
          {message}
        </p>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button onClick={onCancel} style={{ padding: '0.5rem 1.25rem', borderRadius: '8px', border: '1px solid #c8d6ce', backgroundColor: '#fff', cursor: 'pointer', fontWeight: 600 }}>
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: '0.5rem 1.25rem',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: danger ? '#e63946' : '#1b4332',
              color: '#ffffff',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminConfirmDialog;
