'use strict';

// ─── Message Handler ────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'BOJ_ACCEPTED') {
    handleAccepted(message.data, 'BOJ').then(sendResponse);
    return true;
  }
  if (message.type === 'PROGRAMMERS_ACCEPTED') {
    handleAccepted(message.data, 'PROGRAMMERS').then(sendResponse);
    return true;
  }
});

// ─── Core Handler ────────────────────────────────────────────────────────────

async function handleAccepted(data, platform) {
  console.log('[AlgoAutoPost] handleAccepted start:', data.problemId, platform);
  const settings = await getSettings();
  console.log('[AlgoAutoPost] settings loaded. token exists:', !!settings.githubToken, '| repo:', settings.repoOwner + '/' + settings.repoName);

  if (!settings.githubToken || !settings.repoOwner || !settings.repoName) {
    console.warn('[AlgoAutoPost] GitHub settings missing — open options page to configure.');
    notify('설정 필요', 'GitHub 설정을 먼저 완료해주세요. (확장 프로그램 옵션 열기)');
    return { success: false, error: 'missing_settings' };
  }

  // If description is missing, fetch from BOJ
  if (platform === 'BOJ' && !data.description) {
    console.log('[AlgoAutoPost] fetching problem details from BOJ...');
    const fetched = await fetchBOJDetails(data.problemId);
    data.problemTitle = data.problemTitle || fetched.title;
    data.description = fetched.description;
  }

  // Fetch difficulty from solved.ac
  if (platform === 'BOJ') {
    data.level = await fetchBOJLevel(data.problemId);
    console.log('[AlgoAutoPost] solved.ac level:', data.level);
  }

  const today = getLocalDate();
  const prefix = platform === 'BOJ' ? 'boj' : 'pg';
  const filename = `${today}-${prefix}-${data.problemId}.md`;
  console.log('[AlgoAutoPost] pushing to GitHub:', filename);
  const markdown = generateMarkdown(data, platform, today, settings);

  try {
    const result = await pushToGitHub(markdown, filename, settings);
    console.log('[AlgoAutoPost] GitHub result:', JSON.stringify(result));
    if (result.success) {
      notify('포스팅 완료!', `${data.problemTitle} 풀이가 블로그에 올라갔습니다.`);
      await saveHistory({ ...data, platform, filename, date: today });
    } else {
      notify('GitHub 오류', result.error || '알 수 없는 오류가 발생했습니다.');
    }
    return result;
  } catch (e) {
    console.error('[AlgoAutoPost] pushToGitHub threw:', e);
    notify('오류 발생', e.message);
    return { success: false, error: e.message };
  }
}

// ─── Markdown Generator ──────────────────────────────────────────────────────

function generateMarkdown(data, platform, date, settings) {
  const { problemId, problemTitle, description, code, language, level } = data;
  const langTag = normalizeLanguage(language);       // 코드 펜스용: python, cpp
  const langDisplay = normalizeLanguageDisplay(language); // 태그용: Python, C++
  const titlePrefix = platform === 'BOJ' ? 'BOJ' : 'PG';
  const problemUrl =
    platform === 'BOJ'
      ? `https://www.acmicpc.net/problem/${problemId}`
      : data.problemUrl || '';

  // Build categories list
  const baseCategory = platform === 'BOJ' ? 'BOJ' : 'Programmers';
  const extraCategories = settings.extraCategories
    ? settings.extraCategories
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean)
    : [];
  const categoriesYaml = [baseCategory, ...extraCategories]
    .map((c) => `  - ${c}`)
    .join('\n');

  // Tags: language display name + difficulty level
  const tags = [langDisplay];
  if (level) tags.push(level);
  const tagsYaml = tags.map((t) => `  - ${t}`).join('\n');

  // Use first line of description as excerpt (max 150 chars)
  const excerpt = (description || '')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 150);

  const cleanDescription = (description || '').trim();

  return `---
title: "[${titlePrefix} ${problemId}] ${problemTitle}"
excerpt: "${excerpt}"
categories:
${categoriesYaml}
tags:
${tagsYaml}
toc: true
toc_sticky: true
date: ${date}
---

## 🔗 문제 링크
[${titlePrefix} ${problemId} - ${problemTitle}](${problemUrl})

## 📝 문제 설명
${cleanDescription}

## 💡 접근


## ✅ 풀이


## 💻 코드
\`\`\`${langTag}
${code}
\`\`\`
`;
}

// 태그에 표시되는 이름: Python, C++, Java 등
function normalizeLanguageDisplay(language) {
  if (!language) return 'text';
  const clean = language.replace(/\s*[/(（].*/, '').trim();
  const map = {
    'Python 3': 'Python',
    'Python3': 'Python',
    'Python': 'Python',
    'PyPy3': 'Python',
    'PyPy': 'Python',
    'C++17': 'C++',
    'C++14': 'C++',
    'C++': 'C++',
    'C': 'C',
    'Java 11': 'Java',
    'Java 8': 'Java',
    'Java': 'Java',
    'JavaScript (Node.js)': 'JavaScript',
    'JavaScript': 'JavaScript',
    'TypeScript': 'TypeScript',
    'Kotlin': 'Kotlin',
    'Swift': 'Swift',
    'Go': 'Go',
    'Rust': 'Rust',
    'Ruby': 'Ruby',
  };
  return map[clean] || map[language] || clean;
}

// 코드 펜스에 쓰이는 식별자: python, cpp, java 등
function normalizeLanguage(language) {
  if (!language) return 'text';
  // Strip trailing modifiers like "/ 수정", "(수정)", "/ 조건부 컴파일" etc.
  const clean = language.replace(/\s*[/(（].*/, '').trim();
  const map = {
    'Python 3': 'python',
    'Python3': 'python',
    'Python': 'python',
    'PyPy3': 'python',
    'PyPy': 'python',
    'C++17': 'cpp',
    'C++14': 'cpp',
    'C++': 'cpp',
    'C': 'c',
    'Java 11': 'java',
    'Java 8': 'java',
    'Java': 'java',
    'JavaScript (Node.js)': 'javascript',
    'JavaScript': 'javascript',
    'TypeScript': 'typescript',
    'Kotlin': 'kotlin',
    'Swift': 'swift',
    'Go': 'go',
    'Rust': 'rust',
    'Ruby': 'ruby',
  };
  return map[clean] || map[language] || clean.toLowerCase().replace(/\s+/g, '');
}

// ─── GitHub API ──────────────────────────────────────────────────────────────

async function pushToGitHub(markdown, filename, settings) {
  const { githubToken, repoOwner, repoName, branch = 'main' } = settings;
  const path = `_posts/${filename}`;
  const apiUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${path}`;

  // UTF-8 safe base64 encoding
  const encoded = btoa(
    encodeURIComponent(markdown).replace(/%([0-9A-F]{2})/g, (_, p1) =>
      String.fromCharCode(parseInt(p1, 16))
    )
  );

  const headers = {
    Authorization: `Bearer ${githubToken}`,
    'Content-Type': 'application/json',
    Accept: 'application/vnd.github.v3+json',
  };

  // Check if file already exists (need sha to update)
  let sha = null;
  try {
    const checkRes = await fetch(apiUrl, { headers });
    if (checkRes.ok) {
      const existing = await checkRes.json();
      sha = existing.sha;
    }
  } catch (_) {}

  const body = {
    message: `Add solution: ${filename}`,
    content: encoded,
    branch,
  };
  if (sha) body.sha = sha;

  const res = await fetch(apiUrl, {
    method: 'PUT',
    headers,
    body: JSON.stringify(body),
  });

  if (res.ok) {
    const data = await res.json();
    return { success: true, url: data.content?.html_url };
  } else {
    const err = await res.json();
    return { success: false, error: err.message };
  }
}

// ─── solved.ac Level Fetcher ─────────────────────────────────────────────────

async function fetchBOJLevel(problemId) {
  try {
    const res = await fetch(`https://solved.ac/api/v3/problem/show?problemId=${problemId}`);
    if (!res.ok) return null;
    const data = await res.json();
    return levelToTag(data.level);
  } catch (_) {
    return null;
  }
}

function levelToTag(level) {
  // solved.ac levels: 0=Unrated, 1-5=Bronze, 6-10=Silver, 11-15=Gold, 16-20=Platinum, 21-25=Diamond, 26-30=Ruby
  if (!level || level === 0) return null;
  if (level <= 5)  return 'Bronze';
  if (level <= 10) return 'Silver';
  if (level <= 15) return 'Gold';
  if (level <= 20) return 'Platinum';
  if (level <= 25) return 'Diamond';
  return 'Ruby';
}

// ─── BOJ Problem Fetcher ─────────────────────────────────────────────────────

async function fetchBOJDetails(problemId) {
  try {
    const res = await fetch(`https://www.acmicpc.net/problem/${problemId}`);
    const html = await res.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    const titleEl = doc.querySelector('#problem_title');
    const title = titleEl ? titleEl.textContent.trim() : `${problemId}`;

    const descEl = doc.querySelector('#problem_description');
    const description = descEl ? descEl.textContent.replace(/\s+/g, ' ').trim() : '';

    return { title, description };
  } catch (_) {
    return { title: `BOJ ${problemId}`, description: '' };
  }
}

// ─── Date / Utilities ────────────────────────────────────────────────────────

function getLocalDate() {
  // Use local timezone (KST = UTC+9) instead of UTC to avoid off-by-one-day issues
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function notify(title, message) {
  console.log(`[AlgoAutoPost] ${title}: ${message}`);
}

async function getSettings() {
  return chrome.storage.sync.get([
    'githubToken',
    'repoOwner',
    'repoName',
    'branch',
    'extraCategories',
  ]);
}

async function saveHistory(entry) {
  const { history = [] } = await chrome.storage.local.get(['history']);
  history.unshift(entry);
  if (history.length > 50) history.splice(50);
  chrome.storage.local.set({ history });
}
