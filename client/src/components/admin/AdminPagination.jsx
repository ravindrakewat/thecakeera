import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const AdminPagination = ({ page = 1, totalPages = 1, onPageChange, total = 0 }) => {
  if (totalPages <= 1) return null;

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
      <span style={{ fontSize: '0.85rem', color: '#647369' }}>
        Showing page <strong style={{ color: '#153222' }}>{page}</strong> of <strong style={{ color: '#153222' }}>{totalPages}</strong> ({total} total records)
      </span>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <button
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          style={{
            padding: '0.45rem 0.85rem',
            borderRadius: '10px',
            border: '1.5px solid #ded7cb',
            backgroundColor: page <= 1 ? '#f5f2eb' : '#ffffff',
            color: page <= 1 ? '#a8b3aa' : '#153222',
            cursor: page <= 1 ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.3rem',
            fontSize: '0.85rem',
            fontWeight: 600,
            transition: 'all 0.15s ease',
          }}
        >
          <ChevronLeft size={16} /> Previous
        </button>

        <button
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          style={{
            padding: '0.45rem 0.85rem',
            borderRadius: '10px',
            border: '1.5px solid #ded7cb',
            backgroundColor: page >= totalPages ? '#f5f2eb' : '#ffffff',
            color: page >= totalPages ? '#a8b3aa' : '#153222',
            cursor: page >= totalPages ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.3rem',
            fontSize: '0.85rem',
            fontWeight: 600,
            transition: 'all 0.15s ease',
          }}
        >
          Next <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default AdminPagination;
