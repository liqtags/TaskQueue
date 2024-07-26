# @liqtags/task-queue

Asynchronous Task Queue With Controlled Concurrency

## Usecase

- Avoiding Rate-limiting
- Launch async tasks with manageable concurrency

```javascript
// Create the queue class
import TaskQueue from '@liqtags/task-queue';

// Run 2 tasks every 1 seconds until finish
const q = new TaskQueue(2, 1000);
// Run 10 tasks every 10 seconds until finish
const q = new TaskQueue(10, 10000);

// define some tasks with there priortity
let tasklist = [
  { url: 'http://www.google.com', priority: 0 },
  { url: 'http://www.bing.com', priority: 0 },
  { url: 'http://www.yahoo.com', priority: 0 },
  { url: 'http://www.yandex.ru', priority: -10 },
]

async function customTask(url) {
    console.log('Task starting', url);
    await new Promise((resolve) => {
        // run something and resolve it; 
        resolve();
    });
    console.log('Task complete', url);
}

async function runTasks() {
  for (let task of tasklist) {
    // create a symbol for the task
    const me = Symbol();
    // wait for the next slot with it's priority
    await q.waitForSlot(me, site.priority);

    // run your task
    customTask(site.url)
      .catch((e) => console.error(e))
      .finally(() => q.completeTask(me));
  }
}

```
