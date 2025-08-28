import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

export default function InventoryTable() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({
    account: '',
    product: '',
    stocks: '',
    price_each: '',
    inserted_by: ''
  });
  // const [reservations, setReservations] = useState([]);
const [showTooltip, setShowTooltip] = useState(null);

  async function load() {
    const { data: inv, error: invErr } = await supabase.from('inventory').select('*');
    const { data: res, error: resErr } = await supabase.from('reservations').select('*');

    if (!invErr && inv) {
      const computed = inv.map(item => {
        const reservedQty = res
          ?.filter(r => r.inventory_id === item.id && r.status === 'pending')
          .reduce((sum, r) => sum + r.quantity, 0) || 0;

        return {
          ...item,
          reserved: reservedQty,
          available: item.stocks - item.sold_stocks - reservedQty,
          clients: res?.filter(r => r.inventory_id === item.id && r.status === 'pending') || []
        };
      });

      setRows(computed);
    }
    if (!resErr && res) (res);
  }

  useEffect(() => { load(); }, []);

  async function addRecord(e) {
    e.preventDefault();
    if(!form.account || !form.product) return alert('Fill all required fields');

    let { data: acc } = await supabase.from('accounts').select('*').eq('name', form.account).limit(1);
    if(!acc.length) { 
      const { data: newAcc } = await supabase.from('accounts').insert({ name: form.account }).select().single(); 
      acc = [newAcc]; 
    }

    let { data: prod } = await supabase.from('products').select('*')
      .eq('name', form.product).eq('account_id', acc[0].id).limit(1);
    if(!prod.length) { 
      const { data: newProd } = await supabase.from('products')
        .insert({ name: form.product, account_id: acc[0].id }).select().single(); 
      prod = [newProd]; 
    }

    const { error } = await supabase.from('inventory').insert([{
      account: form.account,
      product: form.product,
      stocks: Number(form.stocks) || 0,
      price_each: Number(form.price_each) || 0,
      sold_stocks: 0,
      sales: 0,
      inserted_by: form.inserted_by,
      last_updated: new Date().toISOString()
    }]);

    if(!error) {
      await supabase.from('logs').insert([{
        timestamp: new Date().toISOString(),
        account: form.account,
        product: form.product,
        action: 'Restocking',
        quantity: Number(form.stocks) || 0,
        price_each: Number(form.price_each) || 0,
        old_stock: 0,
        new_stock: Number(form.stocks) || 0,
        sales: 0,
        transact_by:  form.inserted_by
      }]);
      setForm({ account:'', product:'', stocks:'', price_each:'', inserted_by:'' });
      load();
    } else alert(error.message);
  }

  const [editId, setEditId] = useState(null);

  async function updateRecord(id){
    const { data: inv, error: invErr } = await supabase.from('inventory').select('*').eq('id', id).single();
    if(invErr || !inv) return alert('Inventory not found');

    const { error: invError } = await supabase.from('inventory')
      .update({ price_each: Number(form.price_each), last_updated: new Date().toISOString() })
      .eq('id', id);

    if(invError) return alert(invError.message);
    setEditId(null);
    load();
  }

  async function deleteRecord(id){
    if(!confirm("Are you sure to delete this record?")) return;

    const { data: inv, error: invErr } = await supabase.from('inventory').select('*').eq('id', id).single();
    if(invErr || !inv) return alert('Inventory not found');

    await supabase.from('transactions').delete().eq('account', inv.account).eq('product', inv.product);
    await supabase.from('logs').delete().eq('account', inv.account).eq('product', inv.product);
    const { error: delErr } = await supabase.from('inventory').delete().eq('id', id);
    await supabase.from('products').delete().eq('name', inv.product);

    if(delErr) return alert('Error deleting record');
    load();
  }

  const [search, setSearch] = useState('');
  const filteredRows = rows.filter(r =>
    r.account.toLowerCase().includes(search.toLowerCase()) ||
    r.product.toLowerCase().includes(search.toLowerCase()) ||
    r.inserted_by.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <h5 className="mb-3">Inventory</h5>

      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <form onSubmit={addRecord} className="row g-2">
            <div className="col-md">
              <input className="form-control" placeholder="Account"
                value={form.account} onChange={e => setForm({ ...form, account: e.target.value })} />
            </div>
            <div className="col-md">
              <input className="form-control" placeholder="Product"
                value={form.product} onChange={e => setForm({ ...form, product: e.target.value })} />
            </div>
            <div className="col-md">
              <input type="number" className="form-control" placeholder="Stocks"
                value={form.stocks} onChange={e => setForm({ ...form, stocks: e.target.value })} />
            </div>
            <div className="col-md">
              <label className="form-label visually-hidden">Price Each</label>
              <div className="input-group">
                <span className="input-group-text">₱</span>
                <input type="number" className="form-control" placeholder="Price Each"
                  value={form.price_each} onChange={e => setForm({ ...form, price_each: e.target.value })} />
              </div>
            </div>
            <div className="col-md">
              <select className="form-select"
                value={form.inserted_by}
                onChange={e => setForm({ ...form, inserted_by: e.target.value })}>
                <option value="" disabled hidden>Added by</option>
                <option value="Ekong">Ekong</option>
                <option value="Ann">Ann</option>
              </select>
            </div>
            <div className="col-md-auto">
              <button className="btn btn-primary w-100" type="submit">Add</button>
            </div>
          </form>
        </div>
      </div>

      <div className="mb-2">
        <input
          type="text"
          className="form-control"
          placeholder="Search by account, product, or added by..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="card shadow-sm">
        <div className="card-body p-0">
          <table className="table table-striped table-hover mb-0">
            <thead className="table-light">
              <tr>
                <th>Account</th>
                <th>Product</th>
                <th>Stocks</th>
<th style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
  <div style={{ fontSize: "12px", color: "gray" }}>hover item</div>
  <div>Reserved</div>
</th>
                <th>Available</th>
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
                    <>
                      <td>{r.account}</td>
                      <td>{r.product}</td>
                      <td>{r.stocks}</td>
                      <td>{r.reserved}</td>
                      <td>{r.available}</td>
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
                    <>
                      <td>{r.account}</td>
                      <td>{r.product}</td>
                      <td>{r.stocks}</td>
                      <td
  className="position-relative"
  onMouseEnter={() => setShowTooltip(r.id)}
  onMouseLeave={() => setShowTooltip(null)}
>
  {r.reserved}

  {r.clients.length > 0 && showTooltip === r.id && (
    <div
      className="position-absolute bg-white border p-2 rounded shadow small"
      style={{ top: '100%', left: 0, whiteSpace: 'nowrap', zIndex: 10 }}
    >
      {r.clients.map(c => (
        <div key={c.id}>
          {c.client_name} - {c.quantity}
        </div>
      ))}
    </div>
  )}
</td>

                      <td>{r.available}</td>
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
