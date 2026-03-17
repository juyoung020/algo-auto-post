'use strict';

const statusDot = document.getElementById('statusDot');
const configStatus = document.getElementById('configStatus');
const historyList = document.getElementById('historyList');
const openOptions = document.getElementById('openOptions');

openOptions.addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
});

// Check GitHub settings
chrome.storage.sync.get(['githubToken', 'repoOwner', 'repoName'], (settings) => {
  const { githubToken, repoOwner, repoName } = settings;
  if (githubToken && repoOwner && repoName) {
    statusDot.classList.add('ok');
    configStatus.textContent = `${repoOwner}/${repoName} 연결됨`;
  } else {
    statusDot.classList.add('warn');
    configStatus.classList.add('missing');
    configStatus.textContent = '설정이 필요합니다. 아래 버튼을 눌러 설정해주세요.';
  }
});

// Load history
chrome.storage.local.get(['history'], ({ history = [] }) => {
  if (history.length === 0) return;

  historyList.innerHTML = history
    .slice(0, 5)
    .map((entry) => {
      const badgeClass = entry.platform === 'BOJ' ? 'boj' : 'pg';
      const badgeLabel = entry.platform === 'BOJ' ? 'BOJ' : 'PG';
      return `
        <div class="history-item">
          <span class="title">
            <span class="badge ${badgeClass}">${badgeLabel}</span>
            ${entry.problemId} ${entry.problemTitle || ''}
          </span>
          <span class="date">${entry.date || ''}</span>
        </div>
      `;
    })
    .join('');
});
