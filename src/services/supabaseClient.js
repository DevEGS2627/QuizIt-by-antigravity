// Supabase Client Integration with Resilient Local-Fallback Engine
import { createClient } from '@supabase/supabase-js';

// Retrieve credentials from environment variables or custom localStorage override
const getSupabaseConfig = () => {
  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const localUrl = typeof window !== 'undefined' ? localStorage.getItem('egs_supabase_url') : null;
  const localKey = typeof window !== 'undefined' ? localStorage.getItem('egs_supabase_anon_key') : null;

  return {
    url: localUrl || envUrl || '',
    key: localKey || envKey || ''
  };
};

let supabaseInstance = null;
const { url, key } = getSupabaseConfig();

if (url && key && url.startsWith('http')) {
  try {
    supabaseInstance = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true
      },
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    });
  } catch (err) {
    console.warn('Failed to initialize Supabase client:', err);
  }
}

export const supabase = supabaseInstance;

export const supabaseService = {
  isConfigured() {
    return Boolean(supabaseInstance);
  },

  getConfig() {
    return getSupabaseConfig();
  },

  saveCustomConfig(newUrl, newKey) {
    if (typeof window !== 'undefined') {
      if (newUrl) localStorage.setItem('egs_supabase_url', newUrl);
      else localStorage.removeItem('egs_supabase_url');

      if (newKey) localStorage.setItem('egs_supabase_anon_key', newKey);
      else localStorage.removeItem('egs_supabase_anon_key');
      
      window.location.reload();
    }
  },

  // Auth Operations
  async loginAdmin(email, password) {
    if (!supabaseInstance) {
      // Local development mock login
      if (email === 'admin@egs.edu' && password === 'admin123') {
        const mockUser = { id: 'admin-mock-1', email: 'admin@egs.edu', role: 'operator' };
        localStorage.setItem('egs_mock_admin_session', JSON.stringify(mockUser));
        return { user: mockUser, error: null };
      }
      return { user: null, error: { message: 'Invalid credentials. Demo admin: admin@egs.edu / admin123' } };
    }

    try {
      const { data, error } = await supabaseInstance.auth.signInWithPassword({
        email,
        password
      });
      return { user: data?.user || null, error };
    } catch (err) {
      return { user: null, error: err };
    }
  },

  async logoutAdmin() {
    if (!supabaseInstance) {
      localStorage.removeItem('egs_mock_admin_session');
      return { error: null };
    }
    return await supabaseInstance.auth.signOut();
  },

  async getCurrentSession() {
    if (!supabaseInstance) {
      const mock = localStorage.getItem('egs_mock_admin_session');
      return mock ? JSON.parse(mock) : null;
    }
    const { data } = await supabaseInstance.auth.getSession();
    return data?.session?.user || null;
  },

  // Realtime subscription for synced quiz state
  subscribeToLiveQuiz(onUpdate) {
    if (!supabaseInstance) return () => {};

    const channel = supabaseInstance
      .channel('public:live_quiz_state')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'live_quiz_state' },
        (payload) => {
          if (onUpdate) onUpdate(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabaseInstance.removeChannel(channel);
    };
  },

  // Sync state to remote Supabase (if connected)
  async pushLiveState(statePayload) {
    if (!supabaseInstance) return false;
    try {
      const { error } = await supabaseInstance
        .from('live_quiz_state')
        .upsert({ id: 'current_arena', ...statePayload, updated_at: new Date().toISOString() });
      if (error) console.warn('Supabase state push error:', error);
      return !error;
    } catch (err) {
      console.warn('Supabase sync error:', err);
      return false;
    }
  }
};
