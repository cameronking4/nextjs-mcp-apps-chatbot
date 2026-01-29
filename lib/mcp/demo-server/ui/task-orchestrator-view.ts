/**
 * Task Orchestrator View - MCP App UI
 *
 * Interactive task plan display with progress tracking,
 * hierarchical task tree, and real-time status updates.
 * Styled to match shadcn/ui patterns.
 */

export function getTaskOrchestratorViewHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Task Orchestrator</title>
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
      --ring: hsl(240 5.9% 10%);
      --radius: 0.5rem;
      
      /* Status colors */
      --pending: hsl(240 4.8% 65%);
      --in-progress: hsl(217 91% 60%);
      --completed: hsl(142 76% 36%);
      --failed: hsl(0 84% 60%);
      --skipped: hsl(240 4.8% 65%);
      
      /* Celebration (emerald) */
      --emerald-50: hsl(152 81% 96%);
      --emerald-100: hsl(149 80% 90%);
      --emerald-500: hsl(160 84% 39%);
      --emerald-600: hsl(161 94% 30%);
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
        --ring: hsl(240 4.9% 83.9%);
        
        --emerald-50: hsl(152 81% 10%);
        --emerald-100: hsl(149 80% 15%);
        --emerald-500: hsl(160 84% 39%);
        --emerald-600: hsl(161 94% 50%);
      }
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
      background: var(--background);
      color: var(--foreground);
      padding: 0;
      line-height: 1.4;
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
      --ring: hsl(240 4.9% 83.9%);
      
      --emerald-50: hsl(152 81% 10%);
      --emerald-100: hsl(149 80% 15%);
      --emerald-500: hsl(160 84% 39%);
      --emerald-600: hsl(161 94% 50%);
    }

    .card {
      background: var(--card);
      border-radius: var(--radius);
      overflow: hidden;
    }

    .card-header {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 12px 14px;
      border-bottom: 1px solid var(--border);
    }

    .header-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }

    .goal-text {
      font-size: 13px;
      font-weight: 600;
      color: var(--card-foreground);
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .progress-stats {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      color: var(--muted-foreground);
      flex-shrink: 0;
    }

    .progress-count {
      font-weight: 600;
      color: var(--foreground);
    }

    .progress-bar-container {
      width: 100%;
      height: 6px;
      background: var(--secondary);
      border-radius: 3px;
      overflow: hidden;
    }

    .progress-bar {
      height: 100%;
      background: var(--in-progress);
      border-radius: 3px;
      transition: width 0.3s ease, background-color 0.3s ease;
    }

    .progress-bar.complete {
      background: var(--emerald-500);
    }

    .card-content {
      padding: 10px 14px;
      max-height: 350px;
      overflow-y: auto;
    }

    .task-list {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .task-item {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      padding: 6px 8px;
      border-radius: 4px;
      transition: background-color 0.15s;
    }

    .task-item:hover {
      background: var(--accent);
    }

    .task-item.completed .task-title,
    .task-item.skipped .task-title {
      text-decoration: line-through;
      opacity: 0.6;
    }

    .task-icon {
      flex-shrink: 0;
      width: 16px;
      height: 16px;
      margin-top: 1px;
    }

    .task-icon svg {
      width: 16px;
      height: 16px;
    }

    .task-icon.pending {
      color: var(--pending);
    }

    .task-icon.in_progress {
      color: var(--in-progress);
    }

    .task-icon.in_progress svg {
      animation: pulse 1.5s ease-in-out infinite;
    }

    .task-icon.completed {
      color: var(--completed);
    }

    .task-icon.failed {
      color: var(--failed);
    }

    .task-icon.skipped {
      color: var(--skipped);
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    .task-content {
      flex: 1;
      min-width: 0;
    }

    .task-title {
      font-size: 13px;
      font-weight: 500;
      color: var(--card-foreground);
      line-height: 1.3;
    }

    .task-description {
      font-size: 11px;
      color: var(--muted-foreground);
      margin-top: 2px;
      line-height: 1.3;
    }

    .task-notes {
      font-size: 11px;
      color: var(--muted-foreground);
      margin-top: 4px;
      padding: 4px 6px;
      background: var(--secondary);
      border-radius: 3px;
      font-style: italic;
    }

    .task-result {
      font-size: 11px;
      color: var(--completed);
      margin-top: 4px;
      padding: 4px 6px;
      background: hsla(142, 76%, 36%, 0.1);
      border-radius: 3px;
    }

    .subtasks {
      margin-left: 24px;
      margin-top: 2px;
    }

    /* Empty state */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 32px 16px;
      text-align: center;
      color: var(--muted-foreground);
    }

    .empty-state svg {
      width: 32px;
      height: 32px;
      margin-bottom: 12px;
      opacity: 0.5;
    }

    .empty-state-text {
      font-size: 13px;
    }

    /* Completed celebration state */
    .celebration {
      display: none;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 24px 16px;
      text-align: center;
      background: var(--emerald-50);
      border-radius: var(--radius);
    }

    .celebration.active {
      display: flex;
    }

    .celebration-icon {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: var(--emerald-100);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 12px;
    }

    .celebration-icon svg {
      width: 24px;
      height: 24px;
      color: var(--emerald-600);
    }

    .celebration-title {
      font-size: 16px;
      font-weight: 600;
      color: var(--emerald-600);
      margin-bottom: 4px;
    }

    .celebration-message {
      font-size: 13px;
      color: var(--muted-foreground);
    }

    .main-content {
      display: block;
    }

    .main-content.hidden {
      display: none;
    }
  </style>
</head>
<body>
  <div class="card" id="task-card">
    <!-- Main content -->
    <div class="main-content" id="main-content">
      <div class="card-header" id="card-header">
        <div class="header-row">
          <span class="goal-text" id="goal-text">Loading plan...</span>
          <div class="progress-stats">
            <span class="progress-count" id="progress-count">0/0</span>
            <span id="progress-percent">0%</span>
          </div>
        </div>
        <div class="progress-bar-container">
          <div class="progress-bar" id="progress-bar" style="width: 0%"></div>
        </div>
      </div>

      <div class="card-content" id="card-content">
        <!-- Empty state -->
        <div class="empty-state" id="empty-state">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 20h9"/>
            <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>
          </svg>
          <div class="empty-state-text">No tasks yet. The plan will appear here.</div>
        </div>

        <!-- Task list -->
        <div class="task-list" id="task-list" style="display: none;"></div>
      </div>
    </div>

    <!-- Celebration state -->
    <div class="celebration" id="celebration">
      <div class="celebration-icon">
        <!-- Party Popper Icon -->
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M5.8 11.3 2 22l10.7-3.79"/>
          <path d="M4 3h.01"/>
          <path d="M22 8h.01"/>
          <path d="M15 2h.01"/>
          <path d="M22 20h.01"/>
          <path d="m22 2-2.24.75a2.9 2.9 0 0 0-1.96 3.12v0c.1.86-.57 1.63-1.45 1.63h-.38c-.86 0-1.6.6-1.76 1.44L14 10"/>
          <path d="m22 13-.82-.33c-.86-.34-1.82.2-1.98 1.11v0c-.11.7-.72 1.22-1.43 1.22H17"/>
          <path d="m11 2 .33.82c.34.86-.2 1.82-1.11 1.98v0C9.52 4.9 9 5.52 9 6.23V7"/>
          <path d="M11 13c1.93 1.93 2.83 4.17 2 5-.83.83-3.07-.07-5-2-1.93-1.93-2.83-4.17-2-5 .83-.83 3.07.07 5 2Z"/>
        </svg>
      </div>
      <div class="celebration-title">Plan Complete!</div>
      <div class="celebration-message" id="celebration-message">All tasks have been completed.</div>
    </div>
  </div>

  <script>
    // State
    let plan = null;

    // DOM elements
    const mainContentEl = document.getElementById('main-content');
    const celebrationEl = document.getElementById('celebration');
    const celebrationMessageEl = document.getElementById('celebration-message');
    const goalTextEl = document.getElementById('goal-text');
    const progressCountEl = document.getElementById('progress-count');
    const progressPercentEl = document.getElementById('progress-percent');
    const progressBarEl = document.getElementById('progress-bar');
    const emptyStateEl = document.getElementById('empty-state');
    const taskListEl = document.getElementById('task-list');

    // SVG Icons
    const icons = {
      pending: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/></svg>',
      in_progress: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3" fill="currentColor"/></svg>',
      completed: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>',
      failed: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>',
      skipped: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9 12h6"/></svg>'
    };

    function escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }

    function buildTaskTree(tasks) {
      // Build a map of tasks by ID
      const taskMap = new Map();
      for (const task of tasks) {
        taskMap.set(task.id, { ...task, children: [] });
      }

      // Build tree structure
      const roots = [];
      for (const task of taskMap.values()) {
        if (task.parentId && taskMap.has(task.parentId)) {
          taskMap.get(task.parentId).children.push(task);
        } else {
          roots.push(task);
        }
      }

      return roots;
    }

    function renderTask(task, depth = 0) {
      const icon = icons[task.status] || icons.pending;
      
      let html = '<div class="task-item ' + task.status + '">';
      html += '<div class="task-icon ' + task.status + '">' + icon + '</div>';
      html += '<div class="task-content">';
      html += '<div class="task-title">' + escapeHtml(task.title) + '</div>';
      
      if (task.description) {
        html += '<div class="task-description">' + escapeHtml(task.description) + '</div>';
      }
      
      if (task.notes) {
        html += '<div class="task-notes">' + escapeHtml(task.notes) + '</div>';
      }
      
      if (task.result) {
        html += '<div class="task-result">' + escapeHtml(task.result) + '</div>';
      }
      
      html += '</div>';
      html += '</div>';

      // Render children
      if (task.children && task.children.length > 0) {
        html += '<div class="subtasks">';
        for (const child of task.children) {
          html += renderTask(child, depth + 1);
        }
        html += '</div>';
      }

      return html;
    }

    function render() {
      if (!plan) {
        emptyStateEl.style.display = 'flex';
        taskListEl.style.display = 'none';
        goalTextEl.textContent = 'Loading plan...';
        progressCountEl.textContent = '0/0';
        progressPercentEl.textContent = '0%';
        progressBarEl.style.width = '0%';
        progressBarEl.classList.remove('complete');
        mainContentEl.classList.remove('hidden');
        celebrationEl.classList.remove('active');
        requestAnimationFrame(reportHeight);
        return;
      }

      // Check for celebration state
      if (plan.isComplete && plan.totalCount > 0) {
        mainContentEl.classList.add('hidden');
        celebrationEl.classList.add('active');
        celebrationMessageEl.textContent = 
          plan.totalCount === 1 
            ? 'Task completed successfully!' 
            : 'All ' + plan.totalCount + ' tasks have been completed!';
        requestAnimationFrame(reportHeight);
        return;
      }

      // Show main content
      mainContentEl.classList.remove('hidden');
      celebrationEl.classList.remove('active');

      // Update header
      goalTextEl.textContent = plan.rootGoal || 'Task Plan';
      progressCountEl.textContent = plan.completedCount + '/' + plan.totalCount;
      progressPercentEl.textContent = plan.progress + '%';
      progressBarEl.style.width = plan.progress + '%';
      
      if (plan.progress === 100) {
        progressBarEl.classList.add('complete');
      } else {
        progressBarEl.classList.remove('complete');
      }

      // Render tasks
      if (!plan.tasks || plan.tasks.length === 0) {
        emptyStateEl.style.display = 'flex';
        taskListEl.style.display = 'none';
      } else {
        emptyStateEl.style.display = 'none';
        taskListEl.style.display = 'flex';
        
        const tree = buildTaskTree(plan.tasks);
        let html = '';
        for (const task of tree) {
          html += renderTask(task);
        }
        taskListEl.innerHTML = html;
      }

      requestAnimationFrame(reportHeight);
    }

    function reportHeight() {
      const height = document.body.scrollHeight;
      window.parent.postMessage({ type: 'mcp:sizeChange', payload: { height } }, '*');
    }

    // Listen for messages from parent
    window.addEventListener('message', (event) => {
      const { type, payload } = event.data || {};

      // Handle tool result (contains the plan)
      if (type === 'mcp:toolResult') {
        try {
          let data;
          if (payload?.content?.[0]?.text) {
            data = JSON.parse(payload.content[0].text);
          } else if (payload?.plan) {
            data = payload;
          }
          
          if (data?.plan) {
            plan = data.plan;
            render();
          }
        } catch (err) {
          console.error('Error parsing tool result:', err);
        }
      }

      // Handle tool input (alternative way to receive plan)
      if (type === 'mcp:toolInput' && payload?.arguments) {
        // Tool input doesn't contain plan directly, but we can use it
        // to know we're in an active session
      }

      // Handle theme updates
      if (type === 'mcp:hostContext' && payload?.theme) {
        document.body.className = payload.theme === 'dark' ? 'dark' : '';
      }
    });

    // Signal ready and report initial height
    window.parent.postMessage({ type: 'mcp:ready' }, '*');
    render();
  </script>
</body>
</html>`;
}
