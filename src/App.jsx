// App.jsx
import React, { useState } from 'react';
import InventoryTable from './InventoryTable';
import TransactionForm from './TransactionForm';
import LogsTable from './LogsTable';

export default function App() {
  const [page, setPage] = useState('inventory');

  return (
    <div className="d-flex vh-100" style={{ backgroundColor: '#f8f9fa' }}>
      {/* Sidebar */}
      <div className="d-flex flex-column p-3" style={{ width: '220px', backgroundColor: '#ffffff', borderRight: '1px solid #dee2e6' }}>
        <h5 className="mb-4">GAG Inventory</h5>
        <ul className="nav flex-column gap-2">
          <li className="nav-item">
            <button
              className={`btn ${page === 'inventory' ? 'btn-primary' : 'btn-outline-secondary'} w-100`}
              onClick={() => setPage('inventory')}
            >
              Inventory
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`btn ${page === 'transaction' ? 'btn-primary' : 'btn-outline-secondary'} w-100`}
              onClick={() => setPage('transaction')}
            >
              Transactions
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`btn ${page === 'logs' ? 'btn-primary' : 'btn-outline-secondary'} w-100`}
              onClick={() => setPage('logs')}
            >
              Logs
            </button>
          </li>
        </ul>
      </div>

      {/* Main Content */}
      <div className="flex-grow-1 p-4 overflow-auto">
        {page === 'inventory' && <InventoryTable />}
        {page === 'transaction' && <TransactionForm />}
        {page === 'logs' && <LogsTable />}
      </div>
    </div>
  );
}
