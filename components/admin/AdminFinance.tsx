
import React, { useState, useMemo } from 'react';
import { FinanceTransaction, FeeStructure, Student } from '../../types';
import { Wallet, Search, Plus, Download, CreditCard, Check, Clock, DollarSign, Printer, Smartphone, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { useStudentData } from '../../context/StudentDataContext';

// Reusing types from AdminPortal locally to avoid complex exports, 
// or one could export them from types.ts if they were common UI types.
const inputClass = "w-full h-12 px-4 rounded-lg border border-gray-200 focus:border-brand-sky focus:ring-2 focus:ring-brand-sky/20 outline-none transition-all font-medium text-gray-700 bg-white hover:border-brand-sky/50 disabled:bg-gray-100 disabled:cursor-not-allowed";
const cardBase = "bg-white rounded-[12px] shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow";

const AdminFinance = () => {
  const { transactions, students, feeStructures, addFeeStructure, addTransaction } = useStudentData();
  
  const [financeView, setFinanceView] = useState<'OVERVIEW' | 'LEDGER' | 'FEES'>('OVERVIEW');
  const [financeSearch, setFinanceSearch] = useState('');
  const [financeFilter, setFinanceFilter] = useState<'ALL' | 'PAID' | 'PENDING'>('ALL');
  const [financeStartDate, setFinanceStartDate] = useState('');
  const [financeEndDate, setFinanceEndDate] = useState('');
  
  // Payment Modal State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentStudentSearch, setPaymentStudentSearch] = useState('');
  const [selectedStudentForPay, setSelectedStudentForPay] = useState<Student | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [paymentType, setPaymentType] = useState('TUITION');
  const [paymentReference, setPaymentReference] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Fee Builder
  const [isFeeBuilderOpen, setIsFeeBuilderOpen] = useState(false);
  const [feeForm, setFeeForm] = useState<Partial<FeeStructure>>({
      grade: 'Grade 1',
      term: 'Term 1',
      academicYear: new Date().getFullYear().toString(),
      items: [{ name: 'Tuition Fee', amount: 0 }],
      status: 'DRAFT'
  });

  // Metrics
  const totalCollected = transactions.filter(t => t.status === 'PAID').reduce((acc, curr) => acc + curr.amount, 0);
  const outstandingTotal = students.reduce((acc, curr) => acc + curr.balance, 0);
  const mpesaVolume = transactions.filter(t => t.method === 'MPESA').reduce((acc, curr) => acc + curr.amount, 0);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const matchesSearch = t.studentName.toLowerCase().includes(financeSearch.toLowerCase()) || (t.reference && t.reference.toLowerCase().includes(financeSearch.toLowerCase()));
      const matchesStatus = financeFilter === 'ALL' || t.status === financeFilter;
      let matchesDate = true;
      if (financeStartDate) {
          matchesDate = new Date(t.date) >= new Date(financeStartDate);
      }
      if (financeEndDate && matchesDate) {
          matchesDate = new Date(t.date) <= new Date(financeEndDate);
      }
      return matchesSearch && matchesStatus && matchesDate;
    }).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, financeSearch, financeFilter, financeStartDate, financeEndDate]);

  const searchedStudentsForPayment = useMemo(() => {
      if (paymentStudentSearch.length < 2) return [];
      return students.filter(s => s.name.toLowerCase().includes(paymentStudentSearch.toLowerCase()) || s.admissionNumber.toLowerCase().includes(paymentStudentSearch.toLowerCase()));
  }, [students, paymentStudentSearch]);

  const handleManualPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentForPay) return;
    setIsProcessingPayment(true);
    await addTransaction({
      studentId: selectedStudentForPay.id,
      studentName: selectedStudentForPay.name,
      amount: parseInt(paymentAmount),
      type: paymentType as any,
      date: new Date().toISOString().split('T')[0],
      status: 'PAID',
      method: paymentMethod as any,
      reference: paymentReference
    });
    setIsProcessingPayment(false);
    setShowPaymentModal(false);
    setPaymentStudentSearch(''); setSelectedStudentForPay(null); setPaymentAmount(''); setPaymentReference('');
    alert('Payment recorded successfully.');
  };

  return (
    <div className="space-y-6 animate-slide-up">
        {/* Sub Navigation */}
        <div className="flex gap-4 border-b border-gray-200 pb-1">
            {['OVERVIEW', 'LEDGER', 'FEES'].map(view => (
                <button 
                key={view}
                onClick={() => setFinanceView(view as any)}
                className={`px-4 py-2 font-bold text-sm border-b-2 transition-colors ${financeView === view ? 'border-brand-blue text-brand-blue' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    {view === 'FEES' ? 'Fee Structures' : view === 'LEDGER' ? 'Transaction Ledger' : 'Dashboard'}
                </button>
            ))}
        </div>

        {/* OVERVIEW */}
        {financeView === 'OVERVIEW' && (
            <div className="space-y-6 animate-fade-in">
                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className={`${cardBase} bg-gradient-to-br from-brand-blue to-blue-900 border-none text-white`}>
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <p className="text-blue-200 text-xs font-bold uppercase tracking-wider">Total Revenue</p>
                                <p className="text-[10px] opacity-70">Current Term</p>
                            </div>
                            <div className="p-2 bg-white/10 rounded-lg"><Wallet size={20}/></div>
                        </div>
                        <p className="text-3xl font-bold font-sans">KES {totalCollected.toLocaleString()}</p>
                    </div>
                    
                    <div className={cardBase}>
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Outstanding Balance</p>
                                <p className="text-[10px] text-gray-400">Uncollected Fees</p>
                            </div>
                            <div className="p-2 bg-brand-yellow/10 text-brand-yellow rounded-lg"><AlertCircle size={20}/></div>
                        </div>
                        <p className="text-3xl font-bold font-sans text-brand-yellow">KES {outstandingTotal.toLocaleString()}</p>
                    </div>

                    <div className={cardBase}>
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">MPesa Intake</p>
                                <p className="text-[10px] text-gray-400">Total Volume</p>
                            </div>
                            <div className="p-2 bg-brand-green/10 text-brand-green rounded-lg"><Smartphone size={20}/></div>
                        </div>
                        <p className="text-3xl font-bold font-sans text-brand-green">KES {mpesaVolume.toLocaleString()}</p>
                    </div>
                </div>

                {/* Recent Activity */}
                <div className={cardBase}>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-display font-bold text-lg text-gray-800">Recent Activity Feed</h3>
                        <button onClick={() => setFinanceView('LEDGER')} className="text-xs font-bold text-brand-blue hover:underline">View Full Ledger</button>
                    </div>
                    <div className="space-y-0 divide-y divide-gray-50">
                        {transactions.slice(0, 5).map(t => (
                            <div key={t.id} className="py-3 flex justify-between items-center hover:bg-gray-50 transition-colors px-2 -mx-2 rounded">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-full ${t.method === 'MPESA' ? 'bg-brand-green/10 text-brand-green' : 'bg-brand-blue/10 text-brand-blue'}`}>
                                        {t.method === 'MPESA' ? <Smartphone size={16}/> : <CreditCard size={16}/>}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-800">{t.studentName}</p>
                                        <p className="text-[10px] text-gray-500">{format(new Date(t.date), 'dd MMM yyyy')} • {t.type}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-mono font-bold text-brand-green text-sm">+{t.amount.toLocaleString()}</p>
                                    <p className="text-[10px] text-gray-400 uppercase">{t.status}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )}

        {/* LEDGER */}
        {financeView === 'LEDGER' && (
            <div className="space-y-4 animate-fade-in">
                {/* Controls */}
                <div className="flex flex-col md:flex-row justify-between gap-4 bg-white p-4 rounded-[12px] border border-gray-100 shadow-sm">
                    <div className="flex gap-2 flex-1">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16}/>
                            <input 
                                type="text" 
                                placeholder="Search Student or Ref..." 
                                value={financeSearch}
                                onChange={(e) => setFinanceSearch(e.target.value)}
                                className={`${inputClass} pl-10 h-10 text-sm`}
                            />
                        </div>
                        <select 
                            value={financeFilter} 
                            onChange={(e) => setFinanceFilter(e.target.value as any)}
                            className={`${inputClass} w-32 h-10 text-sm`}
                        >
                            <option value="ALL">All Status</option>
                            <option value="PAID">Paid</option>
                            <option value="PENDING">Pending</option>
                        </select>
                    </div>
                    <div className="flex gap-2">
                        <input type="date" value={financeStartDate} onChange={(e) => setFinanceStartDate(e.target.value)} className={`${inputClass} w-auto h-10 text-sm`}/>
                        <span className="self-center text-gray-400">-</span>
                        <input type="date" value={financeEndDate} onChange={(e) => setFinanceEndDate(e.target.value)} className={`${inputClass} w-auto h-10 text-sm`}/>
                        <button onClick={() => setShowPaymentModal(true)} className="px-4 h-10 bg-brand-blue text-white rounded-lg font-bold text-sm shadow hover:bg-brand-blue/90 flex items-center gap-2">
                            <Plus size={16}/> Record Payment
                        </button>
                        <button onClick={() => alert("Exporting...")} className="px-4 h-10 border border-gray-200 text-gray-600 rounded-lg font-bold text-sm hover:bg-gray-50 flex items-center gap-2">
                            <Download size={16}/> Export
                        </button>
                    </div>
                </div>

                {/* Data Table */}
                <div className="bg-white rounded-[12px] border border-gray-100 shadow-sm overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-500 font-bold text-xs uppercase border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Ref No.</th>
                                <th className="px-6 py-4">Student</th>
                                <th className="px-6 py-4 text-right">Amount</th>
                                <th className="px-6 py-4 text-center">Method</th>
                                <th className="px-6 py-4 text-center">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredTransactions.map(t => (
                                <tr key={t.id} className="hover:bg-gray-50 transition-colors group">
                                    <td className="px-6 py-4 text-gray-600 font-mono text-xs">{t.date}</td>
                                    <td className="px-6 py-4 text-gray-800 font-bold text-xs">{t.reference || '-'}</td>
                                    <td className="px-6 py-4 font-bold text-gray-700">{t.studentName}</td>
                                    <td className="px-6 py-4 text-right font-mono font-bold text-brand-green">{t.amount.toLocaleString()}</td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="px-2 py-1 bg-gray-100 rounded text-[10px] font-bold text-gray-600 uppercase">{t.method}</span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold uppercase ${t.status === 'PAID' ? 'bg-brand-green/10 text-brand-green' : 'bg-brand-yellow/10 text-brand-yellow'}`}>
                                            {t.status === 'PAID' ? <Check size={10}/> : <Clock size={10}/>} {t.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button className="p-2 text-gray-400 hover:text-brand-blue hover:bg-brand-blue/5 rounded transition-colors" title="Print Receipt">
                                                <Printer size={16}/>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredTransactions.length === 0 && (
                                <tr><td colSpan={7} className="text-center py-8 text-gray-400 italic">No transactions found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

        {/* FEE STRUCTURES */}
        {financeView === 'FEES' && (
            <div className="space-y-6 animate-fade-in">
                <div className="flex justify-between items-center">
                    <h3 className="font-display font-bold text-lg text-gray-800">Grade Fee Configurations</h3>
                    <button 
                        onClick={() => setIsFeeBuilderOpen(true)}
                        className="px-4 py-2 bg-brand-blue text-white rounded-[12px] font-bold text-sm shadow-lg hover:bg-brand-blue/90 flex items-center gap-2"
                    >
                        <Plus size={16}/> Create Structure
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {feeStructures.map(fs => (
                        <div key={fs.id} className="bg-white rounded-[12px] border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <DollarSign size={64} className="text-brand-blue"/>
                            </div>
                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h4 className="font-display font-bold text-xl text-gray-800">{fs.grade}</h4>
                                        <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">{fs.term} • {fs.academicYear}</p>
                                    </div>
                                    <span className="px-2 py-1 bg-brand-green/10 text-brand-green text-[10px] font-bold uppercase rounded border border-brand-green/20">Published</span>
                                </div>
                                
                                <div className="space-y-2 mb-6">
                                    {fs.items.map((item, idx) => (
                                        <div key={idx} className="flex justify-between text-sm border-b border-gray-50 pb-1 last:border-0">
                                            <span className="text-gray-600">{item.name}</span>
                                            <span className="font-mono font-bold text-gray-800">{item.amount.toLocaleString()}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                                    <span className="text-xs font-bold text-gray-400 uppercase">Total Fees</span>
                                    <span className="text-2xl font-bold font-display text-brand-blue">KES {fs.total.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                    {feeStructures.length === 0 && (
                        <div className="col-span-full py-12 text-center bg-gray-50 rounded-[12px] border border-dashed border-gray-200">
                            <p className="text-gray-400 italic">No fee structures defined yet.</p>
                        </div>
                    )}
                </div>
            </div>
        )}
    </div>
  );
};

export default AdminFinance;
