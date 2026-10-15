import React, { useState, useEffect } from 'react';
import { Mail, Lock, ArrowLeft } from 'lucide-react';
import { Button, TextField, ErrorBanner } from './UIComponents';
import { ScreenStateMode } from '../../types/ludoverse';
import { auth, signInWithEmailAndPassword } from '../../services/firebaseAuth';

interface LoginScreenProps {
  onSignIn?: (email: string) => void;
  onLogin?: () => void;
  onNavigateToSignUp?: () => void;
  onSignup?: () => void;
  onNavigateToForgotPassword?: () => void;
  onForgot?: () => void;
  onBack?: () => void;
  canGoBack?: boolean;
  stateMode?: ScreenStateMode;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onSignIn,
  onLogin,
  onNavigateToSignUp,
  onSignup,
  onNavigateToForgotPassword,
  onForgot,
  onBack,
  canGoBack = false,
  stateMode = 'EMPTY',
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [touched, setTouched] = useState<{ email?: boolean; password?: boolean }>({});
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Synchronize with external state mode for UI review
  useEffect(() => {
    if (stateMode === 'DATA') {
      setEmail('user@domain.com');
      setPassword('SecretPassword123');
      setErrors({});
      setAuthError(null);
      setIsSubmitting(false);
    } else if (stateMode === 'EMPTY') {
      setEmail('');
      setPassword('');
      setErrors({});
      setAuthError(null);
      setIsSubmitting(false);
    } else if (stateMode === 'LOADING') {
      setIsSubmitting(true);
      setAuthError(null);
    } else if (stateMode === 'ERROR') {
      setEmail('wrong@domain.com');
      setPassword('badpass');
      setAuthError('Invalid credentials. Please verify your email and password.');
      setIsSubmitting(false);
    }
  }, [stateMode]);

  // Auto-dismiss auth error after 5s
  useEffect(() => {
    if (authError) {
      const timer = setTimeout(() => {
        setAuthError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [authError]);

  const validateEmail = (val: string) => {
    if (!val.trim()) return 'Email is required';
    const rfc5322 = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
    if (!rfc5322.test(val.trim())) return 'Enter a valid email';
    return undefined;
  };

  const validatePassword = (val: string) => {
    if (!val) return 'Password must be at least 6 characters';
    if (val.length < 6) return 'Password must be at least 6 characters';
    return undefined;
  };

  const handleBlurEmail = () => {
    setTouched((prev) => ({ ...prev, email: true }));
    const err = validateEmail(email);
    setErrors((prev) => ({ ...prev, email: err }));
  };

  const handleBlurPassword = () => {
    setTouched((prev) => ({ ...prev, password: true }));
    const err = validatePassword(password);
    setErrors((prev) => ({ ...prev, password: err }));
  };

  const isFormValid =
    email.trim().length > 0 &&
    password.length >= 6 &&
    !validateEmail(email) &&
    !validatePassword(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailErr = validateEmail(email);
    const passErr = validatePassword(password);
    setErrors({ email: emailErr, password: passErr });
    setTouched({ email: true, password: true });

    if (!emailErr && !passErr) {
      setIsSubmitting(true);
      setAuthError(null);
      try {
        await signInWithEmailAndPassword(auth, email.trim(), password);
        setIsSubmitting(false);
        if (onLogin) onLogin();
        if (onSignIn) onSignIn(email);
      } catch (err: any) {
        setIsSubmitting(false);
        setAuthError(err.message || 'Failed to sign in. Please check your credentials.');
      }
    } else {
      setAuthError('Please resolve the errors below.');
    }
  };

  return (
    <div className="w-full h-full flex flex-col justify-between p-6 select-none overflow-y-auto no-scrollbar pt-4">
      <div>
        {/* Top-left Back button (if applicable) */}
        {canGoBack && (
          <div className="mb-4">
            <button
              onClick={onBack}
              className="w-10 h-10 rounded-full border border-slate-300 dark:border-slate-700 flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 transition-all"
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5 text-current" />
            </button>
          </div>
        )}

        {/* Small logo (48dp) top-left with "AK MIND TRAINER" wordmark beside it */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-white/20 shadow-md p-2 flex flex-col justify-between items-center">
            <div className="flex justify-between w-full">
              <div className="w-2.5 h-2.5 rounded-full bg-[#E63946]" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#2A9D8F]" />
            </div>
            <div className="flex justify-between w-full">
              <div className="w-2.5 h-2.5 rounded-full bg-[#457B9D]" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#F4A261]" />
            </div>
          </div>
          <span className="font-heading text-xl font-bold tracking-wide">AK MIND TRAINER</span>
        </div>

        {/* 40dp gap */}
        <div className="h-10" />

        {/* "Welcome Back" (Poppins SemiBold 24sp) */}
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Welcome Back</h1>

        {/* 8dp gap */}
        <div className="h-2" />

        {/* "Sign in to continue" (Inter 14sp, #8D99AE) */}
        <p className="text-[14px] text-[#8D99AE] font-normal">Sign in to continue</p>

        {/* 32dp gap */}
        <div className="h-8" />

        {/* ERROR STATE: Animated slide-down red banner */}
        {authError && (
          <ErrorBanner
            message={authError}
            onDismiss={() => setAuthError(null)}
          />
        )}

        {/* Form Fields */}
        <form onSubmit={handleSubmit} className="w-full flex flex-col">
          {/* Email Field */}
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (touched.email) {
                setErrors((prev) => ({ ...prev, email: validateEmail(e.target.value) }));
              }
            }}
            onBlur={handleBlurEmail}
            error={touched.email ? errors.email : undefined}
            isValid={touched.email && !errors.email}
            leftIcon={<Mail className="w-5 h-5" />}
            disabled={isSubmitting}
          />

          {/* Password Field */}
          <TextField
            label="Password"
            isPassword
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (touched.password) {
                setErrors((prev) => ({ ...prev, password: validatePassword(e.target.value) }));
              }
            }}
            onBlur={handleBlurPassword}
            error={touched.password ? errors.password : undefined}
            isValid={touched.password && !errors.password}
            leftIcon={<Lock className="w-5 h-5" />}
            disabled={isSubmitting}
          />

          {/* "Forgot Password?" link: right-aligned, 12sp below password */}
          <div className="flex justify-end -mt-1 mb-6">
            <button
              type="button"
              onClick={() => {
                if (onForgot) onForgot();
                else if (onNavigateToForgotPassword) onNavigateToForgotPassword();
              }}
              disabled={isSubmitting}
              className="text-[14px] font-semibold text-[#E63946] hover:underline"
            >
              Forgot Password?
            </button>
          </div>

          {/* Sign In Button: full width, 52dp, disabled when invalid, press scale down 0.97 */}
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            disabled={!isFormValid}
            className="w-full h-[52px]"
          >
            Sign In
          </Button>

          {/* Divider: 24dp gap, Line — "or continue with" — Line */}
          <div className="flex items-center my-6">
            <div className="flex-1 h-[1px] bg-[#8D99AE]/30" />
            <span className="px-3 text-xs text-[#8D99AE] font-medium">or continue with</span>
            <div className="flex-1 h-[1px] bg-[#8D99AE]/30" />
          </div>

          {/* Google Button */}
          <button
            type="button"
            onClick={() => {
              onLogin?.();
              onSignIn?.('google.user@domain.com');
            }}
            disabled={isSubmitting}
            className="h-[52px] w-full rounded-[24px] bg-white dark:bg-[#16213E] border border-[#8D99AE]/30 text-current font-semibold text-sm flex items-center justify-center gap-3 shadow-sm hover:opacity-90 active:scale-[0.97] transition-all duration-100 disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            Continue with Google
          </button>
        </form>
      </div>

      {/* Bottom: 32dp gap, Center: "Don't have an account? " + "Sign Up" */}
      <div className="text-center pt-8 pb-2">
        <span className="text-xs text-[#8D99AE]">Don&apos;t have an account? </span>
        <button
          type="button"
          onClick={() => {
            if (onSignup) onSignup();
            else if (onNavigateToSignUp) onNavigateToSignUp();
          }}
          disabled={isSubmitting}
          className="text-xs font-bold text-[#E63946] hover:underline"
        >
          Sign Up
        </button>
      </div>
    </div>
  );
};
