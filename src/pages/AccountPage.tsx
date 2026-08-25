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
import { getValidProductImageUrl, handleProductImageError } from '../utils/imageUtils';

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
      <div className="bg-[#FAFAFA] text-[#18181B] min-h-screen py-24 px-4 flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-2 border-[#18181B] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-mono uppercase tracking-widest text-[#71717A]">
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
      <div className="bg-[#FAFAFA] text-[#18181B] min-h-screen py-12 px-4 sm:px-6">
        <div className="max-w-xl mx-auto space-y-6">
          <Breadcrumb items={[{ label: 'Autenticação de Conta' }]} />

          {/* Quick Demo Credentials Info Banner */}
          <div className="bg-white border border-[#E4E4E7] p-4 rounded-xl text-xs space-y-2.5 shadow-xs">
            <div className="flex items-center gap-2 text-[#B45309] font-bold uppercase tracking-wider text-[11px]">
              <ShieldCheck className="w-4 h-4" /> Credenciais de Demonstração Rápidas
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemo('admin@marmot.com', 'marmot')}
                className="bg-[#F8F9FA] hover:bg-[#F4F4F5] border border-[#E4E4E7] hover:border-[#18181B]/40 p-2.5 rounded-lg text-left transition-all group cursor-pointer"
              >
                <div className="flex justify-between items-center text-[10px] text-[#B45309] font-mono font-bold">
                  <span>ADMINISTRADOR</span>
                  <span className="group-hover:translate-x-0.5 transition-transform">Usar →</span>
                </div>
                <p className="text-[#18181B] font-bold mt-0.5">admin@marmot.com</p>
                <p className="text-[10px] text-[#71717A]">Senha: marmot</p>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo('cliente@marmot.com', 'cliente123')}
                className="bg-[#F8F9FA] hover:bg-[#F4F4F5] border border-[#E4E4E7] hover:border-[#18181B]/40 p-2.5 rounded-lg text-left transition-all group cursor-pointer"
              >
                <div className="flex justify-between items-center text-[10px] text-[#71717A] group-hover:text-[#18181B] font-mono font-bold">
                  <span>CLIENTE VIP</span>
                  <span className="group-hover:translate-x-0.5 transition-transform">Usar →</span>
                </div>
                <p className="text-[#18181B] font-bold mt-0.5">cliente@marmot.com</p>
                <p className="text-[10px] text-[#71717A]">Senha: cliente123</p>
              </button>
            </div>
          </div>

          {/* Main Auth Card */}
          <div className="bg-white border border-[#E4E4E7] rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs">
            {/* Header Tabs */}
            <div className="flex border-b border-[#E4E4E7] pb-3 gap-4 text-xs font-black uppercase tracking-wider">
              <button
                onClick={() => {
                  setAuthMode('login');
                  setAuthError(null);
                }}
                className={`pb-2 border-b-2 transition-all cursor-pointer ${
                  authMode === 'login'
                    ? 'border-[#18181B] text-[#18181B]'
                    : 'border-transparent text-[#71717A] hover:text-[#18181B]'
                }`}
              >
                Entrar
              </button>

              <button
                onClick={() => {
                  setAuthMode('register');
                  setAuthError(null);
                }}
                className={`pb-2 border-b-2 transition-all cursor-pointer ${
                  authMode === 'register'
                    ? 'border-[#18181B] text-[#18181B]'
                    : 'border-transparent text-[#71717A] hover:text-[#18181B]'
                }`}
              >
                Criar Conta
              </button>

              <button
                onClick={() => {
                  setAuthMode('forgot');
                  setAuthError(null);
                }}
                className={`pb-2 border-b-2 transition-all cursor-pointer ${
                  authMode === 'forgot'
                    ? 'border-[#18181B] text-[#18181B]'
                    : 'border-transparent text-[#71717A] hover:text-[#18181B]'
                }`}
              >
                Recuperar Senha
              </button>
            </div>

            {/* Error Message Alert */}
            {authError && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-3.5 rounded-xl text-xs space-y-2">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
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
                      className="text-xs font-bold text-[#B45309] hover:underline flex items-center gap-1 uppercase tracking-wider cursor-pointer"
                    >
                      Verificar E-mail / Reenviar Link &rarr;
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Preview Verification Code helper banner */}
            {previewCode && (
              <div className="bg-[#FEF3C7] border border-[#FDE68A] text-[#18181B] p-4 rounded-xl text-xs space-y-1">
                <p className="font-bold text-[#B45309] flex items-center gap-1.5 uppercase tracking-wider">
                  <Sparkles className="w-4 h-4" /> Código de Teste Emitido:
                </p>
                <p className="text-lg font-mono font-black text-[#18181B] tracking-widest">{previewCode}</p>
                <p className="text-[10px] text-[#71717A]">
                  Insira o código acima para completar a validação instantânea da conta.
                </p>
              </div>
            )}

            {/* TAB 1: LOGIN */}
            {authMode === 'login' && (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="text-[11px] font-bold text-[#71717A] block mb-1">E-mail</label>
                  <div className="relative">
                    <input
                      type="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="seuemail@exemplo.com"
                      required
                      className="w-full bg-[#F8F9FA] border border-[#E4E4E7] px-3.5 py-3 rounded-xl text-xs text-[#18181B] focus:outline-none focus:border-[#18181B]"
                    />
                    <Mail className="w-4 h-4 text-[#A1A1AA] absolute right-3.5 top-3.5" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[11px] font-bold text-[#71717A]">Senha</label>
                    <button
                      type="button"
                      onClick={() => setAuthMode('forgot')}
                      className="text-[11px] text-[#B45309] hover:underline cursor-pointer"
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
                      className="w-full bg-[#F8F9FA] border border-[#E4E4E7] px-3.5 py-3 rounded-xl text-xs text-[#18181B] focus:outline-none focus:border-[#18181B]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3.5 text-[#A1A1AA] hover:text-[#18181B] cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full bg-[#F4C400] text-[#0B0B0E] hover:bg-[#E5B500] font-extrabold text-xs uppercase py-3.5 rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {authLoading ? 'AUTENTICANDO...' : 'ENTRAR NA CONTA'} <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}

            {/* TAB 2: REGISTER */}
            {authMode === 'register' && (
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div>
                  <label className="text-[11px] font-bold text-[#71717A] block mb-1">Nome Completo</label>
                  <input
                    type="text"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Ex: Roberto Sampaio"
                    required
                    className="w-full bg-[#F8F9FA] border border-[#E4E4E7] px-3.5 py-3 rounded-xl text-xs text-[#18181B] focus:outline-none focus:border-[#18181B]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-[#71717A] block mb-1">E-mail</label>
                    <input
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="roberto@email.com"
                      required
                      className="w-full bg-[#F8F9FA] border border-[#E4E4E7] px-3.5 py-3 rounded-xl text-xs text-[#18181B] focus:outline-none focus:border-[#18181B]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-[#71717A] block mb-1">Telefone WhatsApp</label>
                    <input
                      type="text"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="(11) 98888-7777"
                      className="w-full bg-[#F8F9FA] border border-[#E4E4E7] px-3.5 py-3 rounded-xl text-xs text-[#18181B] focus:outline-none focus:border-[#18181B]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-[#71717A] block mb-1">CPF (Opcional)</label>
                  <input
                    type="text"
                    value={regCpf}
                    onChange={(e) => setRegCpf(e.target.value)}
                    placeholder="000.000.000-00"
                    className="w-full bg-[#F8F9FA] border border-[#E4E4E7] px-3.5 py-3 rounded-xl text-xs text-[#18181B] focus:outline-none focus:border-[#18181B]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-[#71717A] block mb-1">Senha (Mín. 6 caracteres)</label>
                    <input
                      type="password"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full bg-[#F8F9FA] border border-[#E4E4E7] px-3.5 py-3 rounded-xl text-xs text-[#18181B] focus:outline-none focus:border-[#18181B]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-[#71717A] block mb-1">Confirmar Senha</label>
                    <input
                      type="password"
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full bg-[#F8F9FA] border border-[#E4E4E7] px-3.5 py-3 rounded-xl text-xs text-[#18181B] focus:outline-none focus:border-[#18181B]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full bg-[#F4C400] text-[#0B0B0E] hover:bg-[#E5B500] font-extrabold text-xs uppercase py-3.5 rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
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
                    <p className="text-xs text-[#71717A]">
                      Digite seu e-mail cadastrado. Emitiremos um código de segurança para redefinição de senha.
                    </p>

                    <div>
                      <label className="text-[11px] font-bold text-[#71717A] block mb-1">E-mail Cadastrado</label>
                      <input
                        type="email"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="seuemail@exemplo.com"
                        required
                        className="w-full bg-[#F8F9FA] border border-[#E4E4E7] px-3.5 py-3 rounded-xl text-xs text-[#18181B] focus:outline-none focus:border-[#18181B]"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={authLoading}
                      className="w-full bg-[#F4C400] text-[#0B0B0E] hover:bg-[#E5B500] font-extrabold text-xs uppercase py-3.5 rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {authLoading ? 'PROCESSANDO...' : 'ENVIAR CÓDIGO DE RECUPERAÇÃO'}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleResetSubmit} className="space-y-4">
                    <p className="text-xs text-[#71717A]">
                      Insira o código de 6 dígitos e defina a sua nova senha.
                    </p>

                    <div>
                      <label className="text-[11px] font-bold text-[#71717A] block mb-1">Código de 6 Dígitos</label>
                      <input
                        type="text"
                        value={resetCode}
                        onChange={(e) => setResetCode(e.target.value)}
                        placeholder="Ex: 849201"
                        required
                        className="w-full bg-[#F8F9FA] border border-[#E4E4E7] px-3.5 py-3 rounded-xl text-xs text-[#18181B] font-mono focus:outline-none focus:border-[#18181B]"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-bold text-[#71717A] block mb-1">Nova Senha</label>
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Mín. 6 caracteres"
                          required
                          className="w-full bg-[#F8F9FA] border border-[#E4E4E7] px-3.5 py-3 rounded-xl text-xs text-[#18181B] focus:outline-none focus:border-[#18181B]"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-[#71717A] block mb-1">Confirmar Nova Senha</label>
                        <input
                          type="password"
                          value={confirmNewPassword}
                          onChange={(e) => setConfirmNewPassword(e.target.value)}
                          placeholder="••••••••"
                          required
                          className="w-full bg-[#F8F9FA] border border-[#E4E4E7] px-3.5 py-3 rounded-xl text-xs text-[#18181B] focus:outline-none focus:border-[#18181B]"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={authLoading}
                      className="w-full bg-[#F4C400] text-[#0B0B0E] hover:bg-[#E5B500] font-extrabold text-xs uppercase py-3.5 rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
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
                <p className="text-xs text-[#71717A]">
                  Insira o código de 6 dígitos para validar a titularidade da conta para <strong>{verifyTargetEmail}</strong>.
                </p>

                <div>
                  <label className="text-[11px] font-bold text-[#71717A] block mb-1">Código de Validação</label>
                  <input
                    type="text"
                    value={verifyCode}
                    onChange={(e) => setVerifyCode(e.target.value)}
                    placeholder="000000"
                    maxLength={6}
                    required
                    className="w-full bg-[#F8F9FA] border border-[#E4E4E7] px-3.5 py-3 rounded-xl text-center text-lg font-mono font-black text-[#B45309] tracking-widest focus:outline-none focus:border-[#18181B]"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleResend}
                    className="bg-[#F8F9FA] hover:bg-[#F4F4F5] border border-[#E4E4E7] text-[#71717A] hover:text-[#18181B] font-bold text-xs uppercase px-4 py-3 rounded-xl cursor-pointer"
                  >
                    Reenviar Código
                  </button>

                  <button
                    type="submit"
                    disabled={authLoading}
                    className="flex-1 bg-[#F4C400] text-[#0B0B0E] hover:bg-[#E5B500] font-extrabold text-xs uppercase py-3 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {authLoading ? 'VERIFICANDO...' : 'CONFIRMAR E-MAIL'}
                  </button>
                </div>
              </form>
            )}

            {/* TAB 5: AWAITING SUPABASE EMAIL CONFIRMATION LINK */}
            {authMode === 'awaiting_confirmation' && (
              <div className="space-y-6 py-2">
                <div className="mx-auto w-16 h-16 bg-[#FEF3C7] border border-[#FDE68A] rounded-2xl flex items-center justify-center text-[#B45309] shadow-xs">
                  <Mail className="w-8 h-8" />
                </div>

                <div className="text-center space-y-2.5">
                  <h3 className="text-xl sm:text-2xl font-black uppercase text-[#18181B] tracking-tight">
                    Verifique seu e-mail
                  </h3>
                  <p className="text-xs sm:text-sm text-[#71717A]">
                    Enviamos um link de confirmação para:
                  </p>
                  <div className="bg-[#F8F9FA] border border-[#E4E4E7] py-2.5 px-4 rounded-xl text-xs sm:text-sm font-mono font-bold text-[#B45309] break-all max-w-sm mx-auto">
                    {pendingConfirmEmail || regEmail}
                  </div>
                  <p className="text-xs text-[#71717A] pt-1">
                    Clique no link enviado para ativar sua conta na MARMOT.
                  </p>
                </div>

                {resendStatusMsg && (
                  <div className={`p-3 rounded-xl text-xs text-center font-mono border ${
                    resendStatusMsg.includes('sucesso') 
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                      : 'bg-red-50 border-red-200 text-red-700'
                  }`}>
                    {resendStatusMsg}
                  </div>
                )}

                <div className="space-y-4 pt-1">
                  <button
                    type="button"
                    onClick={handleResendPendingConfirm}
                    disabled={authLoading || resendCooldown > 0}
                    className="w-full bg-[#F8F9FA] hover:bg-[#F4F4F5] border border-[#E4E4E7] hover:border-[#18181B]/50 text-[#18181B] disabled:opacity-50 font-bold text-xs uppercase py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                  >
                    {authLoading ? (
                      <span>Reenviando link...</span>
                    ) : resendCooldown > 0 ? (
                      <span>Reenviar e-mail ({resendCooldown}s)</span>
                    ) : (
                      <span>Reenviar e-mail de confirmação</span>
                    )}
                  </button>

                  <div className="pt-2 border-t border-[#E4E4E7] text-center space-y-2">
                    <p className="text-xs text-[#71717A]">Já confirmou seu e-mail?</p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setAuthMode('login');
                          setLoginEmail(pendingConfirmEmail || regEmail);
                          setAuthError(null);
                        }}
                        className="flex-1 bg-[#F4C400] hover:bg-[#E5B500] text-[#0B0B0E] font-extrabold text-xs uppercase py-3 rounded-xl transition-all cursor-pointer shadow-xs"
                      >
                        Ir para o Login
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setAuthMode('register');
                          setAuthError(null);
                        }}
                        className="bg-[#F8F9FA] hover:bg-[#F4F4F5] border border-[#E4E4E7] text-[#71717A] hover:text-[#18181B] font-bold text-xs uppercase px-4 py-3 rounded-xl transition-all cursor-pointer"
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
    <div className="bg-[#FAFAFA] text-[#18181B] min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <Breadcrumb items={[{ label: 'Minha Conta' }]} />

        {/* Admin Access Banner (if user is Admin) */}
        {user.role === 'admin' && (
          <div className="bg-[#FEF3C7] border border-[#FDE68A] p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 bg-[#F4C400] text-black rounded-xl flex items-center justify-center font-black">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-black uppercase text-[#18181B]">
                  CONTA COM PRIVILÉGIOS DE ADMINISTRADOR
                </h2>
                <p className="text-xs text-[#71717A]">
                  Você possui acesso irrestrito ao gerenciamento de categorias, produtos, pedidos e métricas.
                </p>
              </div>
            </div>

            <button
              onClick={() => onNavigate('admin')}
              className="bg-[#0B0B0E] text-white hover:bg-[#27272A] font-black text-xs uppercase px-5 py-3 rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer"
            >
              Abrir Painel Admin <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* User Identity Header Card */}
        <div className="bg-white border border-[#E4E4E7] p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xs">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-[#F4C400] text-[#0B0B0E] font-black text-2xl rounded-2xl flex items-center justify-center uppercase shadow-inner">
              {user.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-black uppercase text-[#18181B]">{user.name}</h1>
                <span
                  className={`px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                    user.role === 'admin'
                      ? 'bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A]'
                      : 'bg-[#F4F4F5] text-[#18181B] border border-[#E4E4E7]'
                  }`}
                >
                  {user.role === 'admin' ? 'ADMINISTRADOR' : 'CLIENTE VIP'}
                </span>

                {user.isVerified ? (
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> E-mail Verificado
                  </span>
                ) : (
                  <button
                    onClick={() => {
                      setVerifyTargetEmail(user.email);
                      handleResend();
                      setAuthMode('verify');
                    }}
                    className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 hover:underline cursor-pointer"
                  >
                    Verificar E-mail
                  </button>
                )}
              </div>

              <p className="text-xs text-[#71717A] font-mono mt-1">{user.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <button
              onClick={logout}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-[#F8F9FA] hover:bg-red-50 text-[#71717A] hover:text-red-600 border border-[#E4E4E7] hover:border-red-200 px-5 py-3 rounded-xl text-xs font-bold uppercase transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" /> Sair da Conta
            </button>
          </div>
        </div>

        {/* Main Tabs Container */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Navigation Sidebar */}
          <aside className="lg:col-span-3 space-y-2 bg-white border border-[#E4E4E7] p-4 rounded-2xl h-fit shadow-xs">
            <button
              onClick={() => setActiveTab('orders')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold uppercase transition-all cursor-pointer ${
                activeTab === 'orders'
                  ? 'bg-[#0B0B0E] text-white font-extrabold shadow-xs'
                  : 'text-[#71717A] hover:text-[#18181B] hover:bg-[#F8F9FA]'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Package className="w-4 h-4" /> Meus Pedidos
              </span>
              <span className="font-mono text-[11px]">{orders.length}</span>
            </button>

            <button
              onClick={() => setActiveTab('addresses')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold uppercase transition-all cursor-pointer ${
                activeTab === 'addresses'
                  ? 'bg-[#0B0B0E] text-white font-extrabold shadow-xs'
                  : 'text-[#71717A] hover:text-[#18181B] hover:bg-[#F8F9FA]'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <MapPin className="w-4 h-4" /> Meus Endereços
              </span>
              <span className="font-mono text-[11px]">{user.addresses.length}</span>
            </button>

            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold uppercase transition-all cursor-pointer ${
                activeTab === 'profile'
                  ? 'bg-[#0B0B0E] text-white font-extrabold shadow-xs'
                  : 'text-[#71717A] hover:text-[#18181B] hover:bg-[#F8F9FA]'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <User className="w-4 h-4" /> Dados Pessoais
              </span>
            </button>

            <button
              onClick={() => setActiveTab('security')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold uppercase transition-all cursor-pointer ${
                activeTab === 'security'
                  ? 'bg-[#0B0B0E] text-white font-extrabold shadow-xs'
                  : 'text-[#71717A] hover:text-[#18181B] hover:bg-[#F8F9FA]'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <KeyRound className="w-4 h-4" /> Alterar Senha
              </span>
            </button>

            <button
              onClick={() => setActiveTab('wishlist')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold uppercase transition-all cursor-pointer ${
                activeTab === 'wishlist'
                  ? 'bg-[#0B0B0E] text-white font-extrabold shadow-xs'
                  : 'text-[#71717A] hover:text-[#18181B] hover:bg-[#F8F9FA]'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Heart className="w-4 h-4" /> Favoritos
              </span>
              <span className="font-mono text-[11px]">{wishlist.length}</span>
            </button>
          </aside>

          {/* Tab Content Column */}
          <main className="lg:col-span-9 bg-white border border-[#E4E4E7] p-6 sm:p-8 rounded-2xl shadow-xs">
            {/* TAB: ORDERS */}
            {activeTab === 'orders' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E4E4E7] pb-4">
                  <div>
                    <h2 className="text-base font-black uppercase text-[#18181B]">
                      Histórico de Pedidos ({(orders || []).length})
                    </h2>
                    <span className="text-[11px] text-[#71717A] font-mono">Persistência permanente no Supabase</span>
                  </div>
                  <button
                    onClick={handleManualSync}
                    disabled={isSyncingOrders}
                    className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#71717A] hover:text-[#18181B] bg-[#F8F9FA] border border-[#E4E4E7] hover:border-[#18181B]/40 px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                    title="Atualizar lista de pedidos diretamente do banco"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncingOrders ? 'animate-spin text-[#B45309]' : ''}`} />
                    <span>{isSyncingOrders ? 'Sincronizando...' : 'Atualizar'}</span>
                  </button>
                </div>

                {(!orders || orders.length === 0) ? (
                  <div className="text-center py-12 space-y-4">
                    <Package className="w-12 h-12 text-[#E4E4E7] mx-auto" />
                    <p className="text-xs text-[#71717A]">Você ainda não realizou nenhum pedido nesta conta.</p>
                    <button
                      onClick={() => onNavigate('home')}
                      className="bg-[#F4C400] text-[#0B0B0E] font-bold text-xs uppercase px-5 py-2.5 rounded-xl hover:bg-[#E5B500] cursor-pointer shadow-xs"
                    >
                      Explorar Lançamentos
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {(orders || []).map((ord, idx) => (
                      <div
                        key={`${ord?.id || 'ord'}-${idx}`}
                        className="bg-[#F8F9FA] border border-[#E4E4E7] rounded-xl p-5 space-y-4 shadow-xs"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E4E4E7] pb-3">
                          <div>
                            <span className="text-xs font-black text-[#18181B] font-mono">PEDIDO #{ord?.id || ''}</span>
                            <span className="text-[11px] text-[#71717A] block">Realizado em {ord?.date || ''}</span>
                          </div>

                          <span className="px-3 py-1 bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A] rounded text-[11px] font-bold uppercase w-fit">
                            {ord?.status || 'Pendente'}
                          </span>
                        </div>

                        {/* Order Items */}
                        <div className="space-y-3">
                          {(ord?.items || []).map((it: any, itemIdx: number) => (
                            <div key={itemIdx} className="flex gap-3 items-center">
                              <img
                                src={getValidProductImageUrl(it?.productImage || it?.image || it?.image_snapshot, 'camisetas', it?.productTitle || String(itemIdx))}
                                alt={it?.productTitle || it?.title || 'Produto'}
                                className="w-12 h-14 object-cover rounded bg-[#F4F4F5] shrink-0 border border-[#E4E4E7]"
                                referrerPolicy="no-referrer"
                                onError={(e) => handleProductImageError(e, 'camisetas', it?.productTitle || String(itemIdx))}
                              />
                              <div className="flex-1 text-xs">
                                <p className="font-bold text-[#18181B] line-clamp-1">{it?.productTitle || it?.title || 'Produto'}</p>
                                <p className="text-[10px] text-[#71717A]">
                                  Tam: {it?.size || 'M'} • Cor: {it?.colorName || it?.color || 'Padrão'} • Qtd: {it?.quantity || 1}
                                </p>
                              </div>
                              <span className="text-xs font-black text-[#18181B]">
                                R$ {((it?.price || 0) * (it?.quantity || 1)).toFixed(2).replace('.', ',')}
                              </span>
                            </div>
                          ))}
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-[#E4E4E7]">
                          <span className="text-xs text-[#71717A]">
                            Total do Pedido: <strong className="text-[#18181B] text-sm font-black">R$ {(ord?.total || 0).toFixed(2).replace('.', ',')}</strong>
                          </span>

                          <div className="flex flex-wrap items-center gap-2">
                            {(ord?.status === 'Aguardando Pagamento' || ord?.status === 'Pagamento Pendente' || ord?.paymentStatus === 'Pendente') && (
                              <button
                                onClick={() => handlePayNow(ord.id)}
                                className="bg-[#F4C400] text-[#0B0B0E] font-extrabold text-xs uppercase px-4 py-2.5 rounded-xl hover:bg-[#E5B500] transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                              >
                                <CreditCard className="w-4 h-4" /> Pagar Agora
                              </button>
                            )}

                            {ord?.trackingCode && (
                              <button
                                onClick={() => onNavigate('tracking', ord.trackingCode)}
                                className="bg-white hover:bg-[#F4F4F5] border border-[#E4E4E7] text-[#18181B] font-extrabold text-xs uppercase px-4 py-2.5 rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                              >
                                <Truck className="w-4 h-4 text-[#B45309]" /> Rastrear ({ord.trackingCode})
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
                <div className="flex justify-between items-center border-b border-[#E4E4E7] pb-4">
                  <h2 className="text-base font-black uppercase text-[#18181B]">
                    Endereços Salvos ({(user?.addresses || []).length})
                  </h2>

                  <button
                    onClick={openNewAddressModal}
                    className="bg-[#F4C400] text-[#0B0B0E] hover:bg-[#E5B500] font-extrabold text-xs uppercase px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Plus className="w-4 h-4" /> Adicionar Endereço
                  </button>
                </div>

                {(!user?.addresses || user.addresses.length === 0) ? (
                  <p className="text-xs text-[#71717A]">Nenhum endereço cadastrado. Clique no botão acima para adicionar.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(user?.addresses || []).map((addr) => (
                      <div
                        key={addr.id}
                        className={`bg-[#F8F9FA] border p-5 rounded-xl space-y-3 text-xs transition-all ${
                          addr.isDefault ? 'border-[#18181B] ring-1 ring-[#18181B]/20 bg-white' : 'border-[#E4E4E7]'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-[#18181B] uppercase">{addr.recipientName}</span>
                          {addr.isDefault && (
                            <span className="text-[10px] bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A] px-2 py-0.5 rounded font-mono font-bold">
                              PRINCIPAL
                            </span>
                          )}
                        </div>

                        <div className="text-[#71717A] space-y-0.5">
                          <p className="text-[#18181B]">
                            {addr.street}, {addr.number} {addr.complement ? `- ${addr.complement}` : ''}
                          </p>
                          <p>
                            {addr.neighborhood} — {addr.city}/{addr.state}
                          </p>
                          <p className="font-mono text-[11px]">CEP: {addr.cep}</p>
                        </div>

                        <div className="flex items-center gap-3 pt-3 border-t border-[#E4E4E7]">
                          {!addr.isDefault && (
                            <button
                              onClick={() => setDefaultAddress(addr.id)}
                              className="text-[11px] text-[#B45309] hover:underline font-bold cursor-pointer"
                            >
                              Tornar Padrão
                            </button>
                          )}

                          <button
                            onClick={() => openEditAddressModal(addr)}
                            className="text-[11px] text-[#71717A] hover:text-[#18181B] flex items-center gap-1 cursor-pointer"
                          >
                            <Edit2 className="w-3 h-3" /> Editar
                          </button>

                          <button
                            onClick={() => deleteAddress(addr.id)}
                            className="text-[11px] text-[#71717A] hover:text-red-600 flex items-center gap-1 ml-auto cursor-pointer"
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
                <h2 className="text-base font-black uppercase text-[#18181B] border-b border-[#E4E4E7] pb-4">
                  Dados do Perfil
                </h2>

                <form onSubmit={handleSaveProfile} className="space-y-4 max-w-lg">
                  <div>
                    <label className="text-[11px] font-bold text-[#71717A] block mb-1">Nome Completo</label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      required
                      className="w-full bg-[#F8F9FA] border border-[#E4E4E7] px-3.5 py-3 rounded-xl text-xs text-[#18181B] focus:outline-none focus:border-[#18181B]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-[#71717A] block mb-1">E-mail Cadastrado</label>
                    <input
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      required
                      className="w-full bg-[#F8F9FA] border border-[#E4E4E7] px-3.5 py-3 rounded-xl text-xs text-[#18181B] focus:outline-none focus:border-[#18181B]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-[#71717A] block mb-1">Telefone WhatsApp</label>
                      <input
                        type="text"
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        placeholder="(11) 98888-7777"
                        className="w-full bg-[#F8F9FA] border border-[#E4E4E7] px-3.5 py-3 rounded-xl text-xs text-[#18181B] focus:outline-none focus:border-[#18181B]"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-[#71717A] block mb-1">CPF</label>
                      <input
                        type="text"
                        value={editCpf}
                        onChange={(e) => setEditCpf(e.target.value)}
                        placeholder="000.000.000-00"
                        className="w-full bg-[#F8F9FA] border border-[#E4E4E7] px-3.5 py-3 rounded-xl text-xs text-[#18181B] focus:outline-none focus:border-[#18181B]"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="bg-[#F4C400] text-[#0B0B0E] hover:bg-[#E5B500] font-extrabold text-xs uppercase px-6 py-3.5 rounded-xl transition-all shadow-xs cursor-pointer"
                  >
                    {savingProfile ? 'SALVANDO...' : 'SALVAR ALTERAÇÕES'}
                  </button>
                </form>
              </div>
            )}

            {/* TAB: SECURITY / CHANGE PASSWORD */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <h2 className="text-base font-black uppercase text-[#18181B] border-b border-[#E4E4E7] pb-4">
                  Segurança & Alteração de Senha
                </h2>

                <form onSubmit={handleChangePassword} className="space-y-4 max-w-lg">
                  <div>
                    <label className="text-[11px] font-bold text-[#71717A] block mb-1">Senha Atual</label>
                    <input
                      type="password"
                      value={currentPass}
                      onChange={(e) => setCurrentPass(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full bg-[#F8F9FA] border border-[#E4E4E7] px-3.5 py-3 rounded-xl text-xs text-[#18181B] focus:outline-none focus:border-[#18181B]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-[#71717A] block mb-1">Nova Senha (Mín. 6 caracteres)</label>
                    <input
                      type="password"
                      value={newPass}
                      onChange={(e) => setNewPass(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full bg-[#F8F9FA] border border-[#E4E4E7] px-3.5 py-3 rounded-xl text-xs text-[#18181B] focus:outline-none focus:border-[#18181B]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-[#71717A] block mb-1">Confirmar Nova Senha</label>
                    <input
                      type="password"
                      value={confirmPass}
                      onChange={(e) => setConfirmPass(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full bg-[#F8F9FA] border border-[#E4E4E7] px-3.5 py-3 rounded-xl text-xs text-[#18181B] focus:outline-none focus:border-[#18181B]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={changingPass}
                    className="bg-[#F4C400] text-[#0B0B0E] hover:bg-[#E5B500] font-extrabold text-xs uppercase px-6 py-3.5 rounded-xl transition-all shadow-xs cursor-pointer"
                  >
                    {changingPass ? 'ALTERANDO...' : 'CONFIRMAR NOVA SENHA'}
                  </button>
                </form>
              </div>
            )}

            {/* TAB: WISHLIST */}
            {activeTab === 'wishlist' && (
              <div className="space-y-6">
                <h2 className="text-base font-black uppercase text-[#18181B] border-b border-[#E4E4E7] pb-4">
                  Meus Favoritos ({(wishlist || []).length})
                </h2>

                {(!wishlist || wishlist.length === 0) ? (
                  <p className="text-xs text-[#71717A]">Sua lista de favoritos está vazia.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {(wishlist || []).map((prod) => (
                      <div
                        key={prod.id}
                        className="bg-[#F8F9FA] border border-[#E4E4E7] p-4 rounded-xl flex gap-3 items-center"
                      >
                        <img
                          src={prod.images?.[0] || prod.image || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=150&q=80'}
                          alt={prod.title}
                          className="w-16 h-20 object-cover rounded bg-[#F4F4F5] shrink-0 border border-[#E4E4E7]"
                          referrerPolicy="no-referrer"
                        />
                        <div className="flex-1 min-w-0 text-xs">
                          <p className="font-bold text-[#18181B] line-clamp-1">{prod.title}</p>
                          <p className="text-xs font-black text-[#18181B] mt-1">
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
                              className="bg-[#F4C400] text-[#0B0B0E] font-extrabold text-[10px] uppercase px-3 py-1.5 rounded hover:bg-[#E5B500] cursor-pointer"
                            >
                              Mover p/ Carrinho
                            </button>
                            <button
                              onClick={() => removeFromWishlist(prod.id)}
                              className="p-1.5 bg-white text-[#71717A] hover:text-red-500 rounded border border-[#E4E4E7] cursor-pointer"
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
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#E4E4E7] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-sm font-black uppercase text-[#18181B]">
              {editingAddressId ? 'Editar Endereço' : 'Novo Endereço de Entrega'}
            </h3>

            <form onSubmit={handleSaveAddress} className="space-y-3 text-xs">
              <div>
                <label className="text-[11px] font-bold text-[#71717A] block mb-1">Destinatário</label>
                <input
                  type="text"
                  value={addrRecipient}
                  onChange={(e) => setAddrRecipient(e.target.value)}
                  placeholder="Nome de quem recebe"
                  required
                  className="w-full bg-[#F8F9FA] border border-[#E4E4E7] px-3 py-2 rounded-xl text-[#18181B] focus:outline-none focus:border-[#18181B]"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-[#71717A] flex items-center justify-between mb-1">
                    <span>CEP</span>
                    {loadingAddrCep && <span className="text-[10px] text-[#B45309] animate-pulse">Buscando...</span>}
                  </label>
                  <input
                    type="text"
                    value={addrCep}
                    onChange={(e) => setAddrCep(formatCep(e.target.value))}
                    onBlur={handleCepLookup}
                    placeholder="00000-000"
                    maxLength={9}
                    required
                    className="w-full bg-[#F8F9FA] border border-[#E4E4E7] px-3 py-2 rounded-xl text-[#18181B] font-mono focus:outline-none focus:border-[#18181B]"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-[11px] font-bold text-[#71717A] block mb-1">Rua / Logradouro</label>
                  <input
                    type="text"
                    value={addrStreet}
                    onChange={(e) => setAddrStreet(e.target.value)}
                    placeholder="Av. Paulista"
                    required
                    className="w-full bg-[#F8F9FA] border border-[#E4E4E7] px-3 py-2 rounded-xl text-[#18181B] focus:outline-none focus:border-[#18181B]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-[#71717A] block mb-1">Número</label>
                  <input
                    type="text"
                    value={addrNumber}
                    onChange={(e) => setAddrNumber(e.target.value)}
                    placeholder="1000"
                    required
                    className="w-full bg-[#F8F9FA] border border-[#E4E4E7] px-3 py-2 rounded-xl text-[#18181B] focus:outline-none focus:border-[#18181B]"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-[11px] font-bold text-[#71717A] block mb-1">Complemento</label>
                  <input
                    type="text"
                    value={addrComplement}
                    onChange={(e) => setAddrComplement(e.target.value)}
                    placeholder="Apto 42"
                    className="w-full bg-[#F8F9FA] border border-[#E4E4E7] px-3 py-2 rounded-xl text-[#18181B] focus:outline-none focus:border-[#18181B]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-[#71717A] block mb-1">Bairro</label>
                  <input
                    type="text"
                    value={addrNeighborhood}
                    onChange={(e) => setAddrNeighborhood(e.target.value)}
                    placeholder="Bela Vista"
                    required
                    className="w-full bg-[#F8F9FA] border border-[#E4E4E7] px-3 py-2 rounded-xl text-[#18181B] focus:outline-none focus:border-[#18181B]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-[#71717A] block mb-1">Cidade</label>
                  <input
                    type="text"
                    value={addrCity}
                    onChange={(e) => setAddrCity(e.target.value)}
                    placeholder="São Paulo"
                    required
                    className="w-full bg-[#F8F9FA] border border-[#E4E4E7] px-3 py-2 rounded-xl text-[#18181B] focus:outline-none focus:border-[#18181B]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-[#71717A] block mb-1">UF</label>
                  <input
                    type="text"
                    value={addrState}
                    onChange={(e) => setAddrState(e.target.value)}
                    placeholder="SP"
                    required
                    className="w-full bg-[#F8F9FA] border border-[#E4E4E7] px-3 py-2 rounded-xl text-[#18181B] focus:outline-none focus:border-[#18181B]"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-2">
                <input
                  type="checkbox"
                  checked={addrIsDefault}
                  onChange={(e) => setAddrIsDefault(e.target.checked)}
                  className="accent-[#0B0B0E]"
                />
                <span className="text-[11px] text-[#18181B]">Definir como endereço principal</span>
              </label>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddressModalOpen(false)}
                  className="flex-1 bg-[#F8F9FA] hover:bg-[#F4F4F5] border border-[#E4E4E7] text-[#71717A] font-bold text-xs uppercase py-2.5 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#F4C400] text-[#0B0B0E] font-extrabold text-xs uppercase py-2.5 rounded-xl hover:bg-[#E5B500] cursor-pointer shadow-xs"
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
