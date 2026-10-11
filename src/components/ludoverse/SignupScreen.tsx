import React, { useState, useEffect } from 'react';
import { ArrowLeft, User, Mail, Lock } from 'lucide-react';
import { Button, TextField, ErrorBanner } from './UIComponents';
import { ScreenStateMode } from '../../types/ludoverse';

interface SignupScreenProps {
  onSignUp?: (name: string, email: string) => void;
  onSignup?: () => void;
  onNavigateToSignIn?: () => void;
  onBack?: () => void;
  onOpenTerms?: () => void;
  onTerms?: () => void;
  stateMode?: ScreenStateMode;
}

export const SignupScreen: React.FC<SignupScreenProps> = ({
  onSignUp,
  onSignup,
  onNavigateToSignIn,
  onBack,
  onOpenTerms,
  onTerms,
  stateMode = 'EMPTY',
}) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (stateMode === 'DATA') {
      setFullName('Devin Vance');
      setEmail('devin.vance@company.com');
      setPassword('StrongPass1');
      setConfirmPassword('StrongPass1');
      setAgreeTerms(true);
      setErrors({});
      setAuthError(null);
      setIsSubmitting(false);
    } else if (stateMode === 'EMPTY') {
      setFullName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setAgreeTerms(false);
      setErrors({});
      setAuthError(null);
      setIsSubmitting(false);
    } else if (stateMode === 'LOADING') {
      setIsSubmitting(true);
      setAuthError(null);
    } else if (stateMode === 'ERROR') {
      setAuthError('An account with this email already exists.');
      setIsSubmitting(false);
    }
  }, [stateMode]);

  // Validation functions
  const validateName = (val: string) => {
    if (!val.trim()) return 'Enter your full name';
    if (val.trim().length < 2) return 'Enter your full name';
    if (!/^[a-zA-Z\s-]+$/.test(val.trim())) return 'Only letters, spaces, hyphens allowed';
    return '';
  };

  const validateEmail = (val: string) => {
    if (!val.trim()) return 'Email is required';
    const rfc5322 = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
    if (!rfc5322.test(val.trim())) return 'Enter a valid email';
    return '';
  };

  const validatePassword = (val: string) => {
    if (!val) return 'Password is required';
    if (val.length < 6) return 'Must be at least 6 characters';
    if (!/[A-Za-z]/.test(val) || !/[0-9]/.test(val)) return 'Password too weak (needs 1 letter & 1 number)';
    return '';
  };

  const validateConfirm = (val: string, pass: string) => {
    if (!val) return 'Confirm your password';
    if (val !== pass) return 'Passwords do not match';
    return '';
  };

  // Password strength calculation
  const getPasswordStrength = (pass: string): { label: string; width: string; color: string } => {
    if (!pass) return { label: '', width: '0%', color: 'bg-transparent' };
    if (pass.length < 6) return { label: 'Weak', width: '33%', color: 'bg-[#EF476F]' };
    const hasLetter = /[A-Za-z]/.test(pass);
    const hasNum = /[0-9]/.test(pass);
    const hasSpecial = /[^A-Za-z0-9]/.test(pass);

    if (pass.length >= 8 && hasLetter && hasNum && hasSpecial) {
      return { label: 'Strong', width: '100%', color: 'bg-[#06D6A0]' };
    }
    if (hasLetter && hasNum) {
      return { label: 'Medium', width: '66%', color: 'bg-[#F4A261]' };
    }
    return { label: 'Weak', width: '33%', color: 'bg-[#EF476F]' };
  };

  const strength = getPasswordStrength(password);

  const isFormValid =
    fullName.trim().length >= 2 &&
    !validateName(fullName) &&
    !validateEmail(email) &&
    !validatePassword(password) &&
    confirmPassword === password &&
    agreeTerms;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nameErr = validateName(fullName);
    const emailErr = validateEmail(email);
    const passErr = validatePassword(password);
    const confErr = validateConfirm(confirmPassword, password);

    setErrors({
      fullName: nameErr,
      email: emailErr,
      password: passErr,
      confirmPassword: confErr,
      terms: !agreeTerms ? 'You must agree to the Terms & Privacy' : '',
    });

    setTouched({ fullName: true, email: true, password: true, confirmPassword: true, terms: true });

    if (!nameErr && !emailErr && !passErr && !confErr && agreeTerms) {
      setIsSubmitting(true);
      setAuthError(null);
      setTimeout(() => {
        setIsSubmitting(false);
        if (onSignup) onSignup();
        if (onSignUp) onSignUp(fullName, email);
      }, 1000);
    }
  };

  return (
    <div className="w-full h-full flex flex-col justify-between p-6 select-none overflow-y-auto no-scrollbar pt-4">
      <div>
        {/* Top-left Back button */}
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={onBack || onNavigateToSignIn}
            className="w-10 h-10 rounded-full border border-slate-300 dark:border-slate-700 flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 transition-all"
            aria-label="Back to sign in"
          >
            <ArrowLeft className="w-5 h-5 text-current" />
          </button>
          <h1 className="font-heading text-xl font-semibold">Create Account</h1>
        </div>

        <p className="text-[14px] text-[#8D99AE] ml-1 mb-6">
          Sign up to play AK MIND TRAINER with friends worldwide
        </p>

        {/* Error Banner */}
        {authError && (
          <ErrorBanner message={authError} onDismiss={() => setAuthError(null)} />
        )}

        {/* Form Fields in exact required order */}
        <form onSubmit={handleSubmit} className="w-full flex flex-col">
          {/* 1. Full Name */}
          <TextField
            label="Full Name"
            value={fullName}
            onChange={(e) => {
              setFullName(e.target.value);
              if (touched.fullName) setErrors((prev) => ({ ...prev, fullName: validateName(e.target.value) }));
            }}
            onBlur={() => {
              setTouched((prev) => ({ ...prev, fullName: true }));
              setErrors((prev) => ({ ...prev, fullName: validateName(fullName) }));
            }}
            error={touched.fullName ? errors.fullName : undefined}
            isValid={touched.fullName && !errors.fullName && fullName.length >= 2}
            leftIcon={<User className="w-5 h-5" />}
            disabled={isSubmitting}
          />

          {/* 2. Email */}
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (touched.email) setErrors((prev) => ({ ...prev, email: validateEmail(e.target.value) }));
            }}
            onBlur={() => {
              setTouched((prev) => ({ ...prev, email: true }));
              setErrors((prev) => ({ ...prev, email: validateEmail(email) }));
            }}
            error={touched.email ? errors.email : undefined}
            isValid={touched.email && !errors.email && email.length > 0}
            leftIcon={<Mail className="w-5 h-5" />}
            disabled={isSubmitting}
          />

          {/* 3. Password */}
          <TextField
            label="Password"
            isPassword
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (touched.password) setErrors((prev) => ({ ...prev, password: validatePassword(e.target.value) }));
            }}
            onBlur={() => {
              setTouched((prev) => ({ ...prev, password: true }));
              setErrors((prev) => ({ ...prev, password: validatePassword(password) }));
            }}
            error={touched.password ? errors.password : undefined}
            isValid={touched.password && !errors.password && password.length >= 6}
            leftIcon={<Lock className="w-5 h-5" />}
            disabled={isSubmitting}
          />

          {/* Password strength bar */}
          {password && (
            <div className="-mt-2 mb-4 px-1">
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="text-[#8D99AE]">Password Strength:</span>
                <span className="font-bold">{strength.label}</span>
              </div>
              <div className="w-full h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full ${strength.color} transition-all duration-300`}
                  style={{ width: strength.width }}
                />
              </div>
            </div>
          )}

          {/* 4. Confirm Password */}
          <TextField
            label="Confirm Password"
            isPassword
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              if (touched.confirmPassword) {
                setErrors((prev) => ({ ...prev, confirmPassword: validateConfirm(e.target.value, password) }));
              }
            }}
            onBlur={() => {
              setTouched((prev) => ({ ...prev, confirmPassword: true }));
              setErrors((prev) => ({ ...prev, confirmPassword: validateConfirm(confirmPassword, password) }));
            }}
            error={touched.confirmPassword ? errors.confirmPassword : undefined}
            isValid={touched.confirmPassword && !errors.confirmPassword && confirmPassword.length >= 6}
            leftIcon={<Lock className="w-5 h-5" />}
            disabled={isSubmitting}
          />

          {/* Terms checkbox */}
          <div className="flex items-start gap-2.5 my-2">
            <input
              type="checkbox"
              id="termsCheckbox"
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              disabled={isSubmitting}
              className="w-4 h-4 mt-0.5 rounded border-slate-300 dark:border-slate-700 text-[#E63946] focus:ring-[#E63946]"
            />
            <label htmlFor="termsCheckbox" className="text-xs text-[#8D99AE] cursor-pointer leading-normal">
              I agree to{' '}
              <button
                type="button"
                onClick={onTerms || onOpenTerms}
                className="text-[#E63946] font-semibold underline hover:text-[#d62839]"
              >
                Terms & Privacy
              </button>
            </label>
          </div>
          {touched.terms && errors.terms && (
            <span className="text-xs text-[#EF476F] mb-3 ml-1">{errors.terms}</span>
          )}

          {/* Create Account button */}
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            disabled={!isFormValid}
            className="mt-2 w-full h-[52px]"
          >
            Create Account
          </Button>

          {/* Divider */}
          <div className="flex items-center my-4">
            <div className="flex-1 h-[1px] bg-[#8D99AE]/30" />
            <span className="px-3 text-xs text-[#8D99AE] font-medium">or continue with</span>
            <div className="flex-1 h-[1px] bg-[#8D99AE]/30" />
          </div>

          {/* Google Sign-Up button */}
          <button
            type="button"
            onClick={() => {
              onSignup?.();
              onSignUp?.('Google Gamer', 'google.gamer@domain.com');
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

      {/* Bottom link: Already have an account? Sign In */}
      <div className="text-center pt-6 pb-2">
        <span className="text-xs text-[#8D99AE]">Already have an account? </span>
        <button
          type="button"
          onClick={onBack || onNavigateToSignIn}
          disabled={isSubmitting}
          className="text-xs font-bold text-[#E63946] hover:underline"
        >
          Sign In
        </button>
      </div>
    </div>
  );
};
