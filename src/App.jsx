// App.jsx
import React, { useState } from 'react';
import InventoryTable from './InventoryTable';
import TransactionForm from './TransactionForm';
import LogsTable from './LogsTable';

export default function App() {
  const [page, setPage] = useState('inventory');

  return (
    <div className="d-flex flex-column vh-100" style={{ backgroundColor: '#f8f9fa' }}>
      {/* Desktop Layout */}
      <div className="d-none d-md-flex flex-grow-1">
        {/* Sidebar */}
        <div
          className="d-flex flex-column p-3"
          style={{ width: '220px', backgroundColor: '#fff', borderRight: '1px solid #dee2e6' }}
        >
          <h5 className="mb-4">GAG Inventory</h5>
          <ul className="nav flex-column gap-2">
            {['inventory', 'transaction', 'logs'].map((p) => (
              <li className="nav-item" key={p}>
                <button
                  className={`btn ${page === p ? 'btn-primary' : 'btn-outline-secondary'} w-100`}
                  onClick={() => setPage(p)}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Main Content */}
        <div className="flex-grow-1 p-4 overflow-auto">
          {page === 'inventory' && <InventoryTable />}
          {page === 'transaction' && <TransactionForm />}
          {page === 'logs' && <LogsTable />}
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="d-flex d-md-none flex-column flex-grow-1">
        {/* Main Content */}
        <div className="flex-grow-1 p-4 overflow-auto">
          {page === 'inventory' && <InventoryTable />}
          {page === 'transaction' && <TransactionForm />}
          {page === 'logs' && <LogsTable />}
        </div>

        {/* Bottom Nav */}
        <nav
          className="d-flex justify-content-around p-2 border-top"
          style={{ backgroundColor: '#fff', borderTop: '1px solid #dee2e6' }}
        >
          {['inventory', 'transaction', 'logs'].map((p) => (
            <button
              key={p}
              className={`btn ${page === p ? 'btn-primary' : 'btn-outline-secondary'}`}
              onClick={() => setPage(p)}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
