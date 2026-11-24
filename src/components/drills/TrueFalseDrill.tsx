import { CheckCircle2, XCircle } from 'lucide-react';
import { DrillQuestion, QuizMode } from '../../types';
import { SpeakChineseButton } from './SpeakChineseButton';

interface TrueFalseDrillProps {
  question: DrillQuestion;
  mode: QuizMode;
  showPinyin: boolean;
  selectedOptionId?: string;
  isLocked: boolean;
  onSelectOption: (optionId: string, label: string, isCorrect: boolean) => void;
}

export function TrueFalseDrill({
  question,
  mode,
  showPinyin,
  selectedOptionId,
  isLocked,
  onSelectOption,
}: TrueFalseDrillProps) {
  const showFeedback = mode === 'practice' && isLocked;
  const isStatementTrue = Boolean(question.isStatementTrue);
  const isCorrectSelected = selectedOptionId === question.correctOptionId;

  const choices = [
    {
      id: 'true',
      label: 'TRUE',
      subtitle: 'Grammatically & semantically correct',
    },
    {
      id: 'false',
      label: 'FALSE',
      subtitle: 'Contains a grammar or usage mistake',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Chinese sentence prompt card */}
      <div className="neo-frame rounded-xl py-9 px-6 text-center space-y-4 bg-white dark:bg-[#1E1C1A]">
        <p className="text-xs font-semibold text-[#57534E] dark:text-[#A8A29E]">
          Decide whether the Chinese sentence is grammatically and semantically correct
        </p>

        <div className="space-y-2.5">
          <p
            dir="ltr"
            className="font-hanzi text-2xl sm:text-4xl font-bold text-[#1C1917] dark:text-[#F5F2EB] leading-relaxed"
          >
            {question.promptPrimary}
          </p>

          {showPinyin && question.promptPinyin && (
            <p className="font-pinyin text-sm sm:text-base font-medium text-[#D97706] dark:text-[#F59E0B]">
              {question.promptPinyin}
            </p>
          )}
        </div>

        <div className="pt-1 flex justify-center">
          <SpeakChineseButton text={question.promptPrimary} compact />
        </div>
      </div>

      {/* Two large TRUE / FALSE selection cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {choices.map((choice) => {
          const isSelected = selectedOptionId === choice.id;
          const isCorrectOption = choice.id === question.correctOptionId;
          const isTrueBtn = choice.id === 'true';

          let cardClass =
            'border-[#1C1917]/12 dark:border-[#F5F2EB]/12 bg-white dark:bg-[#1E1C1A] hover:border-[#B91C1C]/45 dark:hover:border-[#EF4444]/45 text-[#1C1917] dark:text-[#F5F2EB]';

          if (showFeedback) {
            if (isCorrectOption) {
              cardClass =
                'border-[#15803D] dark:border-[#22C55E] bg-[#15803D]/10 dark:bg-[#22C55E]/15 text-[#15803D] dark:text-[#22C55E]';
            } else if (isSelected && !isCorrectOption) {
              cardClass =
                'border-[#B91C1C] dark:border-[#EF4444] bg-[#B91C1C]/10 dark:bg-[#EF4444]/15 text-[#B91C1C] dark:text-[#EF4444]';
            } else {
              cardClass =
                'border-[#1C1917]/8 dark:border-[#F5F2EB]/8 bg-[#F9F6F0]/50 dark:bg-[#181614] opacity-55 text-[#57534E] dark:text-[#A8A29E]';
            }
          } else if (isSelected) {
            cardClass = isTrueBtn
              ? 'border-[#15803D] dark:border-[#22C55E] bg-[#15803D]/8 dark:bg-[#22C55E]/14 text-[#15803D] dark:text-[#22C55E] ring-1 ring-[#15803D]/30'
              : 'border-[#B91C1C] dark:border-[#EF4444] bg-[#B91C1C]/8 dark:bg-[#EF4444]/14 text-[#B91C1C] dark:text-[#EF4444] ring-1 ring-[#B91C1C]/30';
          }

          return (
            <button
              key={choice.id}
              type="button"
              disabled={showFeedback}
              onClick={() => onSelectOption(choice.id, choice.label, isCorrectOption)}
              className={`min-h-[88px] px-6 py-5 rounded-xl border flex items-center justify-between gap-4 transition-all duration-150 ${cardClass}`}
            >
              <div className="flex items-center gap-3.5 text-left">
                <span
                  className={`w-10 h-10 rounded-lg border flex items-center justify-center shrink-0 ${
                    isTrueBtn
                      ? 'border-[#15803D]/30 dark:border-[#22C55E]/35 bg-[#15803D]/10 dark:bg-[#22C55E]/12 text-[#15803D] dark:text-[#22C55E]'
                      : 'border-[#B91C1C]/30 dark:border-[#EF4444]/35 bg-[#B91C1C]/10 dark:bg-[#EF4444]/12 text-[#B91C1C] dark:text-[#EF4444]'
                  }`}
                >
                  {isTrueBtn ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <XCircle className="w-5 h-5" />
                  )}
                </span>
                <div>
                  <span className="block text-lg font-bold tracking-wide">{choice.label}</span>
                  <span className="block text-xs text-[#57534E] dark:text-[#A8A29E] mt-0.5">
                    {choice.subtitle}
                  </span>
                </div>
              </div>

              {showFeedback && isCorrectOption && (
                <CheckCircle2 className="w-5 h-5 shrink-0 text-[#15803D] dark:text-[#22C55E]" />
              )}
              {showFeedback && isSelected && !isCorrectOption && (
                <XCircle className="w-5 h-5 shrink-0 text-[#B91C1C] dark:text-[#EF4444]" />
              )}
            </button>
          );
        })}
      </div>

      {/* Instant feedback & correction panel */}
      {showFeedback && (
        <div
          className={`rounded-xl border p-5 space-y-4 ${
            isCorrectSelected
              ? 'border-[#15803D]/35 dark:border-[#22C55E]/40 bg-[#15803D]/10 dark:bg-[#22C55E]/12'
              : 'border-[#B91C1C]/35 dark:border-[#EF4444]/40 bg-[#B91C1C]/10 dark:bg-[#EF4444]/12'
          }`}
        >
          {/* Verdict header */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              {isCorrectSelected ? (
                <CheckCircle2 className="w-5 h-5 shrink-0 text-[#15803D] dark:text-[#22C55E]" />
              ) : (
                <XCircle className="w-5 h-5 shrink-0 text-[#B91C1C] dark:text-[#EF4444]" />
              )}
              <p
                className={`text-sm font-bold ${
                  isCorrectSelected
                    ? 'text-[#15803D] dark:text-[#22C55E]'
                    : 'text-[#B91C1C] dark:text-[#EF4444]'
                }`}
              >
                {isCorrectSelected ? 'Correct!' : 'Incorrect.'}{' '}
                <span className="text-[#1C1917] dark:text-[#F5F2EB]">
                  This sentence is{' '}
                  <strong
                    className={
                      isStatementTrue
                        ? 'text-[#15803D] dark:text-[#22C55E]'
                        : 'text-[#B91C1C] dark:text-[#EF4444]'
                    }
                  >
                    {isStatementTrue ? 'TRUE' : 'FALSE'}
                  </strong>
                  .
                </span>
              </p>
            </div>

            {question.trapCategory && (
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-md border border-[#1C1917]/15 dark:border-[#F5F2EB]/15 bg-white/80 dark:bg-[#1E1C1A] text-[#57534E] dark:text-[#A8A29E]">
                {question.trapCategory}
              </span>
            )}
          </div>

          {/* Corrected Chinese sentence box for every FALSE statement */}
          {!isStatementTrue && question.correctedHanzi && (
            <div className="rounded-lg border border-[#15803D]/30 dark:border-[#22C55E]/35 bg-white dark:bg-[#1E1C1A] p-4 flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#15803D] dark:text-[#22C55E]">
                  Corrected Chinese Sentence
                </p>
                <p
                  dir="ltr"
                  className="font-hanzi text-xl sm:text-2xl font-bold text-[#1C1917] dark:text-[#F5F2EB]"
                >
                  {question.correctedHanzi}
                </p>
                {showPinyin && question.correctedPinyin && (
                  <p className="font-pinyin text-xs sm:text-sm text-[#D97706] dark:text-[#F59E0B]">
                    {question.correctedPinyin}
                  </p>
                )}
              </div>

              <SpeakChineseButton text={question.correctedHanzi} compact />
            </div>
          )}

          {/* Meaning & concise explanation */}
          <div className="space-y-1.5 text-sm">
            {question.meaningDisplay && (
              <p className="text-[#57534E] dark:text-[#A8A29E]">
                Meaning:{' '}
                <strong className="text-[#1C1917] dark:text-[#F5F2EB]">
                  {question.meaningDisplay}
                </strong>
              </p>
            )}
            {question.explanation && (
              <p className="text-[#1C1917] dark:text-[#F5F2EB] leading-relaxed">
                <strong className="text-[#57534E] dark:text-[#A8A29E] mr-1">
                  {isStatementTrue ? 'Note:' : 'Explanation:'}
                </strong>
                {question.explanation}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
