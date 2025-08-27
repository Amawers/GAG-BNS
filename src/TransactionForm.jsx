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

  useEffect(() => { fetchAccounts(); }, []);

  // 🔹 Fetch unique accounts from inventory
  async function fetchAccounts() {
    const { data } = await supabase
      .from('inventory')
      .select('account');

    const uniqueAccounts = [...new Set(data.map(i => i.account))];
    setAccounts(uniqueAccounts.map((name, idx) => ({ id: idx, name })));
  }

  // 🔹 Fetch products for selected account
  async function fetchProducts(accountName) {
    if (!accountName) return setProducts([]);
    const { data: prods } = await supabase
      .from('inventory')
      .select('product, price_each')
      .eq('account', accountName);

    setProducts(prods || []);
    setInventory(prods || []);
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

    // Auto-fill price_each from inventory
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

  // 🔹 Calculate total cost
  const total = form.items.reduce((sum, i) => {
    const qty = Number(i.quantity) || 0;
    const price = Number(i.price_each) || 0;
    return sum + qty * price;
  }, 0);

  return (
    <div className="card shadow-sm">
      <div className="card-header bg-white border-0"><h5>New Transaction</h5></div>
      <div className="card-body">
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
      </div>
    </div>
  );
}
