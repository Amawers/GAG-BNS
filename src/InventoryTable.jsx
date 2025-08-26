import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

export default function InventoryTable() {
  // State for rows (inventory list) and form input
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({
    account: '',
    product: '',
    value: '',
    stocks: '',
    price_each: '',
    inserted_by: ''  // who added the record
  });

  // Load all inventory records from DB
  async function load() {
    const { data, error } = await supabase.from('inventory').select('*');
    if (!error) setRows(data || []);
  }

  // Run load() when component mounts
  useEffect(() => { load(); }, []);

  // Add new record (with account/product/value checks)
  async function addRecord(e) {
    e.preventDefault();
    if(!form.account || !form.product || !form.value) return alert('Fill all fields');

    // 🔹 Ensure account exists or create
    let { data: acc } = await supabase.from('accounts').select('*').eq('name', form.account).limit(1);
    if(!acc.length) { 
      const { data: newAcc } = await supabase.from('accounts').insert({ name: form.account }).select().single(); 
      acc = [newAcc]; 
    }

    // 🔹 Ensure product exists under the account or create
    let { data: prod } = await supabase.from('products').select('*')
      .eq('name', form.product).eq('account_id', acc[0].id).limit(1);
    if(!prod.length) { 
      const { data: newProd } = await supabase.from('products')
        .insert({ name: form.product, account_id: acc[0].id }).select().single(); 
      prod = [newProd]; 
    }

    // 🔹 Ensure value exists under product or create
    let { data: val } = await supabase.from('values').select('*')
      .eq('value_name', form.value).eq('product_id', prod[0].id).limit(1);
    if(!val.length) { 
      const { data: newVal } = await supabase.from('values')
        .insert({ value_name: form.value, product_id: prod[0].id, price: Number(form.price_each) || 0 }).select().single(); 
      val = [newVal]; 
    }

    // 🔹 Insert into inventory
    const { error } = await supabase.from('inventory').insert([{
      account: form.account,
      product: form.product,
      value: form.value,
      stocks: Number(form.stocks) || 0,
      price_each: Number(form.price_each) || 0,
      sold_stocks: 0,
      sales: 0,
      inserted_by: form.inserted_by,
      last_updated: new Date().toISOString()
    }]);

    if(!error) {
      // 🔹 Log the restocking action
      await supabase.from('logs').insert([{
        timestamp: new Date().toISOString(),
        account: form.account,
        product: form.product,
        value: form.value,
        action: 'Restocking',
        quantity: Number(form.stocks) || 0,
        price_each: Number(form.price_each) || 0,
        old_stock: 0,
        new_stock: Number(form.stocks) || 0,
        sales: 0,
        transact_by:  form.inserted_by
      }]);
      // Reset form
      setForm({ account:'', product:'', value:'', stocks:'', price_each:'', inserted_by:'' });
      load();
    } else alert(error.message);
  }

  // Track which row is in edit mode
  const [editId, setEditId] = useState(null);

  // Update price in both inventory + values table
  async function updateRecord(id){
    // 1️⃣ Get inventory row by ID
    const { data: inv, error: invErr } = await supabase.from('inventory').select('*').eq('id', id).single();
    if(invErr || !inv) return alert('Inventory not found');

    // 2️⃣ Find product_id from products table
    const { data: prod, error: prodErr } = await supabase
      .from('products')
      .select('id')
      .eq('name', inv.product)
      .limit(1)
      .single();

    if(prodErr || !prod) return alert('Product not found for this inventory item');

    // 3️⃣ Update inventory price
    const { error: invError } = await supabase.from('inventory')
      .update({
        price_each: Number(form.price_each),
        last_updated: new Date().toISOString()
      })
      .eq('id', id);

    if(invError) return alert(invError.message);

    // 4️⃣ Update values table price
    const { error: valError } = await supabase.from('values')
      .update({ price: Number(form.price_each) })
      .eq('product_id', prod.id)
      .eq('value_name', inv.value);

    if(valError) return alert(valError.message);

    setEditId(null);
    load();
  }

  // Delete record (and related entries)
  async function deleteRecord(id){
    if(!confirm("Are you sure to delete this record?")) return;

    // 🔹 Get inventory row
    const { data: inv, error: invErr } = await supabase.from('inventory').select('*').eq('id', id).single();
    if(invErr || !inv) return alert('Inventory not found');

    // 🔹 Delete related transactions
    await supabase.from('transactions')
      .delete()
      .eq('account', inv.account)
      .eq('product', inv.product)
      .eq('value', inv.value);

    // 🔹 Delete related logs
    await supabase.from('logs')
      .delete()
      .eq('account', inv.account)
      .eq('product', inv.product)
      .eq('value', inv.value);

    // 🔹 Delete inventory record itself
    const { error: delErr } = await supabase.from('inventory').delete().eq('id', id);

    // 🔹 Also cleanup products & values
    await supabase.from('products').delete().eq('name', inv.product);
    await supabase.from('values').delete().eq('value_name', inv.value);

    if(delErr) return alert('Error deleting record');
    load();
  }

  // Search filter (case-insensitive)
  const [search, setSearch] = useState('');
  const filteredRows = rows.filter(r =>
    r.account.toLowerCase().includes(search.toLowerCase()) ||
    r.product.toLowerCase().includes(search.toLowerCase()) ||
    r.value.toLowerCase().includes(search.toLowerCase()) ||
    r.inserted_by.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <h5 className="mb-3">Inventory</h5>

      {/* 🔹 Add Form */}
      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <form onSubmit={addRecord} className="row g-2">
            {/* Account input */}
            <div className="col-md">
              <input className="form-control" placeholder="Account"
                value={form.account} onChange={e => setForm({ ...form, account: e.target.value })} />
            </div>
            {/* Product input */}
            <div className="col-md">
              <input className="form-control" placeholder="Product"
                value={form.product} onChange={e => setForm({ ...form, product: e.target.value })} />
            </div>
            {/* Value input */}
            <div className="col-md">
              <input className="form-control" placeholder="Value"
                value={form.value} onChange={e => setForm({ ...form, value: e.target.value })} />
            </div>
            {/* Stocks input */}
            <div className="col-md">
              <input type="number" className="form-control" placeholder="Stocks"
                value={form.stocks} onChange={e => setForm({ ...form, stocks: e.target.value })} />
            </div>
            {/* Price input */}
            <div className="col-md">
              <label className="form-label visually-hidden">Price Each</label>
              <div className="input-group">
                <span className="input-group-text">₱</span>
                <input type="number" className="form-control" placeholder="Price Each"
                  value={form.price_each} onChange={e => setForm({ ...form, price_each: e.target.value })} />
              </div>
            </div>
            {/* Inserted by dropdown */}
            <div className="col-md">
              <select className="form-select"
                value={form.inserted_by}
                onChange={e => setForm({ ...form, inserted_by: e.target.value })}>
                <option value="" disabled hidden>Added by</option>
                <option value="Ekong">Ekong</option>
                <option value="Ann">Ann</option>
              </select>
            </div>
            {/* Submit button */}
            <div className="col-md-auto">
              <button className="btn btn-primary w-100" type="submit">Add</button>
            </div>
          </form>
        </div>
      </div>

      {/* 🔹 Search box */}
      <div className="mb-2">
        <input
          type="text"
          className="form-control"
          placeholder="Search by account, product, value, or added by..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* 🔹 Table view */}
      <div className="card shadow-sm">
        <div className="card-body p-0">
          <table className="table table-striped table-hover mb-0">
            <thead className="table-light">
              <tr>
                <th>Account</th>
                <th>Product</th>
                <th>Value</th>
                <th>Stocks</th>
                <th>Price</th>
                <th>Sold</th>
                <th>Sales</th>
                <th>Inserted By</th>
                <th>Last Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map(r => (
                <tr key={r.id}>
                  {editId === r.id ? (
                    // 🔹 Edit mode row
                    <>
                      <td>{r.account}</td>
                      <td>{r.product}</td>
                      <td>{r.value}</td>
                      <td>{r.stocks}</td>
                      <td>
                        <div className="input-group input-group-sm">
                          <span className="input-group-text">₱</span>
                          <input
                            type="number"
                            className="form-control"
                            value={form.price_each}
                            onChange={e => setForm({ ...form, price_each: e.target.value })}
                          />
                        </div>
                      </td>
                      <td>{r.sold_stocks}</td>
                      <td>₱{Number(r.sales).toLocaleString()}</td>
                      <td>{r.inserted_by}</td>
                      <td>{new Date(r.last_updated).toLocaleString()}</td>
                      <td className="d-flex gap-1">
                        <button className="btn btn-sm btn-success" onClick={() => updateRecord(r.id)}>Save</button>
                        <button className="btn btn-sm btn-secondary" onClick={() => setEditId(null)}>Cancel</button>
                      </td>
                    </>
                  ) : (
                    // 🔹 Normal row
                    <>
                      <td>{r.account}</td>
                      <td>{r.product}</td>
                      <td>{r.value}</td>
                      <td>{r.stocks}</td>
                      <td>₱{Number(r.price_each).toLocaleString()}</td>
                      <td>{r.sold_stocks}</td>
                      <td>₱{Number(r.sales).toLocaleString()}</td>
                      <td>{r.inserted_by}</td>
                      <td>{new Date(r.last_updated).toLocaleString()}</td>
                      <td className="d-flex gap-1">
                        <button className="btn btn-sm btn-primary" onClick={() => { setEditId(r.id); setForm({...r}); }}>Edit</button>
                        <button className="btn btn-sm btn-danger" onClick={() => deleteRecord(r.id)}>Delete</button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
