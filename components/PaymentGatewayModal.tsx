
import React, { useState, useEffect } from 'react';
import { X, Smartphone, CreditCard, Landmark, Lock, Loader2, CheckCircle2, AlertCircle, ShieldCheck, ChevronRight, UploadCloud } from 'lucide-react';
import { useStudentData } from '../context/StudentDataContext';
import { Student } from '../types';

interface PaymentContext {
  type: 'TUITION' | 'TRIP' | 'EVENT' | 'UNIFORM' | 'LUNCH' | 'TRANSPORT';
  title: string;
  amount: number;
  eventId?: string; // Optional ID for linking trips/events
}

interface PaymentGatewayModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student;
  paymentContext: PaymentContext;
  onSuccess: () => void;
  userPhone?: string;
}

type PaymentMethod = 'MPESA' | 'CARD' | 'BANK';
type PaymentStatus = 'IDLE' | 'PROCESSING' | 'SUCCESS' | 'ERROR';

const PaymentGatewayModal: React.FC<PaymentGatewayModalProps> = ({ 
  isOpen, onClose, student, paymentContext, onSuccess, userPhone 
}) => {
  const { addTransaction, resolveLeaveRequest } = useStudentData(); // resolveLeaveRequest not needed here but context is
  
  const [method, setMethod] = useState<PaymentMethod>('MPESA');
  const [status, setStatus] = useState<PaymentStatus>('IDLE');
  const [errorMessage, setErrorMessage] = useState('');
  
  // State for Amounts
  const [payAmount, setPayAmount] = useState<number>(paymentContext.amount);
  const [isPartial, setIsPartial] = useState(false);

  // Form State
  const [mpesaNumber, setMpesaNumber] = useState(userPhone || '');
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [bankRef, setBankRef] = useState('');

  // Reset state on open
  useEffect(() => {
    if (isOpen) {
      setStatus('IDLE');
      setMethod('MPESA');
      setPayAmount(paymentContext.amount);
      setIsPartial(false);
      setMpesaNumber(userPhone || '');
      setErrorMessage('');
    }
  }, [isOpen, paymentContext, userPhone]);

  const handleProcessPayment = async () => {
    setStatus('PROCESSING');
    setErrorMessage('');

    // Simulate API Latency
    await new Promise(r => setTimeout(r, 2000));

    try {
      // Mock Validation
      if (method === 'MPESA') {
          // Basic Kenyan Phone Validation (starts with 07, 01, +254, 254)
          const phoneRegex = /^(?:254|\+254|0)?(7|1)\d{8}$/;
          if (!phoneRegex.test(mpesaNumber.replace(/\s+/g, ''))) {
              throw new Error("Invalid M-Pesa number format.");
          }
      }
      
      if (method === 'CARD' && cardNumber.length < 12) throw new Error("Invalid card number.");
      if (method === 'BANK' && bankRef.length < 5) throw new Error("Invalid reference code.");

      // Record Transaction
      await addTransaction({
        studentId: student.id,
        studentName: student.name,
        amount: payAmount,
        type: paymentContext.type,
        date: new Date().toISOString().split('T')[0],
        status: method === 'BANK' ? 'PENDING' : 'PAID', // Bank transfers might need approval
        method: method
      });

      setStatus('SUCCESS');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2500); // Close after showing success for a bit
    } catch (err: any) {
      setStatus('ERROR');
      setErrorMessage(err.message || "Transaction failed. Please try again.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-brand-blue/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* 1. Header Section */}
        <div className="bg-gray-50 p-6 border-b border-gray-100">
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-200 transition-colors">
            <X size={20} />
          </button>
          
          <div className="flex flex-col items-center text-center">
            <h3 className="text-gray-500 font-bold text-xs uppercase tracking-wider mb-2">{paymentContext.title}</h3>
            <div className="flex items-baseline gap-1">
              <span className="text-lg text-gray-400 font-sans font-medium">KES</span>
              <span className="text-4xl font-display font-bold text-brand-blue tracking-tight">
                {payAmount.toLocaleString()}
              </span>
            </div>
            <div className="mt-2 flex items-center gap-2 px-3 py-1 bg-white border border-gray-200 rounded-full text-xs font-bold text-gray-600 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-brand-green"></span>
              Student: {student.name}
            </div>
          </div>
        </div>

        {/* 2. Content Body */}
        <div className="p-6 flex-1 overflow-y-auto">
          
          {/* Status: SUCCESS */}
          {status === 'SUCCESS' && (
            <div className="flex flex-col items-center justify-center py-8 animate-slide-up">
              <div className="w-16 h-16 bg-brand-green/10 rounded-full flex items-center justify-center text-brand-green mb-4">
                <CheckCircle2 size={32} strokeWidth={3} />
              </div>
              <h3 className="text-xl font-bold text-brand-green mb-2">Payment Successful!</h3>
              <p className="text-gray-500 text-sm text-center">
                Your transaction has been processed. <br/> A receipt has been sent to your email.
              </p>
            </div>
          )}

          {/* Status: IDLE / PROCESSING / ERROR */}
          {status !== 'SUCCESS' && (
            <div className="space-y-6">
              
              {/* Partial Payment Toggle (Fees Only) */}
              {paymentContext.type === 'TUITION' && (
                <div className="flex items-center justify-between p-3 bg-brand-grey/30 rounded-xl border border-gray-100">
                  <span className="text-sm font-bold text-gray-700">Pay Custom Amount</span>
                  <button 
                    onClick={() => {
                        const newPartial = !isPartial;
                        setIsPartial(newPartial);
                        if (!newPartial) setPayAmount(paymentContext.amount);
                    }}
                    className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out ${isPartial ? 'bg-brand-blue' : 'bg-gray-300'}`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform duration-200 ${isPartial ? 'translate-x-6' : 'translate-x-0'}`} />
                  </button>
                </div>
              )}

              {isPartial && (
                 <div className="animate-fade-in">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Enter Amount (KES)</label>
                    <input 
                      type="number" 
                      value={payAmount}
                      onChange={(e) => setPayAmount(parseInt(e.target.value) || 0)}
                      className="w-full h-12 px-4 rounded-lg border-2 border-brand-blue/20 focus:border-brand-blue focus:ring-4 focus:ring-brand-blue/10 outline-none text-lg font-bold text-gray-800 transition-all"
                    />
                 </div>
              )}

              {/* Method Tabs */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-3">Select Payment Method</label>
                <div className="grid grid-cols-3 gap-2">
                  <button 
                    onClick={() => setMethod('MPESA')}
                    className={`h-12 flex flex-col items-center justify-center rounded-xl border transition-all ${method === 'MPESA' ? 'border-brand-green bg-brand-green/5 text-brand-green shadow-sm' : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50'}`}
                  >
                    <span className="text-xs font-bold">M-Pesa</span>
                  </button>
                  <button 
                    onClick={() => setMethod('CARD')}
                    className={`h-12 flex flex-col items-center justify-center rounded-xl border transition-all ${method === 'CARD' ? 'border-brand-blue bg-brand-blue/5 text-brand-blue shadow-sm' : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50'}`}
                  >
                    <span className="text-xs font-bold">Card</span>
                  </button>
                  <button 
                    onClick={() => setMethod('BANK')}
                    className={`h-12 flex flex-col items-center justify-center rounded-xl border transition-all ${method === 'BANK' ? 'border-brand-blue bg-brand-blue/5 text-brand-blue shadow-sm' : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50'}`}
                  >
                    <span className="text-xs font-bold">Bank</span>
                  </button>
                </div>
              </div>

              {/* Method Specific Forms */}
              <div className="min-h-[180px]">
                {method === 'MPESA' && (
                  <div className="animate-fade-in space-y-4">
                    <div className="p-4 bg-green-50 border border-green-100 rounded-xl flex items-start gap-3">
                       <Smartphone className="text-brand-green shrink-0 mt-1" size={20}/>
                       <div>
                          <h4 className="text-sm font-bold text-gray-800">Express Checkout</h4>
                          <p className="text-xs text-gray-600 mt-1">Enter your M-Pesa number. You will receive a prompt on your phone to enter your PIN.</p>
                       </div>
                    </div>
                    <div>
                       <label className="block text-xs font-bold text-gray-500 uppercase mb-2">M-Pesa Phone Number</label>
                       <input 
                          type="tel" 
                          value={mpesaNumber}
                          onChange={(e) => setMpesaNumber(e.target.value)}
                          placeholder="07XX XXX XXX" 
                          className="w-full h-12 px-4 rounded-lg border border-gray-200 focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 outline-none transition-all font-medium"
                        />
                    </div>
                  </div>
                )}

                {method === 'CARD' && (
                  <div className="animate-fade-in space-y-4">
                     <div className="relative">
                        <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18}/>
                        <input 
                          type="text" 
                          placeholder="Card Number" 
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value)}
                          className="w-full h-12 pl-12 pr-4 rounded-lg border border-gray-200 focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 outline-none transition-all font-medium"
                        />
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <input 
                          type="text" 
                          placeholder="MM/YY" 
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          className="w-full h-12 px-4 rounded-lg border border-gray-200 focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 outline-none transition-all font-medium"
                        />
                        <div className="relative">
                           <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16}/>
                           <input 
                             type="text" 
                             placeholder="CVC" 
                             value={cardCvc}
                             onChange={(e) => setCardCvc(e.target.value)}
                             className="w-full h-12 pl-10 pr-4 rounded-lg border border-gray-200 focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 outline-none transition-all font-medium"
                           />
                        </div>
                     </div>
                     <input 
                       type="text" 
                       placeholder="Cardholder Name" 
                       value={cardName}
                       onChange={(e) => setCardName(e.target.value)}
                       className="w-full h-12 px-4 rounded-lg border border-gray-200 focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 outline-none transition-all font-medium"
                     />
                     <div className="flex items-center gap-2 justify-center text-xs text-gray-400">
                        <Lock size={12}/> Secure 256-bit SSL Encrypted
                     </div>
                  </div>
                )}

                {method === 'BANK' && (
                  <div className="animate-fade-in space-y-4">
                     <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-2">
                        <div className="flex justify-between text-sm">
                           <span className="text-gray-500">Bank Name</span>
                           <span className="font-bold text-gray-800">KCB Bank</span>
                        </div>
                        <div className="flex justify-between text-sm">
                           <span className="text-gray-500">Account No.</span>
                           <span className="font-bold text-gray-800 font-mono">1122 3344 55</span>
                        </div>
                        <div className="flex justify-between text-sm">
                           <span className="text-gray-500">Paybill</span>
                           <span className="font-bold text-gray-800 font-mono">522 522</span>
                        </div>
                     </div>
                     <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Transaction Reference</label>
                        <input 
                          type="text" 
                          value={bankRef}
                          onChange={(e) => setBankRef(e.target.value)}
                          placeholder="e.g. QWE123RTY" 
                          className="w-full h-12 px-4 rounded-lg border border-gray-200 focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 outline-none transition-all font-medium uppercase"
                        />
                     </div>
                     <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-gray-50 transition-colors">
                        <UploadCloud className="text-gray-400 mb-2" size={24}/>
                        <span className="text-xs font-bold text-brand-blue">Upload Proof of Payment</span>
                        <span className="text-[10px] text-gray-400 mt-1">PDF or Image (Max 2MB)</span>
                     </div>
                  </div>
                )}
              </div>

              {/* Error Message */}
              {errorMessage && (
                 <div className="p-3 bg-brand-red/10 border border-brand-red/20 rounded-lg flex items-center gap-2 text-brand-red text-sm font-bold animate-fade-in">
                    <AlertCircle size={16}/> {errorMessage}
                 </div>
              )}

            </div>
          )}
        </div>

        {/* 3. Footer Actions */}
        {status !== 'SUCCESS' && (
          <div className="p-6 bg-white border-t border-gray-100">
             <button 
                onClick={handleProcessPayment}
                disabled={status === 'PROCESSING'}
                className={`w-full h-14 rounded-xl font-bold text-white text-lg shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed ${method === 'MPESA' ? 'bg-brand-green shadow-brand-green/20 hover:bg-brand-green/90' : 'bg-brand-blue shadow-brand-blue/20 hover:bg-brand-blue/90'}`}
             >
                {status === 'PROCESSING' ? (
                   <Loader2 className="animate-spin" size={24}/>
                ) : (
                   <>
                      {method === 'MPESA' ? 'Pay with M-Pesa' : method === 'CARD' ? 'Pay Securely' : 'Submit Reference'}
                      <ChevronRight size={20} strokeWidth={3} className="opacity-50"/>
                   </>
                )}
             </button>
             <div className="text-center mt-4 flex items-center justify-center gap-2 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                <ShieldCheck size={12}/> Secure Payment Gateway
             </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default PaymentGatewayModal;
