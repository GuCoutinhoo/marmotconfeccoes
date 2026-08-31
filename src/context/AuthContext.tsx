import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserProfile, Address, Order, OrderStatus } from '../types';
import { useToast } from './ToastContext';
import {
  supabase,
  isSupabaseConfigured,
  fetchUserAddressesDirect,
  saveUserAddressDirect,
  updateUserAddressDirect,
  deleteUserAddressDirect,
  fetchUserOrdersDirect,
  fetchAllOrdersDirectAdmin,
} from '../lib/supabaseClient';
import { User, Session } from '@supabase/supabase-js';

interface AuthContextData {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isAdminLoggedIn: boolean;
  isLoading: boolean;
  orders: Order[];
  allOrders: Order[];
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; user?: UserProfile }>;
  register: (data: { name: string; email: string; password: string; phone?: string; cpf?: string }) => Promise<{ success: boolean; error?: string; user?: UserProfile; needsEmailConfirmation?: boolean; verificationCode?: string }>;
  logout: () => Promise<void>;
  adminLogin: (emailOrPassword: string, optionalPassword?: string) => Promise<boolean>;
  adminLogout: () => Promise<void>;
  verifyEmail: (email: string, code: string) => Promise<{ success: boolean; error?: string }>;
  resendVerification: (email: string) => Promise<{ success: boolean; error?: string; verificationCode?: string }>;
  forgotPassword: (email: string) => Promise<{ success: boolean; error?: string; previewResetCode?: string; message?: string }>;
  resetPassword: (email: string, code: string, newPassword: string) => Promise<{ success: boolean; error?: string; message?: string }>;
  updateProfile: (updatedData: Partial<UserProfile>) => Promise<{ success: boolean; error?: string }>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  refreshAddresses: (userId?: string) => Promise<Address[]>;
  addAddress: (address: Omit<Address, 'id'>) => Promise<void>;
  updateAddress: (id: string, address: Partial<Address>) => Promise<void>;
  deleteAddress: (id: string) => Promise<void>;
  setDefaultAddress: (id: string) => Promise<void>;
  addOrder: (order: Order) => Promise<Order>;
  registerOrder: (order: Order) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus, trackingCode?: string) => Promise<void>;
  refreshOrders: () => Promise<void>;
  refreshAllAdminOrders: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

// Helper to translate Supabase errors to friendly Portuguese
function formatSupabaseAuthError(error: any): string {
  if (!error) return 'Erro desconhecido na autenticação.';
  const code = (error?.code || error?.error || '').toLowerCase();
  const status = error?.status;
  const msg = (typeof error === 'string' ? error : error.message || error.error_description || error.msg || String(error)).toLowerCase();

  // Supabase built-in email rate limit (status 429 or over_email_send_rate_limit)
  if (code.includes('over_email_send_rate_limit') || msg.includes('over_email_send_rate_limit') || (status === 429 && msg.includes('email'))) {
    return 'Não foi possível enviar o e-mail de confirmação neste momento devido ao limite de envios do servidor. Por favor, aguarde alguns instantes e tente novamente.';
  }

  // General auth rate limit
  if (status === 429 || code.includes('rate_limit') || msg.includes('rate limit') || msg.includes('too many requests')) {
    return 'Muitas tentativas em pouco tempo. Aguarde alguns instantes e tente novamente.';
  }

  if (code.includes('invalid_credentials') || msg.includes('invalid login credentials') || msg.includes('invalid_credentials')) {
    return 'E-mail ou senha incorretos. Por favor, verifique suas credenciais.';
  }

  if (code.includes('user_already_exists') || msg.includes('user already registered') || msg.includes('already exists') || msg.includes('already registered')) {
    return 'Já existe uma conta cadastrada com este endereço de e-mail.';
  }

  if (code.includes('email_not_confirmed') || msg.includes('email not confirmed') || msg.includes('email_not_confirmed')) {
    return 'Seu e-mail ainda não foi confirmado. Verifique sua caixa de entrada para ativar a conta.';
  }

  if (msg.includes('password should be at least')) {
    return 'A senha deve conter no mínimo 6 caracteres.';
  }

  if (code.includes('invalid_email') || msg.includes('invalid email') || msg.includes('unable to validate email')) {
    return 'Formato de e-mail inválido.';
  }

  if (code.includes('otp_expired') || msg.includes('token has expired') || msg.includes('otp_expired') || msg.includes('token expired')) {
    return 'O link de confirmação expirou. Solicite um novo link de ativação.';
  }

  if (code.includes('invalid_token') || msg.includes('email link is invalid or has expired') || msg.includes('invalid_token')) {
    return 'O link de confirmação é inválido ou já foi utilizado.';
  }

  return typeof error === 'string' ? error : error.message || error.error_description || String(error);
}

// Convert Supabase User to UserProfile safely
function mapSupabaseUserToProfile(sbUser: User, sessionToken?: string): UserProfile {
  if (!sbUser) {
    return {
      id: '',
      name: 'Cliente Marmot',
      email: '',
      role: 'customer',
      isVerified: false,
      addresses: [],
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    };
  }

  const appMeta = (sbUser as any).app_metadata || {};
  const userMeta = sbUser.user_metadata || {};

  // Security rule: admin privilege must come strictly from app_metadata.role === 'admin' or profiles.is_admin
  const isSupabaseAdminRole = appMeta.role === 'admin';
  const role = isSupabaseAdminRole ? 'admin' : 'customer';

  return {
    id: sbUser.id,
    name: userMeta.name || userMeta.full_name || sbUser.email?.split('@')[0] || 'Cliente Marmot',
    email: sbUser.email || '',
    phone: userMeta.phone || '',
    cpf: userMeta.cpf || '',
    role,
    isVerified: Boolean(sbUser.email_confirmed_at || sbUser.confirmed_at),
    addresses: Array.isArray(userMeta.addresses) ? userMeta.addresses : [],
    createdAt: sbUser.created_at || new Date().toISOString(),
    lastLogin: sbUser.last_sign_in_at || new Date().toISOString(),
  };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('@marmot_auth_token') || null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [allOrders, setAllOrders] = useState<Order[]>([]);

  const { showToast } = useToast();

  const safeToast = useCallback((title: string, description?: string, type: 'success' | 'error' | 'info' = 'success') => {
    try {
      if (typeof showToast === 'function') {
        showToast(title, description, type);
      }
    } catch {
      // Never let toast failures disrupt auth flows
    }
  }, [showToast]);

  const getAuthHeaders = useCallback(() => {
    const activeToken = token || localStorage.getItem('@marmot_auth_token');
    return {
      'Content-Type': 'application/json',
      ...(activeToken ? { Authorization: `Bearer ${activeToken}` } : {}),
    };
  }, [token]);

  // Load User Addresses from public.user_addresses table
  const refreshAddresses = useCallback(async (userId?: string): Promise<Address[]> => {
    const targetUserId = userId || user?.id;
    if (!targetUserId) return [];

    let fetched: Address[] = [];

    // 1. Try Direct Supabase Query from public.user_addresses
    if (isSupabaseConfigured()) {
      try {
        fetched = await fetchUserAddressesDirect(targetUserId);
      } catch (err) {
        console.warn('[Auth] Supabase fetchUserAddressesDirect error:', err);
      }
    }

    // 2. Fallback to API endpoint
    if (fetched.length === 0) {
      try {
        const activeToken = token || localStorage.getItem('@marmot_auth_token');
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (activeToken) headers['Authorization'] = `Bearer ${activeToken}`;

        const res = await fetch('/api/user/addresses', { headers, credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.addresses) && data.addresses.length > 0) {
            fetched = data.addresses;
          }
        }
      } catch (err) {
        console.warn('[Auth] API addresses fetch error:', err);
      }
    }

    if (fetched.length > 0) {
      setUser((prev) => (prev && prev.id === targetUserId ? { ...prev, addresses: fetched } : prev));
    }
    return fetched;
  }, [token, user?.id]);

  // Load User Orders
  const refreshOrders = useCallback(async () => {
    const activeToken = token || localStorage.getItem('@marmot_auth_token');
    if (!activeToken && !user) {
      if (!isLoading) setOrders([]);
      return;
    }

    let fetched: Order[] = [];

    // 1. Direct Supabase Query when available
    if (isSupabaseConfigured() && user) {
      try {
        fetched = await fetchUserOrdersDirect(user.id, user.email);
      } catch (sbErr) {
        console.warn('[Supabase Direct Orders] query fallback:', sbErr);
      }
    }

    // 2. API Endpoint Query with safe catch
    if (fetched.length === 0) {
      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        if (activeToken) {
          headers['Authorization'] = `Bearer ${activeToken}`;
          headers['x-admin-token'] = activeToken;
        }

        const res = await fetch('/api/user/orders', { headers, credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            fetched = data;
          }
        }
      } catch {
        // Silently fall back to cached orders in state
      }
    }

    if (fetched.length > 0) {
      const uniqueOrders = Array.from(new Map(fetched.map((o: Order) => [o.id, o])).values());
      setOrders(uniqueOrders);
    }
  }, [token, user, isLoading]);

  // Load All Orders (Admin)
  const refreshAllAdminOrders = useCallback(async () => {
    const activeToken = token || localStorage.getItem('@marmot_auth_token');

    let fetched: Order[] = [];

    // 1. Direct Supabase Query for admin when available
    if (isSupabaseConfigured() && user?.role === 'admin') {
      try {
        fetched = await fetchAllOrdersDirectAdmin();
      } catch (sbErr) {
        console.warn('[Supabase Direct Admin Orders] fallback:', sbErr);
      }
    }

    // 2. API Endpoint Query with safe catch
    if (fetched.length === 0) {
      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        if (activeToken) {
          headers['Authorization'] = `Bearer ${activeToken}`;
          headers['x-admin-token'] = activeToken;
        }

        const res = await fetch('/api/admin/orders', { headers, credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            fetched = data;
          }
        }
      } catch {
        // Silently fall back
      }
    }

    if (fetched.length > 0) {
      const uniqueOrders = Array.from(new Map(fetched.map((o: Order) => [o.id, o])).values());
      setAllOrders(uniqueOrders);
    }
  }, [token, user]);

  // =========================================================
  // SUPABASE SESSION INITIALIZATION & REAL-TIME LISTENER
  // =========================================================
  useEffect(() => {
    let isMounted = true;

    async function initAuthSession() {
      setIsLoading(true);

      if (isSupabaseConfigured()) {
        try {
          const { data: { session }, error } = await supabase.auth.getSession();
          if (error) {
            console.warn('[Supabase Auth] Session fetch error:', error.message);
          }

          if (isMounted) {
            if (session?.user) {
              const mapped = mapSupabaseUserToProfile(session.user, session.access_token);
              // Fetch saved profile and role from public.profiles table
              try {
                const { data: dbProfile } = await supabase
                  .from('profiles')
                  .select('role, is_admin, name, phone, cpf')
                  .eq('id', session.user.id)
                  .maybeSingle();

                if (dbProfile) {
                  if (dbProfile.role === 'admin' || dbProfile.is_admin === true) {
                    mapped.role = 'admin';
                  }
                  if (dbProfile.name) mapped.name = dbProfile.name;
                  if (dbProfile.phone) mapped.phone = dbProfile.phone;
                  if (dbProfile.cpf) mapped.cpf = dbProfile.cpf;
                }
              } catch (profErr) {
                console.warn('[Supabase Auth] Profile fetch notice:', profErr);
              }

              // Fetch saved addresses from public.user_addresses table
              const addressesFromDb = await fetchUserAddressesDirect(session.user.id);
              if (addressesFromDb.length > 0) {
                mapped.addresses = addressesFromDb;
              }
              setUser(mapped);
              setToken(session.access_token);
              localStorage.setItem('@marmot_auth_token', session.access_token);

              // Preload orders immediately so F5 never flashes empty state
              const ordersFromDb = await fetchUserOrdersDirect(session.user.id, session.user.email);
              if (ordersFromDb.length > 0 && isMounted) {
                setOrders(ordersFromDb);
              }
            } else {
              setUser(null);
              setToken(null);
              localStorage.removeItem('@marmot_auth_token');
            }
          }
        } catch (err) {
          console.error('[Supabase Auth] Failed to initialize session:', err);
        } finally {
          if (isMounted) setIsLoading(false);
        }
      } else {
        // Fallback: Check local backend session if Supabase is not configured yet
        const savedToken = localStorage.getItem('@marmot_auth_token');
        if (!savedToken) {
          if (isMounted) {
            setUser(null);
            setToken(null);
            setIsLoading(false);
          }
          return;
        }

        try {
          const res = await fetch('/api/auth/me', {
            headers: { Authorization: `Bearer ${savedToken}` },
          });

          if (res.ok) {
            const data = await res.json();
            if (isMounted && data.user) {
              setUser(data.user);
              setToken(savedToken);
            }
          } else {
            localStorage.removeItem('@marmot_auth_token');
            if (isMounted) {
              setUser(null);
              setToken(null);
            }
          }
        } catch (err) {
          console.error('Backend session check error:', err);
        } finally {
          if (isMounted) setIsLoading(false);
        }
      }
    }

    initAuthSession();

    // Set up Supabase Auth state listener
    let authListener: { subscription: { unsubscribe: () => void } } | null = null;
    if (isSupabaseConfigured()) {
      const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (!isMounted) return;

        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
          if (session?.user) {
            const mapped = mapSupabaseUserToProfile(session.user, session.access_token);
            try {
              const { data: dbProfile } = await supabase
                .from('profiles')
                .select('role, is_admin, name, phone, cpf')
                .eq('id', session.user.id)
                .maybeSingle();

              if (dbProfile) {
                if (dbProfile.role === 'admin' || dbProfile.is_admin === true) {
                  mapped.role = 'admin';
                }
                if (dbProfile.name) mapped.name = dbProfile.name;
                if (dbProfile.phone) mapped.phone = dbProfile.phone;
                if (dbProfile.cpf) mapped.cpf = dbProfile.cpf;
              }
            } catch {}

            try {
              const addressesFromDb = await fetchUserAddressesDirect(session.user.id);
              if (addressesFromDb.length > 0) {
                mapped.addresses = addressesFromDb;
              }
            } catch {}
            setUser(mapped);
            setToken(session.access_token);
            localStorage.setItem('@marmot_auth_token', session.access_token);

            try {
              const ordersFromDb = await fetchUserOrdersDirect(session.user.id, session.user.email);
              if (ordersFromDb.length > 0 && isMounted) {
                setOrders(ordersFromDb);
              }
            } catch {}
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setToken(null);
          setOrders([]);
          setAllOrders([]);
          localStorage.removeItem('@marmot_auth_token');
        }
      });
      authListener = data;
    }

    return () => {
      isMounted = false;
      if (authListener?.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  // Fetch orders when user changes
  useEffect(() => {
    if (user) {
      refreshOrders();
      if (user.role === 'admin') {
        refreshAllAdminOrders();
      }
    } else if (!isLoading) {
      setOrders([]);
      setAllOrders([]);
    }
  }, [user, isLoading, refreshOrders, refreshAllAdminOrders]);

  // =========================================================
  // 1. LOGIN
  // =========================================================
  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string; user?: UserProfile }> => {
    const cleanEmail = email.trim();

    if (!cleanEmail || !password) {
      return { success: false, error: 'E-mail e senha são obrigatórios.' };
    }

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

        if (error) {
          return { success: false, error: formatSupabaseAuthError(error) };
        }

        if (!data.user || !data.session) {
          return { success: false, error: 'Não foi possível estabelecer a sessão com o Supabase.' };
        }

        const profile = mapSupabaseUserToProfile(data.user, data.session.access_token);
        setUser(profile);
        setToken(data.session.access_token);
        localStorage.setItem('@marmot_auth_token', data.session.access_token);

        safeToast(
          'Login Realizado',
          `Bem-vindo(a) de volta, ${profile.name.split(' ')[0]}!`,
          'success'
        );

        return { success: true, user: profile };
      } catch (err: any) {
        console.error('[Supabase Login Error]:', err);
        return {
          success: false,
          error: err?.message ? formatSupabaseAuthError(err) : 'Falha de comunicação com o serviço de autenticação.',
        };
      }
    } else {
      // Fallback to Express backend if Supabase env keys not supplied
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: cleanEmail, password }),
        });

        const data = await res.json();
        if (!res.ok) {
          return { success: false, error: data.error || 'Falha ao autenticar.' };
        }

        localStorage.setItem('@marmot_auth_token', data.token);
        setToken(data.token);
        setUser(data.user);

        safeToast(
          'Login Realizado',
          `Bem-vindo(a) de volta, ${data.user.name.split(' ')[0]}!`,
          'success'
        );

        return { success: true, user: data.user };
      } catch (err) {
        console.error('Login error:', err);
        return { success: false, error: 'Erro de conexão com o servidor.' };
      }
    }
  };

  // =========================================================
  // 2. REGISTER
  // =========================================================
  const register = async (userData: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    cpf?: string;
  }): Promise<{ success: boolean; error?: string; user?: UserProfile; needsEmailConfirmation?: boolean; verificationCode?: string }> => {
    const cleanName = userData.name.trim();
    const cleanEmail = userData.email.trim().toLowerCase();

    if (!cleanName || cleanName.length < 2) {
      return { success: false, error: 'Informe seu nome completo.' };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      return { success: false, error: 'Insira um e-mail com formato válido.' };
    }

    if (!userData.password || userData.password.length < 6) {
      return { success: false, error: 'A senha deve conter no mínimo 6 caracteres.' };
    }

    if (isSupabaseConfigured()) {
      try {
        const redirectUrl = typeof window !== 'undefined' ? `${window.location.origin}/auth/confirm` : undefined;

        console.log('[Supabase Register] Initiating registration request...', {
          emailDomain: cleanEmail.split('@')[1] || '',
          hasRedirectUrl: !!redirectUrl,
        });

        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password: userData.password,
          options: {
            emailRedirectTo: redirectUrl,
            data: {
              name: cleanName,
              phone: userData.phone?.trim() || '',
              cpf: userData.cpf?.trim() || '',
              role: 'customer',
              addresses: [],
            },
          },
        });

        console.log('[Supabase Register] SignUp result:', {
          hasUser: !!data?.user,
          hasSession: !!data?.session,
          identitiesCount: data?.user?.identities?.length,
          status: error?.status,
          code: (error as any)?.code,
          message: error?.message,
        });

        if (error) {
          return { success: false, error: formatSupabaseAuthError(error) };
        }

        // Supabase returns an empty identities array if user is already registered (when email confirmation is active)
        if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
          return {
            success: false,
            error: 'Este endereço de e-mail já está cadastrado. Faça login ou recupere sua senha.',
          };
        }

        if (!data.user) {
          return { success: false, error: 'Não foi possível completar o cadastro.' };
        }

        const profile = mapSupabaseUserToProfile(data.user, data.session?.access_token);

        if (data.session) {
          // Immediate session established (Email confirmation disabled in Supabase project)
          setUser(profile);
          setToken(data.session.access_token);
          localStorage.setItem('@marmot_auth_token', data.session.access_token);

          safeToast(
            'Conta Criada com Sucesso',
            `Bem-vindo(a) à MARMOT, ${profile.name.split(' ')[0]}!`,
            'success'
          );

          return { success: true, user: profile };
        } else {
          // Email confirmation is required by Supabase (Waiting for verification)
          safeToast(
            'Confirmação de E-mail Enviada',
            'Enviamos um link de ativação para o seu e-mail.',
            'info'
          );

          return {
            success: true,
            user: profile,
            needsEmailConfirmation: true,
          };
        }
      } catch (err: any) {
        console.error('[Supabase Register Error]:', err);
        return {
          success: false,
          error: err?.message ? formatSupabaseAuthError(err) : 'Falha ao processar o cadastro no Supabase.',
        };
      }
    } else {
      // Fallback to Express backend if Supabase not configured
      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: cleanName,
            email: cleanEmail,
            password: userData.password,
            phone: userData.phone,
            cpf: userData.cpf,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          return { success: false, error: data.error || 'Falha ao criar cadastro.' };
        }

        localStorage.setItem('@marmot_auth_token', data.token);
        setToken(data.token);
        setUser(data.user);

        safeToast(
          'Conta Criada com Sucesso',
          `Bem-vindo(a) à MARMOT, ${data.user.name.split(' ')[0]}!`,
          'success'
        );

        return {
          success: true,
          user: data.user,
          verificationCode: data.verificationCode,
        };
      } catch (err) {
        console.error('Register error:', err);
        return { success: false, error: 'Erro de conexão ao cadastrar.' };
      }
    }
  };

  // =========================================================
  // 3. LOGOUT
  // =========================================================
  const logout = async (): Promise<void> => {
    try {
      if (isSupabaseConfigured()) {
        await supabase.auth.signOut();
      } else {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: getAuthHeaders(),
        });
      }
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      localStorage.removeItem('@marmot_auth_token');
      setToken(null);
      setUser(null);
      setOrders([]);
      setAllOrders([]);
      safeToast('Sessão Encerrada', 'Você saiu da sua conta com segurança.', 'info');
    }
  };

  // =========================================================
  // 4. ADMIN AUTHENTICATION
  // =========================================================
  const adminLogin = async (emailOrPassword: string, optionalPassword?: string): Promise<boolean> => {
    const email = optionalPassword !== undefined ? emailOrPassword.trim() : '';
    const password = optionalPassword !== undefined ? optionalPassword : emailOrPassword;

    if (!email) {
      safeToast('Acesso Restrito', 'Informe o e-mail do administrador.', 'error');
      return false;
    }

    const result = await login(email, password);
    if (!result.success || !result.user) {
      return false;
    }

    // Verify admin role strictly from user profile / backend
    if (result.user.role === 'admin') {
      return true;
    }

    // Double check with backend /api/auth/me
    try {
      const activeToken = localStorage.getItem('@marmot_auth_token');
      if (activeToken) {
        const res = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${activeToken}` },
        });
        if (res.ok) {
          const meData = await res.json();
          if (meData.user?.role === 'admin') {
            setUser((prev) => (prev ? { ...prev, role: 'admin' } : meData.user));
            return true;
          }
        }
      }
    } catch {}

    safeToast('Acesso Restrito', 'Esta conta não possui privilégios de administrador.', 'error');
    return false;
  };

  const adminLogout = async (): Promise<void> => {
    await logout();
  };

  // =========================================================
  // 5. EMAIL VERIFICATION & RECOVERY
  // =========================================================
  const verifyEmail = async (email: string, code: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Código incorreto ou expirado.' };
      }

      if (user && user.email.toLowerCase() === email.toLowerCase()) {
        setUser({ ...user, isVerified: true });
      }

      safeToast('E-mail Verificado', 'Sua conta foi verificada com sucesso!', 'success');
      return { success: true };
    } catch {
      return { success: false, error: 'Erro ao verificar e-mail.' };
    }
  };

  const resendVerification = async (email: string): Promise<{ success: boolean; error?: string; verificationCode?: string }> => {
    if (isSupabaseConfigured()) {
      try {
        const redirectUrl = typeof window !== 'undefined' ? `${window.location.origin}/auth/confirm` : undefined;
        const { error } = await supabase.auth.resend({
          type: 'signup',
          email: email.trim(),
          options: {
            emailRedirectTo: redirectUrl,
          },
        });
        if (error) {
          return { success: false, error: formatSupabaseAuthError(error) };
        }
        safeToast('E-mail Reenviado', 'Um novo link de confirmação foi enviado.', 'info');
        return { success: true };
      } catch (err: any) {
        return {
          success: false,
          error: err?.message ? formatSupabaseAuthError(err) : 'Erro ao reenviar confirmação do Supabase.',
        };
      }
    } else {
      try {
        const res = await fetch('/api/auth/resend-verification', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });

        const data = await res.json();
        if (!res.ok) {
          return { success: false, error: data.error || 'Erro ao reenviar código.' };
        }

        safeToast('Código Reenviado', 'Um novo código de 6 dígitos foi gerado.', 'info');
        return { success: true, verificationCode: data.verificationCode };
      } catch {
        return { success: false, error: 'Erro ao reenviar código.' };
      }
    }
  };

  const forgotPassword = async (email: string): Promise<{ success: boolean; error?: string; previewResetCode?: string; message?: string }> => {
    const cleanEmail = email.trim();
    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
          redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/` : undefined,
        });

        if (error) {
          return { success: false, error: formatSupabaseAuthError(error) };
        }

        safeToast(
          'Recuperação Solicitada',
          'Enviamos as instruções de redefinição de senha para o seu e-mail.',
          'info'
        );

        return {
          success: true,
          message: 'Instruções enviadas para o seu e-mail.',
        };
      } catch (err: any) {
        return { success: false, error: 'Falha ao solicitar recuperação pelo Supabase.' };
      }
    } else {
      try {
        const res = await fetch('/api/auth/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: cleanEmail }),
        });

        const data = await res.json();
        if (!res.ok) {
          return { success: false, error: data.error || 'Erro ao processar solicitação.' };
        }

        return {
          success: true,
          previewResetCode: data.previewResetCode,
          message: data.message,
        };
      } catch {
        return { success: false, error: 'Erro de comunicação ao recuperar senha.' };
      }
    }
  };

  const resetPassword = async (email: string, code: string, newPassword: string): Promise<{ success: boolean; error?: string; message?: string }> => {
    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) {
          return { success: false, error: formatSupabaseAuthError(error) };
        }
        safeToast('Senha Atualizada', 'Sua nova senha foi gravada com sucesso.', 'success');
        return { success: true };
      } catch (err: any) {
        return { success: false, error: 'Falha ao atualizar senha no Supabase.' };
      }
    } else {
      try {
        const res = await fetch('/api/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, code, newPassword }),
        });

        const data = await res.json();
        if (!res.ok) {
          return { success: false, error: data.error || 'Falha ao redefinir senha.' };
        }

        safeToast('Senha Atualizada', 'Faça login agora com a sua nova senha.', 'success');
        return { success: true, message: data.message };
      } catch {
        return { success: false, error: 'Erro ao redefinir senha.' };
      }
    }
  };

  // =========================================================
  // 6. PROFILE & ADDRESS MANAGEMENT
  // =========================================================
  const updateProfile = async (updatedData: Partial<UserProfile>): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'Usuário não autenticado.' };

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.auth.updateUser({
          data: {
            name: updatedData.name ?? user.name,
            phone: updatedData.phone ?? user.phone,
            cpf: updatedData.cpf ?? user.cpf,
          },
        });

        if (error) {
          return { success: false, error: formatSupabaseAuthError(error) };
        }

        if (data.user) {
          const profile = mapSupabaseUserToProfile(data.user, token || undefined);
          setUser(profile);
        }

        safeToast('Perfil Atualizado', 'Seus dados foram salvos com sucesso.', 'success');
        return { success: true };
      } catch (err: any) {
        return { success: false, error: 'Erro ao atualizar dados no Supabase.' };
      }
    } else {
      try {
        const res = await fetch('/api/user/profile', {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify(updatedData),
        });

        const data = await res.json();
        if (!res.ok) {
          safeToast('Erro ao Salvar', data.error || 'Não foi possível salvar os dados.', 'error');
          return { success: false, error: data.error };
        }

        setUser(data.user);
        safeToast('Perfil Atualizado', 'Seus dados foram salvos com sucesso.', 'success');
        return { success: true };
      } catch {
        safeToast('Erro no Servidor', 'Falha ao conectar com o servidor.', 'error');
        return { success: false, error: 'Falha na conexão.' };
      }
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) {
          safeToast('Erro na Senha', formatSupabaseAuthError(error), 'error');
          return { success: false, error: formatSupabaseAuthError(error) };
        }
        safeToast('Senha Alterada', 'Sua senha foi alterada com sucesso.', 'success');
        return { success: true };
      } catch (err: any) {
        safeToast('Erro', 'Falha ao alterar senha no Supabase.', 'error');
        return { success: false, error: 'Erro ao alterar senha.' };
      }
    } else {
      try {
        const res = await fetch('/api/user/password', {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify({ currentPassword, newPassword }),
        });

        const data = await res.json();
        if (!res.ok) {
          safeToast('Erro na Senha', data.error || 'Senha atual incorreta.', 'error');
          return { success: false, error: data.error };
        }

        safeToast('Senha Alterada', 'Sua senha foi alterada com sucesso.', 'success');
        return { success: true };
      } catch {
        safeToast('Erro', 'Falha ao alterar senha.', 'error');
        return { success: false, error: 'Erro de conexão.' };
      }
    }
  };

  const addAddress = async (addressData: Omit<Address, 'id'>): Promise<void> => {
    if (!user) return;
    const isFirst = user.addresses.length === 0;
    const isDefault = isFirst ? true : Boolean(addressData.isDefault);

    const newAddress: Address = {
      ...addressData,
      id: `addr-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
      isDefault,
    };

    // 1. Direct Supabase operation to public.user_addresses table
    if (isSupabaseConfigured()) {
      try {
        await saveUserAddressDirect(user.id, newAddress);
      } catch (err) {
        console.warn('[Auth] Supabase save address error:', err);
      }
    }

    // 2. Synchronize with API route
    try {
      const res = await fetch('/api/user/addresses', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(newAddress),
      });

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.addresses)) {
          setUser({ ...user, addresses: data.addresses });
          safeToast('Endereço Salvo', 'Novo endereço de entrega adicionado.', 'success');
          return;
        }
      }
    } catch (err) {
      console.warn('[Auth] API save address error:', err);
    }

    // 3. Fallback state update
    let updatedAddresses = [...(user.addresses || [])];
    if (isDefault) {
      updatedAddresses = updatedAddresses.map((a) => ({ ...a, isDefault: false }));
    }
    updatedAddresses.push(newAddress);
    setUser({ ...user, addresses: updatedAddresses });
    safeToast('Endereço Salvo', 'Novo endereço de entrega adicionado.', 'success');
  };

  const updateAddress = async (id: string, addressData: Partial<Address>): Promise<void> => {
    if (!user) return;

    // 1. Direct Supabase operation to public.user_addresses table
    if (isSupabaseConfigured()) {
      try {
        await updateUserAddressDirect(user.id, id, addressData);
      } catch (err) {
        console.warn('[Auth] Supabase update address error:', err);
      }
    }

    // 2. Synchronize with API route
    try {
      const res = await fetch(`/api/user/addresses/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(addressData),
      });

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.addresses)) {
          setUser({ ...user, addresses: data.addresses });
          safeToast('Endereço Atualizado', 'Endereço editado com sucesso.', 'success');
          return;
        }
      }
    } catch (err) {
      console.warn('[Auth] API update address error:', err);
    }

    // 3. Fallback state update
    let updatedAddresses = (user.addresses || []).map((a) => {
      if (a.id === id) {
        return { ...a, ...addressData };
      }
      if (addressData.isDefault) {
        return { ...a, isDefault: false };
      }
      return a;
    });

    setUser({ ...user, addresses: updatedAddresses });
    safeToast('Endereço Atualizado', 'Endereço editado com sucesso.', 'success');
  };

  const deleteAddress = async (id: string): Promise<void> => {
    if (!user) return;

    // 1. Direct Supabase operation to public.user_addresses table
    if (isSupabaseConfigured()) {
      try {
        await deleteUserAddressDirect(user.id, id);
      } catch (err) {
        console.warn('[Auth] Supabase delete address error:', err);
      }
    }

    // 2. Synchronize with API route
    try {
      const res = await fetch(`/api/user/addresses/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.addresses)) {
          setUser({ ...user, addresses: data.addresses });
          safeToast('Endereço Excluído', 'Endereço removido da sua conta.', 'info');
          return;
        }
      }
    } catch (err) {
      console.warn('[Auth] API delete address error:', err);
    }

    // 3. Fallback state update
    const updatedAddresses = (user.addresses || []).filter((a) => a.id !== id);
    if (updatedAddresses.length > 0 && !updatedAddresses.some((a) => a.isDefault)) {
      updatedAddresses[0].isDefault = true;
    }
    setUser({ ...user, addresses: updatedAddresses });
    safeToast('Endereço Excluído', 'Endereço removido da sua conta.', 'info');
  };

  const setDefaultAddress = async (id: string): Promise<void> => {
    if (!user) return;

    // 1. Direct Supabase operation to public.user_addresses table
    if (isSupabaseConfigured()) {
      try {
        await updateUserAddressDirect(user.id, id, { isDefault: true });
      } catch (err) {
        console.warn('[Auth] Supabase set default address error:', err);
      }
    }

    // 2. Synchronize with API route
    try {
      const res = await fetch(`/api/user/addresses/${id}/default`, {
        method: 'PUT',
        headers: getAuthHeaders(),
      });

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.addresses)) {
          setUser({ ...user, addresses: data.addresses });
          safeToast('Endereço Padrão', 'Endereço principal de entrega definido.', 'success');
          return;
        }
      }
    } catch (err) {
      console.warn('[Auth] API set default address error:', err);
    }

    // 3. Fallback state update
    const updatedAddresses = (user.addresses || []).map((a) => ({
      ...a,
      isDefault: a.id === id,
    }));
    setUser({ ...user, addresses: updatedAddresses });
    safeToast('Endereço Padrão', 'Endereço principal de entrega definido.', 'success');
  };

  // =========================================================
  // 7. ORDERS PERSISTENCE
  // =========================================================
  const registerOrder = useCallback((order: Order) => {
    setOrders((prev) => [order, ...prev.filter((o) => o.id !== order.id)]);
    setAllOrders((prev) => [order, ...prev.filter((o) => o.id !== order.id)]);
  }, []);

  const addOrder = async (newOrder: Order): Promise<Order> => {
    // 1. Update local reactive state immediately
    registerOrder(newOrder);

    // 2. Only perform POST /api/user/orders if the order was not already persisted by backend checkout preference flow
    if (!newOrder.paymentDetails?.mercadoPagoPreferenceId) {
      try {
        const res = await fetch('/api/user/orders', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(newOrder),
        });

        if (res.ok) {
          const createdOrder = await res.json();
          registerOrder(createdOrder);
          return createdOrder;
        }
      } catch (err) {
        console.error('Error creating order:', err);
      }
    }
    return newOrder;
  };

  const updateOrderStatus = async (orderId: string, status: OrderStatus, trackingCode?: string): Promise<void> => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status, trackingCode }),
      });

      if (res.ok) {
        const updated = await res.json();
        setAllOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
        setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
        showToast('Status Atualizado', `Pedido #${orderId} alterado para "${status}".`, 'success');
      }
    } catch (err) {
      console.error('Error updating order status:', err);
    }
  };

  const isAuthenticated = Boolean(user);
  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        isAdmin,
        isAdminLoggedIn: isAdmin,
        isLoading,
        orders,
        allOrders,
        login,
        register,
        logout,
        adminLogin,
        adminLogout,
        verifyEmail,
        resendVerification,
        forgotPassword,
        resetPassword,
        updateProfile,
        changePassword,
        addAddress,
        updateAddress,
        deleteAddress,
        setDefaultAddress,
        addOrder,
        registerOrder,
        updateOrderStatus,
        refreshOrders,
        refreshAllAdminOrders,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
