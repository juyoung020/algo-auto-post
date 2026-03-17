'use strict';

// Runs on: https://www.acmicpc.net/submit/*  AND  /problem/*
// Purpose: Capture code + language into sessionStorage on form submit (synchronous)

(function () {
  // Works on /submit/{id} or /problem/{id} (inline submit)
  const pathParts = location.pathname.split('/');
  const problemId = pathParts[2];
  if (!problemId || isNaN(problemId)) return;

  function getCode() {
    // 1. CodeMirror (BOJ web editor)
    const cmEl = document.querySelector('.CodeMirror');
    if (cmEl && cmEl.CodeMirror) {
      const val = cmEl.CodeMirror.getValue();
      if (val.trim()) return val.trim();
    }

    // 2. Hidden textarea synced with editor
    const textarea = document.querySelector('textarea[name="source"], #source');
    if (textarea && textarea.value.trim()) return textarea.value.trim();

    // 3. ACE editor
    try {
      if (typeof ace !== 'undefined') {
        const aceEl = document.querySelector('.ace_editor');
        if (aceEl) {
          const val = ace.edit(aceEl).getValue();
          if (val.trim()) return val.trim();
        }
      }
    } catch (_) {}

    return '';
  }

  function getLanguage() {
    const select = document.querySelector('select[name="language"], #language');
    if (!select) return '';
    return select.options[select.selectedIndex]?.text?.trim() || '';
  }

  // Attach to any form that looks like a submit form
  const forms = document.querySelectorAll(
    '#submit_form, form[action*="/submit"], form[method="post"]'
  );

  forms.forEach((form) => {
    form.addEventListener('submit', () => {
      // Read problem details stored by boj_problem.js
      let problemDetails = {};
      try {
        problemDetails = JSON.parse(sessionStorage.getItem('algoAutoPost_problem') || '{}');
      } catch (_) {}

      if (problemDetails.problemId !== problemId) {
        problemDetails = { problemId, problemTitle: '', description: '' };
      }

      const pending = {
        problemId,
        problemTitle: problemDetails.problemTitle || '',
        description: problemDetails.description || '',
        code: getCode(),
        language: getLanguage(),
        timestamp: Date.now(),
      };

      // sessionStorage.setItem is synchronous — writes before browser navigates away
      sessionStorage.setItem('algoAutoPost_pending', JSON.stringify(pending));
      console.log('[AlgoAutoPost] pending saved:', pending.problemId, '|', pending.language, '| code length:', pending.code.length);
    });
  });

  if (forms.length === 0) {
    console.log('[AlgoAutoPost] boj_submit: no form found on', location.pathname);
  }
})();
