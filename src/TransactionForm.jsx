import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

export default function TransactionForm() {
  const [accounts, setAccounts] = useState([]);
  const [products, setProducts] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [form, setForm] = useState({
    account_id: '',
    items: [{ product_id: '', quantity: 1, price_each: 0 }],
    action: 'sell',
    transact_by: 'Ekong'
  });

  // 🔹 Reservation states
  const [reservations, setReservations] = useState([]);
  const [resAccount, setResAccount] = useState('');
  const [resProducts, setResProducts] = useState([]);
  // Reservation state
  const [resForm, setResForm] = useState({
    inventory_id: '',
    client_name: '',
    quantity: 1,
    date_reserved: new Date().toLocaleString("sv-SE", { timeZone: "Asia/Manila" }).slice(0,16),
    date_pickup: ''
  });

  useEffect(() => { fetchAccounts(); fetchReservations(); }, []);

  async function fetchAccounts() {
    const { data } = await supabase.from('inventory').select('id, account, product, price_each, stocks');
    if (!data) return;

    // unique account names
    const uniqueAccounts = [...new Set(data.map(i => i.account))];
    setAccounts(uniqueAccounts.map((name, idx) => ({ id: idx, name })));
    setInventory(data);
  }

  async function fetchProducts(accountName) {
    if (!accountName) return setProducts([]);
    const prods = inventory.filter(i => i.account === accountName);
    setProducts(prods || []);
  }

  // 🔹 For reservation account filtering
  function fetchReservationProducts(accountName) {
    if (!accountName) return setResProducts([]);
    const prods = inventory.filter(i => i.account === accountName);
    setResProducts(prods || []);
  }

  function addItem() {
    setForm(f => ({ ...f, items: [...f.items, { product_id: '', quantity: 1, price_each: 0 }] }));
  }

  function updateItem(index, key, value) {
    const newItems = [...form.items];

    if (key === 'quantity') {
      newItems[index][key] = value === '' ? '' : Number(value);
    } else {
      newItems[index][key] = value;
    }

    if (key === 'product_id') {
      // value is inventory id (string), find inventory item
      const invItem = inventory.find(i => i.id === Number(value));
      newItems[index].price_each = invItem ? Number(invItem.price_each) : 0;
    }

    setForm(f => ({ ...f, items: newItems }));
  }

  function removeItem(index) {
    const newItems = [...form.items];
    newItems.splice(index, 1);
    setForm(f => ({ ...f, items: newItems }));
  }

  async function submit(e) {
    e.preventDefault();
    // validate: each item must have product_id and quantity
    if (!form.items.length || form.items.some(i => !i.product_id || !i.quantity))
      return alert('Fill all fields');

    const payload = form.items.map(i => {
      const invItem = inventory.find(inv => inv.id === Number(i.product_id));
      return {
        account: invItem?.account || null,
        product: invItem?.product || null,
        action: form.action,
        quantity: i.quantity,
        price_each: i.price_each,
        transact_by: form.transact_by
      };
    });

    const { error } = await supabase.from('transactions').insert(payload);
    if (error) return alert(error.message);

    alert('Transaction recorded');
    setForm({
      account_id: '',
      items: [{ product_id: '', quantity: 1, price_each: 0 }],
      action: 'sell',
      transact_by: 'Ekong'
    });
    fetchAccounts();
  }

  // 🔹 Reservation Handlers
  async function fetchReservations() {
    const { data } = await supabase.from('reservations').select('*');
    setReservations(data || []);
  }

  // Make reservation
// Make reservation
async function makeReservation(e) {
  e.preventDefault();

  if (!resForm.inventory_id || !resForm.client_name || !resForm.quantity) {
    return alert('Fill all fields');
  }

  const { error } = await supabase.rpc('reserve_product', {
    p_inventory_id: resForm.inventory_id,
    p_client_name: resForm.client_name,
    p_quantity: resForm.quantity,
    p_date_pickup: resForm.date_pickup || null
  });

  if (error) return alert(error.message);

  alert('Reservation added');

  // Reset reservation form
  setResForm({
    inventory_id: '',
    client_name: '',
    quantity: 1,
    date_reserved: new Date().toLocaleString("sv-SE", { timeZone: "Asia/Manila" }).slice(0,16),
    date_pickup: ''
  });

  fetchReservations();
}


// Confirm reservation
async function confirmReservation(id) {
  const { error } = await supabase.rpc('confirm_reservation', { p_reservation_id: id });
  if (error) return alert(error.message);

  const reservation = reservations.find(r => r.id === id);
  const invItem = inventory.find(i => i.id === reservation.inventory_id);

  const oldStock = invItem?.stocks || 0;
  const newStock = oldStock - reservation.quantity;

  // Optionally, update inventory stock in frontend after confirm
  invItem.stocks = newStock;

  await supabase.from('logs').insert([{
    account: invItem?.account || null,
    product: invItem?.product || null,
    action: 'Confirmed & sold',
    quantity: reservation.quantity,
    price_each: invItem?.price_each || 0,
    old_stock: oldStock,
    new_stock: newStock,
    sales: (reservation.quantity * (invItem?.price_each || 0)),
    transact_by: 'System',
    timestamp: new Date().toISOString()
  }]);

  fetchReservations();
}

// Cancel reservation
async function cancelReservation(id) {
  const { error } = await supabase.rpc('cancel_reservation', { p_reservation_id: id });
  if (error) return alert(error.message);

  const reservation = reservations.find(r => r.id === id);
  const invItem = inventory.find(i => i.id === reservation.inventory_id);

  await supabase.from('logs').insert([{
    account: invItem?.account || null,
    product: invItem?.product || null,
    action: 'Cancelled reservation',
    quantity: reservation.quantity,
    price_each: invItem?.price_each || 0,
    old_stock: invItem?.stocks || 0,
    new_stock: invItem?.stocks || 0,
    sales: 0,
    transact_by: 'System',
    timestamp: new Date().toISOString()
  }]);

  fetchReservations();
}


  // 🔹 Calculate total
  const total = form.items.reduce((sum, i) => {
    const qty = Number(i.quantity) || 0;
    const price = Number(i.price_each) || 0;
    return sum + qty * price;
  }, 0);

  return (
    <div className="card shadow-sm">
      <div className="card-header bg-white border-0"><h5>New Transaction</h5></div>
      <div className="card-body">
        {/* 🔹 Transaction Form */}
        <form onSubmit={submit}>
          {/* NOTE: global Account selector removed — each item has grouped product dropdown */}
          {form.items.map((item, idx) => (
            <div key={idx} className="row g-2 mb-2 align-items-end">
              <div className="col-md">
                <label>Product (Account → Product)</label>
                <select
                  className="form-select"
                  value={item.product_id}
                  onChange={e => updateItem(idx, 'product_id', e.target.value)}
                >
                  <option value="">-- choose --</option>
                  {accounts.map((a) => (
                    <optgroup key={a.name} label={a.name}>
                      {inventory
                        .filter(inv => inv.account === a.name)
                        .map(inv => (
                          <option key={inv.id} value={inv.id}>
                            {inv.product}
                          </option>
                        ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              <div className="col-md">
                <label>Quantity</label>
                <input
                  type="number"
                  className="form-control"
                  min="1"
                  value={item.quantity}
                  onChange={e => updateItem(idx, 'quantity', e.target.value)}
                />
              </div>

              <div className="col-md">
                <label>Cost</label>
                <input
                  type="number"
                  className="form-control"
                  value={(item.quantity * item.price_each).toFixed(2)}
                  disabled
                />
              </div>

              <div className="col-md-auto">
                <button type="button" className="btn btn-danger" onClick={() => removeItem(idx)}>Remove</button>
              </div>
            </div>
          ))}

          <button type="button" className="btn btn-secondary mb-3" onClick={addItem}>Add Product</button>

          <div className="mb-3">
            <label>Transact By</label>
            <select
              className="form-select"
              value={form.transact_by}
              onChange={e => setForm({ ...form, transact_by: e.target.value })}
            >
              <option value="Ekong">Ekong</option>
              <option value="Ann">Ann</option>
            </select>
          </div>

          <div className="mb-3 p-2 bg-light border rounded text-start">
            <strong>Total Cost: ₱{total.toLocaleString()}</strong>
          </div>

          <button type="submit" className="btn btn-primary w-100">Submit</button>
        </form>

        {/* 🔹 Reservation Section */}
        <hr className="my-4" />
        <h5>Reservations</h5>
        <form onSubmit={makeReservation} className="mb-3">
          <div className="row g-2 align-items-end">
            <div className="col-md">
              <label>Account</label>
              <select
                className="form-select"
                value={resAccount}
                onChange={e => {
                  setResAccount(e.target.value);
                  const accountName = accounts[e.target.value]?.name;
                  fetchReservationProducts(accountName);
                  setResForm({ ...resForm, inventory_id: '' });
                }}
              >
                <option value="">-- choose --</option>
                {accounts.map((a, idx) => <option key={idx} value={idx}>{a.name}</option>)}
              </select>
            </div>

            <div className="col-md">
              <label>Product</label>
              <select
                className="form-select"
                value={resForm.inventory_id}
                onChange={e => setResForm({ ...resForm, inventory_id: e.target.value })}
              >
                <option value="">-- choose --</option>
                {resProducts.map(inv => (
                  <option key={inv.id} value={inv.id}>{inv.product}</option>
                ))}
              </select>
            </div>

            <div className="col-md">
              <label>Client</label>
              <input
                type="text"
                className="form-control"
                value={resForm.client_name}
                onChange={e => setResForm({ ...resForm, client_name: e.target.value })}
              />
            </div>
            <div className="col-md">
              <label>Quantity</label>
              <input
  type="number"
  className="form-control"
  min="1"
  value={resForm.quantity}
  onChange={e => setResForm({ ...resForm, quantity: e.target.value })}
  onBlur={e => {
    if (!e.target.value) setResForm({ ...resForm, quantity: 1 });
  }}
/>

            </div>
            <div className="col-md">
              <label>Date Reserved</label>
              <input
                type="datetime-local"
                className="form-control"
                value={resForm.date_reserved}
                disabled
              />
            </div>
            <div className="col-md">
              <label>Date Pickup</label>
              <input
                type="datetime-local"
                className="form-control"
                value={resForm.date_pickup}
                onChange={e => setResForm({ ...resForm, date_pickup: e.target.value })}
              />
            </div>

            <div className="col-md-auto">
              <button type="submit" className="btn btn-success">Reserve</button>
            </div>
          </div>
        </form>

        <table className="table table-sm">
          <thead>
            <tr>
              <th>Client</th>
              <th>Product</th>
              <th>Qty</th>
              <th>Date Reserved</th>
              <th>Date Pickup</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {reservations.map(r => (
              <tr key={r.id}>
                <td>{r.client_name}</td>
                <td>{inventory.find(i => i.id === r.inventory_id)?.product || '-'}</td>
                <td>{r.quantity}</td>
                <td>
                  {r.date_reserved
                    ? new Date(r.date_reserved).toLocaleString("en-PH", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                      })
                    : "-"}
                </td>

                <td>
                  {r.date_pickup
                    ? new Date(r.date_pickup).toLocaleString("en-PH", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                      })
                    : "-"}
                </td>

                <td>{r.status}</td>
                <td>
                  {r.status === 'pending' && (
                    <>
                      <button
                        className="btn btn-sm btn-primary me-2"
                        onClick={() => confirmReservation(r.id)}
                      >Confirm</button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => cancelReservation(r.id)}
                      >Cancel</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
