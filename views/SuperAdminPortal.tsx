
import React, { useState, useMemo } from 'react';
import { useStudentData } from '../context/StudentDataContext';
import { useAuth } from '../context/AuthContext';
import { SchoolTenant, BillingStatus, SupportTicket } from '../types';
import { 
  Building2, Globe, Wallet, Activity, Search, LogIn, 
  AlertTriangle, ShieldCheck, CreditCard, ChevronRight, 
  Clock, CheckCircle2, User, MoreVertical, Plus, 
  Settings, Server, MessageSquare, ExternalLink, Filter
} from 'lucide-react';
import { format } from 'date-fns';

const SuperAdminPortal: React.FC = () => {
  const { schools, transactions, supportTickets, systemHealth, updateSchool, updateUser } = useStudentData();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'SCHOOLS' | 'BILLING' | 'SUPPORT' | 'SYSTEM'>('DASHBOARD');
  
  // -- GLOBAL METRICS --
  const totalStudents = schools.reduce((acc, curr) => acc + curr.studentCount, 0);
  const activeSchools = schools.filter(s => s.status === 'ACTIVE').length;
  const trialSchools = schools.filter(s => s.status === 'TRIAL').length;
  const totalRevenue = transactions
    .filter(t => t.type === 'LICENSE_FEE' && t.status === 'PAID')
    .reduce((acc, curr) => acc + curr.amount, 0);

  // -- SCHOOL SEARCH --
  const [schoolSearch, setSchoolSearch] = useState('');
  const [schoolFilter, setSchoolFilter] = useState<BillingStatus | 'ALL'>('ALL');

  const filteredSchools = useMemo(() => {
    return schools.filter(s => {
        const matchesSearch = s.name.toLowerCase().includes(schoolSearch.toLowerCase()) || s.slug.includes(schoolSearch.toLowerCase());
        const matchesStatus = schoolFilter === 'ALL' || s.status === schoolFilter;
        return matchesSearch && matchesStatus;
    });
  }, [schools, schoolSearch, schoolFilter]);

  // -- ESCALATED TICKETS --
  const escalatedTickets = supportTickets.filter(t => t.isEscalated);

  const getStatusColor = (status: BillingStatus) => {
    switch(status) {
        case 'ACTIVE': return 'bg-brand-green/10 text-brand-green border-brand-green/20';
        case 'TRIAL': return 'bg-brand-sky/10 text-brand-sky border-brand-sky/20';
        case 'PENDING_PAYMENT': return 'bg-brand-yellow/10 text-brand-yellow-600 border-brand-yellow/20';
        case 'SUSPENDED': return 'bg-brand-red/10 text-brand-red border-brand-red/20';
        default: return 'bg-gray-100 text-gray-500';
    }
  };

  const handleGrantGracePeriod = async (schoolId: string) => {
      const school = schools.find(s => s.id === schoolId);
      if(!school) return;
      const newExpiry = new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      await updateSchool(schoolId, { expiryDate: newExpiry, status: 'ACTIVE' });
      alert(`Grace period granted to ${school.name}. Expiry updated to ${newExpiry}`);
  };

  const cardBase = "bg-white rounded-[12px] shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow";
  const inputClass = "w-full h-12 px-4 rounded-[6px] border border-gray-200 focus:border-brand-sky focus:ring-2 focus:ring-brand-sky/20 outline-none transition-all font-medium text-gray-700 bg-white";

  return (
    <div className="space-y-8 animate-fade-in pb-12">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h1 className="text-2xl font-display font-bold text-brand-blue">Platform Management</h1>
                <p className="text-gray-500 text-sm">Overseeing {schools.length} tenants across Kenya.</p>
            </div>
            <div className="flex gap-2">
                {['DASHBOARD', 'SCHOOLS', 'BILLING', 'SUPPORT', 'SYSTEM'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab as any)}
                        className={`px-4 py-2 rounded-[12px] text-sm font-bold transition-all ${activeTab === tab ? 'bg-brand-blue text-white shadow-lg' : 'bg-white text-gray-600 border border-gray-100 hover:bg-gray-50'}`}
                    >
                        {tab.charAt(0) + tab.slice(1).toLowerCase()}
                    </button>
                ))}
            </div>
        </div>

        {/* METRIC STRIP */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className={cardBase}>
                <div className="flex justify-between items-start mb-4">
                    <div className="p-2 bg-brand-green/10 text-brand-green rounded-lg"><Wallet size={20}/></div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Revenue (KES)</span>
                </div>
                <p className="text-3xl font-bold font-sans">{totalRevenue.toLocaleString()}</p>
                <div className="mt-2 flex items-center gap-1 text-xs text-brand-green font-bold">
                    <Activity size={12}/> +12% from last term
                </div>
            </div>

            <div className={cardBase}>
                <div className="flex justify-between items-start mb-4">
                    <div className="p-2 bg-brand-blue/10 text-brand-blue rounded-lg"><Building2 size={20}/></div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Active Schools</span>
                </div>
                <p className="text-3xl font-bold font-sans">{activeSchools}</p>
                <p className="mt-2 text-xs text-gray-400 font-medium">{trialSchools} schools in trial</p>
            </div>

            <div className={cardBase}>
                <div className="flex justify-between items-start mb-4">
                    <div className="p-2 bg-brand-sky/10 text-brand-sky rounded-lg"><Globe size={20}/></div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Population</span>
                </div>
                <p className="text-3xl font-bold font-sans">{totalStudents.toLocaleString()}</p>
                <p className="mt-2 text-xs text-gray-400 font-medium">Billed at KES 150/student</p>
            </div>

            <div className={cardBase}>
                <div className="flex justify-between items-start mb-4">
                    <div className="p-2 bg-brand-green/10 text-brand-green rounded-lg"><Server size={20}/></div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Platform Health</span>
                </div>
                <p className="text-3xl font-bold font-sans">{systemHealth?.uptime || '99.9%'}</p>
                <p className="mt-2 text-xs text-brand-green font-bold flex items-center gap-1">
                    <ShieldCheck size={12}/> All Systems Operational
                </p>
            </div>
        </div>

        {/* MAIN VIEWS */}
        {activeTab === 'DASHBOARD' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-slide-up">
                {/* 1. escalated Tickets */}
                <div className={cardBase}>
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-display font-bold text-lg text-gray-800">Escalated Support</h3>
                        <button onClick={() => setActiveTab('SUPPORT')} className="text-xs font-bold text-brand-blue hover:underline">View All</button>
                    </div>
                    <div className="space-y-4">
                        {escalatedTickets.map(t => (
                            <div key={t.id} className="p-4 bg-brand-red/5 border border-brand-red/10 rounded-xl">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-[10px] font-bold text-brand-red uppercase tracking-tighter">School: {schools.find(s => s.id === t.schoolId)?.name}</span>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase">{format(new Date(t.updatedAt), 'MMM d, HH:mm')}</span>
                                </div>
                                <h4 className="font-bold text-sm text-gray-800">{t.subject}</h4>
                                <div className="mt-4 flex gap-2">
                                    <button className="flex-1 py-1.5 bg-brand-blue text-white text-[10px] font-bold rounded-lg shadow-sm">Review</button>
                                    <button className="flex-1 py-1.5 bg-white border border-gray-200 text-gray-600 text-[10px] font-bold rounded-lg">Dismiss</button>
                                </div>
                            </div>
                        ))}
                        {escalatedTickets.length === 0 && <p className="text-center py-10 text-gray-400 italic">No escalated platform issues.</p>}
                    </div>
                </div>

                {/* 2. Platform Health Details */}
                <div className={cardBase}>
                    <h3 className="font-display font-bold text-lg text-gray-800 mb-6">Internal Services Health</h3>
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-gray-50 pb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gray-100 rounded-lg text-gray-500"><CreditCard size={18}/></div>
                                <div><p className="text-sm font-bold text-gray-800">M-Pesa Daraja API</p><p className="text-[10px] text-gray-400">Main Payment Processor</p></div>
                            </div>
                            <span className="px-2 py-0.5 rounded-full bg-brand-green/10 text-brand-green text-[10px] font-bold">STABLE</span>
                        </div>
                        <div className="flex items-center justify-between border-b border-gray-50 pb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gray-100 rounded-lg text-gray-500"><MessageSquare size={18}/></div>
                                <div><p className="text-sm font-bold text-gray-800">SMS Gateway</p><p className="text-[10px] text-gray-400">Africa's Talking API</p></div>
                            </div>
                            <span className="px-2 py-0.5 rounded-full bg-brand-green/10 text-brand-green text-[10px] font-bold">STABLE</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gray-100 rounded-lg text-gray-500"><Server size={18}/></div>
                                <div><p className="text-sm font-bold text-gray-800">Firebase Auth</p><p className="text-[10px] text-gray-400">Login Services</p></div>
                            </div>
                            <span className="px-2 py-0.5 rounded-full bg-brand-yellow/10 text-brand-yellow-600 text-[10px] font-bold">DEGRADED (45ms)</span>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {activeTab === 'SCHOOLS' && (
            <div className="space-y-4 animate-slide-up">
                <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-[12px] border border-gray-100 shadow-sm">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18}/>
                        <input 
                            type="text" 
                            placeholder="Search Schools by Name or Slug..." 
                            value={schoolSearch}
                            onChange={(e) => setSchoolSearch(e.target.value)}
                            className={`${inputClass} pl-10 h-10 text-sm`}
                        />
                    </div>
                    <div className="w-full md:w-48 relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16}/>
                        <select 
                            value={schoolFilter} 
                            onChange={(e) => setSchoolFilter(e.target.value as any)}
                            className={`${inputClass} pl-10 h-10 text-sm`}
                        >
                            <option value="ALL">All Status</option>
                            <option value="ACTIVE">Active</option>
                            <option value="TRIAL">Trial</option>
                            <option value="PENDING_PAYMENT">Pending Payment</option>
                            <option value="SUSPENDED">Suspended</option>
                        </select>
                    </div>
                    <button className="px-4 h-10 bg-brand-blue text-white rounded-[12px] font-bold text-sm shadow hover:bg-brand-blue/90 flex items-center gap-2">
                        <Plus size={16}/> Onboard School
                    </button>
                </div>

                <div className="bg-white rounded-[12px] border border-gray-100 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 text-gray-500 font-bold text-xs uppercase border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-4">School Details</th>
                                    <th className="px-6 py-4">Students</th>
                                    <th className="px-6 py-4">Plan</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Next Billing</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredSchools.map(school => (
                                    <tr key={school.id} className="hover:bg-gray-50 group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <img src={school.logoUrl} className="w-10 h-10 rounded-full border border-gray-100" alt=""/>
                                                <div>
                                                    <p className="font-bold text-gray-800">{school.name}</p>
                                                    <p className="text-[10px] text-gray-400 font-mono tracking-wider">/{school.slug}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="font-bold text-brand-blue">{school.studentCount}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-[10px] font-bold text-gray-500 uppercase">{school.plan}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase border ${getStatusColor(school.status)}`}>
                                                {school.status.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-xs font-bold text-gray-600">{school.expiryDate}</p>
                                            {school.status === 'PENDING_PAYMENT' && (
                                                <button onClick={() => handleGrantGracePeriod(school.id)} className="text-[9px] font-bold text-brand-yellow-600 hover:underline">Extend (Grace)</button>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button 
                                                    className="px-3 py-1.5 bg-brand-sky/10 text-brand-sky rounded-[8px] text-[10px] font-bold hover:bg-brand-sky/20 transition-all flex items-center gap-1"
                                                    title="View School Portal"
                                                >
                                                    <LogIn size={12}/> Impersonate
                                                </button>
                                                <button className="p-2 text-gray-400 hover:text-brand-blue">
                                                    <Settings size={16}/>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        )}

        {activeTab === 'BILLING' && (
            <div className="space-y-6 animate-slide-up">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Revenue Over Time Chart Placeholder */}
                    <div className={`${cardBase} lg:col-span-2`}>
                        <h3 className="font-display font-bold text-lg text-gray-800 mb-6">SaaS Revenue Growth</h3>
                        <div className="h-64 bg-gray-50 rounded-xl border border-dashed border-gray-200 flex items-center justify-center">
                            <p className="text-gray-400 text-sm">Revenue Visualization Chart</p>
                        </div>
                    </div>
                    {/* Quick Ledger */}
                    <div className={cardBase}>
                        <h3 className="font-display font-bold text-lg text-gray-800 mb-6">Recent License Payments</h3>
                        <div className="space-y-4">
                            {transactions.filter(t => t.type === 'LICENSE_FEE').slice(0, 5).map(t => (
                                <div key={t.id} className="flex justify-between items-center pb-3 border-b border-gray-50 last:border-0">
                                    <div>
                                        <p className="text-xs font-bold text-gray-800">{t.studentName}</p>
                                        <p className="text-[10px] text-gray-400">{t.date}</p>
                                    </div>
                                    <span className="font-mono font-bold text-brand-green text-xs">+{t.amount.toLocaleString()}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        )}

        {activeTab === 'SYSTEM' && (
            <div className="max-w-2xl animate-slide-up">
                <div className={cardBase}>
                    <h3 className="font-display font-bold text-lg text-gray-800 mb-6">Platform-Wide Settings</h3>
                    <div className="space-y-6">
                        <div className="flex items-center justify-between p-4 bg-brand-red/5 border border-brand-red/10 rounded-xl">
                            <div>
                                <h4 className="font-bold text-brand-red text-sm flex items-center gap-2">
                                    <AlertTriangle size={16}/> Maintenance Mode
                                </h4>
                                <p className="text-xs text-gray-600 mt-1">If active, all tenants will see a "Down for Maintenance" banner.</p>
                            </div>
                            <button className="w-12 h-6 bg-gray-200 rounded-full relative p-1">
                                <div className="w-4 h-4 bg-white rounded-full shadow transition-all"></div>
                            </button>
                        </div>
                        
                        <div className="p-4 bg-brand-blue/5 border border-brand-blue/10 rounded-xl">
                            <h4 className="font-bold text-brand-blue text-sm mb-4">Feature Rollout</h4>
                            <div className="space-y-3">
                                <label className="flex items-center justify-between cursor-pointer group">
                                    <span className="text-sm text-gray-700">Transport Intelligence Module</span>
                                    <input type="checkbox" defaultChecked className="w-4 h-4 accent-brand-blue"/>
                                </label>
                                <label className="flex items-center justify-between cursor-pointer group">
                                    <span className="text-sm text-gray-700">Parent Help Desk</span>
                                    <input type="checkbox" defaultChecked className="w-4 h-4 accent-brand-blue"/>
                                </label>
                                <label className="flex items-center justify-between cursor-pointer group">
                                    <span className="text-sm text-gray-700">Library Management (Beta)</span>
                                    <input type="checkbox" className="w-4 h-4 accent-brand-blue"/>
                                </label>
                            </div>
                        </div>
                    </div>
                    <div className="pt-6 border-t border-gray-100 mt-8 flex justify-end">
                        <button className="px-6 py-3 bg-brand-blue text-white rounded-xl font-bold shadow-lg shadow-brand-blue/20">Apply Global Config</button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default SuperAdminPortal;
