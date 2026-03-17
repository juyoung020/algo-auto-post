# Algo Auto Post
<img width="965" height="886" alt="image" src="https://github.com/user-attachments/assets/222a7ec2-c7b3-4629-a99e-b2789b9e94e7" />
<img width="391" height="411" alt="image" src="https://github.com/user-attachments/assets/14f34a8c-5ca6-4f49-95e3-9eb88e8965a3" />

백준(BOJ) / 프로그래머스 문제를 맞추면 **자동으로 GitHub Jekyll 블로그에 포스팅**하는 Chrome 확장 프로그램입니다.

---

## 주요 기능

- 백준에서 **맞았습니다!!** 판정 시 자동 감지
- 프로그래머스에서 **100점** 달성 시 자동 감지
- solved.ac에서 **문제 난이도** 자동으로 태그에 추가 (Bronze ~ Ruby)
- 사용 **언어 태그** 자동 추가 (Python, C++, Java 등)
- GitHub API를 통해 `_posts/` 폴더에 마크다운 파일 자동 생성
- Jekyll Chirpy 테마 frontmatter 형식 지원

---

## 생성되는 포스트 예시

**파일명**: `_posts/2026-03-17-boj-8393.md`

```markdown
---
title: "[BOJ 8393] 합"
excerpt: "n이 주어졌을 때, 1부터 n까지 합을 구하는 문제"
categories:
  - BOJ
  - Koala 22기
tags:
  - Python
  - Silver
toc: true
toc_sticky: true
date: 2026-03-17
---

## 🔗 문제 링크
## 📝 문제 설명
## 💡 접근
## ✅ 풀이
## 💻 코드
```

> 💡 접근 / 풀이 섹션은 직접 작성할 수 있도록 빈칸으로 올라갑니다.

---

## 설치 방법

1. 이 저장소를 ZIP으로 다운로드하거나 클론
2. Chrome 주소창에 `chrome://extensions` 입력
3. 우상단 **개발자 모드** 활성화
4. **압축해제된 확장 프로그램을 로드합니다** 클릭
5. 다운로드한 폴더 선택

---

## 초기 설정

확장 프로그램 아이콘 우클릭 → **옵션** 에서 아래 항목 입력 후 저장:

| 항목 | 설명 | 예시 |
|---|---|---|
| GitHub Token | Fine-grained PAT (Contents: Read & Write) | `ghp_xxxx...` |
| GitHub 사용자명 | GitHub 계정 이름 | `juyoung020` |
| 저장소 이름 | GitHub Pages 저장소명 | `juyoung020.github.io` |
| 브랜치 | 기본 브랜치 | `master` |
| 추가 카테고리 | 쉼표로 구분 (선택) | `Koala 22기` |

### GitHub Token 발급 방법

1. GitHub → **Settings** → **Developer settings** → **Personal access tokens** → **Fine-grained tokens**
2. **Generate new token** 클릭
3. Repository access: **Only select repositories** → 본인 블로그 저장소 선택
4. Repository permissions → **Contents: Read and Write** 설정
5. 발급된 토큰을 옵션 페이지에 입력

---

## 동작 흐름

**백준**
```
문제 페이지 접속 → 제목·설명 저장
    ↓
제출 페이지에서 코드 제출 → 코드·언어 저장
    ↓
채점 현황에서 "맞았습니다!!" 감지
    ↓
solved.ac API로 난이도 조회
    ↓
GitHub API로 _posts/에 마크다운 파일 생성
```

**프로그래머스**
```
채점 결과 100점 감지 (MutationObserver)
    ↓
CodeMirror 에디터에서 코드 추출
    ↓
GitHub API로 _posts/에 마크다운 파일 생성
```

---

## 지원 언어

Python, C++, C, Java, JavaScript, TypeScript, Kotlin, Swift, Go, Rust, Ruby 등

---

## 지원 플랫폼

| 플랫폼 | 상태 |
|---|---|
| 백준 (acmicpc.net) | ✅ 지원 |
| 프로그래머스 (school.programmers.co.kr) | ✅ 지원 |
