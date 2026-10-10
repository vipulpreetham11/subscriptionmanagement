import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity, AlertCircle, ArrowDownRight, ArrowUpRight, Bell, CalendarDays,
  CheckCircle2, ChevronDown, CircleDollarSign, Clock3, CreditCard, LayoutDashboard,
  LogOut, Menu, Pencil, Plus, Search, Settings2, ShieldCheck, Trash2, X
} from 'lucide-react';
import { api, getToken, setToken } from './api';

const AUTH_ENABLED = import.meta.env.VITE_AUTH_ENABLED !== 'false';
const EMPTY_FORM = {
  serviceName: '', plan: '', amount: '', billingCycle: 'Monthly',
  startDate: new Date().toISOString().slice(0, 10),
  renewalDate: '', status: 'Active', notes: ''
};
const money = amount => new Intl.NumberFormat('en-IN', {
  style: 'currency', currency: 'INR', maximumFractionDigits: 2
}).format(Number(amount || 0));
const dateLabel = value => value ? new Date(value).toLocaleDateString('en-IN', {
  day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC'
}) : '—';
function derivedStatus(item) {
  if (item.status !== 'Active') return item.status;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const renewal = new Date(item.renewalDate); renewal.setHours(0, 0, 0, 0);
  if (renewal < today) return 'Overdue';
  const days = Math.ceil((renewal - today) / 86400000);
  if (days <= 7) return 'Due soon';
  return 'Active';
}
const initials = name => (name || 'User').split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();

function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const submit = async e => {
    e.preventDefault(); setBusy(true); setError('');
    try {
      const result = await api(`/auth/${mode}`, { method: 'POST', body: JSON.stringify(form) });
      setToken(result.token); onAuth(result.user);
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };
  return <div className="auth-page">
    <div className="auth-card">
      <div className="brand-mark"><CreditCard size={23}/></div>
      <div className="eyebrow">SUBSCRIPTION MANAGER</div>
      <h1>{mode === 'login' ? 'Welcome back' : 'Create your account'}</h1>
      <p className="muted">{mode === 'login' ? 'Sign in to manage your subscriptions.' : 'Keep your plans and renewals organized.'}</p>
      <form onSubmit={submit} className="auth-form">
        {mode === 'register' && <label>Full name<input required minLength="2" value={form.name} onChange={e => setForm({...form, name:e.target.value})} placeholder="Your name"/></label>}
        <label>Email address<input required type="email" value={form.email} onChange={e => setForm({...form, email:e.target.value})} placeholder="you@example.com"/></label>
        <label>Password<input required minLength="8" type="password" value={form.password} onChange={e => setForm({...form, password:e.target.value})} placeholder="At least 8 characters"/></label>
        {error && <div className="alert error"><AlertCircle size={16}/>{error}</div>}
        <button className="btn primary full" disabled={busy}>{busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}</button>
      </form>
      <p className="auth-switch">{mode === 'login' ? 'New here?' : 'Already have an account?'} <button onClick={() => {setMode(mode === 'login' ? 'register' : 'login');setError('')}}>{mode === 'login' ? 'Create an account' : 'Sign in'}</button></p>
      <div className="auth-foot"><ShieldCheck size={14}/> Your subscriptions are private to your account.</div>
    </div>
  </div>;
}

function SubscriptionModal({ item, onClose, onSave }) {
  const [form, setForm] = useState(item ? {
    ...item, amount: String(item.amount), startDate: item.startDate?.slice(0,10), renewalDate: item.renewalDate?.slice(0,10)
  } : EMPTY_FORM);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const update = (key, value) => setForm(prev => ({ ...prev, [key]: value }));
  const submit = async e => {
    e.preventDefault(); setError('');
    if (form.renewalDate < form.startDate) { setError('Renewal date cannot be before the start date.'); return; }
    setBusy(true);
    try { await onSave({ ...form, amount: Number(form.amount) }); onClose(); }
    catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };
  return <div className="modal-backdrop" onMouseDown={e => e.target === e.currentTarget && onClose()}>
    <div className="modal">
      <div className="modal-head"><div><h2>{item ? 'Edit subscription' : 'Add subscription'}</h2><p className="muted">Enter the service and billing details below.</p></div><button className="icon-btn" onClick={onClose} aria-label="Close"><X size={19}/></button></div>
      <form onSubmit={submit}>
        <div className="form-grid">
          <label>Service name *<input required maxLength="100" value={form.serviceName} onChange={e => update('serviceName',e.target.value)} placeholder="e.g. Netflix"/></label>
          <label>Plan name *<input required maxLength="100" value={form.plan} onChange={e => update('plan',e.target.value)} placeholder="e.g. Premium"/></label>
          <label>Amount (₹) *<input required min="0" step="0.01" type="number" value={form.amount} onChange={e => update('amount',e.target.value)} placeholder="499"/></label>
          <label>Billing cycle *<select value={form.billingCycle} onChange={e => update('billingCycle',e.target.value)}><option>Monthly</option><option>Yearly</option><option>Quarterly</option><option>Weekly</option></select></label>
          <label>Start date *<input required type="date" value={form.startDate} onChange={e => update('startDate',e.target.value)}/></label>
          <label>Renewal date *<input required type="date" value={form.renewalDate} onChange={e => update('renewalDate',e.target.value)}/></label>
          <label>Status<select value={form.status} onChange={e => update('status',e.target.value)}><option>Active</option><option>Paused</option><option>Cancelled</option></select></label>
          <label className="span-two">Notes<textarea rows="3" maxLength="500" value={form.notes || ''} onChange={e => update('notes',e.target.value)} placeholder="Optional details…"/></label>
        </div>
        {error && <div className="alert error"><AlertCircle size={16}/>{error}</div>}
        <div className="modal-actions"><button type="button" className="btn secondary" onClick={onClose}>Cancel</button><button className="btn primary" disabled={busy}>{busy ? 'Saving…' : item ? 'Save changes' : 'Add subscription'}</button></div>
      </form>
    </div>
  </div>;
}

export default function App() {
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(!AUTH_ENABLED);
  const [subscriptions, setSubscriptions] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, dueSoon: 0, overdue: 0, monthlySpend: 0 });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All statuses');
  const [modal, setModal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [mobileNav, setMobileNav] = useState(false);

  useEffect(() => {
    if (!AUTH_ENABLED) { setAuthReady(true); return; }
    if (!getToken()) { setAuthReady(true); setLoading(false); return; }
    api('/auth/me').then(result => setUser(result.user)).catch(() => { setToken(null); setUser(null); }).finally(() => setAuthReady(true));
  }, []);

  const load = useCallback(async () => {
    if (AUTH_ENABLED && !user) { setLoading(false); return; }
    setLoading(true); setError('');
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      if (statusFilter !== 'All statuses' && statusFilter !== 'Overdue' && statusFilter !== 'Due soon') params.set('status', statusFilter);
      const [list, summary] = await Promise.all([
        api(`/subscriptions?${params.toString()}`),
        api('/dashboard/stats')
      ]);
      let rows = list.subscriptions;
      if (statusFilter === 'Overdue' || statusFilter === 'Due soon') rows = rows.filter(s => derivedStatus(s) === statusFilter);
      setSubscriptions(rows); setStats(summary);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, [user, search, statusFilter]);

  useEffect(() => {
    if (!authReady) return;
    if (AUTH_ENABLED && !user) { setLoading(false); return; }
    load();
  }, [authReady, user, load]);

  const [hasNotified, setHasNotified] = useState(false);
  useEffect(() => {
    if (!loading && stats.total > 0 && !hasNotified) {
      if (Notification.permission !== "denied") {
        Notification.requestPermission().then(permission => {
          if (permission === "granted" && stats.dueSoon > 0) {
            new Notification("Subscription Alert", {
              body: `You have ${stats.dueSoon} renewal(s) coming up in the next 7 days! Your estimated monthly spend is ${money(stats.monthlySpend)}.`
            });
          }
        });
      }
      setHasNotified(true);
    }
  }, [loading, stats, hasNotified]);

  const save = async data => {
    const path = modal?.item ? `/subscriptions/${modal.item._id}` : '/subscriptions';
    await api(path, { method: modal?.item ? 'PUT' : 'POST', body: JSON.stringify(data) });
    setNotice(modal?.item ? 'Subscription updated successfully.' : 'Subscription added successfully.');
    await load();
  };
  const remove = async item => {
    if (!window.confirm(`Delete ${item.serviceName}? This cannot be undone.`)) return;
    try { await api(`/subscriptions/${item._id}`, { method: 'DELETE' }); setNotice('Subscription deleted.'); await load(); }
    catch (err) { setError(err.message); }
  };
  const signOut = () => { setToken(null); setUser(null); setSubscriptions([]); setStats({ total:0, active:0, dueSoon:0, overdue:0, monthlySpend:0 }); };
  const visibleSubscriptions = subscriptions;
  const greeting = useMemo(() => user?.name?.split(' ')[0] || 'there', [user]);

  if (!authReady) return <div className="page-loading"><div className="spinner"/>Checking session…</div>;
  if (AUTH_ENABLED && !user) return <AuthScreen onAuth={setUser}/>;

  return <div className="app-shell">
    <aside className={`sidebar ${mobileNav ? 'nav-open' : ''}`}>
      <div className="sidebar-brand"><div className="brand-mark small"><CreditCard size={19}/></div><span>SubTrack</span><span className="brand-tag">DEMO</span></div>
      <div className="nav-label">WORKSPACE</div>
      <button className="nav-item selected" onClick={() => setMobileNav(false)}><LayoutDashboard size={18}/>Dashboard</button>
      <button className="nav-item" onClick={() => {setStatusFilter('All statuses');setMobileNav(false)}}><CreditCard size={18}/>Subscriptions<span className="nav-count">{stats.total}</span></button>
      <button className="nav-item" onClick={() => {setStatusFilter('Due soon');setMobileNav(false)}}><CalendarDays size={18}/>Renewals {stats.dueSoon > 0 && <span className="nav-dot"/>}</button>
      <div className="sidebar-bottom">
        <div className="help-card"><div className="help-icon"><Activity size={17}/></div><strong>Stay on top of renewals</strong><p>Keep your services and upcoming payments in one place.</p></div>
        <div className="profile-row"><div className="avatar">{initials(user?.name || 'Demo User')}</div><div className="profile-copy"><strong>{user?.name || 'Demo User'}</strong><span>{user?.email || 'Local demo mode'}</span></div>{AUTH_ENABLED && <button className="icon-btn profile-logout" title="Sign out" onClick={signOut}><LogOut size={16}/></button>}</div>
      </div>
    </aside>
    {mobileNav && <button className="nav-scrim" onClick={() => setMobileNav(false)} aria-label="Close navigation"/>}
    <main className="main-content">
      <header className="topbar"><div className="topbar-left"><button className="icon-btn mobile-menu" onClick={() => setMobileNav(!mobileNav)}><Menu size={20}/></button><div className="breadcrumb">Workspace <span>/</span> <strong>Dashboard</strong></div></div><div className="topbar-right"><span className="today-label"><CalendarDays size={15}/>{new Date().toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</span><div className="top-avatar">{initials(user?.name || 'Demo User')}</div></div></header>
      <div className="content-wrap">
        <div className="page-heading"><div><div className="eyebrow">OVERVIEW</div><h1>Subscription dashboard</h1><p>Welcome back, {greeting}. Here's what's happening with your subscriptions.</p></div><button className="btn primary add-main" onClick={() => setModal({ item: null })}><Plus size={17}/> Add subscription</button></div>
        {notice && <div className="alert success"><CheckCircle2 size={17}/>{notice}<button className="alert-close" onClick={() => setNotice('')}><X size={15}/></button></div>}
        {error && <div className="alert error"><AlertCircle size={17}/>{error}<button className="alert-close" onClick={() => setError('')}><X size={15}/></button></div>}
        <section className="stats-grid">
          <div className="stat-card"><div className="stat-top"><span>Total subscriptions</span><div className="stat-icon purple"><CreditCard size={19}/></div></div><div className="stat-value">{stats.total}</div><div className="stat-foot">All services being tracked</div></div>
          <div className="stat-card"><div className="stat-top"><span>Active subscriptions</span><div className="stat-icon green"><CheckCircle2 size={19}/></div></div><div className="stat-value">{stats.active}</div><div className="stat-foot"><span className="tiny-dot green-dot"/>Currently active</div></div>
          <div className="stat-card"><div className="stat-top"><span>Renewals due soon</span><div className="stat-icon orange"><Bell size={19}/></div></div><div className="stat-value">{stats.dueSoon}</div><div className="stat-foot">Within the next 7 days</div></div>
          <div className="stat-card"><div className="stat-top"><span>Monthly equivalent</span><div className="stat-icon blue"><CircleDollarSign size={19}/></div></div><div className="stat-value money-value">{money(stats.monthlySpend)}</div><div className="stat-foot">Estimated active-plan spend</div></div>
        </section>
        <section className="table-panel">
          <div className="panel-head"><div><h2>Your subscriptions</h2><p>Manage your plans, costs, and renewal dates.</p></div><button className="btn secondary compact" onClick={load}><Activity size={15}/> Refresh</button></div>
          <div className="table-controls"><div className="search-box"><Search size={17}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search services or plans…"/></div><div className="filter-select"><Settings2 size={16}/><select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}><option>All statuses</option><option>Active</option><option>Paused</option><option>Cancelled</option><option>Due soon</option><option>Overdue</option></select><ChevronDown size={14}/></div></div>
          <div className="table-scroll"><table><thead><tr><th>Service / Plan</th><th>Amount</th><th>Billing cycle</th><th>Renewal date</th><th>Status</th><th className="actions-heading">Actions</th></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan="6"><div className="table-state"><div className="spinner"/>Loading subscriptions…</div></td></tr> :
              visibleSubscriptions.length === 0 ? <tr><td colSpan="6"><div className="empty-state"><div className="empty-icon"><CreditCard size={23}/></div><strong>No subscriptions found</strong><span>Add a subscription or adjust your search filters.</span><button className="btn primary compact" onClick={() => setModal({item:null})}><Plus size={15}/> Add subscription</button></div></td></tr> :
              visibleSubscriptions.map(item => {
                const state = derivedStatus(item);
                return <tr key={item._id}>
                  <td><div className="service-cell"><div className={`service-logo logo-${(item.serviceName || 's').toLowerCase().replace(/[^a-z]/g,'').slice(0,1)}`}>{(item.serviceName || '?').slice(0,1).toUpperCase()}</div><div className="service-text"><strong>{item.serviceName}</strong><span>{item.plan}</span></div></div></td>
                  <td><strong className="amount-cell">{money(item.amount)}</strong></td><td><span className="cycle-pill">{item.billingCycle}</span></td>
                  <td><div className="renewal-cell"><span>{dateLabel(item.renewalDate)}</span>{state === 'Due soon' && <small><Clock3 size={12}/> Upcoming</small>}{state === 'Overdue' && <small className="overdue-note"><AlertCircle size={12}/> Past due</small>}</div></td>
                  <td><span className={`status-pill status-${state.toLowerCase().replace(' ','-')}`}><span/>{state}</span></td>
                  <td><div className="row-actions"><button className="icon-btn edit-btn" title="Edit subscription" onClick={() => setModal({item})}><Pencil size={16}/></button><button className="icon-btn delete-btn" title="Delete subscription" onClick={() => remove(item)}><Trash2 size={16}/></button></div></td>
                </tr>;
              })}
            </tbody></table></div>
          <div className="table-footer"><span>Showing <strong>{visibleSubscriptions.length}</strong> subscription{visibleSubscriptions.length === 1 ? '' : 's'}</span><span><span className="footer-dot"/> Data saved to MongoDB</span></div>
        </section>
        <footer className="app-footer"><span>SubTrack <span>·</span> Subscription Management Dashboard</span><span>Built with React, Express & MongoDB</span></footer>
      </div>
    </main>
    {modal && <SubscriptionModal item={modal.item} onClose={() => setModal(null)} onSave={save}/>}
  </div>;
}
