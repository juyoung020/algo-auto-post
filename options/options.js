'use strict';

const fields = ['githubToken', 'repoOwner', 'repoName', 'branch', 'extraCategories'];
const saveBtn = document.getElementById('saveBtn');
const toast = document.getElementById('toast');

// Load saved settings
chrome.storage.sync.get(fields, (data) => {
  for (const key of fields) {
    const el = document.getElementById(key);
    if (el && data[key]) el.value = data[key];
  }
  // Default branch to 'main' if not set
  if (!data.branch) {
    document.getElementById('branch').value = 'main';
  }
});

// Save settings
saveBtn.addEventListener('click', () => {
  const values = {};
  let hasError = false;

  for (const key of fields) {
    const el = document.getElementById(key);
    values[key] = el ? el.value.trim() : '';
  }

  if (!values.githubToken) {
    showToast('GitHub Token을 입력해주세요.', true);
    hasError = true;
  }
  if (!values.repoOwner) {
    showToast('GitHub 사용자명을 입력해주세요.', true);
    hasError = true;
  }
  if (!values.repoName) {
    showToast('저장소 이름을 입력해주세요.', true);
    hasError = true;
  }
  if (hasError) return;

  if (!values.branch) values.branch = 'main';

  chrome.storage.sync.set(values, () => {
    showToast('저장되었습니다!', false);
  });
});

function showToast(message, isError) {
  toast.textContent = message;
  toast.className = 'toast' + (isError ? ' error' : '');
  setTimeout(() => { toast.textContent = ''; }, 3000);
}
