
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, ArrowRight, Loader2, ChevronLeft, Check } from 'lucide-react';
import { UserRole } from '../types';

interface LoginViewProps {
  role: UserRole;
  onBack: () => void;
}

const LoginView: React.FC<LoginViewProps> = ({ role, onBack }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  // Pre-fill email for demo purposes based on role
  useEffect(() => {
    switch (role) {
      case UserRole.ADMIN:
      case UserRole.PRINCIPAL:
        setEmail('admin@school.com');
        break;
      case UserRole.TEACHER:
        setEmail('teacher@school.com');
        break;
      case UserRole.PARENT:
        setEmail('parent@school.com');
        break;
      default:
        setEmail('');
    }
  }, [role]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    
    // Simulate slight network delay for effect
    await new Promise(resolve => setTimeout(resolve, 600));

    const success = await login(email);
    if (!success) {
      setError('Invalid credentials. Please verify your email.');
      setIsSubmitting(false);
    }
    // Success redirect handled by App.tsx observing user state
  };

  const handleForgotPassword = () => {
    if (!email) {
      setError('Please enter your email address first.');
      return;
    }
    setResetSent(true);
    setTimeout(() => setResetSent(false), 4000);
  };

  const inputClass = `w-full h-12 pl-12 pr-4 bg-gray-50 rounded-[6px] border focus:bg-white outline-none transition-all font-medium ${error ? 'border-brand-red focus:border-brand-red focus:ring-2 focus:ring-brand-red/20' : 'border-gray-200 focus:border-brand-sky focus:ring-2 focus:ring-brand-sky/20'}`;
  
  const roleLabels: Record<UserRole, string> = {
    [UserRole.ADMIN]: 'System Admin',
    [UserRole.PRINCIPAL]: 'School Principal',
    [UserRole.TEACHER]: 'Class Teacher',
    [UserRole.PARENT]: 'Parent/Guardian'
  };

  return (
    <div className="min-h-screen bg-brand-grey flex flex-col items-center justify-center p-4 relative">
       {/* Background decoration */}
       <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-brand-blue via-blue-500 to-brand-sky"></div>

       {/* Toast */}
       {resetSent && (
         <div className="fixed top-8 left-1/2 -translate-x-1/2 bg-brand-green text-white px-6 py-3 rounded-xl shadow-xl flex items-center gap-2 animate-slide-up z-50">
            <Check size={18}/> <span className="text-sm font-bold">Password reset link sent to {email}</span>
         </div>
       )}

      <div className="w-full max-w-md">
        <button 
          onClick={onBack}
          className="mb-8 flex items-center gap-2 text-gray-400 hover:text-brand-blue transition-colors text-sm font-bold uppercase tracking-wide group"
        >
          <div className="p-1 rounded-full bg-white group-hover:bg-brand-blue group-hover:text-white transition-colors">
             <ChevronLeft size={16} />
          </div>
          Back to Auth Selection
        </button>

        <div className="bg-white p-8 rounded-[12px] shadow-xl border border-gray-100 animate-slide-up relative overflow-hidden">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-display font-bold text-brand-blue mb-1">Mwangaza</h1>
            <p className="text-gray-400 text-xs uppercase tracking-widest font-bold">Secure Login</p>
          </div>

          <div className="mb-6 p-4 bg-brand-grey/50 rounded-lg text-center border border-gray-100">
             <p className="text-xs text-gray-500 uppercase font-bold mb-1">Authenticating As</p>
             <p className="text-lg font-bold text-gray-800 font-display">{roleLabels[role]}</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Email Address</label>
              <div className="relative">
                <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 ${error ? 'text-brand-red' : 'text-gray-400'}`} size={18} />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email" 
                  className={inputClass}
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Password</label>
              <div className="relative">
                <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 ${error ? 'text-brand-red' : 'text-gray-400'}`} size={18} />
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  className={inputClass}
                  // Password not actually checked in mock
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-brand-red/10 text-brand-red text-sm font-bold rounded-lg flex items-center gap-2 animate-fade-in">
                 <span>⚠️</span> {error}
              </div>
            )}

            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full h-14 bg-brand-blue text-white rounded-[12px] font-bold hover:bg-brand-blue/90 transition-all shadow-lg shadow-brand-blue/20 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed focus:ring-4 focus:ring-brand-sky/30 active:scale-[0.98] duration-150"
            >
              {isSubmitting ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>Sign In <ArrowRight size={20} /></>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
             <button type="button" onClick={handleForgotPassword} className="text-xs font-bold text-brand-sky hover:text-brand-blue transition-colors">Forgot Password?</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginView;
