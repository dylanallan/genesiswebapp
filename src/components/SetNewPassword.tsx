import React, { useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';

// Shown after opening a password-reset link (the link signs the user in for this one purpose).
export const SetNewPassword: React.FC<{ onDone: () => void; onCancel?: () => void; title?: string }> = ({ onDone, onCancel, title }) => {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) return toast.error('Use at least 8 characters.');
    if (password !== confirm) return toast.error('The two passwords do not match.');
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success('Password saved.');
      onDone();
    } catch (error: any) {
      toast.error(error.message || 'Could not save the new password.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-genesis-50 via-white to-purple-50 flex items-center justify-center p-4">
      <form onSubmit={save} className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 space-y-4">
        <h2 className="text-2xl font-bold text-gray-900 text-center">{title ?? 'Choose a new password'}</h2>
        <div>
          <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 mb-1">New password</label>
          <input id="new-password" type="password" autoComplete="new-password" minLength={8} required value={password}
            onChange={(e) => setPassword(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
        </div>
        <div>
          <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-1">Type it again</label>
          <input id="confirm-password" type="password" autoComplete="new-password" minLength={8} required value={confirm}
            onChange={(e) => setConfirm(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
        </div>
        <button type="submit" disabled={saving} className="w-full bg-genesis-600 text-white py-2 rounded-lg hover:bg-genesis-700 disabled:opacity-50">
          {saving ? 'Saving...' : 'Save new password'}
        </button>
        {onCancel && <button type="button" onClick={onCancel} className="w-full text-sm text-gray-600">Cancel</button>}
      </form>
    </div>
  );
};
