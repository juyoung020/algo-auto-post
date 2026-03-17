'use strict';

// Runs on: https://www.acmicpc.net/status*
// Purpose: Detect "맞았습니다!!" and trigger GitHub post

(function () {
  const STORAGE_KEY = 'algoAutoPost_pending';
  const processedIds = new Set();

  function getPending() {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (_) {
      return null;
    }
  }

  function getSubmissionId(row) {
    return row.querySelectorAll('td')[0]?.textContent?.trim() || null;
  }

  function getProblemIdFromRow(row) {
    const link = row.querySelector('a[href*="/problem/"]');
    if (!link) return null;
    return link.href.split('/problem/')[1]?.split('?')[0]?.trim() || null;
  }

  function getLanguageFromRow(row) {
    // Columns: 0=제출번호 1=아이디 2=문제 3=결과 4=메모리 5=시간 6=언어 7=코드길이 8=제출시간
    return row.querySelectorAll('td')[6]?.textContent?.trim() || '';
  }

  function isAccepted(row) {
    // Try multiple selectors BOJ might use
    const candidates = [
      row.querySelector('.result-text'),
      row.querySelector('[id^="result-"]'),
      row.querySelector('td.result span'),
      row.querySelector('td:nth-child(4) span'),
    ];
    for (const el of candidates) {
      if (el && el.textContent.includes('맞았습니다')) return true;
    }
    return false;
  }

  function checkFirstRow() {
    const tbody = document.querySelector('#status-table tbody');
    if (!tbody) return;

    const firstRow = tbody.querySelector('tr');
    if (!firstRow) return;

    const submissionId = getSubmissionId(firstRow);
    if (!submissionId || processedIds.has(submissionId)) return;

    if (!isAccepted(firstRow)) return;

    // Got an accepted result — read pending submission data
    const pending = getPending();

    if (!pending) {
      // No pending means user is just browsing; don't auto-post
      console.log('[AlgoAutoPost] 맞았습니다!! detected but no pending submission in sessionStorage. Skipping.');
      return;
    }

    const age = Date.now() - pending.timestamp;
    if (age > 10 * 60 * 1000) {
      console.log('[AlgoAutoPost] Pending submission is too old (' + Math.round(age / 1000) + 's). Skipping.');
      return;
    }

    const problemIdFromRow = getProblemIdFromRow(firstRow);
    if (problemIdFromRow && problemIdFromRow !== pending.problemId) {
      console.log('[AlgoAutoPost] Problem ID mismatch: row=' + problemIdFromRow + ' pending=' + pending.problemId);
      return;
    }

    processedIds.add(submissionId);

    // Use language from row if better
    const language = getLanguageFromRow(firstRow) || pending.language;

    // Clear pending so we don't post again on next visit
    sessionStorage.removeItem(STORAGE_KEY);

    const data = { ...pending, language, submissionId };
    console.log('[AlgoAutoPost] Sending BOJ_ACCEPTED:', data.problemId, data.language);

    chrome.runtime.sendMessage({ type: 'BOJ_ACCEPTED', data });
  }

  // --- Setup ---
  const tbody = document.querySelector('#status-table tbody');
  if (!tbody) {
    console.log('[AlgoAutoPost] #status-table tbody not found. Wrong page?');
    return;
  }

  // Check immediately (result might already be updated)
  checkFirstRow();

  // Watch for AJAX result updates (BOJ polls and updates the DOM)
  const observer = new MutationObserver(() => checkFirstRow());
  observer.observe(tbody, {
    childList: true,
    subtree: true,
    characterData: true,
  });

  // Clean up after 15 minutes
  setTimeout(() => observer.disconnect(), 15 * 60 * 1000);

  console.log('[AlgoAutoPost] boj_status watching. pending:', getPending()?.problemId || 'none');
})();
