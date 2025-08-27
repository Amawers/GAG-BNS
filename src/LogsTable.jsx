import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

export default function LogsTable() {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(1000); // fetch more to group

      if (error) return;

      // Group logs by transaction reference: timestamp + account + action + user
      const grouped = {};
      data.forEach(log => {
        const key = `${log.timestamp}|${log.account}|${log.action}|${log.transact_by}`;
        if (!grouped[key]) grouped[key] = { ...log, products: [], totalSales: 0 };
        if (log.product) grouped[key].products.push(log.product); // safe push
        grouped[key].totalSales += Number(log.sales) || 0;
      });

      setRows(Object.values(grouped));
    }

    load();
  }, []);

  const formatPeso = (val) => val != null ? `₱${Number(val).toLocaleString()}` : '—';

  return (
    <div>
      <h5 className="mb-3">Logs</h5>

      <div className="card shadow-sm">
        <div className="card-body p-0" style={{ maxHeight: '400px', overflowY: 'auto' }}>
          <table className="table table-striped table-hover mb-0">
            <thead className="table-light">
              <tr>
                <th>When</th>
                <th>Account</th>
                <th>Product(s)</th>
                <th>Action</th>
                <th>Sales</th>
                <th>By</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  <td>{r.timestamp ? new Date(r.timestamp).toLocaleString() : '—'}</td>
                  <td>{r.account || '—'}</td>
                  <td>{Array.isArray(r.products) && r.products.length ? r.products.join(', ') : '—'}</td>
                  <td>{r.action || '—'}</td>
                  <td>{formatPeso(r.totalSales)}</td>
                  <td>{r.transact_by || '—'}</td>
                </tr>
              ))}

              {rows.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center text-muted p-3">
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
