'use strict';

// Runs on: school.programmers.co.kr/learn/courses/*/lessons/*

(function () {
  let alreadySent = false;

  const lessonId =
    location.pathname.match(/\/lessons\/(\d+)/)?.[1] ||
    location.pathname.match(/\/challenges\/(\d+)/)?.[1] ||
    'unknown';

  console.log('[AlgoAutoPost] Programmers script loaded. lessonId:', lessonId);

  // ── Code extraction ────────────────────────────────────────────────────────
  function getCodeFromDOM() {
    // Monaco: .view-lines 안의 .view-line 중 줄 번호 요소 제거
    // 줄 번호 .view-line은 내부에 .line-numbers 클래스 span을 포함하거나,
    // 텍스트가 순수 숫자(보이지 않는 유니코드 포함)인 경우
    const container = document.querySelector('.monaco-editor .view-lines');
    if (container) {
      const lines = Array.from(container.querySelectorAll('.view-line'));
      if (lines.length > 0) {
        const codeLines = lines.filter((l) => {
          // 줄 번호 전용 span이 있으면 줄 번호 요소
          if (l.querySelector('.line-numbers, .cgmr, [class*="lineNumber"]')) return false;
          // 모든 비가시 문자 제거 후 순수 숫자면 줄 번호
          const stripped = l.textContent.replace(/[\s\u00a0\u200b-\u200f\ufeff\u2003]/g, '');
          if (stripped !== '' && /^\d+$/.test(stripped)) return false;
          return true;
        });

        if (codeLines.length > 0) {
          codeLines.sort((a, b) => (parseInt(a.style.top) || 0) - (parseInt(b.style.top) || 0));
          const code = codeLines.map((l) => l.textContent).join('\n').trimEnd();
          if (code.trim()) {
            console.log('[AlgoAutoPost] code via Monaco DOM, lines:', codeLines.length);
            return code;
          }
        }
      }
    }

    // CodeMirror: .CodeMirror-line 요소로 추출 (줄 번호 없는 순수 코드)
    const cmLines = document.querySelectorAll('.CodeMirror-line');
    if (cmLines.length > 0) {
      console.log('[AlgoAutoPost] code via CodeMirror-line, lines:', cmLines.length);
      return Array.from(cmLines).map((l) => l.textContent).join('\n').trimEnd();
    }
    return '';
  }

  function getLanguage() {
    // 프로그래머스 언어 드롭다운: .dropdown-language .btn
    const el =
      document.querySelector('.dropdown-language .btn') ||
      document.querySelector('.select-box .selected') ||
      document.querySelector('[class*="language"] .selected') ||
      document.querySelector('select[name="language"] option:checked');
    return el?.textContent?.trim() || el?.value?.trim() || '';
  }

  function getTitle() {
    return (
      document.querySelector('.challenge-title')?.textContent?.trim() ||
      document.querySelector('h1')?.textContent?.trim() ||
      `Programmers ${lessonId}`
    );
  }

  function getDescription() {
    return (
      document.querySelector('.problem-description')?.innerText?.trim() ||
      document.querySelector('[class*="description"] p')?.innerText?.trim() ||
      ''
    );
  }

  // ── Result detection ───────────────────────────────────────────────────────
  function isPassed(bodyText) {
    return (
      bodyText.includes('모든 테스트를 통과') ||
      bodyText.includes('테스트를 통과하였습니다') ||
      bodyText.includes('정확도: 100') ||
      bodyText.includes('정확도 : 100') ||
      bodyText.includes('100.0 / 100') ||
      bodyText.includes('100 / 100')
    );
  }

  // 새로고침 시 이미 passed 상태인 텍스트가 남아있어도 재발송하지 않도록
  // 초기 상태를 기록해 두고 "변화"가 생길 때만 감지
  let prevPassed = isPassed(document.body.innerText);
  console.log('[AlgoAutoPost] initial passed state:', prevPassed);

  function checkResult() {
    if (alreadySent) return;

    const currentPassed = isPassed(document.body.innerText);

    // passed 상태로 새로 전환됐을 때만 발송
    if (!currentPassed || prevPassed) {
      prevPassed = currentPassed;
      return;
    }

    prevPassed = true;
    alreadySent = true;

    const code = getCodeFromDOM();
    const language = getLanguage();

    console.log('[AlgoAutoPost] Programmers ACCEPTED! code length:', code.length, '| lang:', language);

    try {
      chrome.runtime.sendMessage({
        type: 'PROGRAMMERS_ACCEPTED',
        data: {
          problemId: lessonId,
          problemTitle: getTitle(),
          description: getDescription(),
          code,
          language,
          problemUrl: location.href,
        },
      });
    } catch (e) {
      console.warn('[AlgoAutoPost] 확장 컨텍스트 만료 — 페이지를 새로고침하세요.', e.message);
      return;
    }

    setTimeout(() => {
      alreadySent = false;
      prevPassed = isPassed(document.body.innerText);
    }, 10000);
  }

  // ── Watch ──────────────────────────────────────────────────────────────────
  const observer = new MutationObserver(checkResult);
  observer.observe(document.body, { childList: true, subtree: true, characterData: true });
  setTimeout(() => observer.disconnect(), 60 * 60 * 1000);
})();
