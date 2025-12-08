import React from 'react';
import { ChevronLeft, Shield, Phone, Mail, MapPin } from 'lucide-react';

interface SignupViewProps {
  onBack: () => void;
}

const SignupView: React.FC<SignupViewProps> = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-brand-grey flex flex-col items-center justify-center p-6 relative">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-brand-blue via-brand-green to-brand-yellow"></div>

      <div className="w-full max-w-lg z-10 animate-slide-up">
        
        <button 
          onClick={onBack} 
          className="mb-8 flex items-center gap-2 text-gray-400 hover:text-brand-blue transition-colors text-sm font-bold uppercase tracking-wide group"
        >
          <div className="p-1 rounded-full bg-white group-hover:bg-brand-blue group-hover:text-white transition-colors">
             <ChevronLeft size={16} />
          </div>
          Back to Home
        </button>

        <div className="bg-white rounded-[12px] shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-brand-blue p-8 text-center text-white relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-full bg-white/5 opacity-50"></div>
             <Shield size={48} className="mx-auto mb-4 text-brand-sky" />
             <h2 className="font-display font-bold text-2xl mb-2">Account Registration</h2>
             <p className="text-brand-sky text-sm">Mwangaza Education System</p>
          </div>

          <div className="p-8">
            <div className="p-4 bg-brand-yellow/10 border border-brand-yellow/20 rounded-[12px] mb-6">
               <h3 className="font-bold text-brand-yellow text-sm mb-1">Restricted Access</h3>
               <p className="text-xs text-gray-600 leading-relaxed">
                 To ensure the security and privacy of student data, self-registration is disabled. Accounts are created and managed exclusively by the School Administration.
               </p>
            </div>

            <h3 className="font-display font-bold text-gray-800 text-lg mb-4">How to get access?</h3>
            <p className="text-sm text-gray-500 mb-6">
              If you are a new parent, teacher, or staff member, please contact the administration office to receive your login credentials.
            </p>

            <div className="space-y-4">
               <div className="flex items-center gap-4 p-4 border border-gray-100 rounded-[12px] hover:border-brand-sky/30 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-brand-grey flex items-center justify-center text-brand-blue">
                     <Phone size={20} />
                  </div>
                  <div>
                     <p className="text-xs font-bold text-gray-400 uppercase">Call Support</p>
                     <p className="font-bold text-gray-800 font-mono">0722 000 000</p>
                  </div>
               </div>
               
               <div className="flex items-center gap-4 p-4 border border-gray-100 rounded-[12px] hover:border-brand-sky/30 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-brand-grey flex items-center justify-center text-brand-green">
                     <Mail size={20} />
                  </div>
                  <div>
                     <p className="text-xs font-bold text-gray-400 uppercase">Email Administration</p>
                     <p className="font-bold text-gray-800 font-sans">admissions@school.com</p>
                  </div>
               </div>

               <div className="flex items-center gap-4 p-4 border border-gray-100 rounded-[12px] hover:border-brand-sky/30 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-brand-grey flex items-center justify-center text-brand-red">
                     <MapPin size={20} />
                  </div>
                  <div>
                     <p className="text-xs font-bold text-gray-400 uppercase">Visit Office</p>
                     <p className="font-bold text-gray-800 font-sans">Admin Block A, Room 101</p>
                  </div>
               </div>
            </div>
          </div>
          
          <div className="p-4 bg-gray-50 text-center border-t border-gray-100">
             <p className="text-xs text-gray-400">Office Hours: Mon-Fri, 8:00 AM - 4:00 PM</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupView;