import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Users } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { t, useLang } from '../lib/i18n';

export const PENDING_INVITE_KEY = 'genesis.pendingInvite';
const PENDING_MAX_AGE_MS = 24 * 60 * 60 * 1000;

/** Remembers an invite opened while signed out, so it can be offered again right after signing in. */
export function rememberInvite(token: string) {
  try { localStorage.setItem(PENDING_INVITE_KEY, JSON.stringify({ token, at: Date.now() })); } catch { /* storage blocked */ }
}

/** The remembered invite, if it is less than a day old. Old or malformed entries are cleared. */
export function pendingInvite(): string | null {
  try {
    const raw = localStorage.getItem(PENDING_INVITE_KEY);
    if (!raw) return null;
    const { token, at } = JSON.parse(raw) as { token?: string; at?: number };
    if (typeof token === 'string' && typeof at === 'number' && Date.now() - at < PENDING_MAX_AGE_MS) return token;
    localStorage.removeItem(PENDING_INVITE_KEY);
  } catch { /* storage blocked or bad value */ }
  return null;
}

const forgetInvite = () => { try { localStorage.removeItem(PENDING_INVITE_KEY); } catch { /* storage blocked */ } };

interface Preview { owner_name: string; role: 'viewer' | 'contributor' | 'editor'; own: boolean; joined: boolean }

/** Opened from an invite link (/join/<token>). Shows whose family it is and only joins when the person agrees. */
export const JoinFamily: React.FC = () => {
  useLang();
  const { token = '' } = useParams();
  const navigate = useNavigate();
  const [preview, setPreview] = useState<Preview | null>(null);
  const [state, setState] = useState<{ status: 'loading' | 'ask' | 'working' | 'done' | 'error'; text: string }>({ status: 'loading', text: t('Checking your invite…') });

  useEffect(() => {
    forgetInvite();
    supabase.rpc('preview_family_invite', { p_token: token }).then(({ data, error }: { data: Preview | null; error: { message: string } | null }) => {
      if (error || !data) setState({ status: 'error', text: error?.message ?? t('This invite link is no longer valid.') });
      else if (data.own) setState({ status: 'error', text: t('This is your own invite link. Send it to a relative so they can join.') });
      else if (data.joined) setState({ status: 'done', text: t("You're already part of {name}'s family.", { name: data.owner_name }) });
      else { setPreview(data); setState({ status: 'ask', text: '' }); }
    });
  }, [token]);

  const accept = async () => {
    setState({ status: 'working', text: t('Joining…') });
    const { data, error } = await supabase.rpc('accept_family_invite', { p_token: token });
    if (error || !data) setState({ status: 'error', text: error?.message ?? t('This invite link is no longer valid.') });
    else setState({ status: 'done', text: t("You've joined {name}'s family. You can see it any time under “Share with family”.", { name: data.owner_name }) });
  };

  const openFamilyPage = () => navigate('/dashboard?feature=family-sharing');

  return (
    <div className="max-w-lg mx-auto mt-16 bg-white rounded-xl shadow p-8 text-center space-y-4">
      <Users className="w-12 h-12 mx-auto text-genesis-600" />
      {state.status === 'ask' && preview ? (
        <>
          <h1 className="text-xl font-semibold">{t("Join {name}'s family?", { name: preview.owner_name })}</h1>
          <p className="text-gray-600">
            {preview.role === 'editor'
              ? t('You’ll be able to see their family tree, stories and storybooks, add your own memories, and help fix and fill in the tree.')
              : preview.role === 'contributor'
              ? t('You’ll be able to see their family tree, stories and storybooks, and add your own memories.')
              : t('You’ll be able to see their family tree, stories and storybooks.')}{' '}
            {t('They will see your name. You can leave at any time by asking them to remove you.')}
          </p>
          <div className="flex justify-center gap-3">
            <button onClick={accept} className="px-4 py-2 bg-genesis-600 text-white rounded-lg">{t('Yes, join')}</button>
            <button onClick={() => navigate('/dashboard')} className="px-4 py-2 border rounded-lg">{t('No thanks')}</button>
          </div>
        </>
      ) : (
        <>
          <p className={state.status === 'error' ? 'text-red-700' : 'text-gray-800'}>{state.text}</p>
          {(state.status === 'done' || state.status === 'error') && (
            <button onClick={openFamilyPage} className="px-4 py-2 bg-genesis-600 text-white rounded-lg">{t('Open my family page')}</button>
          )}
        </>
      )}
    </div>
  );
};

export default JoinFamily;
