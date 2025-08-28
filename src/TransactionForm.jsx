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
  const [resForm, setResForm] = useState({
    inventory_id: '',
    client_name: '',
    quantity: 1
  });

  useEffect(() => { fetchAccounts(); fetchReservations(); }, []);

  async function fetchAccounts() {
    const { data } = await supabase.from('inventory').select('id, account, product, price_each');
    if (!data) return;

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
      const productName = products[value]?.product;
      const invItem = inventory.find(i => i.product === productName);
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
    if (!form.account_id || !form.items.length || form.items.some(i => !i.product_id || !i.quantity))
      return alert('Fill all fields');

    const accountName = accounts[form.account_id]?.name;
    if (!accountName) return alert('Invalid account');

    const payload = form.items.map(i => {
      const productName = products[i.product_id]?.product;
      return {
        account: accountName,
        product: productName,
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

  async function makeReservation(e) {
    e.preventDefault();
    if (!resForm.inventory_id || !resForm.client_name || !resForm.quantity)
      return alert('Fill all fields');

    const { error } = await supabase.rpc('reserve_product', {
      p_inventory_id: resForm.inventory_id,
      p_client_name: resForm.client_name,
      p_quantity: resForm.quantity
    });

    if (error) return alert(error.message);
    alert('Reservation added');
    setResForm({ inventory_id: '', client_name: '', quantity: 1 });
    fetchReservations();
  }

  async function confirmReservation(id) {
    const { error } = await supabase.rpc('confirm_reservation', { p_reservation_id: id });
    if (error) return alert(error.message);
    fetchReservations();
  }

  async function cancelReservation(id) {
    const { error } = await supabase.rpc('cancel_reservation', { p_reservation_id: id });
    if (error) return alert(error.message);
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
          <div className="mb-3">
            <label>Account</label>
            <select
              className="form-select"
              value={form.account_id}
              onChange={e => {
                setForm({ ...form, account_id: e.target.value });
                const accountName = accounts[e.target.value]?.name;
                fetchProducts(accountName);
              }}
            >
              <option value="">-- choose --</option>
              {accounts.map((a, idx) => <option key={idx} value={idx}>{a.name}</option>)}
            </select>
          </div>

          {form.items.map((item, idx) => (
            <div key={idx} className="row g-2 mb-2 align-items-end">
              <div className="col-md">
                <label>Product</label>
                <select
                  className="form-select"
                  value={item.product_id}
                  onChange={e => updateItem(idx, 'product_id', e.target.value)}
                >
                  <option value="">-- choose --</option>
                  {products.map((p, i) => <option key={i} value={i}>{p.product}</option>)}
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
                onChange={e => setResForm({ ...resForm, quantity: Number(e.target.value) })}
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
