import OrdersPanel from './OrdersPanel';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Boxes, CircleAlert, LayoutDashboard, LogOut, PackagePlus, Pencil, Plus, Search, Trash2, X, ClipboardList, RefreshCw, AlertTriangle, Package, TrendingUp, ChevronRight } from 'lucide-react';
import { api } from './api';

const peso = value => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(Number(value || 0));
const blank = { name: '', category: '', description: '', price: '', stock: '0', image_url: '' };
const errorMessage = error => error.response?.data?.message || 'Connection failed. Check that the backend and XAMPP MySQL are running.';

export default function AdminDashboard({ session, onExit, onLogout, onInventoryChange }) {
  const [products, setProducts] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [query, setQuery] = useState('');
  const [onlyLow, setOnlyLow] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [refreshing, setRefreshing] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blank);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const config = useMemo(() => ({ headers: { Authorization: `Bearer ${session.token}` } }), [session.token]);
  const refresh = useCallback(async () => {
    const [inventory, stats] = await Promise.all([api.get('/admin/products', config), api.get('/admin/summary', config)]);
    setProducts(inventory.data);
    setSummary(stats.data);
  }, [config]);
  useEffect(() => {
    let active = true;
    Promise.all([api.get('/admin/products', config), api.get('/admin/summary', config)])
      .then(([inventory, stats]) => { if (active) { setProducts(inventory.data); setSummary(stats.data); } })
      .catch(err => { if (active) setError(errorMessage(err)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [config]);
  const filtered = products.filter(item =>
    (!onlyLow || item.stock <= 5) && `${item.name} ${item.category}`.toLowerCase().includes(query.toLowerCase())
  );
  async function manualRefresh() {setRefreshing(true);setError('');try{await refresh();setNotice('Dashboard data refreshed.');}catch(err){setError(errorMessage(err));}finally{setRefreshing(false);}}
  const lowProducts = products.filter(item => Number(item.stock) <= 5);
  function openForm(product) {
    setError(''); setNotice('');
    setEditing(product ? product.id : 'new');
    setForm(product ? { name: product.name, category: product.category, description: product.description || '', price: String(product.price), stock: String(product.stock), image_url: product.image_url || '' } : blank);
  }
  async function save(event) {
    event.preventDefault(); setSaving(true); setError(''); setNotice('');
    try {
      if (editing === 'new') await api.post('/admin/products', form, config);
      else await api.put(`/admin/products/${editing}`, form, config);
      setEditing(null);
      await refresh(); await onInventoryChange();
      setNotice(editing === 'new' ? 'Product added successfully.' : 'Product updated successfully.');
    } catch (err) { setError(errorMessage(err)); }
    finally { setSaving(false); }
  }
  async function adjust(item, change) {
    setBusyId(item.id); setError(''); setNotice('');
    try {
      await api.patch(`/admin/products/${item.id}/stock`, { change }, config);
      await refresh(); await onInventoryChange();
      setNotice(`${item.name}: stock ${change > 0 ? 'increased' : 'decreased'} by ${Math.abs(change)}.`);
    } catch (err) { setError(errorMessage(err)); }
    finally { setBusyId(null); }
  }
  async function remove(item) {
    if (!window.confirm(`Remove "${item.name}" from the storefront? This hides the product without deleting its database history.`)) return;
    setBusyId(item.id); setError(''); setNotice('');
    try {
      await api.delete(`/admin/products/${item.id}`, config);
      await refresh(); await onInventoryChange();
      setNotice(`${item.name} removed from the storefront.`);
    } catch (err) { setError(errorMessage(err)); }
    finally { setBusyId(null); }
  }
  return <div className="admin-shell">
    <aside className="admin-side">
      <div className="admin-brand"><Boxes size={23}/> northstar<span>.</span></div>
      <div className="admin-nav-label">WORKSPACE</div>
      <nav className="admin-nav" aria-label="Admin sections">
        <button className={'admin-nav-item '+(activeTab==='overview'?'active':'')} onClick={()=>setActiveTab('overview')}><LayoutDashboard size={18}/> Overview</button>
        <button className={'admin-nav-item '+(activeTab==='inventory'?'active':'')} onClick={()=>setActiveTab('inventory')}><Package size={18}/> Inventory <span>{products.length}</span></button>
        <button className={'admin-nav-item '+(activeTab==='orders'?'active':'')} onClick={()=>setActiveTab('orders')}><ClipboardList size={18}/> Orders</button>
      </nav>
      <div className="admin-side-note"><span>SHOP OPERATIONS</span><strong>Everything under control.</strong><p>Manage listings, stock and fulfillment from one workspace.</p></div>
      <div className="admin-nav-label admin-nav-bottom">ACCOUNT</div>
      <div className="admin-profile"> <div className="admin-avatar">A</div><div><strong>{session.username}</strong><small>Administrator</small></div></div>
      <button className="admin-nav-action" onClick={onExit}><ArrowLeft size={17}/> View storefront</button>
      <button className="admin-nav-action" onClick={onLogout}><LogOut size={17}/> Sign out</button>
    </aside>
    <main className="admin-main">
      <header className="admin-top admin-top-sticky"><div><span>ADMIN WORKSPACE / {activeTab.toUpperCase()}</span><h1>{activeTab==='overview'?'Store overview':activeTab==='inventory'?'Product inventory':'Order management'}</h1><p>{activeTab==='overview'?'Your shop at a glance.':activeTab==='inventory'?'Keep your catalog accurate and in stock.':'Manage and track customer fulfillment.'}</p></div><div className="admin-header-actions"><button className="outline-action" disabled={refreshing} onClick={manualRefresh}><RefreshCw size={16}/>{refreshing?'Refreshing…':'Refresh'}</button><button className="primary-button" onClick={() => {setActiveTab('inventory');openForm(null);}}><Plus size={18}/> Add product</button></div></header>
      {notice && <div className="admin-global-notice" role="status">{notice}</div>}
      {error && <div className="admin-global-error" role="alert"><CircleAlert size={17}/>{error}</div>}
      {activeTab==='overview'&&<><div className="admin-welcome-banner"><div><span>YOUR STORE, SIMPLIFIED</span><h2>Welcome back, {session.username}.</h2><p>A quick snapshot of today's inventory and what needs attention.</p><button onClick={()=>setActiveTab('inventory')}>Manage products <ChevronRight size={17}/></button></div><div className="admin-banner-icon"><Boxes size={72} strokeWidth={1.1}/></div></div>
      <div className="admin-metrics admin-metrics-polished">
        <div className="metric"><div className="metric-label"><span>Active products</span><Package size={19}/></div><strong>{summary?.product_count ?? '—'}</strong><small>Products in your catalog</small></div>
        <div className="metric"><div className="metric-label"><span>Available units</span><Boxes size={19}/></div><strong>{summary?.total_units ?? '—'}</strong><small>Total sellable stock</small></div>
        <div className="metric metric-alert"><div className="metric-label"><span>Low stock</span><AlertTriangle size={19}/></div><strong>{summary?.low_stock_count ?? '—'}</strong><small>Products with 5 or fewer units</small></div>
        <div className="metric"><div className="metric-label"><span>Inventory value</span><TrendingUp size={19}/></div><strong className="metric-currency">{summary ? peso(summary.inventory_value) : '—'}</strong><small>Estimated price × quantity</small></div>
      </div>
      <section className="admin-overview-grid"><div className="admin-overview-card"><div className="admin-card-top"><div><h2>Needs attention</h2><p>Items with low or zero stock</p></div><button onClick={()=>{setOnlyLow(true);setActiveTab('inventory');}}>View all <ChevronRight size={16}/></button></div>{loading?<p>Loading stock alerts…</p>:lowProducts.length===0?<div className="admin-all-clear"><ClipboardList size={23}/> Great news — all products have more than 5 units in stock.</div>:<div className="admin-alert-list">{lowProducts.slice(0,5).map(item=><div key={item.id} className="admin-alert-item"><img src={item.image_url||'https://placehold.co/80x80?text=Item'} alt=""/><div><strong>{item.name}</strong><span>{item.category}</span></div><span className={'inventory-stock '+(Number(item.stock)===0?'out':'warning')}>{Number(item.stock)===0?'Out of stock':`${item.stock} left`}</span></div>)}</div>}</div><div className="admin-overview-card admin-quick-actions"><div className="admin-card-top"><div><h2>Quick actions</h2><p>Jump straight into shop management</p></div></div><button onClick={()=>{setActiveTab('inventory');openForm(null);}}><PackagePlus size={19}/> Add a new product <ChevronRight size={17}/></button><button onClick={()=>{setOnlyLow(false);setActiveTab('inventory');}}><Package size={19}/> Browse inventory <ChevronRight size={17}/></button><button onClick={()=>setActiveTab('orders')}><ClipboardList size={19}/> Manage customer orders <ChevronRight size={17}/></button></div></section></>}
      {activeTab==='inventory'&&<>
      <section className="admin-panel"><div className="admin-panel-heading"><div><h2>Inventory management</h2><p>Manage listings and adjust available quantities.</p></div><button onClick={() => openForm(null)} className="outline-action"><PackagePlus size={17}/> New product</button></div>
        <div className="admin-toolbar"><label className="admin-search"><Search size={18}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search products or categories"/></label><label className="low-filter"><input type="checkbox" checked={onlyLow} onChange={e=>setOnlyLow(e.target.checked)}/> Low stock only</label></div>


        {loading ? <p className="admin-empty">Loading your inventory…</p> : <div className="admin-table-scroll"><table className="inventory-table"><thead><tr><th>PRODUCT</th><th>PRICE</th><th>STOCK</th><th>QUICK ADJUST</th><th>ACTIONS</th></tr></thead><tbody>{filtered.map(item => <tr key={item.id}><td><div className="inventory-product"><img src={item.image_url || 'https://placehold.co/100x100?text=Product'} alt=""/><div><strong>{item.name}</strong><small>{item.category} · #{item.id}</small></div></div></td><td>{peso(item.price)}</td><td><span className={'inventory-stock ' + (item.stock === 0 ? 'out' : item.stock <= 5 ? 'warning' : 'healthy')}>{item.stock === 0 ? 'Out of stock' : `${item.stock} units`}</span></td><td><div className="stock-buttons"><button aria-label={`Reduce ${item.name} stock by one`} disabled={busyId === item.id || item.stock === 0} onClick={() => adjust(item, -1)}>−</button><span>1</span><button aria-label={`Increase ${item.name} stock by one`} disabled={busyId === item.id} onClick={() => adjust(item, 1)}>+</button></div></td><td><div className="row-actions"><button aria-label={`Edit ${item.name}`} title="Edit" disabled={busyId === item.id} onClick={() => openForm(item)}><Pencil size={16}/></button><button aria-label={`Delete ${item.name}`} title="Remove listing" disabled={busyId === item.id} onClick={() => remove(item)}><Trash2 size={16}/></button></div></td></tr>)}</tbody></table>{filtered.length === 0 && <p className="admin-empty">No products match your filters.</p>}</div>}
        <p className="admin-table-foot">Showing {filtered.length} of {products.length} active products · Changes update the customer storefront.</p>
      </section>
      </>}
      {activeTab==='orders'&&<div className="admin-order-view"><OrdersPanel session={session} admin onChange={async () => {await refresh(); await onInventoryChange();}}/></div>}
    </main>
    {editing !== null && <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget && !saving) setEditing(null); }}><div className="modal admin-form-modal" role="dialog" aria-modal="true" aria-labelledby="product-form-title"><button className="modal-close" type="button" onClick={() => setEditing(null)} disabled={saving} aria-label="Close"><X size={20}/></button><h2 id="product-form-title">{editing === 'new' ? 'Add a product' : 'Edit product'}</h2><p>Changes will be saved to the XAMPP database.</p><form onSubmit={save}>
      <label>Product name<input required maxLength={160} value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></label>
      <label>Category<input required maxLength={80} value={form.category} onChange={e=>setForm({...form,category:e.target.value})} placeholder="e.g. Home"/></label>
      <div className="form-two"><label>Price (PHP)<input required type="number" min="0" max="99999999.99" step="0.01" value={form.price} onChange={e=>setForm({...form,price:e.target.value})}/></label><label>Stock quantity<input required type="number" min="0" max="100000000" step="1" value={form.stock} onChange={e=>setForm({...form,stock:e.target.value})}/></label></div>
      <label>Image URL<input type="url" maxLength={800} value={form.image_url} onChange={e=>setForm({...form,image_url:e.target.value})} placeholder="https://images.unsplash.com/..."/></label>
      <label>Description<textarea rows="3" maxLength={5000} value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></label>
      {error && <p className="form-error">{error}</p>}
      <div className="form-actions"><button className="outline-action" type="button" disabled={saving} onClick={() => setEditing(null)}>Cancel</button><button className="primary-button" disabled={saving} type="submit">{saving ? 'Saving…' : editing === 'new' ? 'Add product' : 'Save changes'}</button></div>
    </form></div></div>}
  </div>;
}
