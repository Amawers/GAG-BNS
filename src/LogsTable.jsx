import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

export default function LogsTable() {
  const [rows, setRows] = useState([]);
  const [hoveredIndex, setHoveredIndex] = useState(null);

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(1000);

      if (error) return;

      const grouped = {};
      data.forEach(log => {
        if (!log.timestamp) return;
        const tsKey = new Date(log.timestamp).toISOString();

        if (!grouped[tsKey]) grouped[tsKey] = {
          timestamp: log.timestamp,
          action: log.action,
          transact_by: log.transact_by || '—',
          products: [],
          totalSales: 0
        };

        // Only store product and account separately
        grouped[tsKey].products.push({
          product: log.product || '—', // product name only
          account: log.account || '—', // account name only
          sales: Number(log.sales) || 0
        });

        grouped[tsKey].totalSales += Number(log.sales) || 0;
      });

      setRows(Object.values(grouped));
    }

    load();
  }, []);

  const formatPeso = val => val != null ? `₱${Number(val).toLocaleString()}` : '—';

  return (
    <div>
      <h5 className="mb-3">Logs</h5>

      <div className="card shadow-sm">
        <div className="card-body p-0" style={{ maxHeight: '400px', overflowY: 'auto' }}>
          <table className="table table-striped table-hover mb-0">
            <thead className="table-light">
              <tr>
                <th>When</th>
                <th>
                  Product(s) <span style={{ fontSize: "12px", color: "gray" }}>hover item</span>
                </th>
                <th>Action</th>
                <th>Sales</th>
                <th>By</th>
              </tr>
            </thead>
            <tbody>
              {rows.length > 0 ? rows.map((r, i) => (
                <tr key={i}>
                  <td>{r.timestamp ? new Date(r.timestamp).toLocaleString("en-PH") : '—'}</td>
                  <td style={{ position: 'relative' }}>
                    {Array.isArray(r.products) && r.products.length > 0 ? (
                      <span
                        style={{
                          cursor: 'pointer',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          transition: 'all 0.2s ease',
                          display: 'inline-block',
                          backgroundColor: hoveredIndex === i ? '#f0f0f0' : 'transparent',
                          color: hoveredIndex === i ? '#007bff' : 'inherit',
                          fontWeight: hoveredIndex === i ? '600' : 'normal',
                          boxShadow: hoveredIndex === i ? '0 4px 10px rgba(0,0,0,0.1)' : 'none',
                          transform: hoveredIndex === i ? 'translateY(-2px)' : 'none'
                        }}
                        onMouseEnter={() => setHoveredIndex(i)}
                        onMouseLeave={() => setHoveredIndex(null)}
                      >
                        {/* Only product names */}
                        {r.products.map(p => p.product).join(', ')}
                      </span>
                    ) : '—'}
                    {hoveredIndex === i && (
                      <div style={{
                        position: 'absolute',
                        top: '100%',
                        left: '0',
                        zIndex: 10,
                        backgroundColor: '#fff',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        boxShadow: '0 6px 16px rgba(0,0,0,0.15)',
                        marginTop: '6px',
                        minWidth: '200px'
                      }}>
                        {r.products.map((p, idx) => (
                          <div key={idx} style={{ marginBottom: '6px', fontSize: '14px' }}>
                            <strong>{p.product}</strong>
                            <div style={{ color: 'gray', fontSize: '13px' }}>{p.account}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </td>
                  <td>{r.action || '—'}</td>
                  <td>{formatPeso(r.totalSales)}</td>
                  <td>{r.transact_by || '—'}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="5" className="text-center text-muted p-3">No logs found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
