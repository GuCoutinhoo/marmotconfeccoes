import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { Breadcrumb } from '../components/Breadcrumb';
import {
  User,
  Package,
  Heart,
  MapPin,
  LogOut,
  Truck,
  Edit2,
  Trash2,
  Plus,
  Lock,
  CheckCircle2,
  ShieldCheck,
  KeyRound,
  Mail,
  Phone,
  CreditCard,
  AlertCircle,
  ExternalLink,
  ShieldAlert,
  ArrowRight,
  Eye,
  EyeOff,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { Address } from '../types';
import { validateAndFetchCep, normalizeCep, formatCep, isValidCepFormat } from '../services/cepService';

interface AccountPageProps {
  initialTab?: string;
  onNavigate: (page: string, param?: string) => void;
}

export const AccountPage: React.FC<AccountPageProps> = ({ initialTab = 'orders', onNavigate }) => {
  const {
    user,
    isLoading,
    orders,
    refreshOrders,
    login,
    register,
    logout,
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
  } = useAuth();

  const { wishlist, removeFromWishlist } = useWishlist();
  const { addToCart, openMiniCart } = useCart();
  const { showToast } = useToast();
  const [isSyncingOrders, setIsSyncingOrders] = useState(false);

  const handleManualSync = async () => {
    setIsSyncingOrders(true);
    try {
      await refreshOrders();
      showToast('Sincronizado', 'Seus pedidos foram atualizados diretamente do banco de dados.', 'success');
    } catch {
      showToast('Erro', 'Falha ao sincronizar pedidos.', 'error');
    } finally {
      setIsSyncingOrders(false);
    }
  };

  // Auth Tabs when NOT logged in: 'login' | 'register' | 'forgot' | 'verify' | 'awaiting_confirmation'
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot' | 'verify' | 'awaiting_confirmation'>(
    initialTab === 'register' ? 'register' : 'login'
  );

  // Authenticated Tabs: 'orders' | 'wishlist' | 'addresses' | 'profile' | 'security'
  const [activeTab, setActiveTab] = useState<'orders' | 'wishlist' | 'addresses' | 'profile' | 'security'>(
    ['orders', 'wishlist', 'addresses', 'profile', 'security'].includes(initialTab)
      ? (initialTab as any)
      : 'orders'
  );

  // Synchronize tab and auth mode whenever initialTab prop changes
  useEffect(() => {
    if (initialTab) {
      const authTabs = ['login', 'register', 'forgot', 'verify', 'awaiting_confirmation'];
      const userTabs = ['orders', 'wishlist', 'addresses', 'profile', 'security'];

      if (userTabs.includes(initialTab)) {
        setActiveTab(initialTab as any);
      } else if (authTabs.includes(initialTab)) {
        setAuthMode(initialTab as any);
      }
    }
  }, [initialTab]);

  // Form states
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Pending Confirmation Email State
  const [pendingConfirmEmail, setPendingConfirmEmail] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendStatusMsg, setResendStatusMsg] = useState<string | null>(null);

  // Register Form
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regCpf, setRegCpf] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  // Forgot / Reset Password Form
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetStep, setResetStep] = useState<1 | 2>(1);
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [previewCode, setPreviewCode] = useState<string | null>(null);

  // Verify Email Form
  const [verifyCode, setVerifyCode] = useState('');
  const [verifyTargetEmail, setVerifyTargetEmail] = useState('');

  // Profile Edit State
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editCpf, setEditCpf] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Change Password State
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [changingPass, setChangingPass] = useState(false);

  // Address Modal State
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addrRecipient, setAddrRecipient] = useState('');
  const [addrStreet, setAddrStreet] = useState('');
  const [addrNumber, setAddrNumber] = useState('');
  const [addrComplement, setAddrComplement] = useState('');
  const [addrNeighborhood, setAddrNeighborhood] = useState('');
  const [addrCity, setAddrCity] = useState('');
  const [addrState, setAddrState] = useState('SP');
  const [addrCep, setAddrCep] = useState('');
  const [addrIsDefault, setAddrIsDefault] = useState(false);

  // Handle Resend Cooldown Timer
  React.useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown((prev) => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Sync profile data when user is loaded
  React.useEffect(() => {
    if (user) {
      setEditName(user.name);
      setEditEmail(user.email);
      setEditPhone(user.phone || '');
      setEditCpf(user.cpf || '');
    }
  }, [user]);

  // Atomic submission ref to prevent duplicate/concurrent requests
  const isSubmittingRef = useRef<boolean>(false);

  // Handle Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingRef.current || authLoading) return;
    setAuthError(null);

    const cleanEmail = loginEmail.trim();
    if (!cleanEmail) {
      setAuthError('Por favor, informe seu e-mail.');
      return;
    }
    if (!loginPassword) {
      setAuthError('Por favor, digite sua senha.');
      return;
    }

    isSubmittingRef.current = true;
    setAuthLoading(true);
    try {
      const result = await login(cleanEmail, loginPassword);
      if (!result.success) {
        setAuthError(result.error || 'Credenciais inválidas.');
      } else if (result.user?.role === 'admin') {
        onNavigate('admin');
      }
    } finally {
      setAuthLoading(false);
      isSubmittingRef.current = false;
    }
  };

  // Handle Quick Demo Fill
  const handleQuickDemo = (email: string, pass: string) => {
    setLoginEmail(email);
    setLoginPassword(pass);
    setAuthError(null);
  };

  // Handle Register
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingRef.current || authLoading) return;
    setAuthError(null);

    const cleanName = regName.trim();
    const cleanEmail = regEmail.trim();

    if (!cleanName || cleanName.length < 2) {
      setAuthError('Por favor, informe seu nome completo.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      setAuthError('Por favor, insira um endereço de e-mail válido.');
      return;
    }

    if (!regPassword) {
      setAuthError('A senha é obrigatória.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setAuthError('As senhas digitadas não coincidem. Digite a mesma senha em ambos os campos.');
      return;
    }

    if (regPassword.length < 6) {
      setAuthError('A senha deve conter no mínimo 6 caracteres.');
      return;
    }

    isSubmittingRef.current = true;
    setAuthLoading(true);
    try {
      const result = await register({
        name: cleanName,
        email: cleanEmail,
        password: regPassword,
        phone: regPhone.trim(),
        cpf: regCpf.trim(),
      });

      if (!result.success) {
        setAuthError(result.error || 'Falha ao criar cadastro.');
      } else if (result.needsEmailConfirmation) {
        setPendingConfirmEmail(cleanEmail);
        setAuthMode('awaiting_confirmation');
        setResendCooldown(60);
        setResendStatusMsg(null);
        try {
          showToast('Verifique seu E-mail', 'Enviamos o link de confirmação para sua caixa de entrada.', 'info');
        } catch {}
      } else if (result.verificationCode) {
        setVerifyTargetEmail(cleanEmail);
        setPreviewCode(result.verificationCode);
        setAuthMode('verify');
      }
    } finally {
      setAuthLoading(false);
      isSubmittingRef.current = false;
    }
  };

  // Handle Resend Confirmation Email from Awaiting Screen
  const handleResendPendingConfirm = async () => {
    if (!pendingConfirmEmail || resendCooldown > 0 || isSubmittingRef.current || authLoading) return;
    isSubmittingRef.current = true;
    setAuthLoading(true);
    setResendStatusMsg(null);

    try {
      const result = await resendVerification(pendingConfirmEmail);
      if (result.success) {
        setResendCooldown(60);
        setResendStatusMsg('E-mail de confirmação reenviado com sucesso! Verifique sua caixa de entrada.');
        try {
          showToast('E-mail Reenviado', 'Um novo link de ativação foi enviado.', 'success');
        } catch {}
      } else {
        setResendStatusMsg(result.error || 'Erro ao reenviar e-mail de confirmação.');
        try {
          showToast('Erro no Reenvio', result.error || 'Falha ao reenviar.', 'error');
        } catch {}
      }
    } finally {
      setAuthLoading(false);
      isSubmittingRef.current = false;
    }
  };

  // Handle Forgot Password Step 1
  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);

    const result = await forgotPassword(forgotEmail.trim());
    setAuthLoading(false);

    if (result.success) {
      setResetStep(2);
      if (result.previewResetCode) {
        setPreviewCode(result.previewResetCode);
      }
      showToast('Código Enviado', 'Verifique o código de recuperação emitido.', 'info');
    } else {
      setAuthError(result.error || 'Erro ao processar solicitação.');
    }
  };

  // Handle Reset Password Step 2
  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (newPassword !== confirmNewPassword) {
      setAuthError('As senhas não coincidem.');
      return;
    }

    if (newPassword.length < 6) {
      setAuthError('A nova senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setAuthLoading(true);
    const result = await resetPassword(forgotEmail.trim(), resetCode.trim(), newPassword);
    setAuthLoading(false);

    if (result.success) {
      setAuthMode('login');
      setLoginEmail(forgotEmail);
      setLoginPassword('');
      setResetStep(1);
      setResetCode('');
      setNewPassword('');
      setConfirmNewPassword('');
    } else {
      setAuthError(result.error || 'Falha ao redefinir senha.');
    }
  };

  // Handle Verify Email
  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);

    const emailToVerify = verifyTargetEmail || (user ? user.email : loginEmail);
    const result = await verifyEmail(emailToVerify, verifyCode.trim());
    setAuthLoading(false);

    if (result.success) {
      setAuthMode('login');
      setVerifyCode('');
      setPreviewCode(null);
    } else {
      setAuthError(result.error || 'Código de verificação incorreto.');
    }
  };

  // Handle Resend Verification Code
  const handleResend = async () => {
    const emailToVerify = verifyTargetEmail || (user ? user.email : loginEmail);
    if (!emailToVerify) return;

    const result = await resendVerification(emailToVerify);
    if (result.success && result.verificationCode) {
      setPreviewCode(result.verificationCode);
    }
  };

  // Profile Save
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    await updateProfile({
      name: editName.trim(),
      email: editEmail.trim(),
      phone: editPhone.trim(),
      cpf: editCpf.trim(),
    });
    setSavingProfile(false);
  };

  // Change Password Save
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPass !== confirmPass) {
      showToast('Erro', 'As senhas digitadas não coincidem.', 'error');
      return;
    }
    if (newPass.length < 6) {
      showToast('Erro', 'A nova senha deve ter no mínimo 6 caracteres.', 'error');
      return;
    }

    setChangingPass(true);
    const result = await changePassword(currentPass, newPass);
    setChangingPass(false);

    if (result.success) {
      setCurrentPass('');
      setNewPass('');
      setConfirmPass('');
    }
  };

  // Address Modal Helpers
  const openNewAddressModal = () => {
    setEditingAddressId(null);
    setAddrRecipient(user ? user.name : '');
    setAddrStreet('');
    setAddrNumber('');
    setAddrComplement('');
    setAddrNeighborhood('');
    setAddrCity('São Paulo');
    setAddrState('SP');
    setAddrCep('');
    setAddrIsDefault(user?.addresses.length === 0);
    setIsAddressModalOpen(true);
  };

  const openEditAddressModal = (addr: Address) => {
    setEditingAddressId(addr.id);
    setAddrRecipient(addr.recipientName);
    setAddrStreet(addr.street);
    setAddrNumber(addr.number);
    setAddrComplement(addr.complement || '');
    setAddrNeighborhood(addr.neighborhood);
    setAddrCity(addr.city);
    setAddrState(addr.state);
    setAddrCep(addr.cep);
    setAddrIsDefault(Boolean(addr.isDefault));
    setIsAddressModalOpen(true);
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    const addressData: Omit<Address, 'id'> = {
      recipientName: addrRecipient.trim(),
      street: addrStreet.trim(),
      number: addrNumber.trim(),
      complement: addrComplement.trim(),
      neighborhood: addrNeighborhood.trim(),
      city: addrCity.trim(),
      state: addrState.trim(),
      cep: addrCep.trim(),
      isDefault: addrIsDefault,
    };

    if (editingAddressId) {
      await updateAddress(editingAddressId, addressData);
    } else {
      await addAddress(addressData);
    }

    setIsAddressModalOpen(false);
  };

  const [loadingAddrCep, setLoadingAddrCep] = useState(false);

  // Real CEP Lookup via ViaCEP
  const handleCepLookup = async () => {
    const cleanCep = normalizeCep(addrCep);
    if (!isValidCepFormat(cleanCep) || cleanCep.length !== 8) {
      if (addrCep.trim().length > 0) {
        showToast('CEP Inválido', 'Digite um CEP válido com 8 dígitos.', 'error');
      }
      return;
    }

    setLoadingAddrCep(true);
    try {
      const result = await validateAndFetchCep(cleanCep);
      if (result.address) {
        setAddrStreet(result.address.street || '');
        setAddrNeighborhood(result.address.neighborhood || '');
        setAddrCity(result.address.city || '');
        setAddrState(result.address.state || 'SP');
        showToast('Endereço Identificado', `${result.address.city} - ${result.address.state}`, 'success');
      } else if (!result.exists) {
        showToast('Aviso', 'CEP não encontrado. Preencha os campos manualmente.', 'warning');
      }
    } catch (err) {
      console.warn('[Account Address CEP Lookup Error]', err);
    } finally {
      setLoadingAddrCep(false);
    }
  };

  const handlePayNow = async (orderId: string) => {
    try {
      showToast('Conectando ao Mercado Pago...', 'Gerando link de pagamento para o pedido.', 'info');
      const res = await fetch(`/api/orders/${orderId}/pay-now`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (res.ok && (data.init_point || data.targetUrl || data.sandbox_init_point)) {
        const redirectUrl = data.sandbox_init_point || data.init_point || data.targetUrl;
        window.location.href = redirectUrl;
      } else {
        showToast('Erro', data.error || 'Não foi possível reabrir o pagamento.', 'error');
      }
    } catch {
      showToast('Erro', 'Falha ao conectar com o serviço de pagamento.', 'error');
    }
  };

  // -------------------------------------------------------------
  // VIEW: LOADING SESSION STATE
  // -------------------------------------------------------------
  if (isLoading) {
    return (
      <div className="bg-[#080808] text-[#EFECE6] min-h-screen py-24 px-4 flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-2 border-[#D6B35A] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-mono uppercase tracking-widest text-[#777777]">
          Verificando Sessão com Supabase...
        </p>
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW: UNAUTHENTICATED (LOGIN / REGISTER / FORGOT / VERIFY)
  // -------------------------------------------------------------
  if (!user) {
    return (
      <div className="bg-[#080808] text-[#EFECE6] min-h-screen py-12 px-4 sm:px-6">
        <div className="max-w-xl mx-auto space-y-6">
          <Breadcrumb items={[{ label: 'Autenticação de Conta' }]} />

          {/* Quick Demo Credentials Info Banner */}
          <div className="bg-[#161616] border border-[#262626] p-4 rounded-xl text-xs space-y-2.5">
            <div className="flex items-center gap-2 text-[#D6B35A] font-bold uppercase tracking-wider text-[11px]">
              <ShieldCheck className="w-4 h-4" /> Credenciais de Demonstração Rápidas
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemo('admin@marmot.com', 'marmot')}
                className="bg-[#080808] hover:bg-[#222] border border-[#D6B35A]/40 p-2.5 rounded-lg text-left transition-all group"
              >
                <div className="flex justify-between items-center text-[10px] text-[#D6B35A] font-mono font-bold">
                  <span>ADMINISTRADOR</span>
                  <span className="group-hover:translate-x-0.5 transition-transform">Usar →</span>
                </div>
                <p className="text-[#EFECE6] font-bold mt-0.5">admin@marmot.com</p>
                <p className="text-[10px] text-[#777777]">Senha: marmot</p>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo('cliente@marmot.com', 'cliente123')}
                className="bg-[#080808] hover:bg-[#222] border border-[#262626] hover:border-[#D6B35A]/40 p-2.5 rounded-lg text-left transition-all group"
              >
                <div className="flex justify-between items-center text-[10px] text-[#777777] group-hover:text-[#D6B35A] font-mono font-bold">
                  <span>CLIENTE VIP</span>
                  <span className="group-hover:translate-x-0.5 transition-transform">Usar →</span>
                </div>
                <p className="text-[#EFECE6] font-bold mt-0.5">cliente@marmot.com</p>
                <p className="text-[10px] text-[#777777]">Senha: cliente123</p>
              </button>
            </div>
          </div>

          {/* Main Auth Card */}
          <div className="bg-[#161616] border border-[#262626] rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl">
            {/* Header Tabs */}
            <div className="flex border-b border-[#262626] pb-3 gap-4 text-xs font-black uppercase tracking-wider">
              <button
                onClick={() => {
                  setAuthMode('login');
                  setAuthError(null);
                }}
                className={`pb-2 border-b-2 transition-all ${
                  authMode === 'login'
                    ? 'border-[#D6B35A] text-[#D6B35A]'
                    : 'border-transparent text-[#777777] hover:text-[#EFECE6]'
                }`}
              >
                Entrar
              </button>

              <button
                onClick={() => {
                  setAuthMode('register');
                  setAuthError(null);
                }}
                className={`pb-2 border-b-2 transition-all ${
                  authMode === 'register'
                    ? 'border-[#D6B35A] text-[#D6B35A]'
                    : 'border-transparent text-[#777777] hover:text-[#EFECE6]'
                }`}
              >
                Criar Conta
              </button>

              <button
                onClick={() => {
                  setAuthMode('forgot');
                  setAuthError(null);
                }}
                className={`pb-2 border-b-2 transition-all ${
                  authMode === 'forgot'
                    ? 'border-[#D6B35A] text-[#D6B35A]'
                    : 'border-transparent text-[#777777] hover:text-[#EFECE6]'
                }`}
              >
                Recuperar Senha
              </button>
            </div>

            {/* Error Message Alert */}
            {authError && (
              <div className="bg-red-950/40 border border-red-800 text-red-300 p-3.5 rounded-xl text-xs space-y-2">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{authError}</span>
                </div>
                {(authError.toLowerCase().includes('confirm') || authError.toLowerCase().includes('ativar')) && (
                  <div className="pt-1 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        const target = loginEmail || regEmail;
                        setPendingConfirmEmail(target);
                        setAuthMode('awaiting_confirmation');
                        setAuthError(null);
                      }}
                      className="text-xs font-bold text-[#D6B35A] hover:underline flex items-center gap-1 uppercase tracking-wider"
                    >
                      Verificar E-mail / Reenviar Link &rarr;
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Preview Verification Code helper banner */}
            {previewCode && (
              <div className="bg-[#D6B35A]/10 border border-[#D6B35A] text-[#EFECE6] p-4 rounded-xl text-xs space-y-1">
                <p className="font-bold text-[#D6B35A] flex items-center gap-1.5 uppercase tracking-wider">
                  <Sparkles className="w-4 h-4" /> Código de Teste Emitido:
                </p>
                <p className="text-lg font-mono font-black text-white tracking-widest">{previewCode}</p>
                <p className="text-[10px] text-[#777777]">
                  Insira o código acima para completar a validação instantânea da conta.
                </p>
              </div>
            )}

            {/* TAB 1: LOGIN */}
            {authMode === 'login' && (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="text-[11px] font-bold text-[#777777] block mb-1">E-mail</label>
                  <div className="relative">
                    <input
                      type="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="seuemail@exemplo.com"
                      required
                      className="w-full bg-[#080808] border border-[#262626] px-3.5 py-3 rounded-xl text-xs text-[#EFECE6] focus:outline-none focus:border-[#D6B35A]"
                    />
                    <Mail className="w-4 h-4 text-[#777777] absolute right-3.5 top-3.5" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[11px] font-bold text-[#777777]">Senha</label>
                    <button
                      type="button"
                      onClick={() => setAuthMode('forgot')}
                      className="text-[11px] text-[#D6B35A] hover:underline"
                    >
                      Esqueceu a senha?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full bg-[#080808] border border-[#262626] px-3.5 py-3 rounded-xl text-xs text-[#EFECE6] focus:outline-none focus:border-[#D6B35A]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3.5 text-[#777777] hover:text-[#EFECE6]"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full bg-[#D6B35A] text-black hover:bg-[#EFECE6] font-extrabold text-xs uppercase py-3.5 rounded-xl transition-all shadow-lg hover:shadow-[#D6B35A]/20 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {authLoading ? 'AUTENTICANDO...' : 'ENTRAR NA CONTA'} <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}

            {/* TAB 2: REGISTER */}
            {authMode === 'register' && (
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div>
                  <label className="text-[11px] font-bold text-[#777777] block mb-1">Nome Completo</label>
                  <input
                    type="text"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Ex: Roberto Sampaio"
                    required
                    className="w-full bg-[#080808] border border-[#262626] px-3.5 py-3 rounded-xl text-xs text-[#EFECE6] focus:outline-none focus:border-[#D6B35A]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-[#777777] block mb-1">E-mail</label>
                    <input
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="roberto@email.com"
                      required
                      className="w-full bg-[#080808] border border-[#262626] px-3.5 py-3 rounded-xl text-xs text-[#EFECE6] focus:outline-none focus:border-[#D6B35A]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-[#777777] block mb-1">Telefone WhatsApp</label>
                    <input
                      type="text"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="(11) 98888-7777"
                      className="w-full bg-[#080808] border border-[#262626] px-3.5 py-3 rounded-xl text-xs text-[#EFECE6] focus:outline-none focus:border-[#D6B35A]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-[#777777] block mb-1">CPF (Opcional)</label>
                  <input
                    type="text"
                    value={regCpf}
                    onChange={(e) => setRegCpf(e.target.value)}
                    placeholder="000.000.000-00"
                    className="w-full bg-[#080808] border border-[#262626] px-3.5 py-3 rounded-xl text-xs text-[#EFECE6] focus:outline-none focus:border-[#D6B35A]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-[#777777] block mb-1">Senha (Mín. 6 caracteres)</label>
                    <input
                      type="password"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full bg-[#080808] border border-[#262626] px-3.5 py-3 rounded-xl text-xs text-[#EFECE6] focus:outline-none focus:border-[#D6B35A]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-[#777777] block mb-1">Confirmar Senha</label>
                    <input
                      type="password"
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full bg-[#080808] border border-[#262626] px-3.5 py-3 rounded-xl text-xs text-[#EFECE6] focus:outline-none focus:border-[#D6B35A]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full bg-[#D6B35A] text-black hover:bg-[#EFECE6] font-extrabold text-xs uppercase py-3.5 rounded-xl transition-all shadow-lg hover:shadow-[#D6B35A]/20 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {authLoading ? 'CADASTRANDO...' : 'CRIAR MINHA CONTA'}
                </button>
              </form>
            )}

            {/* TAB 3: FORGOT & RESET PASSWORD */}
            {authMode === 'forgot' && (
              <div>
                {resetStep === 1 ? (
                  <form onSubmit={handleForgotSubmit} className="space-y-4">
                    <p className="text-xs text-[#777777]">
                      Digite seu e-mail cadastrado. Emitiremos um código de segurança para redefinição de senha.
                    </p>

                    <div>
                      <label className="text-[11px] font-bold text-[#777777] block mb-1">E-mail Cadastrado</label>
                      <input
                        type="email"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="seuemail@exemplo.com"
                        required
                        className="w-full bg-[#080808] border border-[#262626] px-3.5 py-3 rounded-xl text-xs text-[#EFECE6] focus:outline-none focus:border-[#D6B35A]"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={authLoading}
                      className="w-full bg-[#D6B35A] text-black hover:bg-[#EFECE6] font-extrabold text-xs uppercase py-3.5 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
                    >
                      {authLoading ? 'PROCESSANDO...' : 'ENVIAR CÓDIGO DE RECUPERAÇÃO'}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleResetSubmit} className="space-y-4">
                    <p className="text-xs text-[#777777]">
                      Insira o código de 6 dígitos e defina a sua nova senha.
                    </p>

                    <div>
                      <label className="text-[11px] font-bold text-[#777777] block mb-1">Código de 6 Dígitos</label>
                      <input
                        type="text"
                        value={resetCode}
                        onChange={(e) => setResetCode(e.target.value)}
                        placeholder="Ex: 849201"
                        required
                        className="w-full bg-[#080808] border border-[#262626] px-3.5 py-3 rounded-xl text-xs text-[#EFECE6] font-mono focus:outline-none focus:border-[#D6B35A]"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-bold text-[#777777] block mb-1">Nova Senha</label>
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Mín. 6 caracteres"
                          required
                          className="w-full bg-[#080808] border border-[#262626] px-3.5 py-3 rounded-xl text-xs text-[#EFECE6] focus:outline-none focus:border-[#D6B35A]"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-[#777777] block mb-1">Confirmar Nova Senha</label>
                        <input
                          type="password"
                          value={confirmNewPassword}
                          onChange={(e) => setConfirmNewPassword(e.target.value)}
                          placeholder="••••••••"
                          required
                          className="w-full bg-[#080808] border border-[#262626] px-3.5 py-3 rounded-xl text-xs text-[#EFECE6] focus:outline-none focus:border-[#D6B35A]"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={authLoading}
                      className="w-full bg-[#D6B35A] text-black hover:bg-[#EFECE6] font-extrabold text-xs uppercase py-3.5 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
                    >
                      {authLoading ? 'ATUALIZANDO...' : 'CONFIRMAR NOVA SENHA'}
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* TAB 4: EMAIL VERIFICATION (MANUAL CODE) */}
            {authMode === 'verify' && (
              <form onSubmit={handleVerifySubmit} className="space-y-4">
                <p className="text-xs text-[#777777]">
                  Insira o código de 6 dígitos para validar a titularidade da conta para <strong>{verifyTargetEmail}</strong>.
                </p>

                <div>
                  <label className="text-[11px] font-bold text-[#777777] block mb-1">Código de Validação</label>
                  <input
                    type="text"
                    value={verifyCode}
                    onChange={(e) => setVerifyCode(e.target.value)}
                    placeholder="000000"
                    maxLength={6}
                    required
                    className="w-full bg-[#080808] border border-[#262626] px-3.5 py-3 rounded-xl text-center text-lg font-mono font-black text-[#D6B35A] tracking-widest focus:outline-none focus:border-[#D6B35A]"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleResend}
                    className="bg-[#080808] hover:bg-[#222] border border-[#262626] text-[#777777] hover:text-[#EFECE6] font-bold text-xs uppercase px-4 py-3 rounded-xl"
                  >
                    Reenviar Código
                  </button>

                  <button
                    type="submit"
                    disabled={authLoading}
                    className="flex-1 bg-[#D6B35A] text-black hover:bg-[#EFECE6] font-extrabold text-xs uppercase py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    {authLoading ? 'VERIFICANDO...' : 'CONFIRMAR E-MAIL'}
                  </button>
                </div>
              </form>
            )}

            {/* TAB 5: AWAITING SUPABASE EMAIL CONFIRMATION LINK */}
            {authMode === 'awaiting_confirmation' && (
              <div className="space-y-6 py-2">
                <div className="mx-auto w-16 h-16 bg-[#D6B35A]/15 border border-[#D6B35A]/40 rounded-2xl flex items-center justify-center text-[#D6B35A] shadow-[0_0_20px_rgba(214,179,90,0.15)]">
                  <Mail className="w-8 h-8" />
                </div>

                <div className="text-center space-y-2.5">
                  <h3 className="text-xl sm:text-2xl font-black uppercase text-[#EFECE6] tracking-tight">
                    Verifique seu e-mail
                  </h3>
                  <p className="text-xs sm:text-sm text-[#A0A0A0]">
                    Enviamos um link de confirmação para:
                  </p>
                  <div className="bg-[#0A0A0A] border border-[#2A2A2A] py-2.5 px-4 rounded-xl text-xs sm:text-sm font-mono font-bold text-[#D6B35A] break-all max-w-sm mx-auto shadow-inner">
                    {pendingConfirmEmail || regEmail}
                  </div>
                  <p className="text-xs text-[#888888] pt-1">
                    Clique no link enviado para ativar sua conta na MARMOT.
                  </p>
                </div>

                {resendStatusMsg && (
                  <div className={`p-3 rounded-xl text-xs text-center font-mono border ${
                    resendStatusMsg.includes('sucesso') 
                      ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300' 
                      : 'bg-red-950/40 border-red-800/60 text-red-300'
                  }`}>
                    {resendStatusMsg}
                  </div>
                )}

                <div className="space-y-4 pt-1">
                  <button
                    type="button"
                    onClick={handleResendPendingConfirm}
                    disabled={authLoading || resendCooldown > 0}
                    className="w-full bg-[#181818] hover:bg-[#222222] border border-[#2E2E2E] hover:border-[#D6B35A]/50 text-[#EFECE6] disabled:opacity-50 font-bold text-xs uppercase py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                  >
                    {authLoading ? (
                      <span>Reenviando link...</span>
                    ) : resendCooldown > 0 ? (
                      <span>Reenviar e-mail ({resendCooldown}s)</span>
                    ) : (
                      <span>Reenviar e-mail de confirmação</span>
                    )}
                  </button>

                  <div className="pt-2 border-t border-[#222222] text-center space-y-2">
                    <p className="text-xs text-[#777777]">Já confirmou seu e-mail?</p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setAuthMode('login');
                          setLoginEmail(pendingConfirmEmail || regEmail);
                          setAuthError(null);
                        }}
                        className="flex-1 bg-[#D6B35A] hover:bg-[#EFECE6] text-black font-extrabold text-xs uppercase py-3 rounded-xl transition-all cursor-pointer"
                      >
                        Ir para o Login
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setAuthMode('register');
                          setAuthError(null);
                        }}
                        className="bg-[#080808] hover:bg-[#141414] border border-[#262626] text-[#777777] hover:text-[#CCCCCC] font-bold text-xs uppercase px-4 py-3 rounded-xl transition-all cursor-pointer"
                      >
                        Alterar E-mail
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW: AUTHENTICATED USER DASHBOARD (MINHA CONTA)
  // -------------------------------------------------------------
  return (
    <div className="bg-[#080808] text-[#EFECE6] min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <Breadcrumb items={[{ label: 'Minha Conta' }]} />

        {/* Admin Access Banner (if user is Admin) */}
        {user.role === 'admin' && (
          <div className="bg-gradient-to-r from-[#161616] to-[#201c12] border border-[#D6B35A]/50 p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 bg-[#D6B35A] text-black rounded-xl flex items-center justify-center font-black">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-black uppercase text-[#EFECE6]">
                  CONTA COM PRIVILÉGIOS DE ADMINISTRADOR
                </h2>
                <p className="text-xs text-[#777777]">
                  Você possui acesso irrestrito ao gerenciamento de categorias, produtos, pedidos e métricas.
                </p>
              </div>
            </div>

            <button
              onClick={() => onNavigate('admin')}
              className="bg-[#D6B35A] text-black hover:bg-[#EFECE6] font-black text-xs uppercase px-5 py-3 rounded-xl transition-all shadow-md flex items-center gap-2"
            >
              Abrir Painel Admin <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* User Identity Header Card */}
        <div className="bg-[#161616] border border-[#262626] p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-[#D6B35A] text-black font-black text-2xl rounded-2xl flex items-center justify-center uppercase shadow-inner">
              {user.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-black uppercase text-[#EFECE6]">{user.name}</h1>
                <span
                  className={`px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                    user.role === 'admin'
                      ? 'bg-[#D6B35A]/20 text-[#D6B35A] border border-[#D6B35A]/40'
                      : 'bg-[#262626] text-[#EFECE6]'
                  }`}
                >
                  {user.role === 'admin' ? 'ADMINISTRADOR' : 'CLIENTE VIP'}
                </span>

                {user.isVerified ? (
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-emerald-950/60 text-emerald-400 border border-emerald-800 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> E-mail Verificado
                  </span>
                ) : (
                  <button
                    onClick={() => {
                      setVerifyTargetEmail(user.email);
                      handleResend();
                      setAuthMode('verify');
                    }}
                    className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-amber-950/60 text-amber-400 border border-amber-800 hover:underline"
                  >
                    Verificar E-mail
                  </button>
                )}
              </div>

              <p className="text-xs text-[#777777] font-mono mt-1">{user.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <button
              onClick={logout}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-[#080808] hover:bg-red-950/40 text-[#777777] hover:text-red-400 border border-[#262626] px-5 py-3 rounded-xl text-xs font-bold uppercase transition-colors"
            >
              <LogOut className="w-4 h-4" /> Sair da Conta
            </button>
          </div>
        </div>

        {/* Main Tabs Container */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Navigation Sidebar */}
          <aside className="lg:col-span-3 space-y-2 bg-[#161616] border border-[#262626] p-4 rounded-2xl h-fit">
            <button
              onClick={() => setActiveTab('orders')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold uppercase transition-all ${
                activeTab === 'orders'
                  ? 'bg-[#D6B35A] text-black font-extrabold'
                  : 'text-[#777777] hover:text-[#EFECE6] hover:bg-[#080808]'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Package className="w-4 h-4" /> Meus Pedidos
              </span>
              <span className="font-mono text-[11px]">{orders.length}</span>
            </button>

            <button
              onClick={() => setActiveTab('addresses')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold uppercase transition-all ${
                activeTab === 'addresses'
                  ? 'bg-[#D6B35A] text-black font-extrabold'
                  : 'text-[#777777] hover:text-[#EFECE6] hover:bg-[#080808]'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <MapPin className="w-4 h-4" /> Meus Endereços
              </span>
              <span className="font-mono text-[11px]">{user.addresses.length}</span>
            </button>

            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold uppercase transition-all ${
                activeTab === 'profile'
                  ? 'bg-[#D6B35A] text-black font-extrabold'
                  : 'text-[#777777] hover:text-[#EFECE6] hover:bg-[#080808]'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <User className="w-4 h-4" /> Dados Pessoais
              </span>
            </button>

            <button
              onClick={() => setActiveTab('security')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold uppercase transition-all ${
                activeTab === 'security'
                  ? 'bg-[#D6B35A] text-black font-extrabold'
                  : 'text-[#777777] hover:text-[#EFECE6] hover:bg-[#080808]'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <KeyRound className="w-4 h-4" /> Alterar Senha
              </span>
            </button>

            <button
              onClick={() => setActiveTab('wishlist')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold uppercase transition-all ${
                activeTab === 'wishlist'
                  ? 'bg-[#D6B35A] text-black font-extrabold'
                  : 'text-[#777777] hover:text-[#EFECE6] hover:bg-[#080808]'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Heart className="w-4 h-4" /> Favoritos
              </span>
              <span className="font-mono text-[11px]">{wishlist.length}</span>
            </button>
          </aside>

          {/* Tab Content Column */}
          <main className="lg:col-span-9 bg-[#161616] border border-[#262626] p-6 sm:p-8 rounded-2xl">
            {/* TAB: ORDERS */}
            {activeTab === 'orders' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#262626] pb-4">
                  <div>
                    <h2 className="text-base font-black uppercase text-[#EFECE6]">
                      Histórico de Pedidos ({(orders || []).length})
                    </h2>
                    <span className="text-[11px] text-[#777777] font-mono">Persistência permanente no Supabase</span>
                  </div>
                  <button
                    onClick={handleManualSync}
                    disabled={isSyncingOrders}
                    className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#777777] hover:text-[#D6B35A] bg-[#080808] border border-[#262626] hover:border-[#D6B35A]/40 px-3 py-1.5 rounded-lg transition-all"
                    title="Atualizar lista de pedidos diretamente do banco"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncingOrders ? 'animate-spin text-[#D6B35A]' : ''}`} />
                    <span>{isSyncingOrders ? 'Sincronizando...' : 'Atualizar'}</span>
                  </button>
                </div>

                {(!orders || orders.length === 0) ? (
                  <div className="text-center py-12 space-y-4">
                    <Package className="w-12 h-12 text-[#262626] mx-auto" />
                    <p className="text-xs text-[#777777]">Você ainda não realizou nenhum pedido nesta conta.</p>
                    <button
                      onClick={() => onNavigate('home')}
                      className="bg-[#D6B35A] text-black font-bold text-xs uppercase px-5 py-2.5 rounded-xl hover:bg-[#EFECE6]"
                    >
                      Explorar Lançamentos
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {(orders || []).map((ord, idx) => (
                      <div
                        key={`${ord?.id || 'ord'}-${idx}`}
                        className="bg-[#080808] border border-[#262626] rounded-xl p-5 space-y-4"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#262626] pb-3">
                          <div>
                            <span className="text-xs font-black text-[#EFECE6] font-mono">PEDIDO #{ord?.id || ''}</span>
                            <span className="text-[11px] text-[#777777] block">Realizado em {ord?.date || ''}</span>
                          </div>

                          <span className="px-3 py-1 bg-[#D6B35A]/10 text-[#D6B35A] border border-[#D6B35A]/30 rounded text-[11px] font-bold uppercase w-fit">
                            {ord?.status || 'Pendente'}
                          </span>
                        </div>

                        {/* Order Items */}
                        <div className="space-y-3">
                          {(ord?.items || []).map((it: any, itemIdx: number) => (
                            <div key={itemIdx} className="flex gap-3 items-center">
                              <img
                                src={it?.productImage || it?.image || it?.image_snapshot || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=150&q=80'}
                                alt={it?.productTitle || it?.title || 'Produto'}
                                className="w-12 h-14 object-cover rounded bg-black shrink-0 border border-[#262626]"
                                referrerPolicy="no-referrer"
                              />
                              <div className="flex-1 text-xs">
                                <p className="font-bold text-[#EFECE6] line-clamp-1">{it?.productTitle || it?.title || 'Produto'}</p>
                                <p className="text-[10px] text-[#777777]">
                                  Tam: {it?.size || 'M'} • Cor: {it?.colorName || it?.color || 'Padrão'} • Qtd: {it?.quantity || 1}
                                </p>
                              </div>
                              <span className="text-xs font-black text-[#EFECE6]">
                                R$ {((it?.price || 0) * (it?.quantity || 1)).toFixed(2).replace('.', ',')}
                              </span>
                            </div>
                          ))}
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-[#262626]">
                          <span className="text-xs text-[#777777]">
                            Total do Pedido: <strong className="text-[#EFECE6] text-sm font-black">R$ {(ord?.total || 0).toFixed(2).replace('.', ',')}</strong>
                          </span>

                          <div className="flex flex-wrap items-center gap-2">
                            {(ord?.status === 'Aguardando Pagamento' || ord?.status === 'Pagamento Pendente' || ord?.paymentStatus === 'Pendente') && (
                              <button
                                onClick={() => handlePayNow(ord.id)}
                                className="bg-[#D6B35A] text-black font-extrabold text-xs uppercase px-4 py-2.5 rounded-xl hover:bg-[#EFECE6] transition-all flex items-center justify-center gap-1.5 shadow-lg"
                              >
                                <CreditCard className="w-4 h-4" /> Pagar Agora
                              </button>
                            )}

                            {ord?.trackingCode && (
                              <button
                                onClick={() => onNavigate('tracking', ord.trackingCode)}
                                className="bg-[#141414] hover:bg-[#222222] border border-[#262626] text-[#EFECE6] font-extrabold text-xs uppercase px-4 py-2.5 rounded-xl transition-colors flex items-center justify-center gap-1.5"
                              >
                                <Truck className="w-4 h-4 text-[#D6B35A]" /> Rastrear ({ord.trackingCode})
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB: ADDRESSES */}
            {activeTab === 'addresses' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center border-b border-[#262626] pb-4">
                  <h2 className="text-base font-black uppercase text-[#EFECE6]">
                    Endereços Salvos ({(user?.addresses || []).length})
                  </h2>

                  <button
                    onClick={openNewAddressModal}
                    className="bg-[#D6B35A] text-black hover:bg-[#EFECE6] font-extrabold text-xs uppercase px-4 py-2 rounded-xl transition-all flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" /> Adicionar Endereço
                  </button>
                </div>

                {(!user?.addresses || user.addresses.length === 0) ? (
                  <p className="text-xs text-[#777777]">Nenhum endereço cadastrado. Clique no botão acima para adicionar.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(user?.addresses || []).map((addr) => (
                      <div
                        key={addr.id}
                        className={`bg-[#080808] border p-5 rounded-xl space-y-3 text-xs transition-all ${
                          addr.isDefault ? 'border-[#D6B35A]/60 ring-1 ring-[#D6B35A]/20' : 'border-[#262626]'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-[#EFECE6] uppercase">{addr.recipientName}</span>
                          {addr.isDefault && (
                            <span className="text-[10px] bg-[#D6B35A]/10 text-[#D6B35A] border border-[#D6B35A]/30 px-2 py-0.5 rounded font-mono font-bold">
                              PRINCIPAL
                            </span>
                          )}
                        </div>

                        <div className="text-[#777777] space-y-0.5">
                          <p className="text-[#EFECE6]">
                            {addr.street}, {addr.number} {addr.complement ? `- ${addr.complement}` : ''}
                          </p>
                          <p>
                            {addr.neighborhood} — {addr.city}/{addr.state}
                          </p>
                          <p className="font-mono text-[11px]">CEP: {addr.cep}</p>
                        </div>

                        <div className="flex items-center gap-3 pt-3 border-t border-[#262626]">
                          {!addr.isDefault && (
                            <button
                              onClick={() => setDefaultAddress(addr.id)}
                              className="text-[11px] text-[#D6B35A] hover:underline font-bold"
                            >
                              Tornar Padrão
                            </button>
                          )}

                          <button
                            onClick={() => openEditAddressModal(addr)}
                            className="text-[11px] text-[#777777] hover:text-[#EFECE6] flex items-center gap-1"
                          >
                            <Edit2 className="w-3 h-3" /> Editar
                          </button>

                          <button
                            onClick={() => deleteAddress(addr.id)}
                            className="text-[11px] text-[#777777] hover:text-red-400 flex items-center gap-1 ml-auto"
                          >
                            <Trash2 className="w-3 h-3" /> Excluir
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB: PROFILE */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <h2 className="text-base font-black uppercase text-[#EFECE6] border-b border-[#262626] pb-4">
                  Dados do Perfil
                </h2>

                <form onSubmit={handleSaveProfile} className="space-y-4 max-w-lg">
                  <div>
                    <label className="text-[11px] font-bold text-[#777777] block mb-1">Nome Completo</label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      required
                      className="w-full bg-[#080808] border border-[#262626] px-3.5 py-3 rounded-xl text-xs text-[#EFECE6] focus:outline-none focus:border-[#D6B35A]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-[#777777] block mb-1">E-mail Cadastrado</label>
                    <input
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      required
                      className="w-full bg-[#080808] border border-[#262626] px-3.5 py-3 rounded-xl text-xs text-[#EFECE6] focus:outline-none focus:border-[#D6B35A]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-[#777777] block mb-1">Telefone WhatsApp</label>
                      <input
                        type="text"
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        placeholder="(11) 98888-7777"
                        className="w-full bg-[#080808] border border-[#262626] px-3.5 py-3 rounded-xl text-xs text-[#EFECE6] focus:outline-none focus:border-[#D6B35A]"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-[#777777] block mb-1">CPF</label>
                      <input
                        type="text"
                        value={editCpf}
                        onChange={(e) => setEditCpf(e.target.value)}
                        placeholder="000.000.000-00"
                        className="w-full bg-[#080808] border border-[#262626] px-3.5 py-3 rounded-xl text-xs text-[#EFECE6] focus:outline-none focus:border-[#D6B35A]"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="bg-[#D6B35A] text-black hover:bg-[#EFECE6] font-extrabold text-xs uppercase px-6 py-3.5 rounded-xl transition-all shadow-lg"
                  >
                    {savingProfile ? 'SALVANDO...' : 'SALVAR ALTERAÇÕES'}
                  </button>
                </form>
              </div>
            )}

            {/* TAB: SECURITY / CHANGE PASSWORD */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <h2 className="text-base font-black uppercase text-[#EFECE6] border-b border-[#262626] pb-4">
                  Segurança & Alteração de Senha
                </h2>

                <form onSubmit={handleChangePassword} className="space-y-4 max-w-lg">
                  <div>
                    <label className="text-[11px] font-bold text-[#777777] block mb-1">Senha Atual</label>
                    <input
                      type="password"
                      value={currentPass}
                      onChange={(e) => setCurrentPass(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full bg-[#080808] border border-[#262626] px-3.5 py-3 rounded-xl text-xs text-[#EFECE6] focus:outline-none focus:border-[#D6B35A]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-[#777777] block mb-1">Nova Senha (Mín. 6 caracteres)</label>
                    <input
                      type="password"
                      value={newPass}
                      onChange={(e) => setNewPass(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full bg-[#080808] border border-[#262626] px-3.5 py-3 rounded-xl text-xs text-[#EFECE6] focus:outline-none focus:border-[#D6B35A]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-[#777777] block mb-1">Confirmar Nova Senha</label>
                    <input
                      type="password"
                      value={confirmPass}
                      onChange={(e) => setConfirmPass(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full bg-[#080808] border border-[#262626] px-3.5 py-3 rounded-xl text-xs text-[#EFECE6] focus:outline-none focus:border-[#D6B35A]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={changingPass}
                    className="bg-[#D6B35A] text-black hover:bg-[#EFECE6] font-extrabold text-xs uppercase px-6 py-3.5 rounded-xl transition-all shadow-lg"
                  >
                    {changingPass ? 'ALTERANDO...' : 'CONFIRMAR NOVA SENHA'}
                  </button>
                </form>
              </div>
            )}

            {/* TAB: WISHLIST */}
            {activeTab === 'wishlist' && (
              <div className="space-y-6">
                <h2 className="text-base font-black uppercase text-[#EFECE6] border-b border-[#262626] pb-4">
                  Meus Favoritos ({(wishlist || []).length})
                </h2>

                {(!wishlist || wishlist.length === 0) ? (
                  <p className="text-xs text-[#777777]">Sua lista de favoritos está vazia.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {(wishlist || []).map((prod) => (
                      <div
                        key={prod.id}
                        className="bg-[#080808] border border-[#262626] p-4 rounded-xl flex gap-3 items-center"
                      >
                        <img
                          src={prod.images?.[0] || prod.image || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=150&q=80'}
                          alt={prod.title}
                          className="w-16 h-20 object-cover rounded bg-black shrink-0 border border-[#262626]"
                          referrerPolicy="no-referrer"
                        />
                        <div className="flex-1 min-w-0 text-xs">
                          <p className="font-bold text-[#EFECE6] line-clamp-1">{prod.title}</p>
                          <p className="text-xs font-black text-[#D6B35A] mt-1">
                            R$ {(prod.promoPrice || prod.price).toFixed(2).replace('.', ',')}
                          </p>

                          <div className="flex gap-2 mt-3">
                            <button
                              onClick={() => {
                                const defaultSize = prod.sizes?.[0] || 'M';
                                const defaultColor = prod.colors?.[0] || 'Padrão';
                                addToCart(prod, defaultSize, defaultColor, 1);
                                showToast('Adicionado', `${prod.title} no carrinho.`, 'success');
                                openMiniCart();
                              }}
                              className="bg-[#D6B35A] text-black font-extrabold text-[10px] uppercase px-3 py-1.5 rounded hover:bg-[#EFECE6]"
                            >
                              Mover p/ Carrinho
                            </button>
                            <button
                              onClick={() => removeFromWishlist(prod.id)}
                              className="p-1.5 bg-[#161616] text-[#777777] hover:text-red-500 rounded border border-[#262626]"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Address Modal */}
      {isAddressModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#161616] border border-[#262626] rounded-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-sm font-black uppercase text-[#EFECE6]">
              {editingAddressId ? 'Editar Endereço' : 'Novo Endereço de Entrega'}
            </h3>

            <form onSubmit={handleSaveAddress} className="space-y-3 text-xs">
              <div>
                <label className="text-[11px] font-bold text-[#777777] block mb-1">Destinatário</label>
                <input
                  type="text"
                  value={addrRecipient}
                  onChange={(e) => setAddrRecipient(e.target.value)}
                  placeholder="Nome de quem recebe"
                  required
                  className="w-full bg-[#080808] border border-[#262626] px-3 py-2 rounded text-[#EFECE6]"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-[#777777] flex items-center justify-between mb-1">
                    <span>CEP</span>
                    {loadingAddrCep && <span className="text-[10px] text-[#D6B35A] animate-pulse">Buscando...</span>}
                  </label>
                  <input
                    type="text"
                    value={addrCep}
                    onChange={(e) => setAddrCep(formatCep(e.target.value))}
                    onBlur={handleCepLookup}
                    placeholder="00000-000"
                    maxLength={9}
                    required
                    className="w-full bg-[#080808] border border-[#262626] px-3 py-2 rounded text-[#EFECE6] font-mono"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-[11px] font-bold text-[#777777] block mb-1">Rua / Logradouro</label>
                  <input
                    type="text"
                    value={addrStreet}
                    onChange={(e) => setAddrStreet(e.target.value)}
                    placeholder="Av. Paulista"
                    required
                    className="w-full bg-[#080808] border border-[#262626] px-3 py-2 rounded text-[#EFECE6]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-[#777777] block mb-1">Número</label>
                  <input
                    type="text"
                    value={addrNumber}
                    onChange={(e) => setAddrNumber(e.target.value)}
                    placeholder="1000"
                    required
                    className="w-full bg-[#080808] border border-[#262626] px-3 py-2 rounded text-[#EFECE6]"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-[11px] font-bold text-[#777777] block mb-1">Complemento</label>
                  <input
                    type="text"
                    value={addrComplement}
                    onChange={(e) => setAddrComplement(e.target.value)}
                    placeholder="Apto 42"
                    className="w-full bg-[#080808] border border-[#262626] px-3 py-2 rounded text-[#EFECE6]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-[#777777] block mb-1">Bairro</label>
                  <input
                    type="text"
                    value={addrNeighborhood}
                    onChange={(e) => setAddrNeighborhood(e.target.value)}
                    placeholder="Bela Vista"
                    required
                    className="w-full bg-[#080808] border border-[#262626] px-3 py-2 rounded text-[#EFECE6]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-[#777777] block mb-1">Cidade</label>
                  <input
                    type="text"
                    value={addrCity}
                    onChange={(e) => setAddrCity(e.target.value)}
                    placeholder="São Paulo"
                    required
                    className="w-full bg-[#080808] border border-[#262626] px-3 py-2 rounded text-[#EFECE6]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-[#777777] block mb-1">UF</label>
                  <input
                    type="text"
                    value={addrState}
                    onChange={(e) => setAddrState(e.target.value)}
                    placeholder="SP"
                    required
                    className="w-full bg-[#080808] border border-[#262626] px-3 py-2 rounded text-[#EFECE6]"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-2">
                <input
                  type="checkbox"
                  checked={addrIsDefault}
                  onChange={(e) => setAddrIsDefault(e.target.checked)}
                  className="accent-[#D6B35A]"
                />
                <span className="text-[11px] text-[#EFECE6]">Definir como endereço principal</span>
              </label>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddressModalOpen(false)}
                  className="flex-1 bg-[#080808] hover:bg-[#222] border border-[#262626] text-[#777777] font-bold text-xs uppercase py-2.5 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#D6B35A] text-black font-extrabold text-xs uppercase py-2.5 rounded-xl hover:bg-[#EFECE6]"
                >
                  Salvar Endereço
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
