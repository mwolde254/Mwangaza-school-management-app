
import React, { useState } from 'react';
import { Gavel, BookOpen, Home, ChevronLeft, LogIn, UserPlus, Settings, Sparkles } from 'lucide-react';
import { UserRole } from '../types';
import AdmissionsWizard from '../components/AdmissionsWizard';

interface LandingViewProps {
  onLoginSelect: (role: UserRole) => void;
  onSignupSelect: () => void;
}

const LandingView: React.FC<LandingViewProps> = ({ onLoginSelect, onSignupSelect }) => {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [showWizard, setShowWizard] = useState(false);

  // Configuration for each role card strictly following DLS
  const roles = [
    {
      id: UserRole.ADMIN,
      title: 'System Admin',
      icon: Settings,
      color: 'text-brand-blue',
      borderColor: 'border-brand-blue',
      bgHover: 'group-hover:bg-brand-blue/5',
      desc: 'Full access to finance, users, and system configuration.'
    },
    {
      id: UserRole.PRINCIPAL,
      title: 'School Principal',
      icon: Gavel,
      color: 'text-brand-blue',
      borderColor: 'border-brand-blue',
      bgHover: 'group-hover:bg-brand-blue/5',
      desc: 'Executive oversight, reporting, and critical approvals.'
    },
    {
      id: UserRole.TEACHER,
      title: 'Class Teacher',
      icon: BookOpen,
      color: 'text-brand-green',
      borderColor: 'border-brand-green',
      bgHover: 'group-hover:bg-brand-green/5',
      desc: 'Daily attendance, grading, and competency recording.'
    },
    {
      id: UserRole.PARENT,
      title: 'Parent/Guardian',
      icon: Home,
      color: 'text-brand-sky',
      borderColor: 'border-brand-sky',
      bgHover: 'group-hover:bg-brand-sky/5',
      desc: "Track child's progress, fees, and communication."
    }
  ];

  const activeRoleConfig = roles.find(r => r.id === selectedRole);

  if (showWizard) {
      return <AdmissionsWizard onExit={() => setShowWizard(false)} />;
  }

  return (
    <div className="min-h-screen bg-brand-grey flex flex-col items-center justify-center p-6 relative">
      
      <div className="w-full max-w-6xl z-10 flex flex-col gap-8">
        
        {/* BRAND HERO SECTION */}
        <div className="w-full bg-brand-blue rounded-[32px] p-12 text-center shadow-2xl relative overflow-hidden flex flex-col items-center animate-slide-up">
            
            {/* Decorative Geometric Background */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-10">
                <svg className="absolute -top-20 -left-20 w-96 h-96 text-white" viewBox="0 0 200 200" fill="currentColor">
                    <circle cx="100" cy="100" r="100" />
                </svg>
                <svg className="absolute -bottom-40 -right-20 w-[500px] h-[500px] text-white" viewBox="0 0 200 200" fill="currentColor">
                    <rect x="0" y="0" width="200" height="200" rx="40" transform="rotate(45 100 100)" />
                </svg>
            </div>

            {/* Logo & Identity Content */}
            <div className="relative z-10 flex flex-col items-center">
                {/* Illuminated M Logo SVG */}
                <div className="mb-6 transform hover:scale-105 transition-transform duration-500">
                    <svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                        {/* The M Shape */}
                        <path 
                            d="M 15 85 L 15 25 L 50 65 L 85 25 L 85 85" 
                            stroke="white" 
                            strokeWidth="6" 
                            strokeLinecap="round" 
                            strokeLinejoin="round"
                        />
                        {/* The Floating Sun in the Valley */}
                        <circle cx="50" cy="35" r="5" fill="white" />
                        {/* Radiating Rays */}
                        <line x1="50" y1="25" x2="50" y2="10" stroke="white" strokeWidth="3" strokeLinecap="round" />
                        <line x1="38" y1="28" x2="28" y2="18" stroke="white" strokeWidth="3" strokeLinecap="round" />
                        <line x1="62" y1="28" x2="72" y2="18" stroke="white" strokeWidth="3" strokeLinecap="round" />
                    </svg>
                </div>

                <h1 className="text-6xl font-display font-extrabold text-white mb-2 tracking-tight drop-shadow-md">
                    Mwangaza
                </h1>
                <p className="text-blue-100 font-sans text-xl mb-10 font-medium tracking-wide opacity-90">
                    Education Management System
                </p>

                {/* Primary CTA */}
                <button 
                    onClick={() => setShowWizard(true)}
                    className="px-8 py-4 bg-white text-brand-blue font-bold rounded-full shadow-lg hover:shadow-2xl hover:bg-blue-50 transform hover:-translate-y-1 transition-all flex items-center gap-3 text-lg group"
                >
                    <Sparkles size={20} className="text-brand-yellow fill-brand-yellow group-hover:rotate-12 transition-transform"/> 
                    <span>New Student? Apply Now</span>
                </button>
            </div>
        </div>

        {!selectedRole ? (
          /* ROLE SELECTION GRID */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-slide-up">
            {roles.map((role) => (
              <button
                key={role.id}
                onClick={() => setSelectedRole(role.id)}
                className={`
                  group h-full flex flex-col text-left
                  bg-brand-card rounded-[24px] p-8
                  shadow-sm hover:shadow-xl hover:shadow-brand-blue/5
                  transition-all duration-300 transform hover:-translate-y-1 
                  border border-transparent hover:border-gray-100
                  relative overflow-hidden
                `}
              >
                {/* Accent Top Line (Hover) */}
                <div className={`absolute top-0 left-0 w-full h-1 bg-current ${role.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>

                {/* Icon Container */}
                <div className={`
                  mb-6 p-4 rounded-2xl w-16 h-16 
                  flex items-center justify-center 
                  bg-brand-grey/50 ${role.bgHover} 
                  transition-colors duration-300
                `}>
                  <role.icon size={32} className={`${role.color}`} strokeWidth={1.5} />
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col">
                  <h3 className="font-display font-bold text-xl text-gray-800 mb-2 group-hover:text-brand-blue transition-colors">
                    {role.title}
                  </h3>
                  <p className="font-sans text-sm text-gray-500 leading-relaxed">
                    {role.desc}
                  </p>
                </div>
              </button>
            ))}
          </div>
        ) : (
          /* AUTH CHOICE VIEW (Login/Signup) */
          <div className="max-w-md mx-auto w-full animate-fade-in">
            <button 
              onClick={() => setSelectedRole(null)} 
              className="mb-6 flex items-center gap-2 text-gray-400 hover:text-brand-blue transition-colors text-sm font-bold uppercase tracking-wide group mx-auto"
            >
              <div className="p-1 rounded-full bg-white group-hover:bg-brand-blue group-hover:text-white transition-colors shadow-sm">
                 <ChevronLeft size={16} />
              </div>
              Back to Roles
            </button>

            <div className="bg-white rounded-[24px] shadow-xl border border-gray-100 p-8 text-center relative overflow-hidden">
              {/* Top Accent */}
              <div className={`absolute top-0 left-0 w-full h-2 bg-current ${activeRoleConfig?.color}`}></div>

              <div className={`mx-auto w-24 h-24 rounded-full bg-brand-grey flex items-center justify-center mb-6 border-4 border-white shadow-sm`}>
                 {activeRoleConfig && <activeRoleConfig.icon size={48} className={activeRoleConfig.color} strokeWidth={1.5} />}
              </div>
              
              <h2 className="font-display font-bold text-2xl text-gray-800 mb-2">{activeRoleConfig?.title}</h2>
              <p className="text-gray-500 font-sans text-sm mb-8 leading-relaxed px-4">
                Welcome back. Please select how you would like to proceed.
              </p>
              
              <div className="space-y-4">
                {/* Primary Action: Log In */}
                <button 
                  onClick={() => onLoginSelect(selectedRole)}
                  className="w-full h-14 bg-brand-blue text-white rounded-[16px] font-sans font-bold text-sm shadow-lg shadow-brand-blue/20 hover:bg-brand-blue/90 transition-all flex items-center justify-center gap-2 focus:ring-4 focus:ring-brand-sky/30 hover:-translate-y-0.5"
                >
                  <LogIn size={18} /> Log In
                </button>
                
                {/* Secondary Action: Create Account */}
                <button 
                  onClick={onSignupSelect}
                  className="w-full h-14 bg-white border-2 border-gray-100 text-gray-700 rounded-[16px] font-sans font-bold text-sm hover:border-brand-sky hover:text-brand-sky transition-all flex items-center justify-center gap-2 focus:ring-4 focus:ring-brand-sky/30 hover:-translate-y-0.5"
                >
                  <UserPlus size={18} /> Create Account
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
      
      {/* Footer */}
      <div className="mt-12 text-center w-full text-xs text-gray-400 font-sans">
        &copy; {new Date().getFullYear()} Mwangaza Education System. Secure & Encrypted.
      </div>
    </div>
  );
};

export default LandingView;
