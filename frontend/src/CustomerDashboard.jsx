import { useEffect, useState } from 'react';
import { MapPin, Save, UserRound } from 'lucide-react';
import { api } from './api';

const provinces = ['Abra','Agusan del Norte','Agusan del Sur','Aklan','Albay','Antique','Apayao','Aurora','Basilan','Bataan','Batanes','Batangas','Benguet','Biliran','Bohol','Bukidnon','Bulacan','Cagayan','Camarines Norte','Camarines Sur','Camiguin','Capiz','Catanduanes','Cavite','Cebu','Cotabato','Davao de Oro','Davao del Norte','Davao del Sur','Davao Occidental','Davao Oriental','Dinagat Islands','Eastern Samar','Guimaras','Ifugao','Ilocos Norte','Ilocos Sur','Iloilo','Isabela','Kalinga','La Union','Laguna','Lanao del Norte','Lanao del Sur','Leyte','Maguindanao del Norte','Maguindanao del Sur','Marinduque','Masbate','Metro Manila (NCR)','Misamis Occidental','Misamis Oriental','Mountain Province','Negros Occidental','Negros Oriental','Northern Samar','Nueva Ecija','Nueva Vizcaya','Occidental Mindoro','Oriental Mindoro','Palawan','Pampanga','Pangasinan','Quezon','Quirino','Rizal','Romblon','Samar','Sarangani','Siquijor','Sorsogon','South Cotabato','Southern Leyte','Sultan Kudarat','Sulu','Surigao del Norte','Surigao del Sur','Tarlac','Tawi-Tawi','Zambales','Zamboanga del Norte','Zamboanga del Sur','Zamboanga Sibugay'];
const empty = {recipient_name:'', phone:'', province:'', city:'', barangay:'', street_address:'', postal_code:''};

// This component renders only the selected sidebar panel, not the entire customer dashboard.
export default function CustomerDashboard({session, panel='delivery'}) {
  const [address, setAddress] = useState(empty);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  useEffect(() => {
    let active=true;
    api.get('/customers/address',{headers:{Authorization:`Bearer ${session.token}`}})
      .then(({data})=>{if(active&&data)setAddress({...empty,...data});})
      .catch(e=>{if(active)setMessage(e.response?.data?.message||'Unable to load your saved address.');})
      .finally(()=>{if(active)setLoading(false);});
    return ()=>{active=false;};
  },[session.token]);
  async function save(e){
    e.preventDefault();setSaving(true);setMessage('');
    try{await api.put('/customers/address',address,{headers:{Authorization:`Bearer ${session.token}`}});setMessage('Delivery address saved successfully.');}
    catch(e){setMessage(e.response?.data?.message||'Could not save delivery address.');}
    finally{setSaving(false);}
  }
  if(panel==='profile')return <section className="store-paper"><div className="paper-heading"><UserRound size={23}/><div><h2>My profile</h2><p>Your Northstar account details</p></div></div><div className="profile-detail"><span>Username</span><strong>{session.username}</strong></div><div className="profile-detail"><span>Email address</span><strong>{session.email||'Not provided'}</strong></div><p className="subtle">Your account is protected by your login credentials. Never share your password.</p></section>;
  return <section className="store-paper"><div className="paper-heading"><MapPin size={23}/><div><h2>Delivery details</h2><p>Your address is saved securely to your customer account.</p></div></div><p className="subtle">Select a province and enter your city and barangay. We never need your device location.</p>{loading?<p>Loading your address…</p>:<form className="address-form" onSubmit={save}><label>Recipient name *<input required maxLength={120} value={address.recipient_name} onChange={e=>setAddress({...address,recipient_name:e.target.value})}/></label><label>Mobile number *<input required type="tel" pattern="09[0-9]{9}" placeholder="09XXXXXXXXX" value={address.phone} onChange={e=>setAddress({...address,phone:e.target.value})}/></label><label>Province / NCR *<select required value={address.province} onChange={e=>setAddress({...address,province:e.target.value,city:'',barangay:''})}><option value="">Select province</option>{provinces.map(p=><option key={p} value={p}>{p}</option>)}</select></label><div className="address-row"><label>City / municipality *<input required maxLength={120} value={address.city} onChange={e=>setAddress({...address,city:e.target.value})} placeholder="e.g. Cauayan City"/></label><label>Barangay *<input required maxLength={120} value={address.barangay} onChange={e=>setAddress({...address,barangay:e.target.value})} placeholder="Enter barangay"/></label></div><label>House no., street, subdivision *<input required maxLength={255} value={address.street_address} onChange={e=>setAddress({...address,street_address:e.target.value})}/></label><label>Postal code (optional)<input inputMode="numeric" pattern="[0-9]{4}" maxLength={4} value={address.postal_code} onChange={e=>setAddress({...address,postal_code:e.target.value})}/></label><button className="primary-button" disabled={saving}><Save size={17}/>{saving?'Saving…':'Save address'}</button></form>}{message&&<p className="account-message" role="status">{message}</p>}</section>;
}
