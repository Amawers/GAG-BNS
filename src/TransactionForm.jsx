import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

export default function TransactionForm({ editingTransaction = null }) {
  // Dropdown options
  const [accounts, setAccounts] = useState([]);
  const [products, setProducts] = useState([]);
  const [values, setValues] = useState([]);

  // Form state
  const [form, setForm] = useState({
    account_id: '',
    product_id: '',
    value_id: '',
    action: 'sell',     // default action
    quantity: 1,        // default quantity
    price_each: 0,
    transact_by: 'Ekong' // default user
  });

  // 🔹 Pre-fill form if editing existing transaction
  useEffect(() => {
    if (editingTransaction) {
      const { account, product, value, action, quantity, price_each, transact_by } = editingTransaction;
      setForm({
        account_id: '', // will be matched after fetching
        product_id: '',
        value_id: '',
        action,
        quantity,
        price_each,
        transact_by
      });
      fetchAccounts(account, product, value); // fetch with preselected values
    } else fetchAccounts(); // normal load
  }, []);

  // 🔹 Fetch accounts that appear in inventory
  async function fetchAccounts(currentAccount = null, currentProduct = null, currentValue = null) {
    const { data: accountsData } = await supabase.from('accounts').select('*');
    const { data: inventory } = await supabase.from('inventory').select('account');

    // Only keep accounts that exist in inventory
    const activeAccounts = accountsData.filter(a =>
      inventory.some(i => i.account === a.name)
    );
    setAccounts(activeAccounts || []);

    // If editing, preselect account
    if (currentAccount) {
      const accountObj = activeAccounts.find(a => a.name === currentAccount);
      if (accountObj) {
        setForm(f => ({ ...f, account_id: accountObj.id }));
        fetchProducts(accountObj.id, currentProduct, currentValue);
      }
    }
  }

  // 🔹 Fetch products under selected account that exist in inventory
  async function fetchProducts(accountId, currentProduct = null, currentValue = null) {
    const accountName = accounts.find(a => a.id === Number(accountId))?.name;
    if (!accountName) return setProducts([]);

    const { data: productsData } = await supabase.from('products').select('*').eq('account_id', accountId);
    const { data: inventory } = await supabase.from('inventory').select('product').eq('account', accountName);

    // Only keep products that exist in inventory
    const activeProducts = productsData.filter(p =>
      inventory.some(i => i.product === p.name)
    );
    setProducts(activeProducts || []);

    // If editing, preselect product
    if (currentProduct) {
      const productObj = activeProducts.find(p => p.name === currentProduct);
      if (productObj) {
        setForm(f => ({ ...f, product_id: productObj.id }));
        fetchValues(productObj.id, currentValue);
      }
    }
  }

  // 🔹 Fetch values under selected account + product that exist in inventory
  async function fetchValues(productId, currentValueId = null) {
    const productName = products.find(p => p.id === Number(productId))?.name;
    const accountName = accounts.find(a => a.id === Number(form.account_id))?.name;
    if (!productName || !accountName) return setValues([]);

    const { data: valuesData } = await supabase.from('values').select('*').eq('product_id', productId);
    const { data: inventory } = await supabase.from('inventory')
      .select('value')
      .eq('account', accountName)
      .eq('product', productName);

    // Only keep values that exist in inventory
    let activeValues = valuesData.filter(v =>
      inventory.some(i => i.value === v.value_name)
    );

    // If editing, keep current value even if not in inventory
    if (currentValueId) {
      const currentValue = valuesData.find(v => v.id === currentValueId);
      if (currentValue && !activeValues.some(v => v.id === currentValueId)) {
        activeValues.push(currentValue);
      }
      setForm(f => ({ ...f, value_id: currentValueId, price_each: currentValue.price }));
    }

    setValues(activeValues || []);
  }

  // 🔹 Auto-update price when value changes
  useEffect(() => {
    if (form.value_id) {
      const v = values.find(v => v.id === Number(form.value_id));
      if (v) setForm(f => ({ ...f, price_each: v.price }));
    }
  }, [form.value_id, values]);

  // 🔹 Auto-refresh products when account changes
  useEffect(() => {
    if (form.account_id) fetchProducts(form.account_id);
    else setProducts([]);
    setForm(f => ({ ...f, product_id: '', value_id: '', price_each: 0 }));
  }, [form.account_id]);

  // 🔹 Auto-refresh values when product changes
  useEffect(() => {
    if (form.product_id) fetchValues(form.product_id);
    else setValues([]);
    setForm(f => ({ ...f, value_id: '', price_each: 0 }));
  }, [form.product_id]);

  // 🔹 Submit transaction to DB
  async function submit(e) {
    e.preventDefault();
    if(!form.account_id || !form.product_id || !form.value_id || !form.quantity || !form.transact_by)
      return alert('Fill all fields');

    // Resolve names from IDs
    const accountName = accounts.find(a => a.id === Number(form.account_id))?.name;
    const productName = products.find(p => p.id === Number(form.product_id))?.name;
    const valueName = values.find(v => v.id === Number(form.value_id))?.value_name;

    if(!accountName || !productName || !valueName) return alert('Invalid selection');

    // Payload for DB
    const payload = { 
      account: accountName,
      product: productName,
      value: valueName,
      action: form.action,
      quantity: parseInt(form.quantity, 10),
      price_each: parseFloat(form.price_each),
      transact_by: form.transact_by
    };

    // Insert transaction
    const { error } = await supabase.from('transactions').insert(payload);
    if(error) return alert('Error: ' + error.message);

    alert('Transaction recorded');
    // Reset form
    setForm({ account_id:'', product_id:'', value_id:'', action:'sell', quantity:1, price_each:0, transact_by:'Ekong' });
    fetchAccounts(); // refresh dropdowns
  }

  return (
    <div className="card shadow-sm">
      <div className="card-header bg-white border-0">
        <h5 className="mb-0">{editingTransaction ? 'Edit Transaction' : 'New Transaction'}</h5>
      </div>
      <div className="card-body">
        <form onSubmit={submit}>
          <div className="row g-3">
            <div className="col-md-6">
              {/* Account dropdown */}
              <div className="mb-3">
                <label className="form-label">Account</label>
                <select className="form-select" value={form.account_id} onChange={e => setForm(f => ({...f, account_id: e.target.value}))}>
                  <option value="">-- choose --</option>
                  {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
              {/* Product dropdown */}
              <div className="mb-3">
                <label className="form-label">Product</label>
                <select className="form-select" value={form.product_id} onChange={e => setForm(f => ({...f, product_id: e.target.value}))}>
                  <option value="">-- choose --</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              {/* Value dropdown */}
              <div className="mb-3">
                <label className="form-label">Value</label>
                <select className="form-select" value={form.value_id} onChange={e => setForm(f => ({...f, value_id: e.target.value}))}>
                  <option value="">-- choose --</option>
                  {values.map(v => <option key={v.id} value={v.id}>{v.value_name}</option>)}
                </select>
              </div>
            </div>
            <div className="col-md-6">
              {/* Quantity input */}
              <div className="mb-3">
                <label className="form-label">Quantity</label>
                <input type="number" min="1" className="form-control" value={form.quantity} onChange={e => setForm({...form, quantity:e.target.value})} />
              </div>
              {/* Transact by dropdown */}
              <div className="mb-3">
                <label className="form-label">Transact By</label>
                <select className="form-select" value={form.transact_by} onChange={e=>setForm({...form, transact_by:e.target.value})}>
                  <option value="Ekong">Ekong</option>
                  <option value="Ann">Ann</option>
                </select>
              </div>
              {/* Submit button */}
              <div className="d-grid">
                <button type="submit" className="btn btn-primary">{editingTransaction ? 'Save Changes' : 'Submit'}</button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
