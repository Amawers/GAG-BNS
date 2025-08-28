import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

export default function LogsTable() {
  const [rows, setRows] = useState([]);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [search, setSearch] = useState('');
  const [selectedDate, setSelectedDate] = useState('');

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(5000); // adjust as needed

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

        grouped[tsKey].products.push({
          product: log.product || '—',
          account: log.account || '—',
          sales: Number(log.sales) || 0
        });

        grouped[tsKey].totalSales += Number(log.sales) || 0;
      });

      setRows(Object.values(grouped));
    }

    load();
  }, []);

  const formatPeso = val => val != null ? `₱${Number(val).toLocaleString()}` : '—';

  // Filter by selected local date (PH timezone)
  const filteredByDate = selectedDate
    ? rows.filter(r => {
        const d = new Date(r.timestamp);
        const logDate = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
        return logDate === selectedDate;
      })
    : rows;

  // Filter by search (product, action, sales, or transact_by)
  const filteredRows = filteredByDate.filter(r => {
    if (!search) return true;
    const s = search.toLowerCase();
    return r.action?.toLowerCase().includes(s) ||
           r.transact_by?.toLowerCase().includes(s) ||
           String(r.totalSales).includes(s) ||
           r.products.some(p => p.product.toLowerCase().includes(s));
  });

  return (
    <div>
      <h5 className="mb-3">Logs</h5>

      <div className="mb-3 d-flex gap-2">
        <input 
          type="date" 
          className="form-control" 
          value={selectedDate} 
          onChange={e => setSelectedDate(e.target.value)} 
        />
        <input 
          type="text" 
          className="form-control" 
          placeholder="Search by product, action, sales, or by..." 
          value={search} 
          onChange={e => setSearch(e.target.value)} 
        />
      </div>

      <div className="card shadow-sm">
        <div className="card-body p-0" style={{ maxHeight: '500px', overflowY: 'auto' }}>
          <table className="table table-striped table-hover mb-0">
            <thead className="table-light">
              <tr>
                <th>When</th>
                <th>Product(s) <span style={{ fontSize: "12px", color: "gray" }}>hover item</span></th>
                <th>Action</th>
                <th>Sales</th>
                <th>By</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.length > 0 ? filteredRows.map((r, i) => (
                <tr key={i}>
                  <td>{r.timestamp ? new Date(r.timestamp).toLocaleString("en-PH") : '—'}</td>
                  <td style={{ position: 'relative' }}>
                    {r.products.length > 0 && (
                      <span
                        style={{
                          cursor: 'pointer',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          display: 'inline-block',
                          backgroundColor: hoveredIndex === i ? '#f0f0f0' : 'transparent',
                          color: hoveredIndex === i ? '#007bff' : 'inherit',
                          fontWeight: hoveredIndex === i ? '600' : 'normal',
                        }}
                        onMouseEnter={() => setHoveredIndex(i)}
                        onMouseLeave={() => setHoveredIndex(null)}
                      >
                        {r.products.map(p => p.product).join(', ')}
                      </span>
                    )}
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
