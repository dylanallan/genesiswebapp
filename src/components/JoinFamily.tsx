import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Users } from 'lucide-react';
import { supabase } from '../lib/supabase';

export const PENDING_INVITE_KEY = 'genesis.pendingInvite';

/** Opened from an invite link (/join/<token>) once the relative is signed in. */
export const JoinFamily: React.FC = () => {
  const { token = '' } = useParams();
  const navigate = useNavigate();
  const [state, setState] = useState<{ status: 'working' | 'done' | 'error'; text: string }>({ status: 'working', text: 'Joining your family...' });

  useEffect(() => {
    try { localStorage.removeItem(PENDING_INVITE_KEY); } catch { /* storage may be blocked */ }
    supabase.rpc('accept_family_invite', { p_token: token }).then(({ data, error }: { data: { owner_name: string } | null; error: { message: string } | null }) => {
      if (error || !data) setState({ status: 'error', text: error?.message ?? 'This invite link is no longer valid.' });
      else setState({ status: 'done', text: `You've joined ${data.owner_name}'s family. You can see it any time under "Share with family".` });
    });
  }, [token]);

  return (
    <div className="max-w-lg mx-auto mt-16 bg-white rounded-xl shadow p-8 text-center space-y-4">
      <Users className="w-12 h-12 mx-auto text-genesis-600" />
      <p className={state.status === 'error' ? 'text-red-700' : 'text-gray-800'}>{state.text}</p>
      {state.status !== 'working' && (
        <button onClick={() => navigate('/dashboard?feature=family-sharing')} className="px-4 py-2 bg-genesis-600 text-white rounded-lg">Open my family page</button>
      )}
    </div>
  );
};

export default JoinFamily;
