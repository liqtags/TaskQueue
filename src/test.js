const TaskQueue = require('../dist/index.js').default;

const q = new TaskQueue(2, 1000);

let tasklist = [
  { url: 'http://www.google.com', priority: 0 },
  { url: 'http://www.bing.com', priority: 0 },
  { url: 'http://www.yahoo.com', priority: 0 },
  { url: 'http://www.yandex.ru', priority: -10 },
]

async function download(url) {
    console.log('Downloading', url);
    await new Promise((resolve) => setTimeout(resolve, 3000));
    console.log('Downloaded', url);
  }

async function downloadTheInternet() {
  for (let site of tasklist) {
    const me = Symbol();
    /* We wait in the line here */
    await q.waitForSlot(me, site.priority);

    download(site.url)
      /* Signal that we are finished */
      /* Do not forget to handle the exceptions! */
      .catch((e) => console.error(e))
      .finally(() => q.completeTask(me));
  }
  return await q.flushQueue();
}

const runTest = async () => {
    await downloadTheInternet();
    console.log('All done!');
};

runTest();