import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../../api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import Input from '../../components/ui/Input.jsx';
import Button from '../../components/ui/Button.jsx';

const MEMBER_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8];

export default function RegisterPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ householdName: '', name: '', email: '', password: '', memberCount: null });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      await authApi.register(form);
      await login(form.email, form.password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary-600">Home Manager</h1>
          <p className="text-gray-500 mt-1">Create your household</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Household name"
              placeholder="e.g. The Sharmas"
              value={form.householdName}
              onChange={e => setForm(f => ({ ...f, householdName: e.target.value }))}
              required autoFocus
            />
            <Input
              label="Your name"
              placeholder="e.g. Raj"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              required
            />
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              required
            />
            <Input
              label="Password"
              type="password"
              placeholder="Min. 6 characters"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              required
            />

            {/* Optional member count */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">
                How many people in the household?
                <span className="text-gray-400 font-normal ml-1">(optional)</span>
              </p>
              <p className="text-xs text-gray-400 mb-2">Used to suggest the right grocery quantities.</p>
              <div className="flex gap-2 flex-wrap">
                {MEMBER_OPTIONS.map(n => (
                  <button
                    key={n} type="button"
                    onClick={() => setForm(f => ({ ...f, memberCount: f.memberCount === n ? null : n }))}
                    className={`w-10 h-10 rounded-xl text-sm font-semibold border transition-colors ${
                      form.memberCount === n
                        ? 'bg-primary-600 text-white border-primary-600'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-primary-400'
                    }`}
                  >
                    {n}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, memberCount: f.memberCount === 9 ? null : 9 }))}
                  className={`px-3 h-10 rounded-xl text-sm font-semibold border transition-colors ${
                    form.memberCount === 9
                      ? 'bg-primary-600 text-white border-primary-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-primary-400'
                  }`}
                >
                  9+
                </button>
              </div>
            </div>

            {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creating...' : 'Create household'}
            </Button>
          </form>
        </div>
        <p className="text-center text-sm text-gray-500 mt-4">
          Already have an account?{' '}
          <Link to="/login" className="text-primary-600 font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
