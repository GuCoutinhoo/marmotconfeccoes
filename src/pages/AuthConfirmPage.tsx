import React, { useState, useEffect, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Breadcrumb } from '../components/Breadcrumb';
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Mail,
  ArrowRight,
  ShieldCheck,
  RotateCw,
  Sparkles,
  Lock,
} from 'lucide-react';
import { EmailOtpType } from '@supabase/supabase-js';

interface AuthConfirmPageProps {
  onNavigate: (page: string, param?: string) => void;
}

type ConfirmStatus = 'verifying' | 'success' | 'invalid_token' | 'error';

export const AuthConfirmPage: React.FC<AuthConfirmPageProps> = ({ onNavigate }) => {
  const [status, setStatus] = useState<ConfirmStatus>('verifying');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [countdown, setCountdown] = useState<number>(3);
  const [resendEmail, setResendEmail] = useState<string>('');
  const [resending, setResending] = useState<boolean>(false);
  const [cooldown, setCooldown] = useState<number>(0);
  const [resendSuccess, setResendSuccess] = useState<boolean>(false);

  const { user, login } = useAuth();
  const { showToast } = useToast();
  const hasAttempted = useRef<boolean>(false);

  // Parse URL tokens on mount
  useEffect(() => {
    if (hasAttempted.current) return;
    hasAttempted.current = true;

    async function processVerification() {
      if (!isSupabaseConfigured()) {
        setStatus('error');
        setErrorMessage('Configuração do Supabase não detectada no ambiente.');
        return;
      }

      // 1. Check search parameters (?token_hash=...&type=email)
      const urlParams = new URLSearchParams(window.location.search);
      let tokenHash = urlParams.get('token_hash');
      let type = urlParams.get('type') as EmailOtpType | null;

      // 2. Check hash fragments if implicit redirect (#access_token=... or #error=...)
      if (!tokenHash && window.location.hash) {
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const hashError = hashParams.get('error_description') || hashParams.get('error');
        if (hashError) {
          setStatus('invalid_token');
          setErrorMessage(decodeURIComponent(hashError));
          return;
        }
        tokenHash = hashParams.get('token_hash');
        if (!type) {
          type = (hashParams.get('type') as EmailOtpType) || null;
        }
      }

      // If token_hash exists, verify via Supabase verifyOtp
      if (tokenHash) {
        try {
          const otpType: EmailOtpType = type || 'email';
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: otpType,
          });

          if (error) {
            console.error('[Supabase verifyOtp Error]:', error);
            setStatus('invalid_token');
            const msg = error.message || String(error);
            if (msg.includes('expired') || msg.includes('Token has expired') || msg.includes('otp_expired')) {
              setErrorMessage('Este link de confirmação expirou. Solicite um novo link de ativação abaixo.');
            } else if (msg.includes('invalid') || msg.includes('invalid_token')) {
              setErrorMessage('O token de verificação é inválido ou já foi utilizado anteriormente.');
            } else {
              setErrorMessage(msg);
            }
            return;
          }

          if (data.session || data.user) {
            setStatus('success');
            try {
              showToast('E-mail Confirmado', 'Sua conta foi ativada com sucesso!', 'success');
            } catch {}

            // Clean up the URL bar
            if (typeof window !== 'undefined' && window.history?.replaceState) {
              window.history.replaceState({}, document.title, '/minha-conta');
            }
          } else {
            setStatus('invalid_token');
            setErrorMessage('Não foi possível autenticar o token de segurança retornado pelo Supabase.');
          }
        } catch (err: any) {
          console.error('[Supabase verifyOtp Exception]:', err);
          setStatus('error');
          setErrorMessage(err.message || 'Erro inesperado ao verificar o token.');
        }
      } else {
        // Check if there is already an active session
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            setStatus('success');
          } else {
            setStatus('invalid_token');
            setErrorMessage('Nenhum parâmetro de verificação (token_hash) foi detectado no endereço da página.');
          }
        } catch {
          setStatus('invalid_token');
          setErrorMessage('Link de verificação incompleto.');
        }
      }
    }

    processVerification();
  }, [showToast]);

  // Handle countdown redirection on success
  useEffect(() => {
    if (status !== 'success') return;

    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      onNavigate('account', 'orders');
    }
  }, [status, countdown, onNavigate]);

  // Handle Resend Cooldown Timer
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown((prev) => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  // Handle Resend Verification Email
  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailToResend = resendEmail.trim().toLowerCase();
    if (!emailToResend || !emailToResend.includes('@')) {
      try {
        showToast('E-mail Inválido', 'Digite um endereço de e-mail válido.', 'error');
      } catch {}
      return;
    }

    setResending(true);
    setResendSuccess(false);

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: emailToResend,
        options: {
          emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/auth/confirm` : undefined,
        },
      });

      if (error) {
        try {
          showToast('Erro no Reenvio', error.message, 'error');
        } catch {}
      } else {
        setResendSuccess(true);
        setCooldown(60);
        try {
          showToast('E-mail Reenviado', 'Um novo link de ativação foi enviado para sua caixa de entrada.', 'success');
        } catch {}
      }
    } catch (err: any) {
      try {
        showToast('Erro de Conexão', err.message || 'Falha ao reenviar link.', 'error');
      } catch {}
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="bg-[#080808] text-[#EFECE6] min-h-[80vh] py-14 px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
      <div className="max-w-xl mx-auto w-full space-y-6">
        <Breadcrumb items={[{ label: 'Autenticação' }, { label: 'Confirmação de E-mail' }]} />

        <div className="bg-[#121212] border border-[#262626] rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
          {/* Subtle Ambient Background Gradient */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#D6B35A]/10 rounded-full blur-3xl pointer-events-none" />

          {/* 1. STATE: VERIFYING */}
          {status === 'verifying' && (
            <div className="text-center py-8 space-y-6">
              <div className="relative mx-auto w-16 h-16 flex items-center justify-center">
                <div className="w-16 h-16 border-3 border-[#262626] border-t-[#D6B35A] rounded-full animate-spin" />
                <Lock className="w-6 h-6 text-[#D6B35A] absolute" />
              </div>

              <div className="space-y-2">
                <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-[#EFECE6]">
                  Validando seu E-mail
                </h1>
                <p className="text-xs sm:text-sm text-[#888888] max-w-md mx-auto leading-relaxed">
                  Aguarde um instante enquanto o <strong>Supabase Auth</strong> processa e valida seu token de segurança criptográfico.
                </p>
              </div>

              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#181818] border border-[#282828] text-[11px] font-mono text-[#D6B35A]">
                <RotateCw className="w-3 h-3 animate-spin" />
                <span>verifyOtp (TokenHash) em execução</span>
              </div>
            </div>
          )}

          {/* 2. STATE: SUCCESS */}
          {status === 'success' && (
            <div className="text-center py-6 space-y-6">
              <div className="mx-auto w-16 h-16 bg-gradient-to-br from-[#D6B35A] to-[#A08132] text-black rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(214,179,90,0.4)] animate-bounce-short">
                <CheckCircle2 className="w-9 h-9 stroke-[2.5]" />
              </div>

              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-700/50 text-emerald-300 text-[10px] font-mono uppercase tracking-widest font-bold">
                  <ShieldCheck className="w-3.5 h-3.5" /> E-mail Verificado com Sucesso
                </div>

                <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-[#EFECE6]">
                  Conta Ativada na MARMOT
                </h1>

                <p className="text-xs sm:text-sm text-[#A0A0A0] max-w-md mx-auto leading-relaxed">
                  Seu endereço de e-mail foi validado oficialmente pelo Supabase. Sua sessão segura foi estabelecida e você já está autenticado.
                </p>
              </div>

              {user && (
                <div className="bg-[#181818] border border-[#282828] rounded-2xl p-4 text-left max-w-md mx-auto flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-mono uppercase text-[#777777]">Usuário Autenticado</p>
                    <p className="text-xs font-bold text-[#EFECE6]">{user.name}</p>
                    <p className="text-[11px] text-[#D6B35A] font-mono">{user.email}</p>
                  </div>
                  <div className="h-8 w-8 rounded-full bg-[#D6B35A]/15 border border-[#D6B35A]/40 flex items-center justify-center text-[#D6B35A]">
                    <Sparkles className="w-4 h-4" />
                  </div>
                </div>
              )}

              <div className="pt-2 space-y-3">
                <button
                  type="button"
                  onClick={() => onNavigate('account', 'orders')}
                  className="w-full bg-[#D6B35A] hover:bg-[#EFECE6] text-black font-black text-xs uppercase py-4 rounded-xl transition-all shadow-lg hover:shadow-[#D6B35A]/25 flex items-center justify-center gap-2 group cursor-pointer"
                >
                  <span>Acessar Minha Conta Agora</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </button>

                <p className="text-[11px] font-mono text-[#666666]">
                  Redirecionamento automático em <span className="text-[#D6B35A] font-bold">{countdown}s</span>...
                </p>
              </div>
            </div>
          )}

          {/* 3. STATE: INVALID TOKEN OR EXPIRED */}
          {status === 'invalid_token' && (
            <div className="text-center py-6 space-y-6">
              <div className="mx-auto w-16 h-16 bg-red-950/60 border border-red-700/60 text-red-400 rounded-2xl flex items-center justify-center shadow-lg">
                <XCircle className="w-9 h-9 stroke-[2.5]" />
              </div>

              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-950/60 border border-red-700/50 text-red-300 text-[10px] font-mono uppercase tracking-widest font-bold">
                  <AlertCircle className="w-3.5 h-3.5" /> Link Inválido ou Expirado
                </div>

                <h1 className="text-2xl font-black uppercase tracking-tight text-[#EFECE6]">
                  Falha na Confirmação
                </h1>

                <p className="text-xs sm:text-sm text-[#A0A0A0] max-w-md mx-auto leading-relaxed">
                  {errorMessage || 'O link de confirmação acessado não é mais válido, já foi utilizado anteriormente ou o prazo de segurança expirou.'}
                </p>
              </div>

              {/* Form to Resend Verification Email */}
              <div className="bg-[#181818] border border-[#282828] rounded-2xl p-5 text-left space-y-3.5 max-w-md mx-auto">
                <div className="flex items-center gap-2 text-xs font-bold text-[#EFECE6] uppercase tracking-wider">
                  <Mail className="w-4 h-4 text-[#D6B35A]" /> Reenviar Novo Link de Ativação
                </div>

                <form onSubmit={handleResend} className="space-y-3">
                  <div>
                    <label className="text-[10px] font-bold text-[#777777] uppercase block mb-1">
                      Seu E-mail Cadastrado
                    </label>
                    <input
                      type="email"
                      value={resendEmail}
                      onChange={(e) => setResendEmail(e.target.value)}
                      placeholder="seuemail@exemplo.com"
                      required
                      className="w-full bg-[#080808] border border-[#262626] px-3.5 py-2.5 rounded-xl text-xs text-[#EFECE6] focus:outline-none focus:border-[#D6B35A]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={resending || cooldown > 0}
                    className="w-full bg-[#D6B35A] hover:bg-[#EFECE6] disabled:opacity-50 text-black font-black text-xs uppercase py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    {resending ? (
                      <>
                        <RotateCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Enviando...</span>
                      </>
                    ) : cooldown > 0 ? (
                      <span>Aguarde {cooldown}s para reenviar</span>
                    ) : (
                      <span>Solicitar Novo Link de Confirmação</span>
                    )}
                  </button>
                </form>

                {resendSuccess && (
                  <p className="text-[11px] text-emerald-400 font-mono text-center pt-1">
                    ✓ Link enviado! Verifique sua caixa de entrada e pasta de spam.
                  </p>
                )}
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-2.5 max-w-md mx-auto">
                <button
                  type="button"
                  onClick={() => onNavigate('account', 'login')}
                  className="flex-1 bg-[#181818] hover:bg-[#222222] border border-[#282828] text-[#CCCCCC] hover:text-[#EFECE6] font-bold text-xs uppercase py-3 rounded-xl transition-all"
                >
                  Ir para o Login
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('home')}
                  className="flex-1 bg-[#080808] hover:bg-[#141414] border border-[#282828] text-[#777777] hover:text-[#CCCCCC] font-bold text-xs uppercase py-3 rounded-xl transition-all"
                >
                  Voltar à Loja
                </button>
              </div>
            </div>
          )}

          {/* 4. STATE: UNEXPECTED ERROR */}
          {status === 'error' && (
            <div className="text-center py-6 space-y-6">
              <div className="mx-auto w-16 h-16 bg-red-950/60 border border-red-700/60 text-red-400 rounded-2xl flex items-center justify-center shadow-lg">
                <AlertCircle className="w-9 h-9 stroke-[2.5]" />
              </div>

              <div className="space-y-2">
                <h1 className="text-2xl font-black uppercase tracking-tight text-[#EFECE6]">
                  Erro na Verificação
                </h1>
                <p className="text-xs sm:text-sm text-[#A0A0A0] max-w-md mx-auto leading-relaxed">
                  {errorMessage || 'Ocorreu um erro durante a comunicação com o servidor de autenticação.'}
                </p>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="flex-1 bg-[#D6B35A] text-black font-black text-xs uppercase py-3 rounded-xl transition-all"
                >
                  Tentar Novamente
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('account', 'login')}
                  className="flex-1 bg-[#181818] border border-[#282828] text-[#CCCCCC] font-bold text-xs uppercase py-3 rounded-xl transition-all"
                >
                  Acessar Login
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
