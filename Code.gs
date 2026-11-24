/**
 * Google Apps Script (Code.gs) — HSK 3.0 Level 1 Practice Portal
 *
 * Deployment steps for your English Google Sheet:
 * 1. Open your Google Sheet > Extensions > Apps Script.
 * 2. Paste this entire file into Code.gs and click Save.
 * 3. Click Deploy > New deployment (or Manage deployments > Edit > New version) > Web app.
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 4. Copy the Web App URL into `src/config/appConfig.ts` (or `VITE_SHEETS_WEB_APP_URL`)
 *    and `public/teacher-dashboard.html`.
 *
 * Tabs managed automatically in this Google Sheet:
 * - Main Students/Access tab (existing sheet, 15 columns; Column 14 JSON permissions & Column 15 device lock untouched)
 * - `Results`:  ['ts', 'code', 'name', 'lesson', 'activity', 'kind', 'correct', 'total', 'pct', 'duration_ms', 'device']
 * - `Exams`:    ['ts', 'code', 'name', 'exam_type', 'exam_title', 'chapters_scope', 'score', 'total', 'pct', 'duration_ms', 'device']
 * - `WrongLog`: ['ts', 'code', 'name', 'lesson', 'activity', 'question', 'user_answer', 'correct_answer']
 *
 * Note: Uses PropertiesService.getScriptProperties() to store the global Teacher Broadcast
 * (`getBroadcast` / `setBroadcast`) without touching student rows.
 */

var BROADCAST_PROPERTY_KEY = 'TEACHER_BROADCAST_JSON';

var STUDENTS_HEADERS = [
  'studentId',
  'studentName',
  'studentCode',
  'totalSolved',
  'correctCount',
  'wrongCount',
  'accuracyPercent',
  'activeMinutes',
  'overallProgressPercent',
  'lastActive',
  'chaptersBreakdown',
  'hskMockResults',
  'hskPatternStats',
  'unlockedAccess',
  'boundDeviceId'
];

var TAB_RESULTS = 'Results';
var TAB_EXAMS = 'Exams';
var TAB_WRONG_LOG = 'WrongLog';

var RESULTS_HEADERS = [
  'ts',
  'code',
  'name',
  'lesson',
  'activity',
  'kind',
  'correct',
  'total',
  'pct',
  'duration_ms',
  'device'
];

var EXAMS_HEADERS = [
  'ts',
  'code',
  'name',
  'exam_type',
  'exam_title',
  'chapters_scope',
  'score',
  'total',
  'pct',
  'duration_ms',
  'device'
];

var WRONG_LOG_HEADERS = [
  'ts',
  'code',
  'name',
  'lesson',
  'activity',
  'question',
  'user_answer',
  'correct_answer'
];

var MAX_WRONG_ROWS_PER_REQUEST = 400;
var MAX_ANALYTICS_GET_ROWS = 2000;

/**
 * Resolves the main Students/Access sheet without ever accidentally picking
 * one of the 3 analytics tabs (`Results`, `Exams`, `WrongLog`).
 */
function getStudentsSheet(ss) {
  var analyticsTabNames = {};
  analyticsTabNames[TAB_RESULTS] = true;
  analyticsTabNames[TAB_EXAMS] = true;
  analyticsTabNames[TAB_WRONG_LOG] = true;

  var sheets = ss.getSheets();
  // 1) Prefer an existing non-analytics sheet whose A1 header is 'studentId'
  for (var i = 0; i < sheets.length; i++) {
    var sh = sheets[i];
    if (analyticsTabNames[sh.getName()]) continue;
    if (sh.getLastRow() > 0) {
      var firstCell = String(sh.getRange(1, 1).getValue() || '').trim();
      if (firstCell === 'studentId') {
        return sh;
      }
    }
  }
  // 2) Otherwise return the first sheet that is not one of the 3 analytics tabs
  for (var j = 0; j < sheets.length; j++) {
    if (!analyticsTabNames[sheets[j].getName()]) {
      return sheets[j];
    }
  }
  return ss.getActiveSheet();
}

/**
 * Auto-creates a logging tab if missing and guarantees its exact header row.
 */
function ensureAnalyticsSheet(ss, tabName, headers) {
  var sheet = ss.getSheetByName(tabName);
  if (!sheet) {
    sheet = ss.insertSheet(tabName);
    sheet.appendRow(headers);
    sheet.setFrozenRows(1);
    return sheet;
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    sheet.setFrozenRows(1);
  } else if (sheet.getLastColumn() < headers.length) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }
  return sheet;
}

function ensureAllAnalyticsSheets(ss) {
  return {
    resultsSheet: ensureAnalyticsSheet(ss, TAB_RESULTS, RESULTS_HEADERS),
    examsSheet: ensureAnalyticsSheet(ss, TAB_EXAMS, EXAMS_HEADERS),
    wrongLogSheet: ensureAnalyticsSheet(ss, TAB_WRONG_LOG, WRONG_LOG_HEADERS)
  };
}

/**
 * Prevents spreadsheet formula injection and bounds text cell lengths safely.
 */
function sanitizeCellText(value, maxLen) {
  var limit = maxLen || 500;
  var str = value === null || value === undefined ? '' : String(value);
  str = str.replace(/\r\n/g, ' ').replace(/[\r\n]/g, ' ').trim();
  if (str.length > limit) {
    str = str.slice(0, limit);
  }
  if (str && /^[=+\-@\t]/.test(str)) {
    return "'" + str;
  }
  return str;
}

function safeNonNegNumber(value, fallback) {
  var n = Number(value);
  if (isNaN(n) || !isFinite(n) || n < 0) {
    return fallback !== undefined ? fallback : 0;
  }
  return Math.round(n);
}

function safePercent(value, num, den) {
  if (value !== undefined && value !== null && value !== '') {
    var parsed = Number(value);
    if (!isNaN(parsed) && isFinite(parsed)) {
      return Math.max(0, Math.min(100, Math.round(parsed)));
    }
  }
  if (den > 0) {
    return Math.max(0, Math.min(100, Math.round((num / den) * 100)));
  }
  return 0;
}

function buildResultRow(entry, fallbackMeta) {
  var meta = fallbackMeta || {};
  var ts = sanitizeCellText(entry.ts || meta.ts || new Date().toISOString(), 64);
  var code = sanitizeCellText(entry.code || entry.studentCode || meta.code || '', 64);
  var name = sanitizeCellText(entry.name || entry.studentName || meta.name || '', 120);
  var lesson = sanitizeCellText(entry.lesson || '', 160);
  var activity = sanitizeCellText(entry.activity || '', 160);
  var kind = sanitizeCellText(entry.kind || 'drill', 64);
  var correct = safeNonNegNumber(entry.correct, 0);
  var total = safeNonNegNumber(entry.total, 0);
  var pct = safePercent(entry.pct, correct, total);
  var durationMs = safeNonNegNumber(entry.duration_ms !== undefined ? entry.duration_ms : entry.durationMs, 0);
  var device = sanitizeCellText(entry.device || entry.deviceId || meta.device || '', 120);

  return [ts, code, name, lesson, activity, kind, correct, total, pct, durationMs, device];
}

function buildExamRow(entry, fallbackMeta) {
  var meta = fallbackMeta || {};
  var ts = sanitizeCellText(entry.ts || meta.ts || new Date().toISOString(), 64);
  var code = sanitizeCellText(entry.code || entry.studentCode || meta.code || '', 64);
  var name = sanitizeCellText(entry.name || entry.studentName || meta.name || '', 120);
  var examType = sanitizeCellText(entry.exam_type || entry.examType || 'exam', 64);
  var examTitle = sanitizeCellText(entry.exam_title || entry.examTitle || '', 180);
  var chaptersScope = sanitizeCellText(entry.chapters_scope || entry.chaptersScope || '', 180);
  var score = safeNonNegNumber(entry.score, 0);
  var total = safeNonNegNumber(entry.total, 0);
  var pct = safePercent(entry.pct, score, total);
  var durationMs = safeNonNegNumber(entry.duration_ms !== undefined ? entry.duration_ms : entry.durationMs, 0);
  var device = sanitizeCellText(entry.device || entry.deviceId || meta.device || '', 120);

  return [ts, code, name, examType, examTitle, chaptersScope, score, total, pct, durationMs, device];
}

function buildWrongRow(entry, fallbackMeta) {
  var meta = fallbackMeta || {};
  var ts = sanitizeCellText(entry.ts || meta.ts || new Date().toISOString(), 64);
  var code = sanitizeCellText(entry.code || entry.studentCode || meta.code || '', 64);
  var name = sanitizeCellText(entry.name || entry.studentName || meta.name || '', 120);
  var lesson = sanitizeCellText(entry.lesson || meta.lesson || '', 160);
  var activity = sanitizeCellText(entry.activity || meta.activity || '', 160);
  var question = sanitizeCellText(entry.question || '', 400);
  var userAnswer = sanitizeCellText(entry.user_answer !== undefined ? entry.user_answer : entry.userAnswer, 300);
  var correctAnswer = sanitizeCellText(entry.correct_answer !== undefined ? entry.correct_answer : entry.correctAnswer, 300);

  return [ts, code, name, lesson, activity, question, userAnswer, correctAnswer];
}

function appendRowsBatch(sheet, rows) {
  if (!rows || rows.length === 0) return 0;
  var startRow = sheet.getLastRow() + 1;
  var numCols = rows[0].length;
  sheet.getRange(startRow, 1, rows.length, numCols).setValues(rows);
  return rows.length;
}

/**
 * Appends any granular analytics entries (results, exams, wrongLog) present on a payload
 * into their respective tabs without touching the Students sheet.
 */
function appendGranularAnalytics(ss, payload) {
  var counts = { results: 0, exams: 0, wrongLog: 0 };
  if (!payload || typeof payload !== 'object') return counts;

  var meta = {
    ts: payload.ts || payload.lastActive || new Date().toISOString(),
    code: payload.code || payload.studentCode || '',
    name: payload.name || payload.studentName || '',
    lesson: payload.lesson || '',
    activity: payload.activity || '',
    device: payload.device || payload.deviceId || ''
  };

  var resultItems = [];
  if (payload.resultEntry && typeof payload.resultEntry === 'object') {
    resultItems.push(payload.resultEntry);
  }
  if (Array.isArray(payload.results)) {
    for (var r = 0; r < payload.results.length; r++) {
      if (payload.results[r] && typeof payload.results[r] === 'object') {
        resultItems.push(payload.results[r]);
      }
    }
  }

  var examItems = [];
  if (payload.examEntry && typeof payload.examEntry === 'object') {
    examItems.push(payload.examEntry);
  }
  if (Array.isArray(payload.exams)) {
    for (var x = 0; x < payload.exams.length; x++) {
      if (payload.exams[x] && typeof payload.exams[x] === 'object') {
        examItems.push(payload.exams[x]);
      }
    }
  }

  var wrongItems = [];
  var rawWrongs = Array.isArray(payload.wrongEntries)
    ? payload.wrongEntries
    : Array.isArray(payload.wrongLog)
      ? payload.wrongLog
      : [];
  for (var w = 0; w < rawWrongs.length && wrongItems.length < MAX_WRONG_ROWS_PER_REQUEST; w++) {
    if (rawWrongs[w] && typeof rawWrongs[w] === 'object') {
      wrongItems.push(rawWrongs[w]);
    }
  }

  if (resultItems.length === 0 && examItems.length === 0 && wrongItems.length === 0) {
    return counts;
  }

  var tabs = ensureAllAnalyticsSheets(ss);

  if (resultItems.length > 0) {
    var resultRows = [];
    for (var i = 0; i < resultItems.length; i++) {
      resultRows.push(buildResultRow(resultItems[i], meta));
    }
    counts.results = appendRowsBatch(tabs.resultsSheet, resultRows);
  }

  if (examItems.length > 0) {
    var examRows = [];
    for (var j = 0; j < examItems.length; j++) {
      examRows.push(buildExamRow(examItems[j], meta));
    }
    counts.exams = appendRowsBatch(tabs.examsSheet, examRows);
  }

  if (wrongItems.length > 0) {
    var wrongRows = [];
    for (var k = 0; k < wrongItems.length; k++) {
      wrongRows.push(buildWrongRow(wrongItems[k], meta));
    }
    counts.wrongLog = appendRowsBatch(tabs.wrongLogSheet, wrongRows);
  }

  return counts;
}

function readAnalyticsTabObjects(ss, tabName, expectedHeaders) {
  var sheet = ss.getSheetByName(tabName);
  if (!sheet || sheet.getLastRow() <= 1) return [];

  var totalRows = sheet.getLastRow();
  var startRow = 2;
  if (totalRows - 1 > MAX_ANALYTICS_GET_ROWS) {
    startRow = totalRows - MAX_ANALYTICS_GET_ROWS + 1;
  }
  var numRows = totalRows - startRow + 1;
  if (numRows <= 0) return [];

  var headerValues = sheet.getRange(1, 1, 1, expectedHeaders.length).getValues()[0];
  var dataValues = sheet.getRange(startRow, 1, numRows, expectedHeaders.length).getValues();
  var out = [];

  for (var i = 0; i < dataValues.length; i++) {
    var row = dataValues[i];
    if (!row[0] && !row[1] && !row[2]) continue;
    var obj = {};
    for (var c = 0; c < expectedHeaders.length; c++) {
      var key = String(headerValues[c] || expectedHeaders[c]);
      var val = row[c];
      if (val instanceof Date) {
        obj[key] = val.toISOString();
      } else {
        obj[key] = val;
      }
    }
    out.push(obj);
  }
  return out;
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  var lockAcquired = false;
  try {
    lockAcquired = lock.tryLock(10000);
    var rawBody = e && e.postData && e.postData.contents ? e.postData.contents : '{}';
    var data = JSON.parse(rawBody);

    // 1) Save/update global Teacher Broadcast banner (does not modify student rows)
    if (data.action === 'setBroadcast') {
      var allowedStyles = ['info', 'important', 'promo'];
      var styleVal = String(data.style || 'info');
      if (allowedStyles.indexOf(styleVal) === -1) styleVal = 'info';

      var broadcastObj = {
        id: String(data.id || ('bc_' + new Date().getTime())),
        enabled: Boolean(data.enabled),
        message: String(data.message || '').trim(),
        style: styleVal,
        ctaLabel: String(data.ctaLabel || '').trim(),
        ctaUrl: String(data.ctaUrl || '').trim(),
        updatedAt: String(data.updatedAt || new Date().toISOString())
      };

      PropertiesService.getScriptProperties().setProperty(
        BROADCAST_PROPERTY_KEY,
        JSON.stringify(broadcastObj)
      );

      return ContentService.createTextOutput(
        JSON.stringify({ ok: true, broadcast: broadcastObj })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    var ss = SpreadsheetApp.getActiveSpreadsheet();

    // 1b) Dedicated granular analytics logging actions (does not alter Students sheet)
    if (data.action === 'logResult') {
      var resPayload = {
        ts: data.ts,
        code: data.code || data.studentCode,
        name: data.name || data.studentName,
        lesson: data.lesson,
        activity: data.activity,
        device: data.device || data.deviceId,
        resultEntry: data.resultEntry || data,
        wrongEntries: data.wrongEntries || data.wrongLog || []
      };
      var resCounts = appendGranularAnalytics(ss, resPayload);
      return ContentService.createTextOutput(
        JSON.stringify({ ok: true, logged: resCounts })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    if (data.action === 'logExam') {
      var examPayload = {
        ts: data.ts,
        code: data.code || data.studentCode,
        name: data.name || data.studentName,
        lesson: data.chapters_scope || data.chaptersScope || data.exam_title || '',
        activity: data.exam_title || data.examTitle || data.exam_type || 'Exam',
        device: data.device || data.deviceId,
        examEntry: data.examEntry || data,
        wrongEntries: data.wrongEntries || data.wrongLog || []
      };
      var examCounts = appendGranularAnalytics(ss, examPayload);
      return ContentService.createTextOutput(
        JSON.stringify({ ok: true, logged: examCounts })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    if (data.action === 'logWrong' || data.action === 'logWrongBatch') {
      var wrongPayload = {
        ts: data.ts,
        code: data.code || data.studentCode,
        name: data.name || data.studentName,
        lesson: data.lesson,
        activity: data.activity,
        wrongEntries: Array.isArray(data.wrongEntries)
          ? data.wrongEntries
          : Array.isArray(data.wrongLog)
            ? data.wrongLog
            : [data]
      };
      var wrongCounts = appendGranularAnalytics(ss, wrongPayload);
      return ContentService.createTextOutput(
        JSON.stringify({ ok: true, logged: wrongCounts })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    if (data.action === 'logAnalyticsBatch') {
      var batchCounts = appendGranularAnalytics(ss, data);
      return ContentService.createTextOutput(
        JSON.stringify({ ok: true, logged: batchCounts })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    var sheet = getStudentsSheet(ss);

    if (sheet.getLastRow() === 0) {
      sheet.appendRow(STUDENTS_HEADERS);
    } else if (sheet.getLastColumn() < STUDENTS_HEADERS.length) {
      sheet.getRange(1, 1, 1, STUDENTS_HEADERS.length).setValues([STUDENTS_HEADERS]);
    }

    var existingRows = sheet.getDataRange().getValues();
    var defaultAccessStr = '{"chapters":[1],"intlMocks":[],"arabicMocks":[],"patterns":[]}';

    function findStudentRowNumber(idVal, codeVal) {
      var targetId = String(idVal || '').trim();
      var targetCode = String(codeVal || '').trim().toLowerCase();
      for (var idx = 1; idx < existingRows.length; idx++) {
        var rId = String(existingRows[idx][0] || '').trim();
        var rCode = String(existingRows[idx][2] || '').trim().toLowerCase();
        if ((targetId && rId === targetId) || (targetCode && rCode === targetCode)) {
          return idx + 1;
        }
      }
      return -1;
    }

    // 2) Register a new student from the Teacher Dashboard
    if (data.action === 'registerStudent') {
      var newCode = String(data.studentCode || '').trim();
      if (findStudentRowNumber(data.studentId, newCode) > 0) {
        return ContentService.createTextOutput(JSON.stringify({ ok: true, alreadyExists: true }))
          .setMimeType(ContentService.MimeType.JSON);
      }

      var initialAccessStr =
        typeof data.unlockedAccess === 'string' && data.unlockedAccess.trim()
          ? data.unlockedAccess
          : data.unlockedAccess && typeof data.unlockedAccess === 'object'
            ? JSON.stringify(data.unlockedAccess)
            : defaultAccessStr;

      sheet.appendRow([
        String(data.studentId || newCode || ''),
        String(data.studentName || '').trim(),
        newCode,
        0,
        0,
        0,
        0,
        0,
        0,
        new Date().toISOString(),
        '[]',
        '[]',
        '{}',
        initialAccessStr,
        ''
      ]);

      return ContentService.createTextOutput(JSON.stringify({ ok: true, registered: true }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // 3) Update granular access permissions (Column 14 only — untouched logic)
    if (data.action === 'updateAccess') {
      var accessStr =
        typeof data.unlockedAccess === 'string' && data.unlockedAccess.trim()
          ? data.unlockedAccess
          : data.unlockedAccess && typeof data.unlockedAccess === 'object'
            ? JSON.stringify(data.unlockedAccess)
            : defaultAccessStr;

      var accessRowIndex = findStudentRowNumber(data.studentId, data.studentCode);
      if (accessRowIndex > 0) {
        sheet.getRange(accessRowIndex, 14).setValue(accessStr);
      } else {
        sheet.appendRow([
          String(data.studentId || data.studentCode || ''),
          String(data.studentName || '').trim(),
          String(data.studentCode || '').trim(),
          0,
          0,
          0,
          0,
          0,
          0,
          new Date().toISOString(),
          '[]',
          '[]',
          '{}',
          accessStr,
          ''
        ]);
      }

      return ContentService.createTextOutput(JSON.stringify({ ok: true, updatedAccess: true }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // 4) Bind student device ID (Column 15 only — untouched logic)
    if (data.action === 'bindDevice') {
      var deviceToBind = String(data.boundDeviceId || data.deviceId || '').trim();
      var bindRowIndex = findStudentRowNumber(data.studentId, data.studentCode);
      if (bindRowIndex > 0 && deviceToBind) {
        var currentDevice = String(existingRows[bindRowIndex - 1][14] || '').trim();
        if (!currentDevice || currentDevice === deviceToBind) {
          sheet.getRange(bindRowIndex, 15).setValue(deviceToBind);
          return ContentService.createTextOutput(JSON.stringify({ ok: true, bound: true }))
            .setMimeType(ContentService.MimeType.JSON);
        }
        return ContentService.createTextOutput(JSON.stringify({ ok: false, alreadyBound: true }))
          .setMimeType(ContentService.MimeType.JSON);
      }
      return ContentService.createTextOutput(JSON.stringify({ ok: false, notFound: true }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // 5) Unbind student device ID (clears Column 15 only — untouched logic)
    if (data.action === 'unbindDevice') {
      var unbindRowIndex = findStudentRowNumber(data.studentId, data.studentCode);
      if (unbindRowIndex > 0) {
        sheet.getRange(unbindRowIndex, 15).setValue('');
      }
      return ContentService.createTextOutput(JSON.stringify({ ok: true, unbound: true }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // 6) Update student progress metrics (Columns 1..13 only; Columns 14..15 preserved intact)
    var breakdownStr =
      typeof data.chaptersBreakdown === 'string'
        ? data.chaptersBreakdown
        : JSON.stringify(data.chaptersBreakdown || []);
    var hskMockStr =
      typeof data.hskMockResults === 'string'
        ? data.hskMockResults
        : JSON.stringify(data.hskMockResults || []);
    var hskPatternStr =
      typeof data.hskPatternStats === 'string'
        ? data.hskPatternStats
        : JSON.stringify(data.hskPatternStats || {});

    var rowValues = [
      String(data.studentId || ''),
      String(data.studentName || ''),
      String(data.studentCode || ''),
      Number(data.totalSolved || 0),
      Number(data.correctCount || 0),
      Number(data.wrongCount || 0),
      Number(data.accuracyPercent || 0),
      Number(data.activeMinutes || 0),
      Number(data.overallProgressPercent || 0),
      data.lastActive || new Date().toISOString(),
      breakdownStr,
      hskMockStr,
      hskPatternStr
    ];

    var targetRowIndex = findStudentRowNumber(data.studentId, data.studentCode);
    if (targetRowIndex > 0) {
      sheet.getRange(targetRowIndex, 1, 1, rowValues.length).setValues([rowValues]);
      var existingAccessCell = existingRows[targetRowIndex - 1][13];
      if (!existingAccessCell || String(existingAccessCell).trim() === '') {
        sheet.getRange(targetRowIndex, 14).setValue(defaultAccessStr);
      }
    } else {
      rowValues.push(defaultAccessStr);
      rowValues.push('');
      sheet.appendRow(rowValues);
    }

    // Also append any optional granular analytics bundled with the progress sync
    var piggybackCounts = appendGranularAnalytics(ss, data);

    return ContentService.createTextOutput(JSON.stringify({ ok: true, logged: piggybackCounts }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    if (lockAcquired) {
      try {
        lock.releaseLock();
      } catch (eRel) {
        // Ignore lock release errors
      }
    }
  }
}

function doGet(e) {
  try {
    // Fetch active Teacher Broadcast banner via ?action=getBroadcast
    if (e && e.parameter && e.parameter.action === 'getBroadcast') {
      var rawBroadcast = PropertiesService.getScriptProperties().getProperty(BROADCAST_PROPERTY_KEY);
      var parsedBroadcast = null;
      if (rawBroadcast) {
        try {
          parsedBroadcast = JSON.parse(rawBroadcast);
        } catch (errB) {
          parsedBroadcast = null;
        }
      }
      return ContentService.createTextOutput(
        JSON.stringify({ ok: true, broadcast: parsedBroadcast })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    var ss = SpreadsheetApp.getActiveSpreadsheet();

    // Auto-create missing analytics tabs cleanly on first GET as well
    try {
      ensureAllAnalyticsSheets(ss);
    } catch (eInit) {
      // Proceed safely even if running in a restricted read context
    }

    var sheet = getStudentsSheet(ss);
    var values = sheet.getDataRange().getValues();
    var students = [];

    if (values.length > 1) {
      var headers = values[0];

      for (var i = 1; i < values.length; i++) {
        var row = values[i];
        if (!row[0] && !row[1] && !row[2]) continue;

        var item = {};
        for (var c = 0; c < headers.length; c++) {
          item[String(headers[c])] = row[c];
        }

        var rawBreakdown = item.chaptersBreakdown !== undefined ? item.chaptersBreakdown : row[10];
        var parsedBreakdown = [];
        if (typeof rawBreakdown === 'string' && rawBreakdown.trim()) {
          try { parsedBreakdown = JSON.parse(rawBreakdown); } catch (e0) { parsedBreakdown = []; }
        } else if (Array.isArray(rawBreakdown)) {
          parsedBreakdown = rawBreakdown;
        }

        var rawHskMock = item.hskMockResults !== undefined ? item.hskMockResults : row[11];
        var parsedHskMock = [];
        if (typeof rawHskMock === 'string' && rawHskMock.trim()) {
          try { parsedHskMock = JSON.parse(rawHskMock); } catch (e1) { parsedHskMock = []; }
        } else if (Array.isArray(rawHskMock)) {
          parsedHskMock = rawHskMock;
        }

        var rawHskPattern = item.hskPatternStats !== undefined ? item.hskPatternStats : row[12];
        var parsedHskPattern = {};
        if (typeof rawHskPattern === 'string' && rawHskPattern.trim()) {
          try { parsedHskPattern = JSON.parse(rawHskPattern); } catch (e2) { parsedHskPattern = {}; }
        } else if (rawHskPattern && typeof rawHskPattern === 'object') {
          parsedHskPattern = rawHskPattern;
        }

        var rawAccess = item.unlockedAccess !== undefined ? item.unlockedAccess : row[13];
        var parsedAccess = { chapters: [1], intlMocks: [], arabicMocks: [], patterns: [] };
        if (typeof rawAccess === 'string' && rawAccess.trim()) {
          try { parsedAccess = JSON.parse(rawAccess); } catch (e3) { parsedAccess = { chapters: [1], intlMocks: [], arabicMocks: [], patterns: [] }; }
        } else if (rawAccess && typeof rawAccess === 'object') {
          parsedAccess = rawAccess;
        }

        var rawBoundDevice = item.boundDeviceId !== undefined ? item.boundDeviceId : row[14];
        var parsedBoundDevice = rawBoundDevice ? String(rawBoundDevice).trim() : '';

        students.push({
          studentId: String(item.studentId || row[0] || ''),
          studentName: String(item.studentName || row[1] || ''),
          studentCode: String(item.studentCode || row[2] || ''),
          totalSolved: Number(item.totalSolved || row[3] || 0),
          correctCount: Number(item.correctCount || row[4] || 0),
          wrongCount: Number(item.wrongCount || row[5] || 0),
          accuracyPercent: Number(item.accuracyPercent || row[6] || 0),
          activeMinutes: Number(item.activeMinutes || row[7] || 0),
          overallProgressPercent: Number(item.overallProgressPercent || row[8] || 0),
          lastActive: item.lastActive ? String(item.lastActive) : '',
          chaptersBreakdown: parsedBreakdown,
          hskMockResults: parsedHskMock,
          hskPatternStats: parsedHskPattern,
          unlockedAccess: parsedAccess,
          boundDeviceId: parsedBoundDevice
        });
      }
    }

    var results = readAnalyticsTabObjects(ss, TAB_RESULTS, RESULTS_HEADERS);
    var exams = readAnalyticsTabObjects(ss, TAB_EXAMS, EXAMS_HEADERS);
    var wrongLog = readAnalyticsTabObjects(ss, TAB_WRONG_LOG, WRONG_LOG_HEADERS);

    // Return backward-compatible envelope (`students` array read by existing frontend & dashboard,
    // plus granular `results`, `exams`, and `wrongLog` arrays).
    return ContentService.createTextOutput(
      JSON.stringify({
        ok: true,
        students: students,
        results: results,
        exams: exams,
        wrongLog: wrongLog
      })
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(
      JSON.stringify({
        ok: false,
        students: [],
        results: [],
        exams: [],
        wrongLog: [],
        error: String(err)
      })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}
