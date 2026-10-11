import React, { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle2, Mail } from 'lucide-react';
import { Button, TextField, ErrorBanner } from './UIComponents';
import { ScreenStateMode } from '../../types/ludoverse';

interface ForgotPasswordScreenProps {
  onNavigateToLogin?: () => void;
  onBack?: () => void;
  stateMode?: ScreenStateMode;
}

export const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({
  onNavigateToLogin,
  onBack,
  stateMode = 'EMPTY',
}) => {
  const handleBack = onBack || onNavigateToLogin || (() => {});
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  useEffect(() => {
    if (stateMode === 'DATA') {
      setEmail('user@domain.com');
      setError(null);
      setGeneralError(null);
      setIsSuccess(true);
      setIsSubmitting(false);
    } else if (stateMode === 'EMPTY') {
      setEmail('');
      setError(null);
      setGeneralError(null);
      setIsSuccess(false);
      setIsSubmitting(false);
    } else if (stateMode === 'LOADING') {
      setIsSubmitting(true);
      setIsSuccess(false);
      setGeneralError(null);
    } else if (stateMode === 'ERROR') {
      setEmail('unknown@domain.com');
      setIsSuccess(false);
      setGeneralError('Email address not found in system. Please register first.');
      setIsSubmitting(false);
    }
  }, [stateMode]);

  const validateEmail = (val: string) => {
    if (!val.trim()) return 'Email is required';
    const rfc5322 = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
    if (!rfc5322.test(val.trim())) return 'Enter a valid email';
    return null;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const err = validateEmail(email);
    setError(err);
    setTouched(true);

    if (!err) {
      setIsSubmitting(true);
      setGeneralError(null);
      setTimeout(() => {
        setIsSubmitting(false);
        setIsSuccess(true);
      }, 1000);
    }
  };

  return (
    <div className="w-full h-full flex flex-col justify-between p-6 select-none overflow-y-auto no-scrollbar pt-4">
      {/* Top Header */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={handleBack}
            className="w-10 h-10 rounded-full border border-slate-300 dark:border-slate-700 flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 transition-all"
            aria-label="Back to sign in"
          >
            <ArrowLeft className="w-5 h-5 text-current" />
          </button>
          <h1 className="font-heading text-xl font-semibold">Reset Password</h1>
        </div>
        <p className="text-[14px] text-[#8D99AE] ml-1">
          Enter your email — we&apos;ll send a reset link.
        </p>
      </div>

      {/* Main Body */}
      <div className="my-8 w-full">
        {generalError && (
          <ErrorBanner message={generalError} onDismiss={() => setGeneralError(null)} />
        )}

        {isSuccess ? (
          <div className="p-8 rounded-3xl bg-white dark:bg-[#16213E] border border-slate-200 dark:border-slate-800 shadow-xl flex flex-col items-center text-center animate-in zoom-in-90 duration-300">
            {/* Green checkmark circle (80dp) */}
            <div className="w-20 h-20 rounded-full bg-[#06D6A0]/15 border-2 border-[#06D6A0] flex items-center justify-center text-[#06D6A0] mb-4 shadow-lg shadow-emerald-500/20 animate-in zoom-in-75 duration-300">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <h3 className="font-heading font-bold text-xl text-current mb-1">Email Sent</h3>
            <p className="text-xs text-[#8D99AE] mb-3">
              We dispatched instructions to:
            </p>
            <span className="font-mono text-sm font-semibold text-[#E63946] px-3 py-1 rounded-lg bg-black/5 dark:bg-white/5 border border-slate-300 dark:border-slate-700 mb-6">
              {email || 'user@domain.com'}
            </span>

            <Button variant="primary" onClick={handleBack} className="w-full !h-[52px]">
              Back to Login
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="w-full flex flex-col">
            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (touched) setError(validateEmail(e.target.value));
              }}
              onBlur={() => {
                setTouched(true);
                setError(validateEmail(email));
              }}
              error={touched ? error : undefined}
              isValid={touched && !error && email.length > 0}
              leftIcon={<Mail className="w-5 h-5" />}
              disabled={isSubmitting}
            />

            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              disabled={!email || !!validateEmail(email)}
              className="mt-4 w-full h-[52px]"
            >
              Send Reset Link
            </Button>
          </form>
        )}
      </div>

      {/* Bottom link: Back to Login */}
      <div className="text-center pb-2">
        <button
          type="button"
          onClick={onNavigateToLogin}
          className="text-xs font-bold text-[#E63946] hover:underline"
        >
          ← Back to Login
        </button>
      </div>
    </div>
  );
};
