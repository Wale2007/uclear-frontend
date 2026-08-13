import React, { useState } from 'react';
import {
  UserCircle,
  Landmark,
  KeySquare,
  CheckCircle2,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';

function FieldGroup({ label, children }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-2xs font-semibold text-slate-500 uppercase tracking-wider">{label}</label>
      {children}
    </div>
  );
}

export default function Settings({ user, onUpdateUser, settings, onUpdateSettings }) {
  const [name,       setName]       = useState(user.name);
  const [email,      setEmail]      = useState(user.email);
  const [phone,      setPhone]      = useState(user.phone || '');
  const [department, setDepartment] = useState(user.department);
  const [level,      setLevel]      = useState(user.level || '100 Level');
  const [matricNo,   setMatricNo]   = useState(user.matricNo || '');
  const [staffId,    setStaffId]    = useState(user.staffId || '');

  const [mode,      setMode]      = useState(settings.mode);
  const [publicKey, setPublicKey] = useState(settings.publicKey || '');

  const [profileSaved, setProfileSaved] = useState(false);
  const [gatewaySaved, setGatewaySaved] = useState(false);

  const saveProfile = (e) => {
    e.preventDefault();
    onUpdateUser({
      ...user,
      name, email, phone, department, level,
      matricNo: user.role === 'student' ? matricNo : undefined,
      staffId:  user.role === 'staff'   ? staffId  : undefined,
    });
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2000);
  };

  const saveGateway = (e) => {
    e.preventDefault();
    onUpdateSettings({ mode, publicKey });
    setGatewaySaved(true);
    setTimeout(() => setGatewaySaved(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-4xl animate-fade-in">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900">Account Settings</h1>
        <p className="text-xs text-slate-500 mt-1">Manage your profile information and payment gateway configuration</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Profile Card */}
        <div className="card-premium p-6 lg:col-span-3 space-y-6">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="h-8 w-8 rounded-lg bg-brand-orange/10 flex items-center justify-center text-brand-orange">
              <UserCircle className="h-5 w-5" strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Profile Details</h2>
              <p className="text-2xs text-slate-400">Update your personal information</p>
            </div>
          </div>

          <form onSubmit={saveProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FieldGroup label="Full Name">
                <input type="text" required value={name} onChange={e => setName(e.target.value)} className="field" />
              </FieldGroup>
              <FieldGroup label="Email Address">
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="field" />
              </FieldGroup>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FieldGroup label="Phone Number">
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="field" />
              </FieldGroup>
              <FieldGroup label="Department">
                <input type="text" required value={department} onChange={e => setDepartment(e.target.value)} className="field" />
              </FieldGroup>
            </div>

            {user.role === 'student' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FieldGroup label="Matriculation Number">
                  <input type="text" required value={matricNo} onChange={e => setMatricNo(e.target.value)} className="field font-mono" />
                </FieldGroup>
                <FieldGroup label="Current Level">
                  <select value={level} onChange={e => setLevel(e.target.value)} className="field appearance-none cursor-pointer">
                    {['100 Level','200 Level','300 Level','400 Level','500 Level'].map(l => (
                      <option key={l}>{l}</option>
                    ))}
                  </select>
                </FieldGroup>
              </div>
            ) : (
              <FieldGroup label="Staff Identification Number">
                <input type="text" required value={staffId} onChange={e => setStaffId(e.target.value)} className="field font-mono" />
              </FieldGroup>
            )}

            <div className="pt-2">
              <button
                type="submit"
                className={`btn-primary h-9 text-xs px-4 flex items-center gap-2 ${profileSaved ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}
              >
                {profileSaved
                  ? <><CheckCircle2 className="h-4 w-4" /> Saved</>
                  : 'Save Profile'
                }
              </button>
            </div>
          </form>
        </div>

        {/* Gateway Configuration Card — Admin Only */}
        {user.role === 'admin' && (
        <div className="card-premium p-6 lg:col-span-2 space-y-6 flex flex-col justify-between">
          <div className="space-y-6">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="h-8 w-8 rounded-lg bg-brand-orange/10 flex items-center justify-center text-brand-orange">
                <Landmark className="h-5 w-5" strokeWidth={1.5} />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Payment Gateway</h2>
                <p className="text-2xs text-slate-400">Configure checkout integration</p>
              </div>
            </div>

            <form onSubmit={saveGateway} className="space-y-5">
              <div className="space-y-2">
                <p className="text-2xs font-semibold text-slate-400 uppercase tracking-wider">Gateway Mode</p>
                <div className="tabs-container">
                  {[
                    { val: 'simulated', label: 'Offline Mode' },
                    { val: 'live',      label: 'Live Checkout' },
                  ].map(({ val, label }) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setMode(val)}
                      className={`tab-btn text-2xs py-1.5 ${mode === val ? 'active' : ''}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {mode === 'live' ? (
                <div className="space-y-2 animate-fade-in">
                  <FieldGroup label="Flutterwave Public Key">
                    <div className="relative">
                      <KeySquare className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" strokeWidth={1.5} />
                      <input
                        type="text"
                        required
                        placeholder="FLWPUBK_TEST-..."
                        value={publicKey}
                        onChange={e => setPublicKey(e.target.value)}
                        className="field pl-9 font-mono text-2xs"
                      />
                    </div>
                  </FieldGroup>
                  <p className="text-2xs text-slate-400 leading-normal">
                    Enter your Flutterwave API key. Live keys begin with&nbsp;
                    <code className="font-mono bg-slate-100 px-1 py-0.5 rounded">FLWPUBK_TEST-</code>.
                  </p>
                </div>
              ) : (
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 animate-fade-in space-y-1.5">
                  <div className="flex items-center gap-2 text-slate-700">
                    <ShieldCheck className="h-4 w-4 text-brand-orange" strokeWidth={1.5} />
                    <span className="text-xs font-semibold">Offline Verification Mode</span>
                  </div>
                  <p className="text-2xs text-slate-400 leading-relaxed">
                    Payments are simulated locally. Receipts and clearance certificates are still fully generated and verifiable.
                  </p>
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  className={`btn-primary w-full h-9 text-xs ${gatewaySaved ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}
                >
                  {gatewaySaved ? 'Configuration Saved' : 'Save Configuration'}
                </button>
              </div>
            </form>
          </div>

          <a
            href="https://developer.flutterwave.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="pt-4 mt-2 border-t border-slate-100 flex items-center justify-between text-2xs text-slate-400 hover:text-brand-orange transition-colors"
          >
            <span>Flutterwave Developer Documentation</span>
            <ChevronRight className="h-3.5 w-3.5" strokeWidth={1.5} />
          </a>
        </div>
        )}
      </div>

      {/* Institutional Reference */}
      <div className="card-premium p-5 max-w-xl">
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheck className="h-4 w-4 text-brand-orange" strokeWidth={1.5} />
          <h3 className="text-2xs font-bold uppercase tracking-wider text-slate-500">Institutional Reference</h3>
        </div>
        <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-xs text-slate-600">
          {[
            { k: 'Account Category',    v: user.role === 'student' ? 'Student' : 'Academic / Administrative Staff' },
            { k: 'Unique Reference ID', v: user.matricNo || user.staffId || 'Not assigned' },
            { k: 'Department',          v: user.department || 'Not specified' },
            { k: 'Faculty',             v: user.faculty    || 'Not specified' },
          ].map(({ k, v }) => (
            <div key={k}>
              <p className="text-2xs font-semibold text-slate-400 uppercase tracking-wider">{k}</p>
              <p className="font-semibold text-slate-700 mt-0.5">{v}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
