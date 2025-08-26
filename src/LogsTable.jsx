import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

export default function LogsTable() {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    // 📌 Fetch latest 200 logs, newest first
    async function load() {
      const { data, error } = await supabase
        .from('logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(200);

      if (!error) setRows(data || []);
    }
    load();
  }, []);

  // 📌 Helper: Format numbers into Peso currency
  const formatPeso = (val) =>
    val != null ? `₱${Number(val).toLocaleString()}` : '—';

  return (
    <div>
      {/* Title */}
      <h5 className="mb-3">Logs</h5>

      <div className="card shadow-sm">
        <div
          className="card-body p-0"
          style={{ maxHeight: '400px', overflowY: 'auto' }}
        >
          {/* 📌 Logs table */}
          <table className="table table-striped table-hover mb-0">
            <thead className="table-light">
              <tr>
                <th>When</th>
                <th>Account</th>
                <th>Product</th>
                <th>Value</th>
                <th>Action</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Old</th>
                <th>New</th>
                <th>Sales</th>
                <th>By</th>
              </tr>
            </thead>
            <tbody>
              {/* 📌 Loop through each log row */}
              {rows.map((r, i) => (
                <tr key={i}>
                  {/* Format timestamp into readable date/time */}
                  <td>{r.timestamp ? new Date(r.timestamp).toLocaleString() : '—'}</td>
                  <td>{r.account || '—'}</td>
                  <td>{r.product || '—'}</td>
                  <td>{r.value || '—'}</td>
                  <td>{r.action || '—'}</td>
                  <td>{r.quantity ?? '—'}</td>
                  <td>{formatPeso(r.price_each)}</td>
                  <td>{r.old_stock ?? '—'}</td>
                  <td>{r.new_stock ?? '—'}</td>
                  <td>{formatPeso(r.sales)}</td>
                  <td>{r.transact_by || '—'}</td>
                </tr>
              ))}

              {/* 📌 Show message if no logs found */}
              {rows.length === 0 && (
                <tr>
                  <td colSpan="11" className="text-center text-muted p-3">
                    No logs found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
