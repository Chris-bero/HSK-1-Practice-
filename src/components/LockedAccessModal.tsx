import { useEffect, useState } from 'react';
import { Lock, RefreshCw, X } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface LockedAccessModalProps {
  isOpen: boolean;
  itemTitle: string;
  itemType?: 'chapter';
  onClose: () => void;
}

export function LockedAccessModal({
  isOpen,
  itemTitle,
  itemType,
  onClose,
}: LockedAccessModalProps) {
  const { currentStudent, refreshStudentAccess } = useApp();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshMsg, setRefreshMsg] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !currentStudent) return null;

  const handleRefreshAccess = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    setRefreshMsg('');
    try {
      const updated = await refreshStudentAccess();
      if (updated) {
        setRefreshMsg('Access permissions refreshed from your instructor’s roster.');
      } else {
        setRefreshMsg('Unable to reach the roster right now. Please try reloading shortly.');
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="locked-access-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#121110]/65 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="neo-frame w-full max-w-md max-h-[90vh] overflow-y-auto rounded-xl p-6 sm:p-7 bg-white dark:bg-[#1E1C1A] space-y-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2.5">
            <span className="w-10 h-10 rounded-lg border border-[#D97706]/35 bg-[#D97706]/10 dark:bg-[#F59E0B]/15 flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5 text-[#B45309] dark:text-[#F59E0B]" />
            </span>
            <div className="text-left">
              <p className="text-[11px] font-bold text-[#B45309] dark:text-[#F59E0B]">
                Chapter Access Activation Required
              </p>
              <h2
                id="locked-access-title"
                className="text-lg font-bold text-[#1C1917] dark:text-[#F5F2EB]"
              >
                {itemTitle}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-9 h-9 rounded-md inline-flex items-center justify-center text-[#57534E] dark:text-[#A8A29E] hover:text-[#1C1917] dark:hover:text-[#F5F2EB] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-[#57534E] dark:text-[#A8A29E] leading-relaxed">
          This chapter is not enabled on your current trial plan. Contact your instructor with your
          registered student name to unlock all 15 curriculum chapters, chapter exams, and study
          labs.
        </p>

        {/* Student account card */}
        <div className="rounded-xl border border-[#1C1917]/12 dark:border-[#F5F2EB]/12 bg-[#F9F6F0] dark:bg-[#121110] p-4">
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="text-[#57534E] dark:text-[#A8A29E]">Student Name</span>
            <strong className="text-sm text-[#1C1917] dark:text-[#F5F2EB]">
              {currentStudent.name}
            </strong>
          </div>
        </div>

        {refreshMsg && (
          <p className="text-xs font-semibold text-center text-[#15803D] dark:text-[#22C55E]">
            {refreshMsg}
          </p>
        )}

        <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-1">
          <button
            type="button"
            onClick={handleRefreshAccess}
            disabled={isRefreshing}
            className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 min-h-[44px] rounded-lg border border-[#1C1917]/15 dark:border-[#F5F2EB]/15 bg-[#F9F6F0] dark:bg-[#121110] text-xs font-bold text-[#1C1917] dark:text-[#F5F2EB] hover:border-[#B91C1C]/45 disabled:opacity-60 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Checking...' : 'Refresh Access'}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full sm:flex-1 py-2.5 px-4 min-h-[44px] rounded-lg bg-[#B91C1C] hover:bg-[#991B1B] dark:bg-[#EF4444] dark:hover:bg-[#DC2626] text-white text-sm font-bold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
