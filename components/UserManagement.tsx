import React, { useState } from 'react';
import { UserRole, UserProfile } from '../types';
import { useStudentData } from '../context/StudentDataContext';
import { Search, Filter, Plus, Edit3, Shield, Mail, Check, AlertTriangle, Loader2, X, User } from 'lucide-react';
import { db } from '../services/db';

const UserManagement: React.FC = () => {
  const { users, updateUser, students } = useStudentData();
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'DISABLED'>('ALL');

  // Modal States
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDisableConfirm, setShowDisableConfirm] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  // Invite Form State
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState(UserRole.TEACHER);
  const [inviteName, setInviteName] = useState('');
  const [inviteLinkedStudents, setInviteLinkedStudents] = useState<string[]>([]);

  // Student Search State (Shared)
  const [studentSearch, setStudentSearch] = useState('');

  // Filtering Logic
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          user.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'ALL' || user.status === statusFilter;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Actions
  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
      // Simulate invite logic
      await db.collection('invites').add({
        email: inviteEmail,
        role: inviteRole,
        name: inviteName,
        date: new Date().toISOString(),
        status: 'PENDING'
      });
      // For mock purposes, we also create the user immediately so they show up
      await db.collection('users').add({
         name: inviteName,
         email: inviteEmail,
         role: inviteRole,
         status: 'ACTIVE',
         avatarUrl: `https://ui-avatars.com/api/?name=${inviteName}&background=random`,
         linkedStudentIds: inviteRole === UserRole.PARENT ? inviteLinkedStudents : []
      });
      showToast('Invitation sent successfully!', 'success');
      setShowInviteModal(false);
      setInviteEmail('');
      setInviteName('');
      setInviteLinkedStudents([]);
    } catch (e) {
      showToast('Failed to send invite.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setIsProcessing(true);
    try {
      await updateUser(selectedUser.id, {
        name: selectedUser.name,
        email: selectedUser.email,
        role: selectedUser.role,
        status: selectedUser.status,
        linkedStudentIds: selectedUser.role === UserRole.PARENT ? selectedUser.linkedStudentIds : []
      });
      showToast('User details updated.', 'success');
      setShowEditModal(false);
      setSelectedUser(null);
    } catch (e) {
      showToast('Update failed.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDisableUser = async () => {
    if (!selectedUser) return;
    setIsProcessing(true);
    try {
      await updateUser(selectedUser.id, { status: 'DISABLED' });
      showToast('User access disabled.', 'success');
      setShowDisableConfirm(false);
      setSelectedUser(null);
    } catch (e) {
      showToast('Failed to disable user.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const openEdit = (user: UserProfile) => {
    setSelectedUser({ ...user, linkedStudentIds: user.linkedStudentIds || [] });
    setShowEditModal(true);
  };

  const openDisable = (user: UserProfile) => {
    setSelectedUser(user);
    setShowDisableConfirm(true);
  };

  // Student Linking Handlers
  const handleAddLinkedStudent = (id: string, isInviteMode: boolean) => {
    if (isInviteMode) {
      if (!inviteLinkedStudents.includes(id)) {
        setInviteLinkedStudents([...inviteLinkedStudents, id]);
      }
    } else if (selectedUser) {
      const current = selectedUser.linkedStudentIds || [];
      if (!current.includes(id)) {
        setSelectedUser({ ...selectedUser, linkedStudentIds: [...current, id] });
      }
    }
    setStudentSearch('');
  };

  const handleRemoveLinkedStudent = (id: string, isInviteMode: boolean) => {
    if (isInviteMode) {
      setInviteLinkedStudents(inviteLinkedStudents.filter(sid => sid !== id));
    } else if (selectedUser) {
      const current = selectedUser.linkedStudentIds || [];
      setSelectedUser({ ...selectedUser, linkedStudentIds: current.filter(sid => sid !== id) });
    }
  };

  // Styles
  const inputClass = "h-12 px-4 rounded-[6px] border border-gray-200 focus:border-brand-sky focus:ring-2 focus:ring-brand-sky/20 outline-none transition-all font-sans text-gray-700 bg-white w-full";
  const labelClass = "block text-xs font-bold text-gray-500 uppercase mb-2";
  const btnBase = "rounded-[12px] font-bold transition-all focus:outline-none focus:ring-4 disabled:opacity-50 active:scale-[0.98]";

  // Helper Component for Student Selection
  const StudentSelector = ({ selectedIds, isInviteMode }: { selectedIds: string[], isInviteMode: boolean }) => {
    const availableStudents = students.filter(s => 
      (s.name.toLowerCase().includes(studentSearch.toLowerCase()) || 
       s.admissionNumber.toLowerCase().includes(studentSearch.toLowerCase())) && 
      !selectedIds.includes(s.id)
    ).slice(0, 5);

    return (
      <div className="space-y-3 animate-fade-in bg-gray-50 p-4 rounded-lg border border-gray-100 mt-2">
         <label className={labelClass}>Linked Students</label>
         
         {/* Selected Pills */}
         <div className="flex flex-wrap gap-2 mb-2">
            {selectedIds.map(id => {
               const student = students.find(s => s.id === id);
               if(!student) return null;
               return (
                 <div key={id} className="bg-white border border-brand-sky/30 text-brand-blue pl-3 pr-1 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-sm">
                    {student.name}
                    <button type="button" onClick={() => handleRemoveLinkedStudent(id, isInviteMode)} className="p-1 hover:bg-gray-100 rounded-full text-gray-400 hover:text-brand-red transition-colors"><X size={12}/></button>
                 </div>
               )
            })}
            {selectedIds.length === 0 && <span className="text-xs text-gray-400 italic">No students linked yet.</span>}
         </div>

         {/* Search Input */}
         <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16}/>
            <input 
               type="text"
               value={studentSearch}
               onChange={(e) => setStudentSearch(e.target.value)}
               className={`${inputClass} pl-10 h-10 text-sm`}
               placeholder="Search student by Name or ID..."
            />
            {studentSearch.length > 1 && (
               <div className="absolute top-full left-0 w-full bg-white border border-gray-100 shadow-xl rounded-b-lg z-20 max-h-48 overflow-y-auto">
                  {availableStudents.length > 0 ? availableStudents.map(s => (
                     <button 
                       type="button"
                       key={s.id}
                       onClick={() => handleAddLinkedStudent(s.id, isInviteMode)}
                       className="w-full text-left p-3 hover:bg-brand-grey flex items-center gap-3 border-b border-gray-50 last:border-0 transition-colors"
                     >
                        <img src={s.avatarUrl} className="w-8 h-8 rounded-full bg-gray-200 object-cover" alt="" />
                        <div>
                           <p className="text-sm font-bold text-gray-800">{s.name}</p>
                           <p className="text-xs text-gray-500">{s.admissionNumber} • {s.grade}</p>
                        </div>
                     </button>
                  )) : (
                     <div className="p-3 text-xs text-gray-400 italic text-center">No matching students found.</div>
                  )}
               </div>
            )}
         </div>
      </div>
    );
  };

  return (
    <div className="max-w-6xl animate-slide-up relative">
      {toast && (
        <div className={`fixed top-20 right-8 z-50 px-6 py-4 rounded-xl shadow-xl flex items-center gap-3 animate-slide-up ${toast.type === 'success' ? 'bg-brand-green text-white' : 'bg-brand-red text-white'}`}>
           {toast.type === 'success' ? <Check size={20}/> : <AlertTriangle size={20}/>}
           <span className="font-bold">{toast.message}</span>
        </div>
      )}

      {/* Header & Controls */}
      <div className="flex flex-col gap-6 mb-8">
         <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h3 className="font-display font-bold text-xl text-gray-800 flex items-center gap-2">
               <Shield size={24} className="text-brand-blue"/> Access Control
            </h3>
            <button 
              onClick={() => setShowInviteModal(true)}
              className={`px-6 h-12 bg-brand-blue text-white shadow-lg shadow-brand-blue/20 hover:bg-brand-blue/90 ${btnBase} flex items-center gap-2`}
            >
               <Plus size={20}/> Invite User
            </button>
         </div>

         <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-[12px] border border-gray-100 shadow-sm">
            <div className="relative flex-1">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18}/>
               <input 
                 type="text" 
                 placeholder="Search Name, ID, or Email..." 
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 className={`${inputClass} pl-10 h-12`}
               />
            </div>
            <div className="w-full md:w-48 relative">
               <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18}/>
               <select 
                  value={roleFilter} 
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className={`${inputClass} pl-10`}
               >
                  <option value="ALL">All Roles</option>
                  <option value={UserRole.ADMIN}>Admins</option>
                  <option value={UserRole.TEACHER}>Teachers</option>
                  <option value={UserRole.PARENT}>Parents</option>
               </select>
            </div>
            <div className="w-full md:w-48">
               <select 
                  value={statusFilter} 
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className={inputClass}
               >
                  <option value="ALL">All Status</option>
                  <option value="ACTIVE">Active</option>
                  <option value="DISABLED">Disabled</option>
               </select>
            </div>
         </div>
      </div>

      {/* User Table */}
      <div className="bg-white rounded-[12px] border border-gray-100 shadow-sm overflow-hidden">
         <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
               <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase">
                     <th className="px-6 py-4">User Details</th>
                     <th className="px-6 py-4">Role</th>
                     <th className="px-6 py-4">Contact</th>
                     <th className="px-6 py-4">Status</th>
                     <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-gray-50">
                  {filteredUsers.length > 0 ? filteredUsers.map(user => (
                     <tr key={user.id} className="hover:bg-brand-grey/30 transition-colors group">
                        <td className="px-6 py-4">
                           <div className="flex items-center gap-3">
                              <img src={user.avatarUrl || `https://ui-avatars.com/api/?name=${user.name}`} className="w-10 h-10 rounded-full border border-gray-200" alt=""/>
                              <div>
                                 <p className="font-sans font-semibold text-gray-800 text-sm">{user.name}</p>
                                 <p className="font-mono text-xs text-gray-400">ID: {user.id}</p>
                              </div>
                           </div>
                        </td>
                        <td className="px-6 py-4">
                           <span className={`px-3 py-1 rounded-[6px] text-xs font-bold font-display ${
                              user.role === UserRole.ADMIN || user.role === UserRole.PRINCIPAL ? 'bg-brand-blue text-white' :
                              user.role === UserRole.TEACHER ? 'bg-brand-green text-white' :
                              'bg-brand-sky text-white'
                           }`}>
                              {user.role}
                           </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 font-medium">
                           {user.email}
                        </td>
                        <td className="px-6 py-4">
                           <span className={`flex items-center gap-1.5 text-xs font-bold ${user.status === 'ACTIVE' ? 'text-brand-green' : 'text-brand-red'}`}>
                              <span className={`w-2 h-2 rounded-full ${user.status === 'ACTIVE' ? 'bg-brand-green' : 'bg-brand-red'}`}></span>
                              {user.status}
                           </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                           <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                 onClick={() => openEdit(user)}
                                 className="p-2 border border-brand-sky text-brand-sky rounded-[6px] hover:bg-brand-sky/10 transition-colors" 
                                 title="Edit User"
                              >
                                 <Edit3 size={16}/>
                              </button>
                              {user.status === 'ACTIVE' && (
                                 <button 
                                    onClick={() => openDisable(user)}
                                    className="p-2 border border-brand-red text-brand-red rounded-[6px] hover:bg-brand-red/10 transition-colors" 
                                    title="Disable User"
                                 >
                                    <X size={16}/>
                                 </button>
                              )}
                           </div>
                        </td>
                     </tr>
                  )) : (
                     <tr>
                        <td colSpan={5} className="py-12 text-center text-gray-400 font-medium">
                           No users found matching your filters.
                        </td>
                     </tr>
                  )}
               </tbody>
            </table>
         </div>
      </div>

      {/* --- MODALS --- */}

      {/* 1. Invite User Modal */}
      {showInviteModal && (
         <div className="fixed inset-0 bg-brand-blue/20 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-[12px] p-8 w-full max-w-md shadow-2xl relative animate-slide-up border border-gray-100 max-h-[90vh] overflow-y-auto">
               <button onClick={() => setShowInviteModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 rounded-full p-1"><X size={20}/></button>
               
               <h3 className="text-xl font-display font-bold mb-1 text-brand-blue">Invite New User</h3>
               <p className="text-sm text-gray-500 mb-6">Send an invitation to add a new staff or parent.</p>

               <form onSubmit={handleInvite} className="space-y-4">
                  <div>
                     <label className={labelClass}>Full Name</label>
                     <input 
                        type="text" 
                        required 
                        value={inviteName}
                        onChange={(e) => setInviteName(e.target.value)}
                        className={inputClass} 
                        placeholder="John Doe"
                     />
                  </div>
                  <div>
                     <label className={labelClass}>Email Address</label>
                     <input 
                        type="email" 
                        required 
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        className={inputClass} 
                        placeholder="user@school.com"
                     />
                  </div>
                  <div>
                     <label className={labelClass}>Assign Role</label>
                     <select 
                        value={inviteRole} 
                        onChange={(e) => setInviteRole(e.target.value as UserRole)}
                        className={inputClass}
                     >
                        <option value={UserRole.ADMIN}>Administrator</option>
                        <option value={UserRole.PRINCIPAL}>Principal</option>
                        <option value={UserRole.TEACHER}>Teacher</option>
                        <option value={UserRole.PARENT}>Parent</option>
                     </select>
                  </div>
                  
                  {/* Conditional Student Linker */}
                  {inviteRole === UserRole.PARENT && (
                     <StudentSelector selectedIds={inviteLinkedStudents} isInviteMode={true} />
                  )}

                  <div className="pt-4">
                     <button 
                        type="submit" 
                        disabled={isProcessing}
                        className={`w-full h-12 bg-brand-blue text-white ${btnBase} shadow-lg shadow-brand-blue/20 hover:bg-brand-blue/90 flex items-center justify-center gap-2`}
                     >
                        {isProcessing ? <Loader2 className="animate-spin" size={20}/> : 'Send Invitation'}
                     </button>
                  </div>
               </form>
            </div>
         </div>
      )}

      {/* 2. Edit User Modal */}
      {showEditModal && selectedUser && (
         <div className="fixed inset-0 bg-brand-blue/20 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-[12px] p-8 w-full max-w-md shadow-2xl relative animate-slide-up border border-gray-100 max-h-[90vh] overflow-y-auto">
               <button onClick={() => setShowEditModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 rounded-full p-1"><X size={20}/></button>
               
               <h3 className="text-xl font-display font-bold mb-6 text-brand-blue flex items-center gap-2">
                  <Edit3 size={20}/> Edit User Profile
               </h3>

               <form onSubmit={handleUpdateUser} className="space-y-4">
                  <div>
                     <label className={labelClass}>Full Name</label>
                     <input 
                        type="text" 
                        required 
                        value={selectedUser.name}
                        onChange={(e) => setSelectedUser({...selectedUser, name: e.target.value})}
                        className={inputClass} 
                     />
                  </div>
                  <div>
                     <label className={labelClass}>Email Address</label>
                     <input 
                        type="email" 
                        required 
                        value={selectedUser.email}
                        onChange={(e) => setSelectedUser({...selectedUser, email: e.target.value})}
                        className={inputClass} 
                     />
                  </div>
                  <div>
                     <label className={labelClass}>User Role</label>
                     <select 
                        value={selectedUser.role} 
                        onChange={(e) => setSelectedUser({...selectedUser, role: e.target.value as UserRole})}
                        className={inputClass}
                     >
                        <option value={UserRole.ADMIN}>Administrator</option>
                        <option value={UserRole.PRINCIPAL}>Principal</option>
                        <option value={UserRole.TEACHER}>Teacher</option>
                        <option value={UserRole.PARENT}>Parent</option>
                     </select>
                  </div>

                  {/* Conditional Student Linker */}
                  {selectedUser.role === UserRole.PARENT && (
                     <StudentSelector selectedIds={selectedUser.linkedStudentIds || []} isInviteMode={false} />
                  )}
                  
                  <div className="pt-4 border-t border-gray-100 mt-4">
                     <label className="flex items-center justify-between cursor-pointer group">
                        <span className="font-bold text-sm text-gray-700">Account Status</span>
                        <div 
                           onClick={() => setSelectedUser({...selectedUser, status: selectedUser.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE'})}
                           className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out flex items-center ${selectedUser.status === 'ACTIVE' ? 'bg-brand-green' : 'bg-gray-300'}`}
                        >
                           <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform duration-200 ${selectedUser.status === 'ACTIVE' ? 'translate-x-6' : 'translate-x-0'}`} />
                        </div>
                     </label>
                     <p className="text-xs text-gray-400 mt-2">Disabled users cannot log in to the portal.</p>
                  </div>

                  <div className="pt-6">
                     <button 
                        type="submit" 
                        disabled={isProcessing}
                        className={`w-full h-12 bg-brand-blue text-white ${btnBase} shadow-lg shadow-brand-blue/20 hover:bg-brand-blue/90 flex items-center justify-center gap-2`}
                     >
                        {isProcessing ? <Loader2 className="animate-spin" size={20}/> : 'Update Details'}
                     </button>
                  </div>
               </form>
            </div>
         </div>
      )}

      {/* 3. Disable Confirmation Modal */}
      {showDisableConfirm && selectedUser && (
         <div className="fixed inset-0 bg-brand-red/10 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-[12px] p-8 w-full max-w-sm shadow-2xl relative animate-slide-up border-2 border-brand-yellow">
               <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-brand-yellow/10 rounded-full flex items-center justify-center text-brand-yellow mb-4">
                     <AlertTriangle size={28}/>
                  </div>
                  <h3 className="text-xl font-display font-bold text-gray-800 mb-2">Disable User Access?</h3>
                  <p className="text-sm text-gray-500 mb-6">
                     Are you sure you want to disable <span className="font-bold text-gray-800">{selectedUser.name}</span>? 
                     They will lose immediate access to the system.
                  </p>
                  
                  <div className="flex w-full gap-3">
                     <button 
                        onClick={() => setShowDisableConfirm(false)}
                        className="flex-1 h-12 bg-gray-100 text-gray-700 font-bold rounded-[12px] hover:bg-gray-200 transition-colors"
                     >
                        Cancel
                     </button>
                     <button 
                        onClick={handleDisableUser}
                        disabled={isProcessing}
                        className="flex-1 h-12 bg-brand-red text-white font-bold rounded-[12px] shadow-lg shadow-brand-red/20 hover:bg-brand-red/90 transition-colors flex items-center justify-center gap-2"
                     >
                        {isProcessing ? <Loader2 className="animate-spin" size={18}/> : 'Disable User'}
                     </button>
                  </div>
               </div>
            </div>
         </div>
      )}
    </div>
  );
};

export default UserManagement;