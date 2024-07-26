var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var src_exports = {};
__export(src_exports, {
  default: () => src_default
});
module.exports = __toCommonJS(src_exports);

// src/heap.ts
var Heap = class _Heap {
  /**
   * Heap instance constructor.
   * @param  {Function} compare Optional comparison function, defaults to Heap.minComparator<number>
   */
  constructor(compare) {
    this.compare = compare;
  }
  heapArray = [];
  _limit = 0;
  /*
            Static methods
   */
  /**
   * Gets children indices for given index.
   * @param  {Number} idx     Parent index
   * @return {Array(Number)}  Array of children indices
   */
  static getChildrenIndexOf(idx) {
    return [idx * 2 + 1, idx * 2 + 2];
  }
  /**
   * Gets parent index for given index.
   * @param  {Number} idx  Children index
   * @return {Number | undefined}      Parent index, -1 if idx is 0
   */
  static getParentIndexOf(idx) {
    if (idx <= 0) {
      return -1;
    }
    const whichChildren = idx % 2 ? 1 : 2;
    return Math.floor((idx - whichChildren) / 2);
  }
  /*
            Instance methods
   */
  /**
   * Adds an element to the heap. Aliases: `offer`.
   * Same as: push(element)
   * @param {any} element Element to be added
   * @return {Boolean} true
   */
  push(element) {
    this._sortNodeUp(this.heapArray.push(element) - 1);
    return true;
  }
  /**
   * Length of the heap.
   * @return {Number}
   */
  length() {
    return this.heapArray.length;
  }
  /**
   * Top node. Aliases: `element`.
   * Same as: `top(1)[0]`
   * @return {any} Top node
   */
  peek() {
    return this.heapArray[0];
  }
  /**
   * Extract the top node (root). Aliases: `poll`.
   * @return {any} Extracted top node, undefined if empty
   */
  pop() {
    const last = this.heapArray.pop();
    if (this.length() > 0 && last !== void 0) {
      return this.replace(last);
    }
    return last;
  }
  /**
   * Pop the current peek value, and add the new item.
   * @param  {any} element  Element to replace peek
   * @return {any}         Old peek
   */
  replace(element) {
    const peek = this.heapArray[0];
    this.heapArray[0] = element;
    this._sortNodeDown(0);
    return peek;
  }
  /**
   * Size of the heap
   * @return {Number}
   */
  size() {
    return this.length();
  }
  /**
   * Move a node to a new index, switching places
   * @param  {Number} j First node index
   * @param  {Number} k Another node index
   */
  _moveNode(j, k) {
    [this.heapArray[j], this.heapArray[k]] = [this.heapArray[k], this.heapArray[j]];
  }
  /**
   * Move a node down the tree (to the leaves) to find a place where the heap is sorted.
   * @param  {Number} i Index of the node
   */
  _sortNodeDown(i) {
    let moveIt = i < this.heapArray.length - 1;
    const self = this.heapArray[i];
    const getPotentialParent = (best, j) => {
      if (this.heapArray.length > j && this.compare(this.heapArray[j], this.heapArray[best]) < 0) {
        best = j;
      }
      return best;
    };
    while (moveIt) {
      const childrenIdx = _Heap.getChildrenIndexOf(i);
      const bestChildIndex = childrenIdx.reduce(getPotentialParent, childrenIdx[0]);
      const bestChild = this.heapArray[bestChildIndex];
      if (typeof bestChild !== "undefined" && this.compare(self, bestChild) > 0) {
        this._moveNode(i, bestChildIndex);
        i = bestChildIndex;
      } else {
        moveIt = false;
      }
    }
  }
  /**
   * Move a node up the tree (to the root) to find a place where the heap is sorted.
   * @param  {Number} i Index of the node
   */
  _sortNodeUp(i) {
    let moveIt = i > 0;
    while (moveIt) {
      const pi = _Heap.getParentIndexOf(i);
      if (pi >= 0 && this.compare(this.heapArray[pi], this.heapArray[i]) > 0) {
        this._moveNode(i, pi);
        i = pi;
      } else {
        moveIt = false;
      }
    }
  }
};

// src/index.ts
var debug = (..._) => void 0;
var TaskQueue = class {
  maxConcurrent;
  minCycle;
  activeTasks;
  pendingTasks;
  lastRunTime;
  nextRunTimer;
  taskCounter;
  constructor(maxConcurrent = 1, minCycle = 0) {
    this.maxConcurrent = maxConcurrent;
    this.minCycle = minCycle;
    this.activeTasks = /* @__PURE__ */ new Map();
    this.pendingTasks = new Heap((a, b) => a.priority - b.priority || a.counter - b.counter);
    this.lastRunTime = 0;
    this.nextRunTimer = null;
    this.taskCounter = 0;
  }
  attemptRun() {
    debug(`attemptRun: pending=${this.pendingTasks.size()}, active=${this.activeTasks.size}`);
    while (this.pendingTasks.size() > 0 && this.activeTasks.size < this.maxConcurrent) {
      if (Date.now() - this.lastRunTime < this.minCycle) {
        debug(`throttling, now=${Date.now() % 1e3}, next=${(this.minCycle + this.lastRunTime) % 1e3}, elapsed=${Date.now() - this.lastRunTime}`);
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
      debug(`not throttling, last=${this.lastRunTime % 1e3}, now=${Date.now() % 1e3}, next is`, nextTask?.hash);
      if (nextTask) {
        let finishTaskSignal;
        const finishTaskWait = new Promise((resolve) => {
          finishTaskSignal = resolve;
        });
        const finishTask = { wait: finishTaskWait, signal: finishTaskSignal };
        const runningTask = { hash: nextTask.hash, priority: nextTask.priority, finishTask };
        if (this.activeTasks.has(nextTask.hash)) {
          throw new Error("async-await-queue: duplicate hash " + nextTask.hash);
        }
        this.activeTasks.set(nextTask.hash, runningTask);
        this.lastRunTime = Date.now();
        nextTask.start.signal();
      }
    }
  }
  completeTask(hash) {
    debug(hash, "completeTask");
    const task = this.activeTasks.get(hash);
    if (!task) throw new Error("async-await-queue: queue desync for " + hash);
    this.activeTasks.delete(hash);
    task.finishTask.signal();
    this.attemptRun();
  }
  async waitForSlot(hash, priority = 0) {
    debug(hash, "waiting");
    let signal;
    const wait = new Promise((resolve) => {
      signal = resolve;
    });
    const waitingTask = { hash, priority, start: { signal, wait }, counter: this.taskCounter++ };
    this.pendingTasks.push(waitingTask);
    this.attemptRun();
    await wait;
    this.lastRunTime = Date.now();
    debug("running", hash, `last=${this.lastRunTime % 1e3}, now=${Date.now() % 1e3}`);
  }
  executeTask(task, priority = 0) {
    const id = Symbol();
    return this.waitForSlot(id, priority).then(task).finally(() => {
      this.completeTask(id);
    });
  }
  getStatus() {
    return {
      running: this.activeTasks.size,
      pending: this.pendingTasks.size(),
      lastRun: this.lastRunTime
    };
  }
  async flushQueue(maxPending) {
    debug("flushQueue", this.getStatus());
    while (this.activeTasks.size > 0 || this.pendingTasks.size() > 0) {
      const waitingTask = this.pendingTasks.peek();
      if (waitingTask) {
        await waitingTask.start.wait;
      }
      if (maxPending !== void 0 && this.pendingTasks.size() < maxPending) return;
      if (this.activeTasks.size > 0) {
        const runningTask = this.activeTasks.values().next().value;
        await runningTask.finishTask.wait;
      }
      debug("retry flushQueue", this.getStatus());
    }
  }
};
var src_default = TaskQueue;
