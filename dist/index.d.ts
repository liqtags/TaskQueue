declare class TaskQueue {
    private maxConcurrent;
    private minCycle;
    private activeTasks;
    private pendingTasks;
    private lastRunTime;
    private nextRunTimer;
    private taskCounter;
    constructor(maxConcurrent?: number, minCycle?: number);
    private attemptRun;
    completeTask(hash: symbol | string): void;
    waitForSlot(hash: symbol | string, priority?: number): Promise<void>;
    executeTask<T>(task: () => Promise<T>, priority?: number): Promise<T>;
    getStatus(): {
        running: number;
        pending: number;
        lastRun: number;
    };
    flushQueue(maxPending?: number): Promise<void>;
}

export { TaskQueue as default };
