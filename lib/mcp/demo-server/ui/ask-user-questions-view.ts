/**
 * Ask User Questions View - MCP App UI
 *
 * Interactive multiple-choice question card with navigation and keyboard shortcuts.
 * Automatically includes an "Other" option with text input for custom responses.
 * Styled to match shadcn/ui patterns.
 */

export function getAskUserQuestionsViewHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ask User Questions</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    :root {
      --background: hsl(0 0% 100%);
      --foreground: hsl(240 10% 3.9%);
      --card: hsl(0 0% 100%);
      --card-foreground: hsl(240 10% 3.9%);
      --primary: hsl(240 5.9% 10%);
      --primary-foreground: hsl(0 0% 98%);
      --secondary: hsl(240 4.8% 95.9%);
      --secondary-foreground: hsl(240 5.9% 10%);
      --muted: hsl(240 4.8% 95.9%);
      --muted-foreground: hsl(240 3.8% 46.1%);
      --accent: hsl(240 4.8% 95.9%);
      --accent-foreground: hsl(240 5.9% 10%);
      --border: hsl(240 5.9% 90%);
      --input: hsl(240 5.9% 90%);
      --ring: hsl(240 5.9% 10%);
      --radius: 0.5rem;
    }

    @media (prefers-color-scheme: dark) {
      :root {
        --background: hsl(240 10% 3.9%);
        --foreground: hsl(0 0% 98%);
        --card: hsl(240 10% 3.9%);
        --card-foreground: hsl(0 0% 98%);
        --primary: hsl(0 0% 98%);
        --primary-foreground: hsl(240 5.9% 10%);
        --secondary: hsl(240 3.7% 15.9%);
        --secondary-foreground: hsl(0 0% 98%);
        --muted: hsl(240 3.7% 15.9%);
        --muted-foreground: hsl(240 5% 64.9%);
        --accent: hsl(240 3.7% 15.9%);
        --accent-foreground: hsl(0 0% 98%);
        --border: hsl(240 3.7% 15.9%);
        --input: hsl(240 3.7% 15.9%);
        --ring: hsl(240 4.9% 83.9%);
      }
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
      background: var(--background);
      color: var(--foreground);
      padding: 0;
      line-height: 1.5;
    }

    body.dark {
      --background: hsl(240 10% 3.9%);
      --foreground: hsl(0 0% 98%);
      --card: hsl(240 10% 3.9%);
      --card-foreground: hsl(0 0% 98%);
      --primary: hsl(0 0% 98%);
      --primary-foreground: hsl(240 5.9% 10%);
      --secondary: hsl(240 3.7% 15.9%);
      --secondary-foreground: hsl(0 0% 98%);
      --muted: hsl(240 3.7% 15.9%);
      --muted-foreground: hsl(240 5% 64.9%);
      --accent: hsl(240 3.7% 15.9%);
      --accent-foreground: hsl(0 0% 98%);
      --border: hsl(240 3.7% 15.9%);
      --input: hsl(240 3.7% 15.9%);
      --ring: hsl(240 4.9% 83.9%);
    }

    .card {
      background: var(--card);
      border-radius: var(--radius);
      overflow: hidden;
    }

    .card-header {
      display: flex;
      flex-direction: column;
      gap: 0;
      padding: 10px 16px;
      border-bottom: 1px solid var(--border);
    }

    .header-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .card-title {
      font-size: 13px;
      font-weight: 500;
      color: var(--muted-foreground);
    }

    .nav-controls {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .nav-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      border: 1px solid var(--border);
      border-radius: 4px;
      background: var(--background);
      color: var(--foreground);
      cursor: pointer;
      transition: background-color 0.15s, border-color 0.15s;
    }

    .nav-btn:hover:not(:disabled) {
      background: var(--accent);
      border-color: var(--accent-foreground);
    }

    .nav-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .nav-btn svg {
      width: 12px;
      height: 12px;
    }

    .card-content {
      padding: 14px 16px;
    }

    .question-text {
      font-size: 16px;
      font-weight: 500;
      color: var(--card-foreground);
      margin-bottom: 12px;
      line-height: 1.4;
    }

    .options-list {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .option-btn {
      display: flex;
      align-items: center;
      gap: 10px;
      width: 100%;
      padding: 11px 14px;
      border: 1px solid var(--border);
      border-radius: 4px;
      background: var(--background);
      color: var(--foreground);
      font-size: 14px;
      text-align: left;
      cursor: pointer;
      transition: background-color 0.15s, border-color 0.15s, box-shadow 0.15s;
    }

    .option-btn:hover {
      background: var(--accent);
      border-color: var(--accent-foreground);
    }

    .option-btn:focus {
      outline: none;
      box-shadow: 0 0 0 2px var(--ring);
    }

    .option-btn.selected {
      background: var(--primary);
      color: var(--primary-foreground);
      border-color: var(--primary);
    }

    .option-key {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 22px;
      height: 22px;
      border-radius: 3px;
      background: var(--secondary);
      color: var(--secondary-foreground);
      font-size: 12px;
      font-weight: 600;
      flex-shrink: 0;
    }

    .option-btn.selected .option-key {
      background: var(--primary-foreground);
      color: var(--primary);
    }

    .option-label {
      flex: 1;
    }

    .card-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 16px;
      border-top: 1px solid var(--border);
      background: var(--muted);
    }

    .skip-btn {
      padding: 6px 14px;
      border: 1px solid var(--border);
      border-radius: 4px;
      background: var(--background);
      color: var(--muted-foreground);
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      transition: background-color 0.15s, color 0.15s;
    }

    .skip-btn:hover {
      background: var(--accent);
      color: var(--accent-foreground);
    }

    .continue-btn {
      padding: 6px 16px;
      border: none;
      border-radius: 4px;
      background: var(--primary);
      color: var(--primary-foreground);
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      transition: opacity 0.15s;
    }

    .continue-btn:hover:not(:disabled) {
      opacity: 0.9;
    }

    .continue-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .keyboard-hint {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      font-size: 10px;
      line-height: 1;
      color: var(--muted-foreground);
      margin-top: 10px;
      opacity: 0.7;
      width: 100%;
    }

    .keyboard-hint svg {
      width: 11px;
      height: 11px;
      flex-shrink: 0;
      vertical-align: middle;
    }

    .keyboard-hint span {
      vertical-align: middle;
    }

    .submitted-state {
      display: none;
      flex-direction: row;
      align-items: center;
      gap: 12px;
      padding: 16px;
    }

    .submitted-state.active {
      display: flex;
    }

    .submitted-icon {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: var(--primary);
      color: var(--primary-foreground);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .submitted-icon svg {
      width: 16px;
      height: 16px;
    }

    .submitted-text {
      flex: 1;
    }

    .submitted-title {
      font-size: 13px;
      font-weight: 600;
      color: var(--foreground);
      margin-bottom: 2px;
    }

    .submitted-message {
      font-size: 12px;
      color: var(--muted-foreground);
    }

    .question-content {
      display: block;
    }

    .question-content.hidden {
      display: none;
    }

    /* Already answered state */
    .option-btn.disabled {
      opacity: 0.6;
      cursor: default;
      pointer-events: none;
    }

    .option-btn.disabled.was-selected {
      opacity: 1;
      background: var(--secondary);
      border-color: var(--primary);
    }

    .already-answered-notice {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 0;
      margin-top: 6px;
      font-size: 11px;
      color: var(--muted-foreground);
    }

    .already-answered-notice svg {
      width: 14px;
      height: 14px;
      flex-shrink: 0;
    }

    /* Other option text input */
    .other-input-container {
      display: none;
      margin-top: 8px;
      padding: 0;
    }

    .other-input-container.visible {
      display: block;
    }

    .other-input {
      width: 100%;
      padding: 11px 14px;
      border: 1px solid var(--ring);
      border-radius: 4px;
      background: var(--background);
      color: var(--foreground);
      font-size: 14px;
      font-family: inherit;
      outline: none;
      box-shadow: 0 0 0 2px var(--ring);
      transition: border-color 0.15s, box-shadow 0.15s;
    }

    .other-input::placeholder {
      color: var(--muted-foreground);
      opacity: 0.6;
    }

    .other-input:focus {
      border-color: var(--primary);
      box-shadow: 0 0 0 2px var(--ring);
    }

    .other-input:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      background: var(--muted);
    }
  </style>
</head>
<body>
  <div class="card" id="question-card">
    <div class="card-header" id="card-header">
      <div class="header-row">
        <span class="card-title" id="progress">Question 1 of 1</span>
        <div class="nav-controls">
          <button type="button" class="nav-btn" id="prev-btn" aria-label="Previous question" disabled>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="m15 18-6-6 6-6"/>
            </svg>
          </button>
          <button type="button" class="nav-btn" id="next-btn" aria-label="Next question" disabled>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="m9 18 6-6-6-6"/>
            </svg>
          </button>
        </div>
      </div>
      <div class="already-answered-notice" id="answered-notice" style="display: none;">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6 9 17l-5-5"/></svg>
        <span>You've already answered these questions</span>
      </div>
    </div>

    <div class="card-content">
      <div class="question-content" id="question-content">
       
        <div class="question-text" id="question-text">Loading question...</div>
        
        <div class="options-list" id="options-list">
          <!-- Options will be inserted here -->
        </div>
        
        <div class="other-input-container" id="other-input-container">
          <input
            type="text"
            class="other-input"
            id="other-input"
            placeholder="Type your answer here..."
            maxlength="200"
          />
        </div>
        
        <div class="keyboard-hint" id="keyboard-hint">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3H6a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 3 3 0 0 0-3-3z"/></svg>
          <span>A-F select · S skip · ←→ nav · Enter submit</span>
        </div>
      </div>

      <div class="submitted-state" id="submitted-state">
        <div class="submitted-icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 6 9 17l-5-5"/>
          </svg>
        </div>
        <div class="submitted-text">
          <div class="submitted-title">Response Submitted</div>
          <div class="submitted-message">Your answers have been sent.</div>
        </div>
      </div>
    </div>

    <div class="card-footer" id="card-footer">
      <button type="button" class="skip-btn" id="skip-btn">Skip</button>
      <button type="button" class="continue-btn" id="continue-btn" disabled>Next</button>
    </div>
  </div>

  <script>
    // State
    let questions = [];
    let currentIndex = 0;
    let answers = {}; // questionId -> { optionId: string | null, other: string }
    let isSubmitting = false;
    let isAlreadyAnswered = false;
    let savedAnswers = null;

    // DOM elements
    const progressEl = document.getElementById('progress');
    const questionTextEl = document.getElementById('question-text');
    const optionsListEl = document.getElementById('options-list');
    const otherInputContainerEl = document.getElementById('other-input-container');
    const otherInputEl = document.getElementById('other-input');
    const questionContentEl = document.getElementById('question-content');
    const submittedStateEl = document.getElementById('submitted-state');
    const answeredNoticeEl = document.getElementById('answered-notice');
    const keyboardHintEl = document.getElementById('keyboard-hint');
    const cardHeaderEl = document.getElementById('card-header');
    const cardFooterEl = document.getElementById('card-footer');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const skipBtn = document.getElementById('skip-btn');
    const continueBtn = document.getElementById('continue-btn');

    function getOptionKey(index) {
      return String.fromCharCode(65 + index); // A, B, C, D, E, F
    }

    // Generate a unique storage key from questions
    function getStorageKey() {
      if (!questions.length) return null;
      const ids = questions.map(q => q.id).join('|');
      // Simple hash
      let hash = 0;
      for (let i = 0; i < ids.length; i++) {
        hash = ((hash << 5) - hash) + ids.charCodeAt(i);
        hash |= 0;
      }
      return 'mcp-questions-' + Math.abs(hash).toString(36);
    }

    // Check if questions were already answered
    function checkSavedAnswers() {
      const key = getStorageKey();
      if (!key) return false;
      try {
        const saved = localStorage.getItem(key);
        if (saved) {
          const data = JSON.parse(saved);
          if (data.answered && data.answers) {
            savedAnswers = data.answers;
            return true;
          }
        }
      } catch (e) {
        console.error('Error reading saved answers:', e);
      }
      return false;
    }

    // Save answers to localStorage
    function saveAnswers() {
      const key = getStorageKey();
      if (!key) return;
      try {
        localStorage.setItem(key, JSON.stringify({
          answered: true,
          answers: answers,
          timestamp: Date.now()
        }));
      } catch (e) {
        console.error('Error saving answers:', e);
      }
    }

    function initAnswer(questionId) {
      if (!answers[questionId]) {
        answers[questionId] = { optionId: null, other: '' };
      }
    }

    function renderQuestion() {
      if (questions.length === 0) return;

      const question = questions[currentIndex];
      initAnswer(question.id);
      const answer = isAlreadyAnswered ? (savedAnswers[question.id] || {}) : answers[question.id];

      // Update progress
      progressEl.textContent = 'Question ' + (currentIndex + 1) + ' of ' + questions.length;
      questionTextEl.textContent = question.text;

      // Update navigation buttons
      prevBtn.disabled = currentIndex === 0;
      nextBtn.disabled = currentIndex === questions.length - 1;

      // Show/hide already answered notice and keyboard hints
      if (isAlreadyAnswered) {
        answeredNoticeEl.style.display = 'flex';
        keyboardHintEl.style.display = 'none';
      } else {
        answeredNoticeEl.style.display = 'none';
        keyboardHintEl.style.display = 'block';
      }

      // Render options
      optionsListEl.innerHTML = '';

      question.options.forEach((option, idx) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        const isSelected = answer.optionId === option.id;
        let className = 'option-btn';
        if (isAlreadyAnswered) {
          className += ' disabled';
          if (isSelected) className += ' was-selected';
        } else if (isSelected) {
          className += ' selected';
        }
        btn.className = className;
        btn.innerHTML = '<span class="option-key">' + getOptionKey(idx) + '</span><span class="option-label">' + escapeHtml(option.label) + '</span>';
        if (!isAlreadyAnswered) {
          btn.onclick = () => selectOption(option.id);
        }
        optionsListEl.appendChild(btn);
      });

      // Add "Other" option button (max 6 options means "Other" would be at most key F or beyond)
      const otherBtnIdx = question.options.length;
      if (otherBtnIdx < 6) { // Only add if we have room (A-F keys)
        const otherBtn = document.createElement('button');
        otherBtn.type = 'button';
        const otherSelected = answer.other && answer.other.trim().length > 0;
        let otherClassName = 'option-btn';
        if (isAlreadyAnswered) {
          otherClassName += ' disabled';
          if (otherSelected) otherClassName += ' was-selected';
        } else if (otherSelected) {
          otherClassName += ' selected';
        }
        otherBtn.className = otherClassName;
        otherBtn.innerHTML = '<span class="option-key">' + getOptionKey(otherBtnIdx) + '</span><span class="option-label">Other...</span>';
        if (!isAlreadyAnswered) {
          otherBtn.onclick = () => selectOther();
        }
        optionsListEl.appendChild(otherBtn);
      }

      // Show/hide Other input based on whether "Other" is selected
      if (answer.optionId === 'other' || (answer.other && answer.other.trim().length > 0)) {
        // "Other" is selected, show input
        otherInputContainerEl.classList.add('visible');
        if (otherInputEl.value !== answer.other) {
          otherInputEl.value = answer.other || '';
        }
        // Disable input if already answered
        otherInputEl.disabled = isAlreadyAnswered;
        // Auto-focus if it was just selected (empty value) and not already answered
        if (!isAlreadyAnswered && (!answer.other || answer.other.trim().length === 0)) {
          setTimeout(() => otherInputEl.focus(), 50);
        }
      } else {
        // Hide input
        otherInputContainerEl.classList.remove('visible');
        otherInputEl.value = '';
        otherInputEl.disabled = false;
      }

      // Update continue button
      updateContinueButton();

      // Report height to parent after render
      requestAnimationFrame(reportHeight);
    }

    function reportHeight() {
      const height = document.body.scrollHeight;
      window.parent.postMessage({ type: 'mcp:sizeChange', payload: { height } }, '*');
    }

    function escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }

    function selectOption(optionId) {
      const question = questions[currentIndex];
      initAnswer(question.id);
      answers[question.id].optionId = optionId;
      answers[question.id].other = '';
      renderQuestion();
    }

    function selectOther() {
      const question = questions[currentIndex];
      initAnswer(question.id);
      answers[question.id].optionId = 'other';
      // Keep existing "other" text if any, otherwise empty
      if (!answers[question.id].other) {
        answers[question.id].other = '';
      }
      renderQuestion();
    }

    function updateContinueButton() {
      const question = questions[currentIndex];
      const answer = answers[question.id];
      const hasAnswer = (answer.optionId && answer.optionId !== 'other') || (answer.other && answer.other.trim().length > 0);
      const isLast = currentIndex === questions.length - 1;
      
      continueBtn.disabled = !hasAnswer && !isLast;
      continueBtn.textContent = isLast ? 'Submit' : 'Next';
    }

    function goToPrev() {
      if (currentIndex > 0) {
        currentIndex--;
        renderQuestion();
      }
    }

    function goToNext() {
      if (currentIndex < questions.length - 1) {
        currentIndex++;
        renderQuestion();
      }
    }

    function skip() {
      const question = questions[currentIndex];
      initAnswer(question.id);
      answers[question.id] = { optionId: null, other: '' };
      
      if (currentIndex < questions.length - 1) {
        currentIndex++;
        renderQuestion();
      } else {
        submit();
      }
    }

    function continueOrSubmit() {
      const question = questions[currentIndex];
      const answer = answers[question.id];
      const hasAnswer = answer.optionId || answer.other.trim().length > 0;
      
      if (currentIndex < questions.length - 1) {
        currentIndex++;
        renderQuestion();
      } else if (hasAnswer || questions.every(q => answers[q.id]?.optionId || answers[q.id]?.other?.trim())) {
        submit();
      }
    }

    function submit() {
      if (isSubmitting) return;
      isSubmitting = true;
      continueBtn.disabled = true;
      continueBtn.textContent = 'Submitting...';

      // Format the answers
      let formatted = 'Here are my answers to your questions:\\n\\n';
      
      questions.forEach((question, idx) => {
        const answer = answers[question.id] || { optionId: null, other: '' };
        let answerText;
        
        if (answer.other && answer.other.trim()) {
          answerText = 'Other: ' + answer.other.trim();
        } else if (answer.optionId && answer.optionId !== 'other') {
          const option = question.options.find(o => o.id === answer.optionId);
          answerText = option ? option.label : answer.optionId;
        } else {
          answerText = '(Skipped)';
        }
        
        formatted += '- ' + question.text + ': ' + answerText + '\\n';
      });

      // Save answers to localStorage
      saveAnswers();

      // Send the message back to the host
      window.parent.postMessage({
        type: 'mcp:sendMessage',
        payload: { text: formatted.trim() }
      }, '*');

      // Show submitted state
      questionContentEl.classList.add('hidden');
      submittedStateEl.classList.add('active');
      cardHeaderEl.style.display = 'none';
      cardFooterEl.style.display = 'none';

      // Report new height
      requestAnimationFrame(reportHeight);
    }

    // Event listeners
    prevBtn.addEventListener('click', goToPrev);
    nextBtn.addEventListener('click', goToNext);
    skipBtn.addEventListener('click', skip);
    continueBtn.addEventListener('click', continueOrSubmit);

    // "Other" input field listener
    otherInputEl.addEventListener('input', (e) => {
      const question = questions[currentIndex];
      if (!question) return;
      initAnswer(question.id);
      answers[question.id].other = e.target.value;
      answers[question.id].optionId = 'other'; // Mark as "other" option
      updateContinueButton();
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      // Don't intercept if already submitted
      if (isSubmitting) return;

      const question = questions[currentIndex];
      if (!question) return;

      // Don't intercept keyboard shortcuts if user is typing in "Other" input
      const isTypingInOther = document.activeElement === otherInputEl;

      const keyUpper = e.key.toUpperCase();

      // Arrow navigation (always allowed for browsing)
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goToPrev();
        return;
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        goToNext();
        return;
      }

      // Don't allow selection/submission if already answered
      if (isAlreadyAnswered) return;

      // A-F or 1-6 to select option (including "Other") - skip if typing in Other input
      if (!isTypingInOther) {
        const optionIndex = keyUpper.charCodeAt(0) - 65; // A=0, B=1, etc.
        const numIndex = parseInt(e.key, 10) - 1; // 1=0, 2=1, etc.
        const otherIndex = question.options.length; // "Other" comes after regular options
        
        if (optionIndex >= 0 && optionIndex < question.options.length) {
          e.preventDefault();
          selectOption(question.options[optionIndex].id);
        } else if (optionIndex === otherIndex && otherIndex < 6) {
          // Select "Other" option if within A-F range
          e.preventDefault();
          selectOther();
        } else if (numIndex >= 0 && numIndex < question.options.length) {
          e.preventDefault();
          selectOption(question.options[numIndex].id);
        } else if (numIndex === otherIndex && otherIndex < 6) {
          // Select "Other" with number key
          e.preventDefault();
          selectOther();
        }
      }

      // Enter to continue/submit (works from anywhere, including Other input)
      if (e.key === 'Enter' && !continueBtn.disabled) {
        e.preventDefault();
        continueOrSubmit();
      }

      // S to skip current question - skip if typing in Other input
      if (keyUpper === 'S' && !isTypingInOther) {
        e.preventDefault();
        skip();
      }
    });

    // Listen for messages from parent
    window.addEventListener('message', (event) => {
      const { type, payload } = event.data || {};

      // Handle tool result (contains the questions)
      if (type === 'mcp:toolResult' && payload?.content?.[0]?.text) {
        try {
          const data = JSON.parse(payload.content[0].text);
          if (data.questions && Array.isArray(data.questions)) {
            questions = data.questions;
            currentIndex = 0;
            answers = {};
            isAlreadyAnswered = checkSavedAnswers();
            if (isAlreadyAnswered) {
              cardFooterEl.style.display = 'none';
            }
            renderQuestion();
          }
        } catch (err) {
          console.error('Error parsing tool result:', err);
        }
      }

      // Handle tool input (alternative way to receive questions)
      if (type === 'mcp:toolInput' && payload?.arguments?.questions) {
        questions = payload.arguments.questions;
        currentIndex = 0;
        answers = {};
        isAlreadyAnswered = checkSavedAnswers();
        if (isAlreadyAnswered) {
          cardFooterEl.style.display = 'none';
        }
        renderQuestion();
      }

      // Handle theme updates
      if (type === 'mcp:hostContext' && payload?.theme) {
        document.body.className = payload.theme === 'dark' ? 'dark' : '';
      }
    });

    // Signal ready and report initial height
    window.parent.postMessage({ type: 'mcp:ready' }, '*');
    requestAnimationFrame(reportHeight);
  </script>
</body>
</html>`;
}
