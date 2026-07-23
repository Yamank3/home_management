import { useState, useEffect } from 'react';
import { UserPlus, Trash2, Crown, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { authApi } from '../../api.js';
import PageHeader from '../../components/layout/PageHeader.jsx';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import Modal from '../../components/ui/Modal.jsx';
import Badge from '../../components/ui/Badge.jsx';

const EMPTY_INVITE = { name: '', email: '', password: '', role: 'member' };

export default function AccountPage() {
  const { user, household, logout, updateUser } = useAuth();
  const [members, setMembers] = useState([]);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteForm, setInviteForm] = useState(EMPTY_INVITE);
  const [inviteError, setInviteError] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: user?.name || '', currentPassword: '', newPassword: '' });
  const [profileMsg, setProfileMsg] = useState('');
  const [profileError, setProfileError] = useState('');

  useEffect(() => {
    authApi.getMembers().then(setMembers).catch(() => {});
  }, []);

  const handleInvite = async () => {
    setInviteError('');
    if (!inviteForm.name || !inviteForm.email || !inviteForm.password) {
      setInviteError('All fields are required');
      return;
    }
    setInviteLoading(true);
    try {
      const member = await authApi.inviteMember(inviteForm);
      setMembers(prev => [...prev, member]);
      setInviteForm(EMPTY_INVITE);
      setShowInvite(false);
    } catch (err) {
      setInviteError(err.message);
    } finally {
      setInviteLoading(false);
    }
  };

  const handleRemove = async (id) => {
    if (!confirm('Remove this member from the household?')) return;
    try {
      await authApi.removeMember(id);
      setMembers(prev => prev.filter(m => m.id !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileMsg('');
    setProfileError('');
    try {
      const data = {};
      if (profileForm.name !== user.name) data.name = profileForm.name;
      if (profileForm.newPassword) {
        data.currentPassword = profileForm.currentPassword;
        data.newPassword = profileForm.newPassword;
      }
      if (!Object.keys(data).length) return;
      const updated = await authApi.updateMe(data);
      updateUser(updated);
      setProfileMsg('Profile updated');
      setProfileForm(f => ({ ...f, currentPassword: '', newPassword: '' }));
    } catch (err) {
      setProfileError(err.message);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      <PageHeader title="Account & Household" subtitle={household?.name} />

      {/* Profile section */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 mb-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Your Profile</h2>
        <form onSubmit={handleUpdateProfile} className="space-y-3">
          <Input label="Name" value={profileForm.name}
            onChange={e => setProfileForm(f => ({ ...f, name: e.target.value }))} />
          <Input label="New password (optional)" type="password" placeholder="Leave blank to keep current"
            value={profileForm.newPassword}
            onChange={e => setProfileForm(f => ({ ...f, newPassword: e.target.value }))} />
          {profileForm.newPassword && (
            <Input label="Current password" type="password"
              value={profileForm.currentPassword}
              onChange={e => setProfileForm(f => ({ ...f, currentPassword: e.target.value }))} />
          )}
          {profileMsg && <p className="text-sm text-green-600">{profileMsg}</p>}
          {profileError && <p className="text-sm text-red-500">{profileError}</p>}
          <Button type="submit" size="sm">Save changes</Button>
        </form>
      </div>

      {/* Members section */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 mb-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-700">Household Members</h2>
          {user?.role === 'admin' && (
            <Button size="sm" onClick={() => setShowInvite(true)}>
              <UserPlus size={14} /> Invite Member
            </Button>
          )}
        </div>
        <div className="space-y-2">
          {members.map(member => (
            <div key={member.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-gray-50">
              <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-semibold text-sm shrink-0">
                {member.name[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 flex items-center gap-1.5">
                  {member.name}
                  {member.id === user?.id && <Badge color="indigo">You</Badge>}
                </p>
                <p className="text-xs text-gray-400">{member.email}</p>
              </div>
              <Badge color={member.role === 'admin' ? 'purple' : 'gray'}>
                {member.role === 'admin' ? <><Crown size={10} className="mr-1" />Admin</> : 'Member'}
              </Badge>
              {user?.role === 'admin' && member.id !== user?.id && (
                <button onClick={() => handleRemove(member.id)}
                  className="p-1 text-gray-300 hover:text-red-400 transition-colors">
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Sign out */}
      <Button variant="secondary" onClick={logout} className="w-full">Sign out</Button>

      {/* Invite modal */}
      <Modal open={showInvite} onClose={() => setShowInvite(false)} title="Invite Member"
        footer={<>
          <Button variant="secondary" onClick={() => setShowInvite(false)}>Cancel</Button>
          <Button onClick={handleInvite} disabled={inviteLoading}>
            {inviteLoading ? 'Inviting...' : 'Send Invite'}
          </Button>
        </>}
      >
        <div className="space-y-3">
          <Input label="Name" placeholder="e.g. Bob" value={inviteForm.name}
            onChange={e => setInviteForm(f => ({ ...f, name: e.target.value }))} autoFocus />
          <Input label="Email" type="email" placeholder="bob@example.com" value={inviteForm.email}
            onChange={e => setInviteForm(f => ({ ...f, email: e.target.value }))} />
          <Input label="Password" type="password" placeholder="Min. 6 characters" value={inviteForm.password}
            onChange={e => setInviteForm(f => ({ ...f, password: e.target.value }))} />
          <div className="flex items-center gap-3 pt-1">
            <label className="text-sm font-medium text-gray-700">Role</label>
            <div className="flex gap-2">
              {['member', 'admin'].map(r => (
                <button key={r} type="button"
                  onClick={() => setInviteForm(f => ({ ...f, role: r }))}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                    inviteForm.role === r
                      ? 'bg-primary-600 text-white border-primary-600'
                      : 'bg-white text-gray-600 border-gray-200'
                  }`}
                >
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </button>
              ))}
            </div>
          </div>
          {inviteError && <p className="text-sm text-red-500">{inviteError}</p>}
        </div>
      </Modal>
    </div>
  );
}
