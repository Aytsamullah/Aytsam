
import React, { useState } from 'react';

const ArchitectureView: React.FC = () => {
  const [activeApiTab, setActiveApiTab] = useState<'auth' | 'patients' | 'clinical'>('auth');

  const apiEndpoints = {
    auth: [
      { method: 'POST', path: '/auth/register', desc: 'Initialize signup with CNIC, Email, & Password' },
      { method: 'POST', path: '/auth/verify', desc: 'Confirm 6-digit OTP and activate account' },
      { method: 'POST', path: '/auth/login', desc: 'Verify credentials and issue JWT' },
      { method: 'POST', path: '/auth/resend', desc: 'Trigger new OTP dispatch (60s cooldown)' },
    ],
    patients: [
      { method: 'GET', path: '/patients/search?cnic={id}', desc: 'Doctor-only lookup for patient profile' },
      { method: 'GET', path: '/patients/{id}', desc: 'Retrieve core identity data' },
      { method: 'GET', path: '/patients/{id}/history', desc: 'Fetch full longitudinal medical record' },
    ],
    clinical: [
      { method: 'POST', path: '/treatments', desc: 'Append new immutable clinical encounter' },
      { method: 'POST', path: '/treatments/{id}/files', desc: 'Upload binary diagnostic assets (DICOM/PDF)' },
      { method: 'GET', path: '/files/{id}/download', desc: 'Secure temporary link for medical assets' },
    ]
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in duration-700 pb-12">
      <header className="text-center space-y-4">
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">System Architecture Design</h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          A high-security EMR framework utilizing multi-factor authentication and immutable clinical records.
        </p>
      </header>

      {/* API Contract Section */}
      <section className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 text-indigo-600">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
            <h2 className="text-2xl font-bold text-slate-900">REST API Contracts</h2>
          </div>
          <div className="flex p-1 bg-slate-100 rounded-lg">
            {(['auth', 'patients', 'clinical'] as const).map(tab => (
              <button 
                key={tab}
                onClick={() => setActiveApiTab(tab)}
                className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all capitalize ${activeApiTab === tab ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="border border-slate-100 rounded-2xl overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3">Method</th>
                <th className="px-6 py-3">Endpoint</th>
                <th className="px-6 py-3">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {apiEndpoints[activeApiTab].map((endpoint, i) => (
                <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded font-mono text-[10px] font-bold ${
                      endpoint.method === 'GET' ? 'bg-emerald-100 text-emerald-700' : 
                      endpoint.method === 'POST' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {endpoint.method}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-slate-600">
                    /api/v1{endpoint.path}
                  </td>
                  <td className="px-6 py-4 text-slate-500 text-xs">
                    {endpoint.desc}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* JSON Example Card */}
        <div className="bg-slate-900 rounded-2xl p-6 overflow-hidden relative group">
          <div className="flex justify-between items-center mb-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Request Payload Example</span>
            <span className="text-[10px] text-emerald-400 font-mono">application/json</span>
          </div>
          <pre className="text-xs text-indigo-300 font-mono leading-relaxed overflow-x-auto">
{`{
  "endpoint": "POST /api/v1/treatments",
  "payload": {
    "patient_id": "uuid-v4-string",
    "diagnosis": "Bacterial Sinusitis",
    "medication": "Amoxicillin 500mg (7 days)",
    "notes": "Patient presents with pressure and congestion.",
    "attachments": ["blob_id_1", "blob_id_2"]
  },
  "security": "Bearer eyJhbGciOiJIUzI1..."
}`}
          </pre>
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <svg className="w-24 h-24 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M13 2L3 14h9v8l10-12h-9l9-8z"/></svg>
          </div>
        </div>
      </section>

      {/* Security Deep Dive */}
      <section className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-8">
        <div className="flex items-center space-x-3 text-blue-600">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
          <h2 className="text-2xl font-bold text-slate-900">OTP Verification & Security</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h4 className="font-bold text-slate-800 flex items-center">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></span>
              The 5-Step Verification Flow
            </h4>
            <div className="space-y-3">
              {[
                { step: "1", title: "Registration", desc: "User submits CNIC, Email, and salted Password hash." },
                { step: "2", title: "OTP Dispatch", desc: "6-digit CSPRNG code sent via TLS-encrypted SMTP." },
                { step: "3", title: "Expiry Window", desc: "OTP is valid for exactly 5 minutes (300 seconds)." },
                { step: "4", title: "Rate Limiting", desc: "Max 3 attempts per OTP. Failed attempts trigger a lockout." },
                { step: "5", title: "Activation", desc: "Account transitions from 'Pending' to 'Active' status." }
              ].map((item, i) => (
                <div key={i} className="flex items-start">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-[10px] font-bold mt-0.5 mr-3">{item.step}</span>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{item.title}</p>
                    <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
              <h4 className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-4">Security Implementation</h4>
              <ul className="space-y-3 text-sm">
                <li className="flex justify-between">
                  <span className="text-slate-600">Password Hashing</span>
                  <span className="font-mono text-slate-900 font-bold">Argon2id</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-slate-600">Entropy Source</span>
                  <span className="font-mono text-slate-900 font-bold">CSPRNG /dev/urandom</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-slate-600">Brute Force Limit</span>
                  <span className="font-mono text-slate-900 font-bold">3 Attempts</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-slate-600">Resend Cooldown</span>
                  <span className="font-mono text-slate-900 font-bold">60 Seconds</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Database Schema Section */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center">
          <span className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white mr-3">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" /></svg>
          </span>
          Relational Database Schema
        </h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="bg-slate-800 text-white px-3 py-2 text-xs font-bold uppercase tracking-wider">Patients</div>
            <div className="p-3 space-y-2">
              <div className="flex justify-between text-xs border-b border-slate-100 pb-1">
                <span className="text-slate-500">patient_id</span>
                <span className="font-mono text-blue-600">UUID (PK)</span>
              </div>
              <div className="flex justify-between text-xs border-b border-slate-100 pb-1">
                <span className="text-slate-500">pass_hash</span>
                <span className="font-mono text-red-400">VarChar</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">is_verified</span>
                <span className="font-mono text-slate-600">Bool</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="bg-slate-800 text-white px-3 py-2 text-xs font-bold uppercase tracking-wider">OTP_Ledger</div>
            <div className="p-3 space-y-2">
              <div className="flex justify-between text-xs border-b border-slate-100 pb-1">
                <span className="text-slate-500">otp_id</span>
                <span className="font-mono text-blue-600">UUID</span>
              </div>
              <div className="flex justify-between text-xs border-b border-slate-100 pb-1">
                <span className="text-slate-500">code_hash</span>
                <span className="font-mono text-slate-600">SHA-256</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">expiry</span>
                <span className="font-mono text-slate-600">Timestamp</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-900 text-slate-100 p-8 rounded-3xl overflow-hidden relative">
        <div className="relative z-10 space-y-6">
          <h2 className="text-2xl font-bold flex items-center">
            <span className="bg-blue-500 w-1.5 h-6 rounded-full mr-3"></span>
            Security Protocols
          </h2>
          <div className="grid md:grid-cols-2 gap-12">
            <div className="space-y-4">
              <h4 className="text-blue-400 font-semibold uppercase text-xs tracking-widest">Architectural Layers</h4>
              <p className="text-sm text-slate-400">A Zero-Trust approach where every clinical API request requires a verified JWT token and explicit role checks.</p>
            </div>
          </div>
        </div>
      </section>

      <div className="text-center">
        <p className="text-slate-500 mb-4">Experience the verification flow</p>
        <div className="inline-flex p-1 bg-slate-200 rounded-xl">
           <span className="px-4 py-2 text-sm font-medium text-slate-600 underline">Switch to App Simulator & Sign up as a Patient</span>
        </div>
      </div>
    </div>
  );
};

export default ArchitectureView;
