import React from 'react';

const AdminTable = ({ columns = [], data = [], loading = false, emptyMessage = 'No records found' }) => {
  if (loading) {
    return (
      <div
        style={{
          padding: '3.5rem',
          textAlign: 'center',
          color: '#647369',
          backgroundColor: '#fff',
          borderRadius: '16px',
          border: '1px solid #eae5dc',
          fontWeight: 500,
        }}
      >
        Loading data...
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div
        style={{
          padding: '3.5rem',
          textAlign: 'center',
          color: '#647369',
          backgroundColor: '#fff',
          borderRadius: '16px',
          border: '1px solid #eae5dc',
          fontWeight: 500,
        }}
      >
        {emptyMessage}
      </div>
    );
  }

  return (
    <div
      style={{
        backgroundColor: '#fff',
        borderRadius: '16px',
        border: '1px solid #eae5dc',
        overflowX: 'auto',
        boxShadow: '0 2px 10px rgba(21, 50, 34, 0.03)',
      }}
      className="admin-table-container"
    >
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }} className="admin-table">
        <thead>
          <tr style={{ backgroundColor: '#faf7f2', borderBottom: '1.5px solid #eae5dc', color: '#153222' }}>
            {columns.map((col, idx) => (
              <th
                key={idx}
                style={{
                  padding: '1rem 1.15rem',
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                  fontSize: '0.8rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.6px',
                  color: '#153222',
                }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rIdx) => (
            <tr
              key={row._id || rIdx}
              style={{
                borderBottom: rIdx === data.length - 1 ? 'none' : '1px solid #f0ece3',
                transition: 'background-color 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#fbf9f5')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}
            >
              {columns.map((col, cIdx) => (
                <td
                  key={cIdx}
                  style={{
                    padding: '0.95rem 1.15rem',
                    color: '#2a3b30',
                    verticalAlign: 'middle',
                  }}
                >
                  {col.render ? col.render(row) : row[col.accessor]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminTable;
