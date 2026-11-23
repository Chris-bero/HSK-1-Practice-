import { Fragment, useEffect, useMemo, useState } from 'react';
import {
  ArrowUp,
  BookMarked,
  BookOpenText,
  Check,
  Download,
  Grid2x2,
  LayoutGrid,
  ListTree,
  Lock,
  Maximize2,
  MessageSquareText,
  Printer,
  Search,
  Volume2,
  X,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useApp } from '../context/AppContext';
import { CHAPTERS_DATA } from '../data/chaptersData';
import { GRAMMAR_COLLECTION_DATA } from '../data/grammarCollectionData';
import { groupVocabularyByCategory } from '../data/vocabCategories';
import { ChapterData } from '../types';
import { isChapterUnlocked } from '../utils/accessControl';
import {
  downloadCategorizedVocabularyWordDoc,
  downloadVocabularyWordDoc,
  NumberedVocabEntry,
  VocabSheetMode,
} from '../utils/exportVocabWord';
import { initChineseVoices, speakChinese, stopChineseSpeech } from '../utils/speech';
import { BookmarkNoteControls } from './BookmarkNoteControls';
import { DialoguesCollectionTab } from './collections/DialoguesCollectionTab';
import { GrammarCollectionTab } from './collections/GrammarCollectionTab';
import { LockedAccessModal } from './LockedAccessModal';

type CollectionSubTab = 'vocab' | 'grammar' | 'dialogues';

function chunkRows<T>(items: T[], cols: number): T[][] {
  const safeCols = Math.max(1, cols);
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += safeCols) {
    rows.push(items.slice(i, i + safeCols));
  }
  return rows;
}

export function CollectionsView() {
  const { unlockedAccess } = useApp();

  const [subTab, setSubTab] = useState<CollectionSubTab>('vocab');
  const [selectedChapterId, setSelectedChapterId] = useState<'all' | number>('all');
  const [sheetMode, setSheetMode] = useState<VocabSheetMode>('hanzi-only');
  const [hanziCols, setHanziCols] = useState<5 | 6 | 10>(10);
  const [reviewCols, setReviewCols] = useState<3 | 4 | 6>(3);
  const [searchQuery, setSearchQuery] = useState('');
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [wordExported, setWordExported] = useState(false);
  const [lockedChapterModal, setLockedChapterModal] = useState<ChapterData | null>(null);

  useEffect(() => {
    const cleanup = initChineseVoices();
    return () => {
      cleanup();
      stopChineseSpeech();
    };
  }, []);

  const unlockedChapters = useMemo(
    () => CHAPTERS_DATA.filter((ch) => isChapterUnlocked(unlockedAccess, ch.id)),
    [unlockedAccess]
  );

  // If the selected chapter becomes locked after an access refresh, reset to "all"
  useEffect(() => {
    if (
      selectedChapterId !== 'all' &&
      !unlockedChapters.some((ch) => ch.id === selectedChapterId)
    ) {
      setSelectedChapterId('all');
    }
  }, [selectedChapterId, unlockedChapters]);

  const totalUnlockedVocab = useMemo(
    () => unlockedChapters.reduce((sum, ch) => sum + ch.vocab.length, 0),
    [unlockedChapters]
  );

  const totalUnlockedSentences = useMemo(
    () => unlockedChapters.reduce((sum, ch) => sum + ch.sentences.length, 0),
    [unlockedChapters]
  );

  const totalUnlockedGrammar = useMemo(() => {
    const unlockedIds = new Set(unlockedChapters.map((ch) => ch.id));
    return GRAMMAR_COLLECTION_DATA.filter((item) => unlockedIds.has(item.lessonId)).length;
  }, [unlockedChapters]);

  const scopedChapters = useMemo(() => {
    if (selectedChapterId === 'all') return unlockedChapters;
    return unlockedChapters.filter((ch) => ch.id === selectedChapterId);
  }, [selectedChapterId, unlockedChapters]);

  const numberedEntries = useMemo<NumberedVocabEntry[]>(() => {
    const list: NumberedVocabEntry[] = [];
    let serial = 1;
    for (const ch of scopedChapters) {
      for (const v of ch.vocab) {
        list.push({
          serial,
          chapterId: ch.id,
          chapterTitleAr: ch.titleAr,
          id: v.id,
          hanzi: v.hanzi,
          pinyin: v.pinyin,
          arabic: v.arabic,
        });
        serial += 1;
      }
    }
    return list;
  }, [scopedChapters]);

  const filteredEntries = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return numberedEntries;
    return numberedEntries.filter(
      (item) =>
        item.hanzi.includes(q) ||
        item.pinyin.toLowerCase().includes(q) ||
        item.arabic.toLowerCase().includes(q) ||
        String(item.serial) === q
    );
  }, [numberedEntries, searchQuery]);

  const activeColumns = sheetMode === 'hanzi-only' ? hanziCols : reviewCols;
  const tableRows = useMemo(
    () => chunkRows(filteredEntries, activeColumns),
    [filteredEntries, activeColumns]
  );

  // Dedicated single-sheet A3 Landscape print rows: 10 columns (Hanzi only) or 6 columns (full review)
  const printA3Columns = sheetMode === 'hanzi-only' ? 10 : 6;
  const printA3Rows = useMemo(
    () => chunkRows(filteredEntries, printA3Columns),
    [filteredEntries, printA3Columns]
  );

  // Group vocabulary into the 15 thematic/grammatical categories
  const categorizedGroups = useMemo(
    () => groupVocabularyByCategory(filteredEntries),
    [filteredEntries]
  );

  const nonEmptyCategorizedGroups = useMemo(
    () => categorizedGroups.filter((g) => g.entries.length > 0),
    [categorizedGroups]
  );

  // Dynamically set @page print size:
  // A4 Portrait for Grammar, Dialogues, and Categorized Vocabulary; A3 Landscape for single-sheet master grids
  useEffect(() => {
    const styleId = 'collections-dynamic-print-page';
    const needsA4Portrait =
      subTab === 'grammar' ||
      subTab === 'dialogues' ||
      (subTab === 'vocab' && sheetMode === 'categorized');

    let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;
    if (needsA4Portrait) {
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = styleId;
        document.head.appendChild(styleEl);
      }
      styleEl.textContent = '@media print { @page { size: A4 portrait; margin: 10mm; } }';
    } else if (styleEl) {
      styleEl.remove();
    }
    return () => {
      const existing = document.getElementById(styleId);
      if (existing) existing.remove();
    };
  }, [subTab, sheetMode]);

  const activeScopeLabelAr = useMemo(() => {
    if (selectedChapterId === 'all') {
      return unlockedChapters.length === CHAPTERS_DATA.length
        ? 'All Chapters (Chapter 1 – Chapter 15)'
        : `All Unlocked Chapters (${unlockedChapters.length} of 15)`;
    }
    const found = CHAPTERS_DATA.find((ch) => ch.id === selectedChapterId);
    return found ? `Chapter ${found.id} (第${found.id}课) — ${found.subtitleAr}` : `Chapter ${selectedChapterId}`;
  }, [selectedChapterId, unlockedChapters.length]);

  const fileScopeTag = useMemo(() => {
    if (selectedChapterId === 'all') {
      return unlockedChapters.length === CHAPTERS_DATA.length
        ? 'All_Ch1-15'
        : `Unlocked_${unlockedChapters.length}Ch`;
    }
    return `Ch${selectedChapterId}`;
  }, [selectedChapterId, unlockedChapters.length]);

  const handlePlayWord = (entry: NumberedVocabEntry) => {
    if (speakingId === entry.id) {
      stopChineseSpeech();
      setSpeakingId(null);
      return;
    }
    setSpeakingId(entry.id);
    const ok = speakChinese(entry.hanzi, 0.92, {
      onEnd: () => setSpeakingId((cur) => (cur === entry.id ? null : cur)),
      onError: () => setSpeakingId((cur) => (cur === entry.id ? null : cur)),
    });
    if (!ok) {
      setSpeakingId(null);
    }
  };

  const handleExportWord = () => {
    if (filteredEntries.length === 0) return;
    if (sheetMode === 'categorized') {
      downloadCategorizedVocabularyWordDoc({
        groups: categorizedGroups.map((g) => ({
          id: g.category.id,
          titleAr: g.category.titleAr,
          titleEn: g.category.titleEn,
          entries: g.entries,
        })),
        totalCount: filteredEntries.length,
        scopeLabelAr: activeScopeLabelAr,
        fileScopeTag,
      });
    } else {
      downloadVocabularyWordDoc({
        entries: filteredEntries,
        mode: sheetMode,
        scopeLabelAr: activeScopeLabelAr,
        fileScopeTag,
      });
    }
    setWordExported(true);
    window.setTimeout(() => setWordExported(false), 2600);
  };

  const scrollToElementById = (elementId: string) => {
    const target = document.getElementById(elementId);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handlePrintPdf = () => {
    stopChineseSpeech();
    setSpeakingId(null);
    window.print();
  };

  const handleSelectChapterFilter = (ch: ChapterData) => {
    if (!isChapterUnlocked(unlockedAccess, ch.id)) {
      setLockedChapterModal(ch);
      return;
    }
    setSelectedChapterId(ch.id);
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      className="vocab-print-root mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-10 space-y-7"
    >
      {/* Page Header & 3 Sub-Tabs (hidden on print) */}
      <div className="no-print space-y-6">
        <div className="neo-frame rounded-xl p-6 sm:p-8 bg-white dark:bg-[#1E1C1A] space-y-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div className="flex items-start gap-4">
              <span className="cinnabar-seal font-hanzi w-14 h-14 rounded-lg bg-[#B91C1C]/6 dark:bg-[#EF4444]/12 flex items-center justify-center text-2xl font-bold shrink-0">
                集
              </span>
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2 text-xs text-[#57534E] dark:text-[#A8A29E] tabular-nums">
                  <span>Study Compilations</span>
                  <span aria-hidden="true">·</span>
                  <span>HSK 3.0 Level 1</span>
                  <span aria-hidden="true">·</span>
                  <span>
                    {unlockedChapters.length} of {CHAPTERS_DATA.length} chapters unlocked
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{totalUnlockedVocab} words available</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-[#1C1917] dark:text-[#F5F2EB] [text-wrap:balance]">
                  Comprehensive Study Compilations
                </h1>
                <p className="text-sm text-[#57534E] dark:text-[#A8A29E] leading-relaxed max-w-2xl">
                  Structured multi-column sheets for rapid review and recall testing, featuring
                  instant audio pronunciation, direct Microsoft Word (.doc) export, and clean
                  black-and-white A3/A4 PDF printing.
                </p>
              </div>
            </div>
          </div>

          {/* Sub-Tabs */}
          <div
            role="tablist"
            aria-label="Compilation Sections"
            className="flex flex-wrap items-center gap-2 pt-4 border-t border-[#1C1917]/10 dark:border-[#F5F2EB]/10"
          >
            <button
              type="button"
              role="tab"
              aria-selected={subTab === 'vocab'}
              onClick={() => setSubTab('vocab')}
              className={`inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-lg text-xs sm:text-sm font-bold transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B91C1C] ${
                subTab === 'vocab'
                  ? 'bg-[#B91C1C] dark:bg-[#EF4444] text-white'
                  : 'border border-[#1C1917]/12 dark:border-[#F5F2EB]/12 bg-[#F9F6F0] dark:bg-[#121110] text-[#57534E] dark:text-[#A8A29E] hover:text-[#1C1917] dark:hover:text-[#F5F2EB]'
              }`}
            >
              <BookMarked className="w-4 h-4 shrink-0" />
              <span>Vocabulary Sheets ({totalUnlockedVocab})</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={subTab === 'grammar'}
              onClick={() => setSubTab('grammar')}
              className={`inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-lg text-xs sm:text-sm font-bold transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B91C1C] ${
                subTab === 'grammar'
                  ? 'bg-[#B91C1C] dark:bg-[#EF4444] text-white'
                  : 'border border-[#1C1917]/12 dark:border-[#F5F2EB]/12 bg-[#F9F6F0] dark:bg-[#121110] text-[#57534E] dark:text-[#A8A29E] hover:text-[#1C1917] dark:hover:text-[#F5F2EB]'
              }`}
            >
              <BookOpenText className="w-4 h-4 shrink-0" />
              <span>Grammar Guide ({totalUnlockedGrammar})</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={subTab === 'dialogues'}
              onClick={() => setSubTab('dialogues')}
              className={`inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-lg text-xs sm:text-sm font-bold transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B91C1C] ${
                subTab === 'dialogues'
                  ? 'bg-[#B91C1C] dark:bg-[#EF4444] text-white'
                  : 'border border-[#1C1917]/12 dark:border-[#F5F2EB]/12 bg-[#F9F6F0] dark:bg-[#121110] text-[#57534E] dark:text-[#A8A29E] hover:text-[#1C1917] dark:hover:text-[#F5F2EB]'
              }`}
            >
              <MessageSquareText className="w-4 h-4 shrink-0" />
              <span>Dialogues &amp; Sentences ({totalUnlockedSentences})</span>
            </button>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* Tab 1: Vocabulary Master Sheet                                        */}
      {/* ===================================================================== */}
      {subTab === 'vocab' && (
        <div className="space-y-5">
          {/* Controls: Sheet Mode + Word/PDF Export + Chapter Filters */}
          <div className="no-print rounded-xl border border-[#1C1917]/12 dark:border-[#F5F2EB]/12 bg-white dark:bg-[#1E1C1A] p-5 sm:p-6 space-y-5">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-[#1C1917]/10 dark:border-[#F5F2EB]/10">
              {/* Sheet layout mode switcher */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-[#57534E] dark:text-[#A8A29E]">
                  Select Vocabulary Sheet Layout:
                </p>
                <div
                  role="radiogroup"
                  aria-label="Vocabulary Sheet Mode"
                  className="inline-flex flex-wrap p-1 rounded-lg border border-[#1C1917]/12 dark:border-[#F5F2EB]/12 bg-[#F2ECE1] dark:bg-[#141312] gap-1"
                >
                  <button
                    type="button"
                    role="radio"
                    aria-checked={sheetMode === 'hanzi-only'}
                    onClick={() => setSheetMode('hanzi-only')}
                    className={`inline-flex items-center gap-2 px-4 py-2 min-h-[42px] rounded-md text-xs sm:text-sm font-bold transition-colors whitespace-nowrap ${
                      sheetMode === 'hanzi-only'
                        ? 'bg-white dark:bg-[#292623] text-[#B91C1C] dark:text-[#EF4444] shadow-xs'
                        : 'text-[#57534E] dark:text-[#A8A29E] hover:text-[#1C1917] dark:hover:text-[#F5F2EB]'
                    }`}
                  >
                    <Grid2x2 className="w-4 h-4 shrink-0" />
                    <span>Recall Test Sheet (Hanzi Only)</span>
                  </button>

                  <button
                    type="button"
                    role="radio"
                    aria-checked={sheetMode === 'full-review'}
                    onClick={() => setSheetMode('full-review')}
                    className={`inline-flex items-center gap-2 px-4 py-2 min-h-[42px] rounded-md text-xs sm:text-sm font-bold transition-colors whitespace-nowrap ${
                      sheetMode === 'full-review'
                        ? 'bg-white dark:bg-[#292623] text-[#15803D] dark:text-[#22C55E] shadow-xs'
                        : 'text-[#57534E] dark:text-[#A8A29E] hover:text-[#1C1917] dark:hover:text-[#F5F2EB]'
                    }`}
                  >
                    <LayoutGrid className="w-4 h-4 shrink-0" />
                    <span>Complete Review (Hanzi + Pinyin + Meaning)</span>
                  </button>

                  <button
                    type="button"
                    role="radio"
                    aria-checked={sheetMode === 'categorized'}
                    onClick={() => setSheetMode('categorized')}
                    className={`inline-flex items-center gap-2 px-4 py-2 min-h-[42px] rounded-md text-xs sm:text-sm font-bold transition-colors whitespace-nowrap ${
                      sheetMode === 'categorized'
                        ? 'bg-white dark:bg-[#292623] text-[#B45309] dark:text-[#F59E0B] shadow-xs'
                        : 'text-[#57534E] dark:text-[#A8A29E] hover:text-[#1C1917] dark:hover:text-[#F5F2EB]'
                    }`}
                  >
                    <ListTree className="w-4 h-4 shrink-0" />
                    <span>3. Categorized (15 Thematic Sections)</span>
                  </button>
                </div>
              </div>

              {/* Export buttons and print size badge */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2.5">
                  <div className="inline-flex items-center gap-1.5 px-3 py-2 min-h-[44px] rounded-lg border border-[#D97706]/35 dark:border-[#F59E0B]/35 bg-[#D97706]/8 dark:bg-[#F59E0B]/12 text-[#92400E] dark:text-[#F59E0B] text-xs font-bold whitespace-nowrap shrink-0">
                    <Maximize2 className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      {sheetMode === 'categorized'
                        ? 'Print Format: A4 Portrait (15 Sections)'
                        : 'Print Format: A3 Landscape (Single Master Sheet)'}
                    </span>
                  </div>

                  <button
                    type="button"
                    disabled={filteredEntries.length === 0}
                    onClick={handleExportWord}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 min-h-[44px] rounded-lg bg-[#B91C1C] hover:bg-[#991B1B] dark:bg-[#EF4444] dark:hover:bg-[#DC2626] text-white text-xs sm:text-sm font-bold transition-colors disabled:opacity-45 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#B91C1C]"
                  >
                    {wordExported ? (
                      <>
                        <Check className="w-4 h-4 shrink-0" />
                        <span>
                          {sheetMode === 'categorized'
                            ? 'Word Downloaded (Categorized)'
                            : 'Word Downloaded (A3)'}
                        </span>
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 shrink-0" />
                        <span>Download Word (.doc)</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    disabled={filteredEntries.length === 0}
                    onClick={handlePrintPdf}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 min-h-[44px] rounded-lg border border-[#1C1917]/20 dark:border-[#F5F2EB]/20 bg-[#F9F6F0] dark:bg-[#121110] hover:border-[#B91C1C]/55 dark:hover:border-[#EF4444]/55 text-[#1C1917] dark:text-[#F5F2EB] text-xs sm:text-sm font-bold transition-colors disabled:opacity-45 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B91C1C]"
                  >
                    <Printer className="w-4 h-4 text-[#D97706] dark:text-[#F59E0B] shrink-0" />
                    <span>Print / Save PDF (B&amp;W)</span>
                  </button>
                </div>

                <p className="text-[11px] sm:text-xs text-[#57534E] dark:text-[#A8A29E] leading-relaxed">
                  Tip: A3 Landscape sheets are ideal for desktop viewing or single-page printing,
                  while A4 Portrait compilations work smoothly across phones and tablets.
                </p>
              </div>
            </div>

            {/* Chapter filter bar + column density + quick search */}
            <div className="space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-semibold text-[#57534E] dark:text-[#A8A29E]">
                  Filter by chapter:
                </p>

                <div className="flex flex-wrap items-center gap-3">
                  {sheetMode !== 'categorized' && (
                    <div className="inline-flex items-center gap-1.5 text-xs">
                      <span className="text-[#57534E] dark:text-[#A8A29E]">Display columns:</span>
                      {sheetMode === 'hanzi-only' ? (
                        <div className="inline-flex rounded-md border border-[#1C1917]/12 dark:border-[#F5F2EB]/12 p-0.5 bg-[#F9F6F0] dark:bg-[#121110]">
                          {([5, 6, 10] as const).map((n) => (
                            <button
                              key={n}
                              type="button"
                              onClick={() => setHanziCols(n)}
                              className={`px-2.5 py-1 rounded text-xs font-bold tabular-nums transition-colors ${
                                hanziCols === n
                                  ? 'bg-[#1C1917] dark:bg-[#F5F2EB] text-white dark:text-[#121110]'
                                  : 'text-[#57534E] dark:text-[#A8A29E]'
                              }`}
                            >
                              {n === 10 ? '10 (A3)' : n}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="inline-flex rounded-md border border-[#1C1917]/12 dark:border-[#F5F2EB]/12 p-0.5 bg-[#F9F6F0] dark:bg-[#121110]">
                          {([3, 4, 6] as const).map((n) => (
                            <button
                              key={n}
                              type="button"
                              onClick={() => setReviewCols(n)}
                              className={`px-2.5 py-1 rounded text-xs font-bold tabular-nums transition-colors ${
                                reviewCols === n
                                  ? 'bg-[#1C1917] dark:bg-[#F5F2EB] text-white dark:text-[#121110]'
                                  : 'text-[#57534E] dark:text-[#A8A29E]'
                              }`}
                            >
                              {n === 6 ? '6 (A3)' : n}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Quick search box */}
                  <div className="relative w-56 sm:w-64">
                    <Search className="w-3.5 h-3.5 text-[#57534E] dark:text-[#A8A29E] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search Hanzi, Pinyin, or meaning..."
                      className="w-full pl-9 pr-8 py-1.5 min-h-[38px] rounded-lg border border-[#1C1917]/15 dark:border-[#F5F2EB]/15 bg-[#F9F6F0] dark:bg-[#121110] text-xs text-[#1C1917] dark:text-[#F5F2EB] placeholder:text-[#57534E]/75 dark:placeholder:text-[#A8A29E]/75 focus:outline-none focus:border-[#B91C1C] dark:focus:border-[#EF4444]"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        aria-label="Clear search"
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-[#57534E] hover:text-[#B91C1C]"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setSelectedChapterId('all')}
                  className={`px-3.5 py-2 min-h-[38px] rounded-lg border text-xs font-bold transition-colors whitespace-nowrap tabular-nums ${
                    selectedChapterId === 'all'
                      ? 'border-[#B91C1C] dark:border-[#EF4444] bg-[#B91C1C] dark:bg-[#EF4444] text-white'
                      : 'border-[#1C1917]/12 dark:border-[#F5F2EB]/12 bg-[#F9F6F0] dark:bg-[#121110] text-[#1C1917] dark:text-[#F5F2EB] hover:border-[#B91C1C]/45'
                  }`}
                >
                  All Unlocked Chapters ({totalUnlockedVocab})
                </button>

                {CHAPTERS_DATA.map((ch) => {
                  const unlocked = isChapterUnlocked(unlockedAccess, ch.id);
                  const isActive = selectedChapterId === ch.id;
                  return (
                    <button
                      key={ch.id}
                      type="button"
                      title={`Chapter ${ch.id}: ${ch.subtitleAr} (${ch.vocab.length} words)`}
                      onClick={() => handleSelectChapterFilter(ch)}
                      className={`inline-flex items-center gap-1.5 px-3 py-2 min-h-[38px] rounded-lg border text-xs font-bold transition-colors whitespace-nowrap tabular-nums ${
                        !unlocked
                          ? 'border-[#D97706]/25 dark:border-[#F59E0B]/25 bg-[#F2ECE1]/60 dark:bg-[#181614] text-[#57534E] dark:text-[#A8A29E] hover:border-[#D97706]/55'
                          : isActive
                            ? 'border-[#B91C1C] dark:border-[#EF4444] bg-[#B91C1C] dark:bg-[#EF4444] text-white'
                            : 'border-[#1C1917]/12 dark:border-[#F5F2EB]/12 bg-white dark:bg-[#1E1C1A] text-[#1C1917] dark:text-[#F5F2EB] hover:border-[#B91C1C]/45'
                      }`}
                    >
                      {!unlocked && (
                        <Lock className="w-3 h-3 text-[#B45309] dark:text-[#F59E0B] shrink-0" />
                      )}
                      <span className="font-hanzi">第{ch.id}课</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Scope status & audio hint */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-[#1C1917]/8 dark:border-[#F5F2EB]/8 text-xs text-[#57534E] dark:text-[#A8A29E]">
              <div className="flex flex-wrap items-center gap-2 tabular-nums">
                <span className="font-bold text-[#1C1917] dark:text-[#F5F2EB]">
                  {activeScopeLabelAr}
                </span>
                <span aria-hidden="true">·</span>
                <span>Showing: {filteredEntries.length} words</span>
              </div>
              <span className="inline-flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-[#B91C1C] dark:text-[#EF4444]" />
                <span>Click any word in the sheet to hear its Chinese pronunciation</span>
              </span>
            </div>
          </div>

          {/* ================================================================= */}
          {/* Interactive On-Screen Sheet + Dedicated B&W Print Sheet           */}
          {/* ================================================================= */}
          <div
            className={`vocab-print-sheet ${
              sheetMode === 'categorized' ? 'vocab-print-sheet-flow' : ''
            } rounded-xl border border-[#1C1917]/15 dark:border-[#F5F2EB]/15 bg-white dark:bg-[#1E1C1A] p-4 sm:p-6 shadow-xs`}
          >
            {/* Interactive On-Screen View */}
            <div className="no-print">
              {filteredEntries.length === 0 ? (
                <div className="py-12 text-center space-y-2">
                  <p className="text-base font-bold text-[#1C1917] dark:text-[#F5F2EB]">
                    No matching vocabulary found
                  </p>
                  <p className="text-xs text-[#57534E] dark:text-[#A8A29E]">
                    Try clearing your search or selecting &ldquo;All Unlocked Chapters&rdquo;.
                  </p>
                </div>
              ) : sheetMode === 'categorized' ? (
                /* ============================================================= */
                /* Mode 3: Categorized (15 Thematic Sections) + TOC              */
                /* ============================================================= */
                <div className="space-y-8">
                  {/* Table of Contents */}
                  <div
                    id="vocab-cat-toc"
                    className="scroll-mt-24 rounded-xl border border-[#1C1917]/12 dark:border-[#F5F2EB]/12 bg-[#F9F6F0]/70 dark:bg-[#141312] p-4 sm:p-5 space-y-3.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-[#1C1917]/10 dark:border-[#F5F2EB]/10">
                      <div className="flex items-center gap-2">
                        <ListTree className="w-4 h-4 text-[#B91C1C] dark:text-[#EF4444]" />
                        <h2 className="text-base font-bold text-[#1C1917] dark:text-[#F5F2EB]">
                          Thematic Table of Contents (15 Sections)
                        </h2>
                      </div>
                      <span className="text-xs font-semibold text-[#57534E] dark:text-[#A8A29E] tabular-nums">
                        {nonEmptyCategorizedGroups.length} active sections ·{' '}
                        {filteredEntries.length} words
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {categorizedGroups.map((group) => {
                        const count = group.entries.length;
                        const isEmpty = count === 0;
                        return (
                          <button
                            key={group.category.id}
                            type="button"
                            disabled={isEmpty}
                            onClick={() => scrollToElementById(group.category.anchorId)}
                            className={`flex items-center justify-between gap-2 text-left px-3 py-2.5 rounded-lg border transition-colors ${
                              isEmpty
                                ? 'border-[#1C1917]/8 dark:border-[#F5F2EB]/8 bg-transparent text-[#57534E]/50 dark:text-[#A8A29E]/45 cursor-not-allowed'
                                : 'border-[#1C1917]/12 dark:border-[#F5F2EB]/12 bg-white dark:bg-[#1E1C1A] hover:border-[#B91C1C]/50 dark:hover:border-[#EF4444]/50 text-[#1C1917] dark:text-[#F5F2EB]'
                            }`}
                          >
                            <div className="min-w-0 flex items-center gap-2.5">
                              <span
                                className={`w-6 h-6 rounded-md text-xs font-bold tabular-nums flex items-center justify-center shrink-0 ${
                                  isEmpty
                                    ? 'bg-[#1C1917]/5 dark:bg-[#F5F2EB]/5 text-[#57534E]/60'
                                    : 'bg-[#B91C1C]/10 dark:bg-[#EF4444]/15 text-[#B91C1C] dark:text-[#EF4444]'
                                }`}
                              >
                                {group.category.id}
                              </span>
                              <div className="min-w-0">
                                <p className="text-xs font-bold truncate">
                                  {group.category.titleEn}
                                </p>
                              </div>
                            </div>
                            <span className="text-xs font-bold tabular-nums text-[#57534E] dark:text-[#A8A29E] shrink-0">
                              {count}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 15 Categorized Sections */}
                  <div className="space-y-7">
                    {nonEmptyCategorizedGroups.map((group) => (
                      <section
                        key={group.category.id}
                        id={group.category.anchorId}
                        className="scroll-mt-24 rounded-xl border border-[#1C1917]/12 dark:border-[#F5F2EB]/12 overflow-hidden bg-white dark:bg-[#1E1C1A]"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-5 py-3.5 bg-[#F2ECE1]/75 dark:bg-[#25221F] border-b border-[#1C1917]/12 dark:border-[#F5F2EB]/12">
                          <div className="space-y-0.5">
                            <h3 className="text-sm sm:text-base font-bold text-[#1C1917] dark:text-[#F5F2EB]">
                              <span className="text-[#B91C1C] dark:text-[#EF4444] tabular-nums mr-1.5">
                                {group.category.id}.
                              </span>
                              {group.category.titleEn}
                            </h3>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <span className="text-xs font-bold text-[#57534E] dark:text-[#A8A29E] tabular-nums">
                              {group.entries.length} words
                            </span>
                            <button
                              type="button"
                              onClick={() => scrollToElementById('vocab-cat-toc')}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-[#1C1917]/15 dark:border-[#F5F2EB]/15 bg-white dark:bg-[#1E1C1A] hover:border-[#B91C1C]/50 text-[11px] font-bold text-[#57534E] dark:text-[#A8A29E] hover:text-[#B91C1C] dark:hover:text-[#EF4444] transition-colors whitespace-nowrap"
                            >
                              <span>Back to Contents</span>
                              <ArrowUp className="w-3 h-3 shrink-0" />
                            </button>
                          </div>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full min-w-[600px] border-collapse">
                            <thead>
                              <tr className="bg-[#F9F6F0] dark:bg-[#181614] text-xs font-bold text-[#57534E] dark:text-[#A8A29E] border-b border-[#1C1917]/12 dark:border-[#F5F2EB]/12">
                                <th className="w-12 py-2.5 px-2 text-center border-r border-[#1C1917]/10 dark:border-[#F5F2EB]/10">
                                  #
                                </th>
                                <th className="w-32 py-2.5 px-3 text-center border-r border-[#1C1917]/10 dark:border-[#F5F2EB]/10">
                                  Hanzi
                                </th>
                                <th className="w-40 py-2.5 px-3 text-center border-r border-[#1C1917]/10 dark:border-[#F5F2EB]/10">
                                  Pinyin
                                </th>
                                <th className="py-2.5 px-4 text-left border-r border-[#1C1917]/10 dark:border-[#F5F2EB]/10">
                                  Meaning
                                </th>
                                <th className="w-20 py-2.5 px-2 text-center border-r border-[#1C1917]/10 dark:border-[#F5F2EB]/10">
                                  Chapter
                                </th>
                                <th className="w-32 py-2.5 px-2 text-center">Audio &amp; Save</th>
                              </tr>
                            </thead>
                            <tbody>
                              {group.entries.map((entry, idx) => {
                                const isSpeaking = speakingId === entry.id;
                                return (
                                  <tr
                                    key={entry.id}
                                    onClick={() => handlePlayWord(entry)}
                                    className={`border-b last:border-b-0 border-[#1C1917]/10 dark:border-[#F5F2EB]/10 cursor-pointer transition-colors ${
                                      isSpeaking
                                        ? 'bg-[#B91C1C]/10 dark:bg-[#EF4444]/15'
                                        : 'hover:bg-[#F9F6F0]/80 dark:hover:bg-[#25221F]/70'
                                    }`}
                                  >
                                    <td className="py-2.5 px-2 text-center text-xs font-bold text-[#57534E] dark:text-[#A8A29E] tabular-nums bg-[#F9F6F0]/60 dark:bg-[#181614]/60 border-r border-[#1C1917]/10 dark:border-[#F5F2EB]/10">
                                      {idx + 1}
                                    </td>
                                    <td className="py-2.5 px-3 text-center border-r border-[#1C1917]/10 dark:border-[#F5F2EB]/10">
                                      <span
                                        className={`font-hanzi text-lg font-bold ${
                                          isSpeaking
                                            ? 'text-[#B91C1C] dark:text-[#EF4444]'
                                            : 'text-[#1C1917] dark:text-[#F5F2EB]'
                                        }`}
                                      >
                                        {entry.hanzi}
                                      </span>
                                    </td>
                                    <td className="py-2.5 px-3 text-center border-r border-[#1C1917]/10 dark:border-[#F5F2EB]/10">
                                      <span className="font-pinyin text-xs sm:text-sm font-semibold text-[#57534E] dark:text-[#A8A29E]">
                                        {entry.pinyin}
                                      </span>
                                    </td>
                                    <td className="py-2.5 px-4 text-left text-xs sm:text-sm font-semibold text-[#1C1917] dark:text-[#F5F2EB] border-r border-[#1C1917]/10 dark:border-[#F5F2EB]/10">
                                      {entry.arabic}
                                    </td>
                                    <td className="py-2.5 px-2 text-center text-xs font-semibold text-[#57534E] dark:text-[#A8A29E] border-r border-[#1C1917]/10 dark:border-[#F5F2EB]/10">
                                      <span className="font-hanzi">第{entry.chapterId}课</span>
                                    </td>
                                    <td className="py-2.5 px-2 text-center">
                                      <div className="inline-flex items-center justify-center gap-1">
                                        <button
                                          type="button"
                                          aria-label={`Listen to ${entry.hanzi}`}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handlePlayWord(entry);
                                          }}
                                          className={`inline-flex items-center justify-center w-8 h-8 rounded-md border transition-colors ${
                                            isSpeaking
                                              ? 'border-[#B91C1C] dark:border-[#EF4444] bg-[#B91C1C] dark:bg-[#EF4444] text-white'
                                              : 'border-[#1C1917]/15 dark:border-[#F5F2EB]/15 bg-white dark:bg-[#1E1C1A] text-[#57534E] dark:text-[#A8A29E] hover:text-[#B91C1C] dark:hover:text-[#EF4444]'
                                          }`}
                                        >
                                          <Volume2 className="w-3.5 h-3.5" />
                                        </button>
                                        <BookmarkNoteControls
                                          itemType="vocab"
                                          itemId={entry.id}
                                          chapterId={entry.chapterId}
                                          hanzi={entry.hanzi}
                                          pinyin={entry.pinyin}
                                          arabic={entry.arabic}
                                        />
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </section>
                    ))}
                  </div>
                </div>
              ) : sheetMode === 'hanzi-only' ? (
                /* ============================================================= */
                /* Mode A: Recall Test Sheet — 5, 6, or 10 columns (# + Hanzi)   */
                /* ============================================================= */
                <div className="overflow-x-auto">
                  <table
                    dir="ltr"
                    className={`w-full border-collapse table-fixed ${
                      hanziCols === 10 ? 'min-w-[920px]' : 'min-w-[680px]'
                    }`}
                  >
                    <tbody>
                      {tableRows.map((row, rowIdx) => (
                        <tr key={rowIdx}>
                          {Array.from({ length: hanziCols }, (_, colIdx) => {
                            const entry = row[colIdx];
                            if (!entry) {
                              return (
                                <td
                                  key={`empty-${rowIdx}-${colIdx}`}
                                  colSpan={2}
                                  className="border border-[#1C1917]/20 dark:border-[#F5F2EB]/20 bg-[#F9F6F0]/45 dark:bg-[#141312]/45"
                                />
                              );
                            }
                            const isSpeaking = speakingId === entry.id;
                            return (
                              <Fragment key={entry.id}>
                                <td
                                  style={{ width: `${(25 / hanziCols).toFixed(2)}%` }}
                                  className="border border-[#1C1917]/25 dark:border-[#F5F2EB]/25 bg-[#EFEAE0] dark:bg-[#292623] text-center text-[11px] font-bold text-[#1C1917] dark:text-[#F5F2EB] tabular-nums py-1.5 px-1 select-none"
                                >
                                  {entry.serial}
                                </td>
                                <td
                                  style={{ width: `${(75 / hanziCols).toFixed(2)}%` }}
                                  onClick={() => handlePlayWord(entry)}
                                  title={`Click to listen to ${entry.hanzi}`}
                                  className={`group border border-[#1C1917]/25 dark:border-[#F5F2EB]/25 text-center py-2 px-1 cursor-pointer transition-colors select-none ${
                                    isSpeaking
                                      ? 'bg-[#B91C1C]/12 dark:bg-[#EF4444]/18 text-[#B91C1C] dark:text-[#EF4444]'
                                      : 'bg-white dark:bg-[#1E1C1A] hover:bg-[#F9F6F0] dark:hover:bg-[#25221F] text-[#1C1917] dark:text-[#F5F2EB]'
                                  }`}
                                >
                                  <div className="relative flex flex-col items-center justify-center gap-1">
                                    <span
                                      className={`font-hanzi font-bold leading-snug ${
                                        hanziCols === 10
                                          ? 'text-sm sm:text-base'
                                          : 'text-lg sm:text-xl'
                                      }`}
                                    >
                                      {entry.hanzi}
                                    </span>
                                    <div className="opacity-80 sm:opacity-0 sm:group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                                      <BookmarkNoteControls
                                        itemType="vocab"
                                        itemId={entry.id}
                                        chapterId={entry.chapterId}
                                        hanzi={entry.hanzi}
                                        pinyin={entry.pinyin}
                                        arabic={entry.arabic}
                                        compact
                                      />
                                    </div>
                                  </div>
                                </td>
                              </Fragment>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                /* ============================================================= */
                /* Mode B: Complete Review Sheet — 3, 4, or 6 columns            */
                /* ============================================================= */
                <div className="overflow-x-auto">
                  <table
                    dir="ltr"
                    className={`w-full border-collapse table-fixed ${
                      reviewCols === 6 ? 'min-w-[1060px]' : 'min-w-[760px]'
                    }`}
                  >
                    <tbody>
                      {tableRows.map((row, rowIdx) => (
                        <tr key={rowIdx}>
                          {Array.from({ length: reviewCols }, (_, colIdx) => {
                            const entry = row[colIdx];
                            if (!entry) {
                              return (
                                <td
                                  key={`empty-r-${rowIdx}-${colIdx}`}
                                  className="border border-[#1C1917]/20 dark:border-[#F5F2EB]/20 bg-[#F9F6F0]/45 dark:bg-[#141312]/45"
                                />
                              );
                            }
                            const isSpeaking = speakingId === entry.id;
                            return (
                              <td
                                key={`rev-${entry.id}`}
                                onClick={() => handlePlayWord(entry)}
                                title={`Click to listen to ${entry.hanzi}`}
                                className={`group border border-[#1C1917]/25 dark:border-[#F5F2EB]/25 p-0 align-middle cursor-pointer transition-colors ${
                                  isSpeaking
                                    ? 'bg-[#B91C1C]/10 dark:bg-[#EF4444]/16'
                                    : 'bg-white dark:bg-[#1E1C1A] hover:bg-[#F9F6F0] dark:hover:bg-[#25221F]'
                                }`}
                              >
                                {reviewCols === 6 ? (
                                  <div className="flex items-center gap-1 px-1.5 py-1 text-[10px] whitespace-nowrap overflow-hidden">
                                    <span className="inline-flex items-center justify-center min-w-[20px] px-1 py-0.5 bg-[#EFEAE0] dark:bg-[#292623] text-[#1C1917] dark:text-[#F5F2EB] font-bold tabular-nums rounded-[2px] shrink-0">
                                      {entry.serial}
                                    </span>
                                    <span
                                      className={`font-hanzi text-xs font-bold shrink-0 ${
                                        isSpeaking
                                          ? 'text-[#B91C1C] dark:text-[#EF4444]'
                                          : 'text-[#1C1917] dark:text-[#F5F2EB]'
                                      }`}
                                    >
                                      {entry.hanzi}
                                    </span>
                                    <span className="font-pinyin text-[10px] text-[#57534E] dark:text-[#A8A29E] shrink-0">
                                      {entry.pinyin}
                                    </span>
                                    <span className="ml-auto text-[10px] font-semibold text-[#1C1917] dark:text-[#F5F2EB] truncate text-left">
                                      {entry.arabic}
                                    </span>
                                  </div>
                                ) : (
                                  <div className="flex items-stretch min-h-[46px]">
                                    <div className="w-9 shrink-0 bg-[#EFEAE0] dark:bg-[#292623] border-r border-[#1C1917]/20 dark:border-[#F5F2EB]/20 flex items-center justify-center text-[11px] font-bold text-[#1C1917] dark:text-[#F5F2EB] tabular-nums">
                                      {entry.serial}
                                    </div>

                                    <div className="flex-1 grid grid-cols-12 items-center gap-1 px-2 py-1.5">
                                      <div className="col-span-4 text-center">
                                        <span
                                          className={`font-hanzi text-base font-bold leading-tight block ${
                                            isSpeaking
                                              ? 'text-[#B91C1C] dark:text-[#EF4444]'
                                              : 'text-[#1C1917] dark:text-[#F5F2EB]'
                                          }`}
                                        >
                                          {entry.hanzi}
                                        </span>
                                      </div>

                                      <div className="col-span-4 text-center border-x border-[#1C1917]/10 dark:border-[#F5F2EB]/10 px-1">
                                        <span className="font-pinyin text-[11px] font-semibold text-[#57534E] dark:text-[#A8A29E] leading-tight block break-words">
                                          {entry.pinyin}
                                        </span>
                                      </div>

                                      <div className="col-span-4 text-left pl-1 flex items-center justify-between gap-1">
                                        <span className="text-[11px] sm:text-xs font-semibold text-[#1C1917] dark:text-[#F5F2EB] leading-snug">
                                          {entry.arabic}
                                        </span>
                                        <BookmarkNoteControls
                                          itemType="vocab"
                                          itemId={entry.id}
                                          chapterId={entry.chapterId}
                                          hanzi={entry.hanzi}
                                          pinyin={entry.pinyin}
                                          arabic={entry.arabic}
                                          compact
                                        />
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* ================================================================= */}
            {/* Dedicated Black-and-White Print / PDF Sheets                      */}
            {/* ================================================================= */}
            {filteredEntries.length > 0 && sheetMode === 'categorized' && (
              <div className="hidden print-only vocab-cat-print-sheet">
                <div className="vocab-cat-print-header">
                  <h2>
                    HSK 3.0 Level 1 Categorized Vocabulary (15 Thematic Sections) — Instructor Laohu
                  </h2>
                  <p>
                    {activeScopeLabelAr} · Total: {filteredEntries.length} words · Active Sections:{' '}
                    {nonEmptyCategorizedGroups.length}
                  </p>
                </div>

                {/* Printable Table of Contents */}
                <div className="vocab-cat-print-toc">
                  <div className="vocab-cat-print-toc-title">
                    Table of Contents — Thematic Sections
                  </div>
                  <table>
                    <tbody>
                      {nonEmptyCategorizedGroups.map((group) => (
                        <tr key={`ptoc-${group.category.id}`}>
                          <td style={{ width: '8%', textAlign: 'center', fontWeight: 700 }}>
                            {group.category.id}
                          </td>
                          <td style={{ width: '76%', fontWeight: 700, textAlign: 'left' }}>
                            {group.category.titleEn}
                          </td>
                          <td style={{ width: '16%', textAlign: 'center', fontWeight: 700 }}>
                            {group.entries.length} words
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Printable 15 Thematic Tables */}
                {nonEmptyCategorizedGroups.map((group) => (
                  <div key={`pcat-${group.category.id}`} className="vocab-cat-print-section">
                    <div className="vocab-cat-print-section-head">
                      {group.category.id}. {group.category.titleEn} ({group.entries.length})
                    </div>
                    <table className="vocab-cat-print-table">
                      <thead>
                        <tr>
                          <th style={{ width: '7%' }}>#</th>
                          <th style={{ width: '20%' }}>Hanzi</th>
                          <th style={{ width: '24%' }}>Pinyin</th>
                          <th style={{ width: '39%' }}>Meaning</th>
                          <th style={{ width: '10%' }}>Chapter</th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.entries.map((entry, idx) => (
                          <tr key={`prow-${entry.id}`}>
                            <td className="cat-p-num tabular-nums">{idx + 1}</td>
                            <td className="cat-p-hanzi font-hanzi">{entry.hanzi}</td>
                            <td className="cat-p-pinyin font-pinyin">{entry.pinyin}</td>
                            <td className="cat-p-arabic">{entry.arabic}</td>
                            <td className="cat-p-ch font-hanzi">第{entry.chapterId}课</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}

                <div className="vocab-cat-print-footer">
                  HSK 3.0 Level 1 Practice Portal · Prepared by Instructor Laohu · Categorized Vocabulary
                </div>
              </div>
            )}

            {filteredEntries.length > 0 && sheetMode !== 'categorized' && (
              <div className="hidden print-only vocab-a3-print-sheet">
                <div className="vocab-a3-print-header">
                  <h2>HSK 3.0 Level 1 Vocabulary Master Sheet — Instructor Laohu</h2>
                  <p>
                    {sheetMode === 'hanzi-only'
                      ? 'Recall Test Sheet — Hanzi Only (10 Columns)'
                      : 'Complete Review Sheet — Hanzi, Pinyin & Meaning (6 Columns)'}{' '}
                    · {activeScopeLabelAr} · Total: {filteredEntries.length} words · Print Format:
                    A3 Landscape (Single Master Sheet)
                  </p>
                </div>

                {sheetMode === 'hanzi-only' ? (
                  <table dir="ltr" className="vocab-a3-table-hanzi">
                    <colgroup>
                      {Array.from({ length: 10 }, (_, idx) => (
                        <Fragment key={idx}>
                          <col style={{ width: '2.4%' }} />
                          <col style={{ width: '7.6%' }} />
                        </Fragment>
                      ))}
                    </colgroup>
                    <tbody>
                      {printA3Rows.map((row, rowIdx) => (
                        <tr key={rowIdx}>
                          {Array.from({ length: 10 }, (_, colIdx) => {
                            const entry = row[colIdx];
                            if (!entry) {
                              return (
                                <Fragment key={`p-empty-${rowIdx}-${colIdx}`}>
                                  <td className="a3-serial-cell a3-empty-cell">&nbsp;</td>
                                  <td className="a3-hanzi-cell a3-empty-cell">&nbsp;</td>
                                </Fragment>
                              );
                            }
                            return (
                              <Fragment key={`p-${entry.id}`}>
                                <td className="a3-serial-cell tabular-nums">{entry.serial}</td>
                                <td className="a3-hanzi-cell font-hanzi">{entry.hanzi}</td>
                              </Fragment>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <table dir="ltr" className="vocab-a3-table-full">
                    <colgroup>
                      {Array.from({ length: 6 }, (_, idx) => (
                        <col key={idx} style={{ width: '16.6667%' }} />
                      ))}
                    </colgroup>
                    <tbody>
                      {printA3Rows.map((row, rowIdx) => (
                        <tr key={rowIdx}>
                          {Array.from({ length: 6 }, (_, colIdx) => {
                            const entry = row[colIdx];
                            if (!entry) {
                              return (
                                <td key={`pf-empty-${rowIdx}-${colIdx}`} className="a3-empty-cell">
                                  &nbsp;
                                </td>
                              );
                            }
                            return (
                              <td key={`pf-${entry.id}`}>
                                <div className="a3-full-line">
                                  <span className="a3-full-serial tabular-nums">
                                    {entry.serial}
                                  </span>
                                  <span className="a3-full-hanzi font-hanzi">{entry.hanzi}</span>
                                  <span className="a3-full-pinyin font-pinyin">{entry.pinyin}</span>
                                  <span className="a3-full-arabic">{entry.arabic}</span>
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                <div className="vocab-a3-print-footer">
                  HSK 3.0 Level 1 Practice Portal · Prepared by Instructor Laohu · A3 Landscape Master Print Sheet
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* Tab 2: Comprehensive Grammar Guide (Chapters 1–15)                    */}
      {/* ===================================================================== */}
      {subTab === 'grammar' && (
        <GrammarCollectionTab onSelectLockedChapter={(ch) => setLockedChapterModal(ch)} />
      )}

      {/* ===================================================================== */}
      {/* Tab 3: Dialogues & Sentences Bank (278 sentences across Ch 1–15)      */}
      {/* ===================================================================== */}
      {subTab === 'dialogues' && (
        <DialoguesCollectionTab onSelectLockedChapter={(ch) => setLockedChapterModal(ch)} />
      )}

      {/* Locked chapter modal */}
      <LockedAccessModal
        isOpen={Boolean(lockedChapterModal)}
        itemTitle={
          lockedChapterModal
            ? `Chapter ${lockedChapterModal.id} (第${lockedChapterModal.id}课)`
            : ''
        }
        itemType="chapter"
        onClose={() => setLockedChapterModal(null)}
      />
    </motion.section>
  );
}
