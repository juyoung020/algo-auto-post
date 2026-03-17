'use strict';

// Runs on: https://www.acmicpc.net/problem/*
// Purpose: Capture problem title + description into sessionStorage (synchronous)

(function () {
  const problemId = location.pathname.split('/')[2];
  if (!problemId || isNaN(problemId)) return;

  function getProblemTitle() {
    // BOJ: <span id="problem_title">합</span>
    const el = document.querySelector('#problem_title');
    if (el) return el.textContent.trim();
    // page title: "8393번 - 합"
    const match = document.title.match(/\d+번\s*[-–]\s*(.+)/);
    return match ? match[1].trim() : document.title.trim();
  }

  function getProblemDescription() {
    const el = document.querySelector('#problem_description');
    if (!el) return '';
    return el.innerText.trim();
  }

  const data = {
    problemId,
    problemTitle: getProblemTitle(),
    description: getProblemDescription(),
  };

  // sessionStorage is synchronous and persists across same-tab navigation (same origin)
  sessionStorage.setItem('algoAutoPost_problem', JSON.stringify(data));
  console.log('[AlgoAutoPost] problem stored:', data.problemId, data.problemTitle);
})();
