/**
 * Task Orchestrator - Persistent Working Memory for Multi-Step Workflows
 *
 * Provides a hierarchical task tree with in-memory state management.
 * Each chat session has its own isolated TaskOrchestrator instance.
 */

export type TaskStatus = "pending" | "in_progress" | "completed" | "failed" | "skipped";

export interface TaskNode {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  parentId: string | null;
  childIds: string[];
  notes?: string;
  result?: string;
  createdAt: number;
  updatedAt: number;
}

export interface PlanState {
  rootGoal: string;
  tasks: TaskNode[];
  totalCount: number;
  completedCount: number;
  inProgressCount: number;
  progress: number; // 0-100
  isComplete: boolean;
  createdAt: number;
  updatedAt: number;
}

/**
 * TaskOrchestrator manages a hierarchical tree of tasks for a single chat session.
 */
export class TaskOrchestrator {
  private tasks: Map<string, TaskNode> = new Map();
  private rootGoal: string = "";
  private createdAt: number = Date.now();
  private updatedAt: number = Date.now();

  /**
   * Create a new plan with a root goal, clearing any existing state.
   */
  createPlan(rootGoal: string): PlanState {
    this.tasks.clear();
    this.rootGoal = rootGoal;
    this.createdAt = Date.now();
    this.updatedAt = Date.now();
    return this.getPlan();
  }

  /**
   * Add a task to the plan.
   * If parentId is provided, the task becomes a subtask.
   */
  addTask(params: {
    id: string;
    title: string;
    description?: string;
    parentId?: string | null;
    status?: TaskStatus;
  }): PlanState {
    const { id, title, description, parentId = null, status = "pending" } = params;

    // Validate parent exists if specified
    if (parentId && !this.tasks.has(parentId)) {
      throw new Error(`Parent task "${parentId}" not found`);
    }

    // Check for duplicate ID
    if (this.tasks.has(id)) {
      throw new Error(`Task with ID "${id}" already exists`);
    }

    const now = Date.now();
    const task: TaskNode = {
      id,
      title,
      description,
      status,
      parentId,
      childIds: [],
      createdAt: now,
      updatedAt: now,
    };

    this.tasks.set(id, task);

    // Update parent's childIds
    if (parentId) {
      const parent = this.tasks.get(parentId);
      if (parent) {
        parent.childIds.push(id);
        parent.updatedAt = now;
      }
    }

    this.updatedAt = now;
    return this.getPlan();
  }

  /**
   * Update an existing task's status, notes, or result.
   */
  updateTask(params: {
    id: string;
    status?: TaskStatus;
    notes?: string;
    result?: string;
    title?: string;
    description?: string;
  }): PlanState {
    const { id, status, notes, result, title, description } = params;

    const task = this.tasks.get(id);
    if (!task) {
      throw new Error(`Task "${id}" not found`);
    }

    const now = Date.now();

    if (status !== undefined) {
      task.status = status;
    }
    if (notes !== undefined) {
      task.notes = notes;
    }
    if (result !== undefined) {
      task.result = result;
    }
    if (title !== undefined) {
      task.title = title;
    }
    if (description !== undefined) {
      task.description = description;
    }

    task.updatedAt = now;
    this.updatedAt = now;

    return this.getPlan();
  }

  /**
   * Get the current plan state with computed statistics.
   */
  getPlan(): PlanState {
    const tasks = Array.from(this.tasks.values());

    // Count only leaf tasks (tasks without children) for progress calculation
    // This prevents double-counting parent tasks
    const leafTasks = tasks.filter((t) => t.childIds.length === 0);

    const totalCount = leafTasks.length;
    const completedCount = leafTasks.filter(
      (t) => t.status === "completed" || t.status === "skipped"
    ).length;
    const inProgressCount = leafTasks.filter(
      (t) => t.status === "in_progress"
    ).length;

    const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
    const isComplete = totalCount > 0 && completedCount === totalCount;

    // Sort tasks: root-level first (parentId === null), then by creation time
    const sortedTasks = tasks.sort((a, b) => {
      // Root tasks first
      if (a.parentId === null && b.parentId !== null) return -1;
      if (a.parentId !== null && b.parentId === null) return 1;
      // Then by creation time
      return a.createdAt - b.createdAt;
    });

    return {
      rootGoal: this.rootGoal,
      tasks: sortedTasks,
      totalCount,
      completedCount,
      inProgressCount,
      progress,
      isComplete,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  /**
   * Check if the orchestrator has any tasks.
   */
  hasTasks(): boolean {
    return this.tasks.size > 0;
  }

  /**
   * Get a specific task by ID.
   */
  getTask(id: string): TaskNode | undefined {
    return this.tasks.get(id);
  }
}

/**
 * In-memory store for TaskOrchestrator instances keyed by chatId.
 * Falls back to "default" key if no chatId is provided.
 */
const plansByChat = new Map<string, TaskOrchestrator>();

/**
 * Get or create a TaskOrchestrator for a given chat.
 */
export function getOrCreateOrchestrator(chatId?: string): TaskOrchestrator {
  const key = chatId || "default";

  let orchestrator = plansByChat.get(key);
  if (!orchestrator) {
    orchestrator = new TaskOrchestrator();
    plansByChat.set(key, orchestrator);
  }

  return orchestrator;
}

/**
 * Get an existing TaskOrchestrator for a chat, or undefined if none exists.
 */
export function getOrchestrator(chatId?: string): TaskOrchestrator | undefined {
  const key = chatId || "default";
  return plansByChat.get(key);
}

/**
 * Clear the orchestrator for a specific chat.
 */
export function clearOrchestrator(chatId?: string): void {
  const key = chatId || "default";
  plansByChat.delete(key);
}

/**
 * Clear all orchestrators (useful for testing).
 */
export function clearAllOrchestrators(): void {
  plansByChat.clear();
}
