
import React, { useState, useEffect } from 'react';
import { Gavel, BookOpen, Home, ChevronLeft, LogIn, UserPlus, Settings, Sparkles, CheckCircle2, TrendingUp, Shield, MessageCircle, Menu, X, ArrowRight, Quote, Phone, Mail, LayoutDashboard, Smartphone, Check, ChevronDown, Terminal, Calendar as CalendarIcon, MapPin, Wallet, Bus, Clock, Heart, Star, Users, ShieldCheck } from 'lucide-react';
import { UserRole } from '../types';
import AdmissionsWizard from '../components/AdmissionsWizard';
import { db } from '../services/db';
import { Link } from 'react-router-dom';

interface LandingViewProps {
  onLoginSelect: (role: UserRole) => void;
  onSignupSelect: () => void;
  onDevLogin?: (role: UserRole) => void;
}

// --- SUB-COMPONENTS ---

const MwangazaLogo = ({ className = "w-10 h-10" }: { className?: string }) => (
  <div className={`${className} transition-transform duration-500 hover:scale-110 hover:rotate-12`}>
    <svg width="100%" height="100%" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="22" stroke="currentColor" strokeWidth="9" />
        <path d="M50 5V18 M50 82V95 M5 50H18 M82 50H95 M18.18 18.18L27.37 27.37 M72.63 72.63L81.82 81.82 M18.18 81.82L27.37 72.63 M72.63 27.37L81.82 18.18" stroke="currentColor" strokeWidth="9" strokeLinecap="round" />
    </svg>
  </div>
);

const Navbar = ({ onLoginClick, onRequestDemo, onApplyNow }: { onLoginClick: () => void, onRequestDemo: () => void, onApplyNow: () => void }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinkClass = "text-sm font-bold text-gray-600 hover:text-brand-blue transition-colors";

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white/90 backdrop-blur-md shadow-sm py-3' : 'bg-transparent py-5'}`}>
      <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="text-brand-blue">
             <MwangazaLogo className="w-10 h-10" />
          </div>
          <span className={`font-display font-extrabold text-2xl tracking-tight ${isScrolled ? 'text-brand-blue' : 'text-brand-blue'}`}>Mwangaza</span>
        </div>

        {/* Desktop Links - Simple Navigation */}
        <div className="hidden md:flex items-center gap-8">
           <Link to="/about" className={navLinkClass}>About Us</Link>
           <a href="#features" className={navLinkClass}>Features</a>
           <a href="#testimonials" className={navLinkClass}>Community</a>
        </div>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-4">
          <button 
            onClick={onApplyNow}
            className="px-5 py-2.5 text-brand-green font-bold hover:bg-brand-green/5 rounded-full transition-all text-sm border border-transparent hover:border-brand-green/10"
          >
            Apply for Admission
          </button>
          <button 
            onClick={onLoginClick}
            className="px-6 py-2.5 bg-brand-blue text-white font-bold rounded-full shadow-lg shadow-brand-blue/20 hover:bg-brand-blue/90 transition-all transform hover:-translate-y-0.5 flex items-center gap-2 text-sm"
          >
            <LogIn size={16}/> Login
          </button>
        </div>

        {/* Mobile Toggle */}
        <button className="md:hidden text-gray-600" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X size={24}/> : <Menu size={24}/>}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="absolute top-full left-0 right-0 bg-white border-t border-gray-100 p-6 shadow-xl md:hidden animate-slide-up">
          <div className="flex flex-col gap-4">
            <Link to="/about" className="text-lg font-bold text-gray-800" onClick={() => setMobileMenuOpen(false)}>
              About Us
            </Link>
            <a href="#features" className="text-lg font-bold text-gray-800" onClick={() => setMobileMenuOpen(false)}>
              Features
            </a>
            <a href="#testimonials" className="text-lg font-bold text-gray-800" onClick={() => setMobileMenuOpen(false)}>
              Community
            </a>
            <hr className="border-gray-100 my-2"/>
            <button 
              onClick={() => { onApplyNow(); setMobileMenuOpen(false); }}
              className="w-full py-3 bg-brand-green/10 text-brand-green font-bold rounded-xl"
            >
              Apply for Admission
            </button>
            <button 
              onClick={() => { onLoginClick(); setMobileMenuOpen(false); }}
              className="w-full py-3 bg-brand-blue text-white font-bold rounded-xl"
            >
              Portal Login
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

const FeatureCard = ({ icon: Icon, title, desc }: { icon: any, title: string, desc: string }) => (
  <div className="p-6 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-brand-sky/30 transition-all group h-full flex flex-col">
    <div className="w-12 h-12 bg-brand-grey rounded-xl flex items-center justify-center text-brand-blue mb-4 group-hover:bg-brand-blue group-hover:text-white transition-colors">
      <Icon size={24} />
    </div>
    <h3 className="font-display font-bold text-xl text-gray-800 mb-2">{title}</h3>
    <p className="text-gray-500 text-sm leading-relaxed flex-1">{desc}</p>
  </div>
);

const StatItem = ({ value, label }: { value: string, label: string }) => (
  <div className="text-center px-4">
    <p className="text-4xl font-display font-extrabold text-white mb-1">{value}</p>
    <p className="text-blue-200 text-xs font-bold uppercase tracking-wider">{label}</p>
  </div>
);

const TeamCard = ({ name, role, img }: { name: string, role: string, img: string }) => (
  <div className="text-center group">
    <div className="w-24 h-24 mx-auto rounded-full overflow-hidden mb-4 border-4 border-white shadow-lg group-hover:border-brand-sky transition-colors">
      <img src={img} alt={name} className="w-full h-full object-cover"/>
    </div>
    <h4 className="font-bold text-gray-800 text-lg">{name}</h4>
    <p className="text-xs text-brand-blue font-bold uppercase tracking-wide mt-1">{role}</p>
  </div>
);

const TestimonialCard = ({ quote, author, role, image }: { quote: string, author: string, role: string, image: string }) => (
  <div className="bg-white p-8 rounded-[24px] border border-gray-100 shadow-sm relative hover:shadow-xl transition-all h-full flex flex-col">
    <Quote size={40} className="text-brand-blue/10 absolute top-6 right-6" />
    <div className="flex-1 mb-6">
      <div className="flex gap-1 mb-4">
        {[...Array(5)].map((_, i) => (
          <Star key={i} size={14} className="text-brand-yellow fill-brand-yellow" />
        ))}
      </div>
      <p className="text-gray-600 italic leading-relaxed">"{quote}"</p>
    </div>
    <div className="flex items-center gap-4 pt-4 border-t border-gray-50">
      <img src={image} alt={author} className="w-12 h-12 rounded-full object-cover border-2 border-brand-grey" />
      <div>
        <h4 className="font-bold text-gray-900 text-sm">{author}</h4>
        <p className="text-xs text-brand-blue font-bold uppercase tracking-wide">{role}</p>
      </div>
    </div>
  </div>
);

// --- MODALS ---

const LoginSelectionModal = ({ isOpen, onClose, onSelect, onSignup }: { isOpen: boolean; onClose: () => void; onSelect: (role: UserRole) => void; onSignup: () => void }) => {
  if (!isOpen) return null;

  const roles = [
    { id: UserRole.ADMIN, title: 'System Admin', icon: Settings, color: 'text-brand-blue', desc: 'Configuration' },
    { id: UserRole.PRINCIPAL, title: 'Principal', icon: Gavel, color: 'text-brand-blue', desc: 'Management' },
    { id: UserRole.TEACHER, title: 'Teacher', icon: BookOpen, color: 'text-brand-green', desc: 'Classroom' },
    { id: UserRole.PARENT, title: 'Parent', icon: Home, color: 'text-brand-sky', desc: 'Family' },
    { id: UserRole.SUPER_ADMIN, title: 'Platform Owner', icon: ShieldCheck, color: 'text-brand-blue', desc: 'SaaS Control' }
  ];

  return (
    <div className="fixed inset-0 bg-brand-blue/20 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl relative animate-slide-up border border-gray-100">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 rounded-full p-1 transition-colors hover:bg-gray-100">
          <X size={20} />
        </button>
        
        <div className="text-center mb-8">
          <h2 className="font-display font-bold text-2xl text-gray-800">Welcome Back</h2>
          <p className="text-gray-500 text-sm">Select your portal to continue</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {roles.map((role) => (
            <button
              key={role.id}
              onClick={() => { onSelect(role.id); onClose(); }}
              className="group flex flex-col items-center justify-center text-center bg-gray-50 hover:bg-white rounded-xl p-4 border border-gray-200 hover:border-brand-blue/30 hover:shadow-lg transition-all duration-300"
            >
              <div className={`mb-3 p-3 rounded-full bg-white shadow-sm group-hover:bg-brand-blue/5 transition-colors`}>
                <role.icon size={24} className={role.color} />
              </div>
              <h3 className="font-display font-bold text-sm text-gray-800 mb-1">{role.title}</h3>
              <p className="text-[10px] text-gray-400">{role.desc}</p>
            </button>
          ))}
        </div>

        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
            <button 
                onClick={() => { onClose(); onSignup(); }}
                className="text-xs font-bold text-brand-blue hover:underline"
            >
                New to Mwangaza? Registration Information
            </button>
        </div>
      </div>
    </div>
  );
};

const LeadCaptureModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const [formData, setFormData] = useState({ name: '', email: '', schoolSize: '100-300 Students' });
  const [status, setStatus] = useState<'IDLE' | 'SUCCESS'>('IDLE');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) return;

    await db.collection('admissions_leads').add({
      ...formData,
      leadDate: new Date().toISOString()
    });

    setStatus('SUCCESS');
    setTimeout(() => {
      onClose();
      setStatus('IDLE');
      setFormData({ name: '', email: '', schoolSize: '100-300 Students' });
    }, 2500);
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white/70 backdrop-blur-md rounded-xl p-8 w-full max-w-md shadow-2xl relative animate-slide-up border border-white/50">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 rounded-full p-1 transition-colors hover:bg-white/50">
          <X size={20} />
        </button>

        {status === 'SUCCESS' ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-16 h-16 bg-brand-green/20 rounded-full flex items-center justify-center text-brand-green mb-4">
              <Check size={32} />
            </div>
            <h3 className="font-display font-bold text-2xl text-gray-800 mb-2">Thank You!</h3>
            <p className="text-gray-600">We will be in touch shortly.</p>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <h2 className="font-display font-bold text-2xl text-brand-blue mb-1">Request a Demo</h2>
              <p className="text-gray-600 text-sm">See how Mwangaza can transform your school.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Full Name</label>
                <input 
                  type="text" 
                  required
                  className="w-full h-12 px-4 rounded-md border border-gray-200 focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 outline-none bg-white/80"
                  placeholder="e.g. Jane Doe"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Work Email Address</label>
                <input 
                  type="email" 
                  required
                  className="w-full h-12 px-4 rounded-md border border-gray-200 focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 outline-none bg-white/80"
                  placeholder="name@school.com"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">School Size</label>
                <select 
                  className="w-full h-12 px-4 rounded-md border border-gray-200 focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 outline-none bg-white/80"
                  value={formData.schoolSize}
                  onChange={e => setFormData({...formData, schoolSize: e.target.value})}
                >
                  <option>100-300 Students</option>
                  <option>301-800 Students</option>
                  <option>800+ Students</option>
                </select>
              </div>

              <button 
                type="submit" 
                className="w-full h-12 bg-[#1E3A8A] text-white rounded-xl font-bold shadow-lg hover:bg-brand-blue/90 transition-all mt-4"
              >
                Schedule Demo
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

// --- MAIN PAGE COMPONENT ---

const LandingView: React.FC<LandingViewProps> = ({ onLoginSelect, onSignupSelect, onDevLogin }) => {
  const [showWizard, setShowWizard] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showLeadModal, setShowLeadModal] = useState(false);

  if (showWizard) {
      return <AdmissionsWizard onExit={() => setShowWizard(false)} />;
  }

  return (
    <div className="min-h-screen bg-white font-sans text-gray-800 scroll-smooth">
      <Navbar 
        onLoginClick={() => setShowLoginModal(true)} 
        onRequestDemo={() => setShowLeadModal(true)}
        onApplyNow={() => setShowWizard(true)}
      />

      {/* HERO SECTION */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden bg-gradient-to-b from-brand-grey to-white" id="hero-portal">
        {/* Background Decor */}
        <div className="absolute top-0 right-0 w-1/2 h-full bg-brand-blue/5 skew-x-12 transform origin-top-right pointer-events-none"></div>
        <div className="absolute top-20 left-10 w-64 h-64 bg-brand-yellow/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
          
          {/* Left: Content */}
          <div className="text-center lg:text-left space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-brand-blue/20 rounded-full text-brand-blue text-xs font-bold shadow-sm animate-fade-in">
              <Sparkles size={14} className="text-brand-yellow fill-brand-yellow"/>
              <span>New: CBC Assessment Modules Available</span>
            </div>
            
            <h1 className="text-5xl lg:text-6xl font-display font-extrabold text-gray-900 leading-[1.1] tracking-tight">
              The Future of <br/>
              <span className="text-brand-blue">Kenyan Education</span>
            </h1>
            
            <p className="text-lg text-gray-600 max-w-xl mx-auto lg:mx-0 leading-relaxed font-sans">
              Mwangaza bridges the gap between school, teachers, and parents. 
              Seamless CBC reporting, real-time fee tracking, and instant communication in one secure platform.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start pt-4">
              <button 
                onClick={() => setShowLeadModal(true)}
                className="px-8 py-4 bg-[#1E3A8A] text-white font-bold rounded-xl shadow-xl shadow-brand-blue/20 hover:bg-brand-blue/90 transition-all hover:-translate-y-1 flex items-center gap-2"
              >
                Request Demo <ArrowRight size={18}/>
              </button>
              <button 
                onClick={() => setShowWizard(true)} 
                className="px-8 py-4 bg-white text-brand-green font-bold rounded-xl shadow-sm border border-gray-200 hover:border-brand-green hover:text-brand-green transition-all"
              >
                Apply for Admission
              </button>
            </div>

            <div className="pt-8 flex items-center justify-center lg:justify-start gap-6 text-sm font-bold text-gray-400">
               <div className="flex items-center gap-2"><CheckCircle2 size={16} className="text-brand-green"/> CBC Compliant</div>
               <div className="flex items-center gap-2"><CheckCircle2 size={16} className="text-brand-green"/> Secure Data</div>
            </div>
          </div>

          {/* Right: Abstract Visualization (Replacing Portal Card) */}
          <div className="relative flex justify-center lg:justify-end">
             <div className="relative w-full max-w-lg">
                <div className="absolute inset-0 bg-brand-blue rounded-[32px] rotate-3 opacity-10 scale-95 blur-xl"></div>
                <div className="bg-white rounded-[24px] shadow-2xl border border-gray-100 p-2 overflow-hidden relative z-10 transform hover:scale-[1.02] transition-transform duration-700">
                   <img 
                     src="https://images.unsplash.com/photo-1531403009284-440f080d1e12?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80" 
                     alt="Mwangaza Dashboard Preview" 
                     className="rounded-[20px] w-full h-auto object-cover"
                   />
                   <div className="absolute bottom-6 left-6 right-6 bg-white/90 backdrop-blur-md p-4 rounded-xl shadow-lg border border-white/50 flex items-center gap-4 animate-slide-up">
                      <div className="w-10 h-10 bg-brand-green/20 text-brand-green rounded-full flex items-center justify-center">
                         <CheckCircle2 size={20} />
                      </div>
                      <div>
                         <p className="text-xs font-bold text-gray-400 uppercase">Status</p>
                         <p className="font-bold text-gray-800 text-sm">98% Attendance Recorded</p>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* STATS STRIP */}
      <div className="bg-brand-blue py-12 relative overflow-hidden">
         {/* Background Patterns */}
         <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '20px 20px'}}></div>
         
         <div className="max-w-7xl mx-auto px-6 relative z-10 grid grid-cols-2 md:grid-cols-4 gap-8">
            <StatItem value="1" label="Partner Schools" />
            <StatItem value="150" label="Students Active" />
            <StatItem value="98%" label="Attendance Rate" />
            <StatItem value="24/7" label="System Uptime" />
         </div>
      </div>

      {/* FEATURES SECTION (Icons) */}
      <section className="py-24 bg-white" id="features">
         <div className="max-w-7xl mx-auto px-6">
            <div className="text-center max-w-3xl mx-auto mb-16">
               <h2 className="text-brand-blue font-bold text-sm uppercase tracking-widest mb-3">Why Mwangaza?</h2>
               <h3 className="font-display font-extrabold text-4xl text-gray-900 mb-6">Designed for the Modern CBC Curriculum</h3>
               <p className="text-gray-500 leading-relaxed">
                  We don't just digitalize grades; we transform the entire school experience. 
                  From competence-based assessments to automated financial reconciliation.
               </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               <FeatureCard 
                  icon={TrendingUp} 
                  title="CBC Assessment Tracking" 
                  desc="Record learner competencies with ease. Move beyond grades to holistic development tracking."
               />
               <FeatureCard 
                  icon={Shield} 
                  title="Secure & Private" 
                  desc="Bank-level encryption for student data and payments. Role-based access ensures privacy."
               />
               <FeatureCard 
                  icon={MessageCircle} 
                  title="Instant Communication" 
                  desc="SMS blasts and direct in-app messaging keep parents connected to their child's journey."
               />
               <FeatureCard 
                  icon={Wallet} 
                  title="Integrated Finance" 
                  desc="Automated fee collection via M-Pesa and bank integrations with real-time reconciliation."
               />
               <FeatureCard 
                  icon={Bus} 
                  title="Smart Transport" 
                  desc="Track school buses in real-time and manage routes for student safety and efficiency."
               />
               <FeatureCard 
                  icon={Clock} 
                  title="Dynamic Timetabling" 
                  desc="Conflict-free schedule generation for classes, teachers, and resources."
               />
            </div>
         </div>
      </section>

      {/* VISUAL FEATURES SHOWCASE */}
      <section className="py-24 bg-gray-50 overflow-hidden border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-6 space-y-24">
          
          {/* Feature 1 */}
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="lg:w-1/2 space-y-6">
              <div className="w-12 h-12 bg-brand-blue/10 rounded-2xl flex items-center justify-center text-brand-blue mb-4">
                <LayoutDashboard size={24} />
              </div>
              <h3 className="text-4xl font-display font-extrabold text-gray-900">
                Command Center for <span className="text-brand-blue">School Admins</span>
              </h3>
              <p className="text-lg text-gray-600 leading-relaxed">
                Stop juggling spreadsheets. Our centralized dashboard gives you a 360-degree view of enrollment, attendance, and financial health in real-time. Make data-driven decisions effortlessly.
              </p>
              <ul className="space-y-3 pt-4">
                {['Real-time Enrollment Stats', 'Staff Performance Metrics', 'Automated Daily Reports'].map(item => (
                  <li key={item} className="flex items-center gap-3 text-gray-700 font-medium">
                    <CheckCircle2 size={20} className="text-brand-green" /> {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="lg:w-1/2 relative">
                <div className="absolute inset-0 bg-brand-blue/5 rounded-[32px] transform rotate-3 scale-95"></div>
                <img 
                  src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
                  alt="Admin Dashboard" 
                  className="relative rounded-[32px] shadow-2xl border border-gray-100 z-10 hover:scale-[1.02] transition-transform duration-500 w-full object-cover h-80 lg:h-96"
                />
            </div>
          </div>

          {/* Feature 2 (Reversed) */}
          <div className="flex flex-col lg:flex-row-reverse items-center gap-16">
            <div className="lg:w-1/2 space-y-6">
              <div className="w-12 h-12 bg-brand-yellow/10 rounded-2xl flex items-center justify-center text-brand-yellow-600 mb-4">
                <Smartphone size={24} />
              </div>
              <h3 className="text-4xl font-display font-extrabold text-gray-900">
                Parents are always <span className="text-brand-blue">in the loop</span>
              </h3>
              <p className="text-lg text-gray-600 leading-relaxed">
                Bridge the communication gap. Parents receive instant notifications for arrival, departure, and academic progress directly on their phones.
              </p>
              <div className="grid grid-cols-2 gap-4 pt-4">
                 <div className="p-4 bg-white rounded-xl shadow-sm border border-gray-100">
                    <p className="font-bold text-gray-800 text-sm">SMS Alerts</p>
                    <p className="text-xs text-gray-500">Instant fee reminders & updates</p>
                 </div>
                 <div className="p-4 bg-white rounded-xl shadow-sm border border-gray-100">
                    <p className="font-bold text-gray-800 text-sm">Student Portal</p>
                    <p className="text-xs text-gray-500">View grades & download reports</p>
                 </div>
              </div>
            </div>
            <div className="lg:w-1/2 relative">
                <div className="absolute inset-0 bg-brand-yellow/10 rounded-[32px] transform -rotate-3 scale-95"></div>
                <img 
                  src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
                  alt="Parent Mobile App" 
                  className="relative rounded-[32px] shadow-2xl border border-gray-100 z-10 hover:scale-[1.02] transition-transform duration-500 w-full object-cover h-80 lg:h-96"
                />
            </div>
          </div>

          {/* Feature 3 */}
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="lg:w-1/2 space-y-6">
              <div className="w-12 h-12 bg-brand-green/10 rounded-2xl flex items-center justify-center text-brand-green mb-4">
                <BookOpen size={24} />
              </div>
              <h3 className="text-4xl font-display font-extrabold text-gray-900">
                CBC Assessment <span className="text-brand-blue">Made Simple</span>
              </h3>
              <p className="text-lg text-gray-600 leading-relaxed">
                Fully compliant with the Competency Based Curriculum. Record observations, track learning strands, and generate colorful, easy-to-read reports for parents.
              </p>
              <button className="px-6 py-3 bg-white border-2 border-brand-grey text-gray-700 font-bold rounded-full hover:border-brand-green hover:text-brand-green transition-colors">
                 View Sample Report
              </button>
            </div>
            <div className="lg:w-1/2 relative">
                <div className="absolute inset-0 bg-brand-green/10 rounded-[32px] transform rotate-2 scale-95"></div>
                <img 
                  src="https://images.unsplash.com/photo-1509062522246-3755977927d7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
                  alt="CBC Grading System" 
                  className="relative rounded-[32px] shadow-2xl border border-gray-100 z-10 hover:scale-[1.02] transition-transform duration-500 w-full object-cover h-80 lg:h-96"
                />
            </div>
          </div>

        </div>
      </section>

      {/* TESTIMONIALS SECTION */}
      <section id="testimonials" className="py-24 bg-white">
         <div className="max-w-7xl mx-auto px-6">
            <div className="text-center max-w-3xl mx-auto mb-16">
               <h2 className="text-brand-blue font-bold text-sm uppercase tracking-widest mb-3">Community Feedback</h2>
               <h3 className="font-display font-extrabold text-4xl text-gray-900">Trusted by Parents, Loved by Teachers</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               <TestimonialCard 
                  quote="Mwangaza has made paying school fees so easy. I get SMS reminders and can pay via M-Pesa instantly from my phone."
                  author="Sarah Kamau"
                  role="Parent, Grade 4"
                  image="https://ui-avatars.com/api/?name=Sarah+Kamau&background=FCD34D&color=fff"
               />
               <TestimonialCard 
                  quote="Reporting student progress used to take weeks. Now with the CBC assessment tools, I can record observations in minutes."
                  author="Mr. John Maina"
                  role="Senior Teacher"
                  image="https://ui-avatars.com/api/?name=John+Maina&background=059669&color=fff"
               />
               <TestimonialCard 
                  quote="The financial transparency is a game changer. I can track every shilling in real-time and ensure resources are allocated correctly."
                  author="Mrs. M. Mwangi"
                  role="Principal"
                  image="https://ui-avatars.com/api/?name=Mwangi&background=1E3A8A&color=fff"
               />
            </div>
         </div>
      </section>

      {/* ABOUT SECTION (Reverted to "Our Team") */}
      <section id="about" className="py-24 bg-brand-grey/50 relative overflow-hidden">
         {/* Decor */}
         <div className="absolute -left-20 top-20 w-96 h-96 bg-brand-blue/5 rounded-full blur-3xl"></div>

         <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
               <div>
                  <h2 className="font-display font-extrabold text-4xl text-gray-900 mb-6">Our Team</h2>
                  <p className="text-gray-600 text-lg leading-relaxed mb-6">
                     Mwangaza was founded with a simple mission: to bridge the gap between traditional education and the digital future. We believe in holistic learning that respects the Kenyan competency-based curriculum while leveraging cutting-edge technology.
                  </p>
               </div>

               {/* Team Grid */}
               <div>
                  <div className="bg-white p-8 rounded-[24px] shadow-xl border border-gray-100">
                     <h3 className="font-display font-bold text-xl text-center mb-8">Meet Our Leadership</h3>
                     <div className="grid grid-cols-2 gap-y-8 gap-x-4">
                        <TeamCard name="Dr. A. Hassan" role="Board Chair" img="https://ui-avatars.com/api/?name=Ali+Hassan&background=EF4444&color=fff" />
                        <TeamCard name="Mr. Emmanuel Omondi" role="Board Member" img="https://ui-avatars.com/api/?name=Emmanuel+Omondi&background=1E3A8A&color=fff" />
                        <TeamCard name="Morgan Wolde" role="Software Developer" img="https://ui-avatars.com/api/?name=Morgan+Wolde&background=059669&color=fff" />
                        <TeamCard name="Mrs. M. Mwangi" role="Principal" img="https://ui-avatars.com/api/?name=M+Mwangi&background=FCD34D&color=fff" />
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#0f172a] text-white pt-20 pb-10">
         <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
               <div className="col-span-1 md:col-span-1">
                  <div className="flex items-center gap-3 mb-6">
                     <div className="text-white">
                        <MwangazaLogo className="w-10 h-10" />
                     </div>
                     <span className="font-display font-bold text-2xl">Mwangaza</span>
                  </div>
                  <p className="text-gray-400 text-sm leading-relaxed mb-6">
                     Empowering schools across Kenya with next-generation management tools.
                  </p>
                  <div className="flex gap-4">
                     {/* Social placeholders */}
                     <div className="w-8 h-8 bg-white/10 rounded-full hover:bg-brand-blue cursor-pointer transition-colors"></div>
                     <div className="w-8 h-8 bg-white/10 rounded-full hover:bg-brand-blue cursor-pointer transition-colors"></div>
                     <div className="w-8 h-8 bg-white/10 rounded-full hover:bg-brand-blue cursor-pointer transition-colors"></div>
                  </div>
               </div>

               <div>
                  <h4 className="font-bold text-lg mb-6">Product</h4>
                  <ul className="space-y-4 text-gray-400 text-sm">
                     <li><a href="#" className="hover:text-brand-sky transition-colors">Features</a></li>
                     <li><a href="#" className="hover:text-brand-sky transition-colors">Pricing</a></li>
                     <li><a href="#" className="hover:text-brand-sky transition-colors">CBC Resources</a></li>
                  </ul>
               </div>

               <div>
                  <h4 className="font-bold text-lg mb-6">Support</h4>
                  <ul className="space-y-4 text-gray-400 text-sm">
                     <li><a href="#" className="hover:text-brand-sky transition-colors">Help Center</a></li>
                     <li><a href="#" className="hover:text-brand-sky transition-colors">Contact Us</a></li>
                     <li><a href="#" className="hover:text-brand-sky transition-colors">Privacy Policy</a></li>
                  </ul>
               </div>

               <div>
                  <h4 className="font-bold text-lg mb-6">Contact</h4>
                  <ul className="space-y-4 text-gray-400 text-sm">
                     <li className="flex items-center gap-3"><Phone size={16} className="text-brand-sky"/> +254 700 123 456</li>
                     <li className="flex items-center gap-3"><Mail size={16} className="text-brand-sky"/> hello@mwangaza.co.ke</li>
                  </ul>
               </div>
            </div>

            <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
               <p className="text-gray-500 text-xs">
                  &copy; {new Date().getFullYear()} Mwangaza Education Systems. All rights reserved.
               </p>
               <div className="flex gap-6 text-xs text-gray-500 font-bold">
                  <a href="#" className="hover:text-white">Privacy</a>
                  <a href="#" className="hover:text-white">Terms</a>
                  <a href="#" className="hover:text-white">Cookies</a>
               </div>
            </div>
         </div>
      </footer>

      {/* Dev Login Widget */}
      {onDevLogin && (
        <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end group">
           {/* Expanded Menu */}
           <div className="mb-3 bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 w-48 opacity-0 invisible translate-y-4 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 transition-all duration-300 ease-out origin-bottom-right">
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
                 <Terminal size={14} className="text-gray-400"/>
                 <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Dev Quick Login</span>
              </div>
              <div className="flex flex-col gap-2">
                 <button onClick={() => onDevLogin(UserRole.SUPER_ADMIN)} className="w-full text-left px-3 py-2 text-xs font-bold text-gray-700 hover:bg-brand-blue/5 hover:text-brand-blue rounded-lg transition-colors">
                    SaaS Owner
                 </button>
                 <button onClick={() => onDevLogin(UserRole.ADMIN)} className="w-full text-left px-3 py-2 text-xs font-bold text-gray-700 hover:bg-brand-blue/5 hover:text-brand-blue rounded-lg transition-colors">
                    Admin
                 </button>
                 <button onClick={() => onDevLogin(UserRole.PRINCIPAL)} className="w-full text-left px-3 py-2 text-xs font-bold text-gray-700 hover:bg-brand-blue/5 hover:text-brand-blue rounded-lg transition-colors">
                    Principal
                 </button>
                 <button onClick={() => onDevLogin(UserRole.TEACHER)} className="w-full text-left px-3 py-2 text-xs font-bold text-gray-700 hover:bg-brand-green/5 hover:text-brand-green rounded-lg transition-colors">
                    Teacher
                 </button>
                 <button onClick={() => onDevLogin(UserRole.PARENT)} className="w-full text-left px-3 py-2 text-xs font-bold text-gray-700 hover:bg-brand-sky/5 hover:text-brand-sky rounded-lg transition-colors">
                    Parent
                 </button>
              </div>
           </div>

           {/* FAB Trigger */}
           <button className="w-12 h-12 bg-gray-100 hover:bg-white text-gray-800 rounded-full shadow-lg border border-gray-200 flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:shadow-xl group-hover:border-brand-blue group-hover:text-brand-blue">
              <Terminal size={20} />
           </button>
        </div>
      )}

      {/* Modals */}
      <LoginSelectionModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)} 
        onSelect={onLoginSelect} 
        onSignup={onSignupSelect}
      />
      <LeadCaptureModal isOpen={showLeadModal} onClose={() => setShowLeadModal(false)} />
    </div>
  );
};

export default LandingView;
