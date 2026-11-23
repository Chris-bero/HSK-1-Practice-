import React, { useState } from 'react';
import { AlertCircle, KeyRound, Loader2, Moon, Sun, User } from 'lucide-react';
import { motion } from 'motion/react';
import { useApp } from '../context/AppContext';
import { getConfiguredSheetsUrl, verifyStudentFromSheet } from '../services/sheetsSync';

const LOGIN_SCROLL_ART = '/src/assets/images/neo_chinese_login_scroll_1795181947033.jpg';

export function LoginGate() {
  const { login, theme, toggleTheme } = useApp();
  const [nameInput, setNameInput] = useState('');
  const [codeInput, setCodeInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isVerifying) return;
    setErrorMsg('');

    const cleanedName = nameInput.trim().replace(/\s+/g, ' ');
    const cleanedCode = codeInput.trim();

    if (!cleanedName || !cleanedCode) {
      setErrorMsg('Please enter both your student name and access code.');
      return;
    }

    setIsVerifying(true);
    try {
      const configuredUrl = getConfiguredSheetsUrl();
      const verification = await verifyStudentFromSheet(cleanedName, cleanedCode);

      if (verification.status === 'device_locked') {
        setErrorMsg(verification.message);
        return;
      }

      if (verification.status !== 'ok') {
        if (!configuredUrl) {
          setErrorMsg(
            'The portal is not yet connected to a Google Sheets backend. Ask your instructor to configure the sync URL first.'
          );
          return;
        }
        setErrorMsg(
          'Unable to verify your credentials. Please check that your name and access code match your instructor’s roster.'
        );
        return;
      }

      const success = login(
        verification.student.name,
        verification.student.code,
        verification.student
      );
      if (!success) {
        setErrorMsg(
          'Unable to verify your credentials. Please check that your name and access code match your instructor’s roster.'
        );
      }
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen paper-lattice bg-[#F9F6F0] dark:bg-[#121110] text-[#1C1917] dark:text-[#F5F2EB] flex flex-col">
      {/* Minimal top header with theme toggle */}
      <div className="mx-auto w-full max-w-6xl px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="cinnabar-seal font-hanzi w-9 h-9 flex items-center justify-center text-base font-bold rounded-[3px]"
          >
            汉
          </span>
          <span className="text-base sm:text-lg font-bold">
            HSK 3.0 Level 1 Practice Portal
          </span>
        </div>

        <button
          type="button"
          onClick={toggleTheme}
          aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
          className="inline-flex items-center gap-2 px-3.5 py-2 min-h-[40px] rounded-md border border-[#1C1917]/15 dark:border-[#F5F2EB]/15 bg-white dark:bg-[#1E1C1A] text-xs font-semibold hover:border-[#B91C1C]/40 dark:hover:border-[#EF4444]/40 transition-colors"
        >
          {theme === 'light' ? (
            <>
              <Moon className="w-4 h-4" />
              <span>Ink Dark</span>
            </>
          ) : (
            <>
              <Sun className="w-4 h-4 text-[#F59E0B]" />
              <span>Rice Paper</span>
            </>
          )}
        </button>
      </div>

      {/* Split Login Card */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 pb-12 pt-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="neo-frame w-full max-w-4xl rounded-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 items-stretch shadow-sm"
        >
          {/* Form Column */}
          <div className="lg:col-span-7 p-7 sm:p-10 flex flex-col justify-between bg-white dark:bg-[#1E1C1A]">
            <div>
              <div className="flex items-center gap-2 text-xs text-[#57534E] dark:text-[#A8A29E] mb-3">
                <span>Foundational Curriculum</span>
                <span aria-hidden="true">·</span>
                <span>HSK 3.0</span>
                <span aria-hidden="true">·</span>
                <span>15 Chapters</span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold text-[#1C1917] dark:text-[#F5F2EB] leading-snug mb-2">
                Student Sign In
              </h1>
              <p className="text-sm text-[#57534E] dark:text-[#A8A29E] leading-relaxed mb-8">
                Enter your registered name and personal access code to continue training and sync
                your study analytics.
              </p>

              <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                <div>
                  <label
                    htmlFor="student-name"
                    className="block text-sm font-semibold text-[#1C1917] dark:text-[#F5F2EB] mb-2"
                  >
                    Student Name
                  </label>
                  <div className="relative">
                    <User
                      aria-hidden="true"
                      className="w-4 h-4 text-[#57534E] dark:text-[#A8A29E] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                    />
                    <input
                      id="student-name"
                      type="text"
                      value={nameInput}
                      disabled={isVerifying}
                      onChange={(e) => setNameInput(e.target.value)}
                      placeholder="e.g., Alex Morgan"
                      autoComplete="username"
                      className="w-full pl-10 pr-4 py-3 rounded-lg border border-[#1C1917]/15 dark:border-[#F5F2EB]/15 bg-[#F9F6F0]/60 dark:bg-[#121110] text-[#1C1917] dark:text-[#F5F2EB] placeholder:text-[#57534E]/60 dark:placeholder:text-[#A8A29E]/50 text-sm focus:outline-none focus:border-[#B91C1C] dark:focus:border-[#EF4444] focus:ring-2 focus:ring-[#B91C1C]/15 dark:focus:ring-[#EF4444]/20 transition-colors disabled:opacity-60"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="student-code"
                    className="block text-sm font-semibold text-[#1C1917] dark:text-[#F5F2EB] mb-2"
                  >
                    Access Code
                  </label>
                  <div className="relative">
                    <KeyRound
                      aria-hidden="true"
                      className="w-4 h-4 text-[#57534E] dark:text-[#A8A29E] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                    />
                    <input
                      id="student-code"
                      type="password"
                      value={codeInput}
                      disabled={isVerifying}
                      onChange={(e) => setCodeInput(e.target.value)}
                      placeholder="Enter your assigned access code"
                      autoComplete="current-password"
                      className="w-full pl-10 pr-4 py-3 rounded-lg border border-[#1C1917]/15 dark:border-[#F5F2EB]/15 bg-[#F9F6F0]/60 dark:bg-[#121110] text-[#1C1917] dark:text-[#F5F2EB] placeholder:text-[#57534E]/60 dark:placeholder:text-[#A8A29E]/50 text-sm tabular-nums focus:outline-none focus:border-[#B91C1C] dark:focus:border-[#EF4444] focus:ring-2 focus:ring-[#B91C1C]/15 dark:focus:ring-[#EF4444]/20 transition-colors disabled:opacity-60"
                    />
                  </div>
                </div>

                {errorMsg && (
                  <div
                    role="alert"
                    className="flex items-start gap-2.5 p-3.5 rounded-lg border border-[#B91C1C]/30 dark:border-[#EF4444]/35 bg-[#B91C1C]/8 dark:bg-[#EF4444]/12 text-[#B91C1C] dark:text-[#EF4444] text-sm"
                  >
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isVerifying}
                  className="w-full py-3 px-6 min-h-[46px] rounded-lg bg-[#B91C1C] hover:bg-[#991B1B] dark:bg-[#EF4444] dark:hover:bg-[#DC2626] text-white font-bold text-sm inline-flex items-center justify-center gap-2 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#B91C1C] dark:focus-visible:ring-[#EF4444] disabled:opacity-70 disabled:cursor-wait"
                >
                  {isVerifying ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Verifying credentials...</span>
                    </>
                  ) : (
                    <span>Enter Practice Portal</span>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Ink Scroll Artwork Column */}
          <div className="lg:col-span-5 relative min-h-[240px] lg:min-h-full bg-[#F2ECE1] dark:bg-[#181614] border-t lg:border-t-0 lg:border-l border-[#1C1917]/10 dark:border-[#F5F2EB]/10 overflow-hidden">
            {!imageError ? (
              <img
                src={LOGIN_SCROLL_ART}
                alt="Traditional Chinese ink wash illustration of bamboo and plum blossoms"
                referrerPolicy="no-referrer"
                onError={() => setImageError(true)}
                className="w-full h-full object-cover dark:opacity-80"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center">
                <div className="cinnabar-seal font-hanzi w-20 h-20 flex items-center justify-center text-4xl font-bold rounded-sm mb-4">
                  学
                </div>
                <p className="font-hanzi text-2xl text-[#1C1917] dark:text-[#F5F2EB]">
                  学而时习之
                </p>
              </div>
            )}

            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#121110]/85 via-[#121110]/45 to-transparent p-6 text-[#F5F2EB]">
              <p className="font-hanzi text-xl tracking-wide mb-1">千里之行，始于足下</p>
              <p className="text-xs text-[#F5F2EB]/85 leading-relaxed">
                A journey of a thousand miles begins with a single step — structured daily practice
                for HSK Level 1 mastery.
              </p>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
