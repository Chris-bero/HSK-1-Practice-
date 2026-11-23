export type VocabSheetMode = 'hanzi-only' | 'full-review' | 'categorized';

export interface NumberedVocabEntry {
  serial: number;
  chapterId: number;
  chapterTitleAr: string;
  id: string;
  hanzi: string;
  pinyin: string;
  arabic: string;
}

export interface ExportVocabWordOptions {
  entries: NumberedVocabEntry[];
  mode: 'hanzi-only' | 'full-review';
  scopeLabelAr: string;
  fileScopeTag: string;
}

export interface CategorizedWordGroup {
  id: number;
  titleAr: string;
  titleEn: string;
  entries: NumberedVocabEntry[];
}

export interface ExportCategorizedVocabWordOptions {
  groups: CategorizedWordGroup[];
  totalCount: number;
  scopeLabelAr: string;
  fileScopeTag: string;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function chunkEntries<T>(items: T[], size: number): T[][] {
  const safeSize = Math.max(1, size);
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += safeSize) {
    rows.push(items.slice(i, i + safeSize));
  }
  return rows;
}

/**
 * Generates and downloads a Microsoft Word (.doc) file in A3 Landscape (420mm × 297mm)
 * designed to fit all HSK 3.0 Level 1 vocabulary on a single clean B&W master sheet:
 * - Mode A (hanzi-only): 10 dual columns [shaded # | 12pt Hanzi] (~33 rows)
 * - Mode B (full-review): 6 compact columns [# | Hanzi | Pinyin | Meaning] (~55 rows)
 */
export function downloadVocabularyWordDoc({
  entries,
  mode,
  scopeLabelAr,
  fileScopeTag,
}: ExportVocabWordOptions): void {
  const isHanziOnly = mode === 'hanzi-only';
  const effectiveCols = isHanziOnly ? 10 : 6;

  const modeTitleEn = isHanziOnly
    ? 'Recall Test Sheet — Hanzi Only (10 Columns · A3 Landscape)'
    : 'Complete Review Sheet — Hanzi, Pinyin & Meaning (6 Columns · A3 Landscape)';

  const rows = chunkEntries(entries, effectiveCols);

  let colGroupHtml = '';
  let tableBodyHtml = '';

  if (isHanziOnly) {
    colGroupHtml = `<colgroup>${Array.from(
      { length: 10 },
      () => `<col style="width:2.4%;" /><col style="width:7.6%;" />`
    ).join('')}</colgroup>`;

    tableBodyHtml = rows
      .map((row) => {
        const cells = Array.from({ length: 10 }, (_, idx) => {
          const item = row[idx];
          if (!item) {
            return `<td class="serial-cell empty-cell">&nbsp;</td><td class="hanzi-cell empty-cell">&nbsp;</td>`;
          }
          return (
            `<td class="serial-cell">${item.serial}</td>` +
            `<td class="hanzi-cell" dir="ltr">${escapeHtml(item.hanzi)}</td>`
          );
        }).join('');
        return `<tr>${cells}</tr>`;
      })
      .join('\n');
  } else {
    colGroupHtml = `<colgroup>${Array.from(
      { length: 6 },
      () =>
        `<col style="width:1.65%;" /><col style="width:3.35%;" /><col style="width:4.95%;" /><col style="width:6.716%;" />`
    ).join('')}</colgroup>`;

    tableBodyHtml = rows
      .map((row) => {
        const cells = Array.from({ length: 6 }, (_, idx) => {
          const item = row[idx];
          if (!item) {
            return (
              `<td class="full-serial empty-cell">&nbsp;</td>` +
              `<td class="full-hanzi empty-cell">&nbsp;</td>` +
              `<td class="full-pinyin empty-cell">&nbsp;</td>` +
              `<td class="full-arabic empty-cell">&nbsp;</td>`
            );
          }
          return (
            `<td class="full-serial">${item.serial}</td>` +
            `<td class="full-hanzi" dir="ltr">${escapeHtml(item.hanzi)}</td>` +
            `<td class="full-pinyin" dir="ltr">${escapeHtml(item.pinyin)}</td>` +
            `<td class="full-arabic">${escapeHtml(item.arabic)}</td>`
          );
        }).join('');
        return `<tr>${cells}</tr>`;
      })
      .join('\n');
  }

  const htmlDocument = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40"
      lang="en" dir="ltr">
<head>
  <meta charset="utf-8" />
  <title>HSK 3.0 Level 1 Vocabulary Master Sheet — Instructor Laohu (A3 Landscape)</title>
  <!--[if gte mso 9]>
  <xml>
    <w:WordDocument>
      <w:View>Print</w:View>
      <w:Zoom>75</w:Zoom>
      <w:DoNotOptimizeForBrowser/>
    </w:WordDocument>
  </xml>
  <![endif]-->
  <style>
    @page Section1 {
      size: 420mm 297mm;
      mso-page-orientation: landscape;
      margin: 6mm;
      mso-header-margin: 3mm;
      mso-footer-margin: 3mm;
    }
    div.Section1 {
      page: Section1;
    }
    body {
      font-family: 'Calibri', 'Arial', 'Microsoft YaHei', sans-serif;
      color: #000000;
      background-color: #ffffff;
      margin: 0;
      padding: 0;
    }
    .doc-header {
      text-align: center;
      border-bottom: 1.2pt solid #222222;
      padding-bottom: 3pt;
      margin-bottom: 5pt;
    }
    .doc-title {
      font-size: 12pt;
      font-weight: bold;
      margin: 0 0 2pt 0;
      color: #000000;
      mso-line-height-rule: exactly;
      line-height: 14pt;
    }
    .doc-subtitle {
      font-size: 8pt;
      margin: 0;
      color: #222222;
      mso-line-height-rule: exactly;
      line-height: 10pt;
    }
    table.master-grid {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
      direction: ltr;
      page-break-inside: avoid;
    }
    table.master-grid tr {
      page-break-inside: avoid;
      mso-height-rule: at-least;
    }
    td.serial-cell {
      border: 0.75pt solid #444444;
      background-color: #e5e7eb;
      text-align: center;
      vertical-align: middle;
      font-size: 8.5pt;
      font-weight: bold;
      color: #000000;
      padding: 1.5pt 2pt;
      font-family: 'Arial', sans-serif;
      mso-line-height-rule: exactly;
      line-height: 13pt;
    }
    td.hanzi-cell {
      border: 0.75pt solid #444444;
      background-color: #ffffff;
      text-align: center;
      vertical-align: middle;
      font-size: 12pt;
      font-weight: bold;
      color: #000000;
      padding: 1.5pt 2.5pt;
      font-family: 'KaiTi', 'SimSun', 'Songti SC', 'Microsoft YaHei', serif;
      white-space: nowrap;
      mso-line-height-rule: exactly;
      line-height: 14.5pt;
    }
    td.full-serial {
      border-top: 0.75pt solid #666666;
      border-bottom: 0.75pt solid #666666;
      border-left: 0.75pt solid #444444;
      border-right: 0.5pt solid #999999;
      background-color: #e5e7eb;
      text-align: center;
      vertical-align: middle;
      font-size: 7.5pt;
      font-weight: bold;
      color: #000000;
      padding: 1pt 1.5pt;
      font-family: 'Arial', sans-serif;
      white-space: nowrap;
      mso-line-height-rule: exactly;
      line-height: 10.5pt;
    }
    td.full-hanzi {
      border-top: 0.75pt solid #666666;
      border-bottom: 0.75pt solid #666666;
      border-left: none;
      border-right: 0.4pt solid #cccccc;
      background-color: #ffffff;
      text-align: center;
      vertical-align: middle;
      font-size: 8.5pt;
      font-weight: bold;
      color: #000000;
      padding: 1pt 1.5pt;
      font-family: 'KaiTi', 'SimSun', 'Microsoft YaHei', serif;
      white-space: nowrap;
      mso-line-height-rule: exactly;
      line-height: 10.5pt;
    }
    td.full-pinyin {
      border-top: 0.75pt solid #666666;
      border-bottom: 0.75pt solid #666666;
      border-left: none;
      border-right: 0.4pt solid #cccccc;
      background-color: #ffffff;
      text-align: center;
      vertical-align: middle;
      font-size: 7.5pt;
      color: #222222;
      padding: 1pt 1.5pt;
      font-family: 'Calibri', 'Arial', sans-serif;
      white-space: nowrap;
      mso-line-height-rule: exactly;
      line-height: 10.5pt;
    }
    td.full-arabic {
      border-top: 0.75pt solid #666666;
      border-bottom: 0.75pt solid #666666;
      border-left: none;
      border-right: 0.75pt solid #444444;
      background-color: #ffffff;
      text-align: left;
      vertical-align: middle;
      font-size: 8pt;
      font-weight: normal;
      color: #000000;
      padding: 1pt 2.5pt 1pt 2pt;
      font-family: 'Calibri', 'Arial', sans-serif;
      white-space: nowrap;
      mso-line-height-rule: exactly;
      line-height: 10.5pt;
    }
    td.empty-cell {
      background-color: #fafafa;
    }
    .doc-footer {
      margin-top: 4pt;
      padding-top: 2pt;
      border-top: 0.6pt solid #666666;
      text-align: center;
      font-size: 7.5pt;
      color: #333333;
      mso-line-height-rule: exactly;
      line-height: 9.5pt;
    }
  </style>
</head>
<body>
  <div class="Section1">
    <div class="doc-header">
      <p class="doc-title">HSK 3.0 Level 1 Vocabulary Master Sheet — Instructor Laohu</p>
      <p class="doc-subtitle">${escapeHtml(modeTitleEn)} &nbsp;|&nbsp; Scope: ${escapeHtml(scopeLabelAr)} &nbsp;|&nbsp; Total Words: ${entries.length} &nbsp;|&nbsp; Print Size: A3 Landscape (420mm × 297mm)</p>
    </div>

    <table class="master-grid" cellspacing="0" cellpadding="0">
      ${colGroupHtml}
      <tbody>
        ${tableBodyHtml}
      </tbody>
    </table>

    <div class="doc-footer">
      HSK 3.0 Level 1 Practice Portal · Prepared by Instructor Laohu · A3 Landscape Master Print Sheet
    </div>
  </div>
</body>
</html>`;

  const blob = new Blob(['\ufeff', htmlDocument], {
    type: 'application/msword;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const modeSlug = isHanziOnly ? 'HanziOnly_10Col' : 'FullReview_6Col';
  link.href = url;
  link.download = `HSK3_Laohu_Vocab_A3_${modeSlug}_${fileScopeTag}.doc`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}

/**
 * Generates and downloads a Microsoft Word (.doc) file for the Categorized Vocabulary Compilation
 * (15 thematic sections) in A4 Portrait B&W format with a Table of Contents.
 */
export function downloadCategorizedVocabularyWordDoc({
  groups,
  totalCount,
  scopeLabelAr,
  fileScopeTag,
}: ExportCategorizedVocabWordOptions): void {
  const nonEmptyGroups = groups.filter((g) => g.entries.length > 0);

  const tocRowsHtml = nonEmptyGroups
    .map(
      (group) => `
      <tr>
        <td class="toc-num">${group.id}</td>
        <td class="toc-en">${escapeHtml(group.titleEn)}</td>
        <td class="toc-count">${group.entries.length} words</td>
      </tr>`
    )
    .join('\n');

  const sectionsHtml = nonEmptyGroups
    .map((group) => {
      const rowsHtml = group.entries
        .map(
          (entry, idx) => `
        <tr>
          <td class="cat-num">${idx + 1}</td>
          <td class="cat-hanzi" dir="ltr">${escapeHtml(entry.hanzi)}</td>
          <td class="cat-pinyin" dir="ltr">${escapeHtml(entry.pinyin)}</td>
          <td class="cat-arabic">${escapeHtml(entry.arabic)}</td>
          <td class="cat-ch" dir="ltr">第${entry.chapterId}课</td>
        </tr>`
        )
        .join('\n');

      return `
      <div class="cat-section">
        <div class="cat-heading">
          <span class="cat-heading-main">${group.id}. ${escapeHtml(group.titleEn)}</span>
          <span class="cat-heading-sub"> (${group.entries.length} words)</span>
        </div>
        <table class="cat-table" cellspacing="0" cellpadding="0">
          <thead>
            <tr>
              <th style="width:7%;">#</th>
              <th style="width:20%;">Hanzi</th>
              <th style="width:24%;">Pinyin</th>
              <th style="width:39%;">Meaning</th>
              <th style="width:10%;">Chapter</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </div>`;
    })
    .join('\n');

  const htmlDocument = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40"
      lang="en" dir="ltr">
<head>
  <meta charset="utf-8" />
  <title>HSK 3.0 Level 1 Categorized Vocabulary (15 Thematic Sections) — Instructor Laohu</title>
  <!--[if gte mso 9]>
  <xml>
    <w:WordDocument>
      <w:View>Print</w:View>
      <w:Zoom>100</w:Zoom>
      <w:DoNotOptimizeForBrowser/>
    </w:WordDocument>
  </xml>
  <![endif]-->
  <style>
    @page SectionCat {
      size: 210mm 297mm;
      mso-page-orientation: portrait;
      margin: 12mm 11mm 12mm 11mm;
      mso-header-margin: 6mm;
      mso-footer-margin: 6mm;
    }
    div.SectionCat {
      page: SectionCat;
    }
    body {
      font-family: 'Calibri', 'Arial', 'Microsoft YaHei', sans-serif;
      color: #000000;
      background-color: #ffffff;
      margin: 0;
      padding: 0;
    }
    .doc-header {
      text-align: center;
      border-bottom: 1.5pt solid #000000;
      padding-bottom: 6pt;
      margin-bottom: 12pt;
    }
    .doc-title {
      font-size: 15pt;
      font-weight: bold;
      margin: 0 0 3pt 0;
      color: #000000;
    }
    .doc-subtitle {
      font-size: 9.5pt;
      margin: 0;
      color: #222222;
    }
    .toc-box {
      margin-bottom: 14pt;
      page-break-inside: avoid;
    }
    .toc-title {
      font-size: 11.5pt;
      font-weight: bold;
      background-color: #e5e7eb;
      border: 0.75pt solid #333333;
      border-bottom: none;
      padding: 5pt 8pt;
      margin: 0;
    }
    table.toc-table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
      direction: ltr;
    }
    table.toc-table td {
      border: 0.75pt solid #444444;
      padding: 3.5pt 6pt;
      font-size: 9pt;
      vertical-align: middle;
    }
    td.toc-num {
      width: 8%;
      text-align: center;
      font-weight: bold;
      background-color: #f3f4f6;
    }
    td.toc-en {
      width: 76%;
      text-align: left;
      font-weight: bold;
      color: #000000;
    }
    td.toc-count {
      width: 16%;
      text-align: center;
      font-weight: bold;
    }
    .cat-section {
      margin-top: 12pt;
      margin-bottom: 10pt;
    }
    .cat-heading {
      background-color: #e5e7eb;
      border: 0.75pt solid #333333;
      border-bottom: none;
      padding: 5pt 8pt;
      font-size: 11pt;
      font-weight: bold;
      color: #000000;
      page-break-after: avoid;
    }
    .cat-heading-sub {
      font-size: 9.5pt;
      font-weight: normal;
      color: #222222;
    }
    table.cat-table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
      direction: ltr;
    }
    table.cat-table thead {
      display: table-header-group;
    }
    table.cat-table tr {
      page-break-inside: avoid;
    }
    table.cat-table th {
      border: 0.75pt solid #333333;
      background-color: #f3f4f6;
      padding: 4.5pt 5pt;
      font-size: 9pt;
      font-weight: bold;
      text-align: center;
      color: #000000;
    }
    table.cat-table td {
      border: 0.75pt solid #444444;
      padding: 4pt 6pt;
      vertical-align: middle;
      color: #000000;
    }
    td.cat-num {
      text-align: center;
      font-size: 8.5pt;
      font-weight: bold;
      background-color: #f9fafb;
    }
    td.cat-hanzi {
      text-align: center;
      font-size: 12.5pt;
      font-weight: bold;
      font-family: 'KaiTi', 'SimSun', 'Microsoft YaHei', serif;
    }
    td.cat-pinyin {
      text-align: center;
      font-size: 9.5pt;
      font-family: 'Calibri', 'Arial', sans-serif;
      color: #222222;
    }
    td.cat-arabic {
      text-align: left;
      font-size: 9.5pt;
      font-family: 'Calibri', 'Arial', sans-serif;
    }
    td.cat-ch {
      text-align: center;
      font-size: 8.5pt;
      color: #333333;
      font-family: 'KaiTi', 'SimSun', 'Arial', sans-serif;
    }
    .doc-footer {
      margin-top: 14pt;
      padding-top: 5pt;
      border-top: 0.75pt solid #444444;
      text-align: center;
      font-size: 8.5pt;
      color: #333333;
    }
  </style>
</head>
<body>
  <div class="SectionCat">
    <div class="doc-header">
      <p class="doc-title">HSK 3.0 Level 1 Categorized Vocabulary (15 Thematic Sections) — Instructor Laohu</p>
      <p class="doc-subtitle">Scope: ${escapeHtml(scopeLabelAr)} &nbsp;|&nbsp; Total Words: ${totalCount} &nbsp;|&nbsp; Active Sections: ${nonEmptyGroups.length}</p>
    </div>

    <div class="toc-box">
      <p class="toc-title">Table of Contents — Thematic Sections</p>
      <table class="toc-table" cellspacing="0" cellpadding="0">
        <tbody>
          ${tocRowsHtml}
        </tbody>
      </table>
    </div>

    ${sectionsHtml}

    <div class="doc-footer">
      HSK 3.0 Level 1 Practice Portal · Prepared by Instructor Laohu · Categorized Vocabulary Compilation
    </div>
  </div>
</body>
</html>`;

  const blob = new Blob(['\ufeff', htmlDocument], {
    type: 'application/msword;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `HSK3_Laohu_Vocab_Categorized_15Sections_${fileScopeTag}.doc`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}
