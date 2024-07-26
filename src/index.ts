import { Heap } from './heap';

// const debug = (..._: any[]) => console.log(..._);
const debug = (..._) => undefined;

interface Task {
  hash: symbol | string;
  priority: number;
  start: { signal: () => void, wait: Promise<void> };
  counter: number;
}

interface RunningTask {
  hash: symbol | string;
  priority: number;
  finishTask: { wait: Promise<void>, signal: () => void };
}

class TaskQueue {
  private maxConcurrent: number;
  private minCycle: number;
  private activeTasks: Map<symbol | string, RunningTask>;
  private pendingTasks: Heap<Task>;
  private lastRunTime: number;
  private nextRunTimer: Promise<void> | null;
  private taskCounter: number;

  constructor(maxConcurrent: number = 1, minCycle: number = 0) {
    this.maxConcurrent = maxConcurrent;
    this.minCycle = minCycle;
    this.activeTasks = new Map<symbol | string, RunningTask>();
    this.pendingTasks = new Heap<Task>((a, b) => a.priority - b.priority || a.counter - b.counter);
    this.lastRunTime = 0;
    this.nextRunTimer = null;
    this.taskCounter = 0;
  }

  private attemptRun(): void {
    debug(`attemptRun: pending=${this.pendingTasks.size()}, active=${this.activeTasks.size}`);
    while (this.pendingTasks.size() > 0 && this.activeTasks.size < this.maxConcurrent) {
      if (Date.now() - this.lastRunTime < this.minCycle) {
        debug(`throttling, now=${Date.now() % 1000}, next=${(this.minCycle + this.lastRunTime) % 1000}, elapsed=${Date.now() - this.lastRunTime}`);
        if (this.nextRunTimer === null) {
          this.nextRunTimer = new Promise((resolve) => setTimeout(() => {
            this.nextRunTimer = null;
            this.attemptRun();
            resolve();
          }, this.minCycle - Date.now() + this.lastRunTime));
        }
        return;
      }

      const nextTask = this.pendingTasks.pop();
      debug(`not throttling, last=${this.lastRunTime % 1000}, now=${Date.now() % 1000}, next is`, nextTask?.hash);
      if (nextTask) {
        let finishTaskSignal: () => void;
        const finishTaskWait = new Promise<void>((resolve) => {
          finishTaskSignal = resolve;
        });
        const finishTask = { wait: finishTaskWait, signal: finishTaskSignal! };
        const runningTask = { hash: nextTask.hash, priority: nextTask.priority, finishTask };
        if (this.activeTasks.has(nextTask.hash)) {
          //@ts-ignore - it works
          throw new Error('async-await-queue: duplicate hash ' + nextTask.hash);
        }
        this.activeTasks.set(nextTask.hash, runningTask);
        this.lastRunTime = Date.now();

        nextTask.start.signal();
      }
    }
  }

  completeTask(hash: symbol | string): void {
    debug(hash, 'completeTask');
    const task = this.activeTasks.get(hash);
    // @ts-expect-error - it works
    if (!task) throw new Error('async-await-queue: queue desync for ' + hash);

    this.activeTasks.delete(hash);
    task.finishTask.signal();
    this.attemptRun();
  }

  async waitForSlot(hash: symbol | string, priority: number = 0): Promise<void> {
    debug(hash, 'waiting');
    let signal!: () => void;
    const wait = new Promise<void>((resolve) => {
      signal = resolve;
    });
    const waitingTask = { hash, priority, start: { signal, wait }, counter: this.taskCounter++ };

    this.pendingTasks.push(waitingTask);
    this.attemptRun();
    await wait;

    this.lastRunTime = Date.now();
    debug('running', hash, `last=${this.lastRunTime % 1000}, now=${Date.now() % 1000}`);
  }

  executeTask<T>(task: () => Promise<T>, priority: number = 0): Promise<T> {
    const id = Symbol();
    return this.waitForSlot(id, priority)
      .then(task)
      .finally(() => {
        this.completeTask(id);
      });
  }

  getStatus(): { running: number, pending: number, lastRun: number } {
    return {
      running: this.activeTasks.size,
      pending: this.pendingTasks.size(),
      lastRun: this.lastRunTime
    };
  }

  async flushQueue(maxPending?: number): Promise<void> {
    debug('flushQueue', this.getStatus());
    while (this.activeTasks.size > 0 || this.pendingTasks.size() > 0) {
      const waitingTask = this.pendingTasks.peek();
      if (waitingTask) {
        await waitingTask.start.wait;
      }
      if (maxPending !== undefined && this.pendingTasks.size() < maxPending) return;
      if (this.activeTasks.size > 0) {
        const runningTask = this.activeTasks.values().next().value;
        await runningTask.finishTask.wait;
      }
      debug('retry flushQueue', this.getStatus());
    }
  }
}

export default TaskQueue;