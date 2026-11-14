import { useEffect, useState } from 'react';
import { api } from './api';
import { ClipboardList, RefreshCw } from 'lucide-react';
const peso = value => new Intl.NumberFormat('en-PH',{style:'currency',currency:'PHP'}).format(Number(value));
const dates = value => new Date(value).toLocaleString('en-PH',{dateStyle:'medium',timeStyle:'short'});
const transitions = {pending:['confirmed','cancelled'],confirmed:['shipped','cancelled'],shipped:['delivered'],delivered:[],cancelled:[]};
const errorText = e => e.response?.data?.message || 'Could not connect to backend.';
export default function OrdersPanel({session,admin=false,onChange,refreshKey=0}) {
  const [orders,setOrders] = useState([]);
  const [loading,setLoading] = useState(true);
  const [error,setError] = useState('');
  const [busy,setBusy] = useState(null);
  async function load() {
    setError('');
    try { const {data}=await api.get(admin?'/orders/admin':'/orders/mine',{headers:{Authorization:`Bearer ${session.token}`}});setOrders(data); }
    catch(e){setError(errorText(e));}
    finally{setLoading(false);}
  }
  useEffect(()=>{let alive=true; const fetchOrders=async()=>{
    try{const {data}=await api.get(admin?'/orders/admin':'/orders/mine',{headers:{Authorization:`Bearer ${session.token}`}});if(alive)setOrders(data);}
    catch(e){if(alive)setError(errorText(e));}finally{if(alive)setLoading(false);}
  };fetchOrders();return()=>{alive=false;};},[admin,session.token,refreshKey]);
  async function changeStatus(order,status){
    if(status==='cancelled'&&!window.confirm(`Cancel order #${order.id}? All purchased units will be returned to inventory.`))return;
    setBusy(order.id);setError('');
    try{await api.patch(`/orders/admin/${order.id}/status`,{status},{headers:{Authorization:`Bearer ${session.token}`}});await load();if(onChange)await onChange();}
    catch(e){setError(errorText(e));}finally{setBusy(null);}
  }
  return <section className="orders-panel"><div className="orders-heading"><div><h2><ClipboardList size={22}/> {admin?'Customer orders':'Order history'}</h2><p>{admin?'Track fulfillment, confirm and dispatch orders.':'Check your recent orders and delivery status.'}</p></div><button className="outline-action" onClick={load}><RefreshCw size={16}/> Refresh</button></div>
    {error&&<p className="form-error" role="alert">{error}</p>}
    {loading?<p>Loading orders…</p>:orders.length===0?<p className="subtle">No orders yet.</p>:<div className="orders-list">{orders.map(order=><article className="order-card" key={order.id}><div className="order-top"><div><strong>Order #{order.id}</strong><small>{dates(order.created_at)}{admin?` · ${order.username}`:''}</small></div><span className={`order-status status-${order.status}`}>{order.status}</span></div><div className="order-lines">{order.items.map(item=><div key={item.product_id} className="summary-item"><span>{item.name} × {item.quantity}</span><strong>{peso(Number(item.unit_price)*item.quantity)}</strong></div>)}</div><div className="order-shipping"><strong>Deliver to:</strong> {order.recipient_name}, {order.street_address}, {order.barangay}, {order.city}, {order.province} {order.postal_code} · {order.phone}</div><div className="summary-item"><span>Shipping (Cash on Delivery)</span><strong>{peso(order.shipping_fee)}</strong></div><div className="summary-total"><strong>Total</strong><strong>{peso(order.total)}</strong></div>{admin&&transitions[order.status]?.length>0&&<div className="order-actions">{transitions[order.status].map(next=><button key={next} disabled={busy===order.id} className={next==='cancelled'?'outline-action':'primary-button'} onClick={()=>changeStatus(order,next)}>{busy===order.id?'Saving…':`${next==='cancelled'?'Cancel order':'Mark as '+next}`}</button>)}</div>}</article>)}</div>}
  </section>;
}
