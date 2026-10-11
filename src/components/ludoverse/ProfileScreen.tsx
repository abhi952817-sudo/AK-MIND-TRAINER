import React, { useState } from 'react';
import {
  ArrowLeft,
  Camera,
  Pencil,
  Moon,
  Sun,
  Volume2,
  VolumeX,
  Bell,
  BellOff,
  LogOut,
  ChevronRight,
  UserCheck,
  Key,
} from 'lucide-react';
import { AppAvatar, SkeletonBox, ConfirmDialog, ErrorBanner } from './UIComponents';
import { User, UserProfile, ScreenStateMode, StateMode } from '../../types/ludoverse';

interface ProfileScreenProps {
  user: User | UserProfile | null;
  onBack: () => void;
  onLogout?: () => void;
  onUpdateName?: (newName: string) => void;
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
  state?: StateMode | ScreenStateMode;
  stateMode?: ScreenStateMode;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  user,
  onBack,
  onLogout = () => {},
  onUpdateName,
  isDarkMode = true,
  onToggleDarkMode = () => {},
  state,
  stateMode,
}) => {
  const effectiveState = String(state || stateMode || 'DATA').toUpperCase();
  const isLoading = effectiveState === 'LOADING';
  const isEmpty = effectiveState === 'EMPTY';
  const isError = effectiveState === 'ERROR';

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameInput, setEditNameInput] = useState(user?.name || '');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // User values adhering strictly to GOLDEN RULE
  const userName = !isEmpty && user?.name?.trim() ? user.name.trim() : null;
  const userEmail = !isEmpty && user?.email?.trim() ? user.email.trim() : null;
  const photoUrl = !isEmpty ? user?.photoUrl : null;

  // Stats row (Numbers in Poppins Bold 24sp, labels in Inter 12sp grey)
  const userStats = user && 'stats' in user ? (user as UserProfile).stats : null;
  const gamesPlayed =
    !isEmpty && userStats?.gamesPlayed !== null && userStats?.gamesPlayed !== undefined
      ? userStats.gamesPlayed
      : '-';
  const gamesWon =
    !isEmpty && userStats?.won !== null && userStats?.won !== undefined
      ? userStats.won
      : '-';
  const rank =
    !isEmpty && userStats?.rank !== null && userStats?.rank !== undefined
      ? `#${userStats.rank}`
      : '-';

  const handleSaveName = () => {
    if (editNameInput.trim()) {
      onUpdateName?.(editNameInput.trim());
    }
    setIsEditingName(false);
  };

  return (
    <div className="w-full h-full flex flex-col justify-between p-6 select-none overflow-y-auto no-scrollbar">
      {/* Logout Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showLogoutConfirm}
        title="Log Out"
        message="Are you sure you want to log out of LudoVerse?"
        confirmText="Log Out"
        cancelText="Cancel"
        onConfirm={() => {
          setShowLogoutConfirm(false);
          onLogout();
        }}
        onCancel={() => setShowLogoutConfirm(false)}
      />

      {/* Top Bar with Back Arrow */}
      <div>
        <div className="flex items-center justify-between pt-2 mb-4">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-full border border-slate-300 dark:border-slate-700 flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 transition-all"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5 text-current" />
          </button>
          <h1 className="font-heading text-lg font-semibold">Profile</h1>
          <div className="w-10" />
        </div>

        {isError && (
          <ErrorBanner
            message="Failed to sync profile changes with Firestore."
            onRetry={() => {}}
          />
        )}

        {/* Top Section (Centered) */}
        <div className="flex flex-col items-center my-4">
          {isLoading ? (
            <SkeletonBox className="w-24 h-24 !rounded-full mb-4" />
          ) : (
            <div className="flex flex-col items-center mb-3">
              {/* 96dp Avatar Circle */}
              <div className="relative">
                <AppAvatar
                  photoUrl={photoUrl}
                  name={userName}
                  size={96}
                  className="ring-4 ring-[#E63946]/20 shadow-xl"
                />
                <button
                  className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#E63946] text-white flex items-center justify-center shadow-md active:scale-90 transition-transform"
                  aria-label="Change photo"
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>

              {!photoUrl && !userName && (
                <span className="text-[12px] text-[#8D99AE] mt-2">Add photo</span>
              )}
            </div>
          )}

          {/* 16dp gap */}
          <div className="h-4" />

          {/* Name (Poppins SemiBold 20sp) */}
          {isLoading ? (
            <SkeletonBox className="h-6 w-36 mb-2" />
          ) : isEditingName ? (
            <div className="flex items-center gap-2 mb-1">
              <input
                type="text"
                value={editNameInput}
                onChange={(e) => setEditNameInput(e.target.value)}
                placeholder="Enter name"
                className="px-3 py-1.5 text-sm rounded-xl bg-black/5 dark:bg-white/10 border border-slate-400 font-medium focus:outline-none focus:border-[#E63946]"
                autoFocus
              />
              <button
                onClick={handleSaveName}
                className="text-xs font-semibold px-3 py-1.5 bg-[#E63946] text-white rounded-xl active:scale-95"
              >
                Save
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setEditNameInput(userName || '');
                  setIsEditingName(true);
                }}
                className="font-heading text-[20px] font-semibold hover:text-[#E63946] transition-colors"
              >
                {userName || (
                  <span className="text-[#8D99AE] text-base font-normal underline">
                    Set your name
                  </span>
                )}
              </button>
              {userName && (
                <button
                  onClick={() => {
                    setEditNameInput(userName);
                    setIsEditingName(true);
                  }}
                  className="text-[#8D99AE] hover:text-[#E63946]"
                  aria-label="Edit name"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          {/* Email (Inter 14sp, grey) */}
          {isLoading ? (
            <SkeletonBox className="h-4 w-44 mt-1" />
          ) : (
            <p className="text-[14px] text-[#8D99AE] mt-0.5">{userEmail || 'Not set'}</p>
          )}
        </div>

        {/* Stats Row (3 Equal Columns): Card with 16sp radius, Poppins Bold 24sp, Inter 12sp grey */}
        <div className="my-4 p-4 rounded-[16px] bg-white dark:bg-[#16213E] border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-around text-center">
          {isLoading ? (
            <>
              <SkeletonBox className="h-12 w-16" />
              <SkeletonBox className="h-12 w-16" />
              <SkeletonBox className="h-12 w-16" />
            </>
          ) : (
            <>
              <div className="flex-1">
                <span className="text-[12px] text-[#8D99AE] block">Games Played</span>
                <p className="font-heading text-[24px] font-bold text-current mt-0.5">
                  {gamesPlayed}
                </p>
              </div>

              <div className="w-[1px] h-9 bg-[#8D99AE]/20" />

              <div className="flex-1">
                <span className="text-[12px] text-[#8D99AE] block">Won</span>
                <p className="font-heading text-[24px] font-bold text-[#06D6A0] mt-0.5">
                  {gamesWon}
                </p>
              </div>

              <div className="w-[1px] h-9 bg-[#8D99AE]/20" />

              <div className="flex-1">
                <span className="text-[12px] text-[#8D99AE] block">Rank</span>
                <p className="font-heading text-[24px] font-bold text-[#F4A261] mt-0.5">
                  {rank}
                </p>
              </div>
            </>
          )}
        </div>

        {/* Settings List (Grouped): 56dp height rows, 16dp horizontal padding */}
        <div className="space-y-4 my-4">
          {/* Group 1 — Preferences */}
          <div className="rounded-[16px] bg-white dark:bg-[#16213E] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800/60 bg-black/5 dark:bg-white/5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#8D99AE]">
                Preferences
              </span>
            </div>

            {/* Dark Mode */}
            <div className="h-[56px] px-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/60">
              <div className="flex items-center gap-3">
                {isDarkMode ? (
                  <Moon className="w-5 h-5 text-[#F4A261]" />
                ) : (
                  <Sun className="w-5 h-5 text-amber-500" />
                )}
                <span className="text-xs font-semibold">Dark Mode</span>
              </div>
              <button
                onClick={onToggleDarkMode}
                className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                  isDarkMode ? 'bg-[#E63946]' : 'bg-slate-300'
                }`}
                aria-label="Toggle dark mode"
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                    isDarkMode ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Sound Toggle */}
            <div className="h-[56px] px-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/60">
              <div className="flex items-center gap-3">
                {soundEnabled ? (
                  <Volume2 className="w-5 h-5 text-[#2A9D8F]" />
                ) : (
                  <VolumeX className="w-5 h-5 text-[#8D99AE]" />
                )}
                <span className="text-xs font-semibold">Sound</span>
              </div>
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                  soundEnabled ? 'bg-[#2A9D8F]' : 'bg-slate-300'
                }`}
                aria-label="Toggle sound"
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                    soundEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Notifications Toggle */}
            <div className="h-[56px] px-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {notificationsEnabled ? (
                  <Bell className="w-5 h-5 text-[#457B9D]" />
                ) : (
                  <BellOff className="w-5 h-5 text-[#8D99AE]" />
                )}
                <span className="text-xs font-semibold">Notifications</span>
              </div>
              <button
                onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                  notificationsEnabled ? 'bg-[#457B9D]' : 'bg-slate-300'
                }`}
                aria-label="Toggle notifications"
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                    notificationsEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Group 2 — Account */}
          <div className="rounded-[16px] bg-white dark:bg-[#16213E] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800/60 bg-black/5 dark:bg-white/5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#8D99AE]">
                Account
              </span>
            </div>

            {/* Edit Profile */}
            <button
              onClick={() => setIsEditingName(true)}
              className="w-full h-[56px] px-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/60 hover:bg-black/5 dark:hover:bg-white/5 active:scale-[0.99] transition-all text-left"
            >
              <div className="flex items-center gap-3">
                <UserCheck className="w-5 h-5 text-[#8D99AE]" />
                <span className="text-xs font-semibold">Edit Profile</span>
              </div>
              <ChevronRight className="w-4 h-4 text-[#8D99AE]" />
            </button>

            {/* Change Password */}
            <div className="h-[56px] px-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/60 hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer text-left">
              <div className="flex items-center gap-3">
                <Key className="w-5 h-5 text-[#8D99AE]" />
                <span className="text-xs font-semibold">Change Password</span>
              </div>
              <ChevronRight className="w-4 h-4 text-[#8D99AE]" />
            </div>

            {/* Logout (Red text, no arrow) */}
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="w-full h-[56px] px-4 flex items-center justify-between hover:bg-red-500/10 active:scale-[0.99] transition-all text-left text-[#EF476F]"
            >
              <div className="flex items-center gap-3">
                <LogOut className="w-5 h-5 text-[#EF476F]" />
                <span className="text-xs font-bold">Logout</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
