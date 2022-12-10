---
title: 【译】优化长任务 Optimize long tasks
date: 2022-10-11 22:42:10
tags:
---

原文：[https://web.dev/optimize-long-tasks/](https://web.dev/optimize-long-tasks/)

> 你曾被告诉过，不要阻塞主线程并且分解你的长任务，但是有想过这样做的意义吗？

如果你读了很多关于网站性能的资料, 保持 JavasScript 应用程序快速运行的建议往往涉及以下的建议：

- 不要阻塞主线程
- 分解你的长任务

那这些意味着什么？减少 JavaScript 是好的，但这是否自动等同在整个页面生命周期中更快速的用户界面？也许是，也许不是.

## 一个 task 是什么样的？

一个 task 是浏览器所做的任何离散的工作，task 包括解析 HTML 和 CSS, 运行 JavaScript 代码, 以及一些你不能直接控制的事情。对于所有的这些，你所编写的并且部署到服务器的 JavaScript 是主要的任务来源。

![img_1](https://cdn.jsdelivr.net/gh/PancakeDogLLL/imageBed/img/2022-10-11%2019.23.12.png)

Tasks 以多种方式影响性能。例如，当浏览器在启动时下载 js 文件时，浏览器将任务进行排队并且编译 js 以让其能被执行。然后在页面的生命周期中，（例如通过事件处理程序驱动交互、JavaScript 驱动的动画和后台活动（例如分析收集））启动任务。所有的这些东西，除了 web worker 和类似的 API 都发生在主线程上。

## 主线程是什么 ？

主线程是大多数任务在浏览器中运行的地方。它被称为主线程的原因是：它是您编写的几乎所有 JavaScript 都在这个线程中工作。

主线程一次只能处理一个任务。当任务超出某个确定的点（准确来说是 50ms ）时,它们被归类为长任务。如果用户在长时间的任务运行时尝试与页面交互 — 或者如果需要进行重要的渲染更新 — 浏览器将延迟处理该工作。这会导致交互或渲染延迟。

![img_2](https://cdn.jsdelivr.net/gh/PancakeDogLLL/imageBed/img/2022-10-11%2019.42.24.png)

<em style="font-size:12px">Chrome浏览器的性能分析器中描述的长任务。长任务的角落里有一个红色的三角形，任务的阻塞部分用对角线的红色条纹填充</em>

你需要分解任务。这意味着将一个长任务划分为较小的任务，这些任务单独运行所需的时间更少。

![img_3](https://web-dev.imgix.net/image/jL3OLOhcWUQDnR4XjewLBx4e3PC3/8Bhl9Ilki4tM0aC1nfn8.png?auto=format&w=1600)

<em style="font-size:12px">单个长任务与同一任务分解为五个较短任务的可视化</em>

这很重要，因为当任务被分解时，浏览器有更多机会响应更高优先级的工作——包括用户交互。

![img_3](https://web-dev.imgix.net/image/jL3OLOhcWUQDnR4XjewLBx4e3PC3/0yV0ynwW7FujIwvCbCxQ.png?auto=format&w=1600)

<em style="font-size:12px">当任务太长，浏览器不能对互动做出足够快的反应时，与将较长的任务分解成较小的任务时相比，互动会发生什么样的情况，这是一个可视化的结果</em>

如上图的上半部分所述，由用户交互排队的事件处理程序必须等待一个长任务才能运行。这延迟了交互的发生。在下半部分，事件处理程序有机会更快地运行。因为事件处理程序有机会在较小的任务之间运行。它运行得比它必须等待一个很长的任务完成要快。在上半部分中，用户可能已经感受到了延迟，在下半部分，交互可能是即时的。

然而，问题在于 “分解你的长任务” 和 “不要阻塞主线程”的建议不够具体,除非你已经知道如何做这些事情，这就是本指南将要解释的内容。

## 任务管理策略

在软件架构中，一个常见建议是将您的工作分解更小的功能。这为您提供了更好的代码可读性和项目可维护性的好处。这使得测试更容易编写。

```ts
function saveSettings() {
  validateForm();
  showSpinner();
  saveToDatabase();
  updateUI();
  sendAnalytics();
}
```
在这个例子中，这里的 saveSettings 函数，在它调用时，它调用了其他五个函数。从概念上讲，这是很好的架构，如果你需要调试这些函数中的一个，你可以便利项目树以弄清每个函数的作用。

然而，问题在于 JavaScript 不会将这些函数中的每一个作为单独的任务运行，因为它们是在 savaSettings 函数中执行的。__这意味着所有五个功能都作为单独任务运行。__

> JavaScript 以这种方式工作是因为它使用任务执行的运行到完成模型。这意味着每个任务将一直运行到完成，无论它阻塞主线程多长时间。

![img_4](https://web-dev.imgix.net/image/jL3OLOhcWUQDnR4XjewLBx4e3PC3/0c61l5DCix9y0GBa3pFj.png?auto=format&w=1600)

<em style="font-size:12px">调用五个函数的单个函数 saveSettings()。这项工作是作为一项长期的整体任务的一部分运行的</em>

在最好的情况下，即使只是这些功能中的一个，也可以为任务的总长度贡献50毫秒或更多。在最坏的情况下，更多的这些任务可以运行相当长的时间–特别是在资源有限的设备上。下面是一套策略，你可以用来分解和优先处理任务。

## 手动延迟代码执行

开发人员使用的一种将任务分解成小任务的方法涉及到 setTimeout(). 使用这种技术，你把函数传给 setTimeout 这将回调的执行推迟到一个单独的任务中，即时你指定的时间为 0。

```ts
function saveSettings () {
  // 完成用户可见的关键工作:
  validateForm();
  showSpinner();
  updateUI();

  // 将用户不可见的工作推迟到单独的任务:
  setTimeout(() => {
    saveToDatabase();
    sendAnalytics();
  }, 0);
}
```

如果您有一系列需要按顺序运行的函数，这很有效，但您的代码可能并不总是以这种方式组织。例如，您可能有大量数据需要循环处理，如果您有数百万个项目，该任务可能需要很长时间。

```ts
function processData () {
  for (const item of largeDataArray) {
    // Process the individual item here.
  }
}
```

使用 setTimeout 是存在问题的, 因为它的人机工程学（这是什么意思🤔，原文：ergonomics）使其难以实现，并且整个数据数组可能需要很长时间处理，即使每个项目都可以非常快速地处理。这一切加起来，setTimeout 不是合适的工具，至少在这样使用时不是。

除了 setTimeout 之外，还有一些其他 API 允许您将代码执行推迟到后续任务。 一种方法是使用 postMessage 来加快超时。您也可以使用 requestIdleCallback() 来分解工作。 但是要注意 – requestIdleCallback() 以尽可能低的优先级安排任务，而且只在浏览器空闲时间内进行。当主线程拥挤时,用 requestIdleCallback() 安排的任务可能永远无法运行。

## 使用 async/await yield points

在本指南的其余部分，你会看到一个短语是 “yield to the main thread”，但是，这意味着什么？为什么你要这么做？你什么时候该这样做？

> 当你 yield to the main thread，你会给它一个机会来处理比当前排队的任务更重要的任务。理想情况下（ideally），当你有一些关键的面向用户的工作，需要比 yield 更早地执行时，你应该 yield main thread，yield main thread 可以为关键工作创造机会，使其更快地运行。

当任务被分解时，其他任务可以通过浏览器内部优先级方案更好地进行优先级排序。yield main thread 的方法涉及到使用一个 Promise 的组合，该组合与对 setTimeout() 进行的调用进行解析。

```ts
function yieldToMain () {
  return new Promise(resolve => {
    setTimeout(resolve, 0);
  });
}
```
> 虽然这个代码实例返回了一个在调用 setTimeout 后解析的 Promise, 但负责在新任务中运行奇遇代码的并不是这个 Promise，而是 setTimeout 调用。Promise 回调作为微任务而不是任务运行，因此不会 yield main thread

在 saveSettings() 函数中，如果在每次函数调用后 await yieldToMain() 函数，则可以在每次工作后 yield to the main

```ts
async function saveSettings () {
  // Create an array of functions to run:
  const tasks = [
    validateForm,
    showSpinner,
    saveToDatabase,
    updateUI,
    sendAnalytics
  ]

  // Loop over the tasks:
  while (tasks.length > 0) {
    // Shift the first task off the tasks array:
    const task = tasks.shift();

    // Run the task:
    task();

    // Yield to the main thread:
    await yieldToMain();
  }
}
```
> 你不必在每次函数调用后都 yield。例如，如果你运行的两个函数会导致用户界面的关键性更新，你可能不想在它们之间 yield。如果可以的话，让这些 tast 先运行，然后考虑在那些不那么关键的或用户看不到的后台工作的函数之间进行 yield。

结果是曾经单一的任务现在被分解为单独的任务

![img_5](https://web-dev.imgix.net/image/jL3OLOhcWUQDnR4XjewLBx4e3PC3/wg0FW6S29CzOCbbwk9kK.png?auto=format&w=1600)

<em style="font-size:12px">saveSettings() 函数现在将其子函数作为单独的任务执行。</em>

使用基于 Promise 的方法来产生而不是手动使用 setTimeout() 的好处是更好的人体工程学。屈服点成为声明性的，因此更容易编写、阅读和理解。

## 仅在必要时 yield

如果您有一堆任务，但您只想在用户尝试与页面交互时让步怎么办？这就是 isInputPending() 的用途。

isInputPending() 是一个您可以随时运行以确定用户是否正在尝试与页面元素交互的函数：对 isInputPending() 的调用将返回 true。否则返回 false。

假设您可有一个需要运行的任务队列，但您不想妨碍任何输入。这段代码 — 它同时使用了 isInputPending() 函数 — 确保在用户尝试与页面交互时输入不会被延迟。

```ts
async function saveSettings () {
  // A task queue of functions
  const tasks = [
    validateForm,
    showSpinner,
    saveToDatabase,
    updateUI,
    sendAnalytics
  ];
  
  while (tasks.length > 0) {
    // Yield to a pending user input:
    if (navigator.scheduling.isInputPending()) {
      // There's a pending user input. Yield here:
      await yieldToMain();
    } else {
      // Shift the the task out of the queue:
      const task = tasks.shift();

      // Run the task:
      task();
    }
  }
}
```
当 saveSettings() 运行时，它将遍历队列中的任务。如果 isInputPending() 在循环期间返回 true，则 saveSettings() 将调用 yieldToMain() 以便处理用户输入。否则，它将把下一个任务移出队列的前面并继续运行它。它将执行此操作，直到没有其他任务为止。

![img_5](https://web-dev.imgix.net/image/jL3OLOhcWUQDnR4XjewLBx4e3PC3/snMl3kRlWyJjdbL0qsqM.png?auto=format&w=1600)

<em style="font-size:12px">saveSettings()运行一个有五个任务的任务队列，但在第二个工作项运行时，用户已经点击打开了一个菜单。 isInputPending()让位于主线程来处理这个交互，并恢复运行其余的任务。</em>

> isInputPending()不一定在用户输入后立即返回true。这是因为操作系统需要时间来告诉浏览器发生了交互。这意味着其他代码可能已经开始执行了（正如你在上面的截图中看到的saveToDatabase()函数）。即使你使用isInputPending()，你仍然要限制每个函数的工作量，这是至关重要的。

将 isInputPending() 与让步机制结合使用是让浏览器停止其正在处理的任何任务以响应关键的面向用户的交互的好方法。这可以帮助提高您的页面在许多任务正在进行时在许多情况下响应用户的能力。

另一种使用isInputPending()的方法–特别是如果你担心为不支持它的浏览器提供退路–是使用基于时间的方法与 可选链操作符 （?.）

```ts
async function saveSettings () {
  // A task queue of functions
  const tasks = [
    validateForm,
    showSpinner,
    saveToDatabase,
    updateUI,
    sendAnalytics
  ];
  
  let deadline = performance.now() + 50;

  while (tasks.length > 0) {
    // Optional chaining operator used here helps to avoid
    // errors in browsers that don't support `isInputPending`:
    if (navigator.scheduling?.isInputPending() || performance.now() >= deadline) {
      // There's a pending user input, or the
      // deadline has been reached. Yield here:
      await yieldToMain();

      // Extend the deadline:
      deadline += 50;

      // Stop the execution of the current loop and
      // move onto the next iteration:
      continue;
    }

    // Shift the the task out of the queue:
    const task = tasks.shift();

    // Run the task:
    task();
  }
}
```

通过这种方法，你可以为不支持isInputPending()的浏览器提供一个后备方案，即使用（并调整）一个截止日期，以便在必要时将工作分开，无论是通过屈服于用户输入，还是在某个时间点之前。

## 当前 api 的差异

到目前为止提到的API可以帮助你分解任务，但它们有一个显著的缺点：当你通过推迟代码在后续任务中运行而屈服于主线程时，该代码会被添加到任务队列的最末端。

如果你控制了你页面上的所有代码，就有可能创建你自己的scheduler （参考 react 吗，😯），并能对任务进行优先排序，但第三方脚本不会使用你的调度器。实际上，在这样的环境中，你并不能真正地对工作进行优先排序。你只能把它分成几块，或者明确地屈从于用户的互动。

幸运的是，目前有一个专门的调度器API正在开发中，可以解决这些问题。

## 一个专门的调度程序API

调度器API目前提供了postTask()函数，在撰写本文时，该函数在Chromium浏览器和Firefox的一个标志后面可用。 postTask()允许对任务进行更精细的调度，是帮助浏览器确定工作优先级的一种方法，这样低优先级的任务就会让位于主线程。 postTask()使用 Promise，并接受一个优先级设置。

postTask() API 具有三个可以使用的 priorities

- ‘background’ : 最低优先级任务。
- ‘user-visible’ : 中等优先级任务，“用户可见”，如果没有设置优先级，这是默认设置。
- ‘user-blocking’: 用于需要高优先级运行的关键任务。

以下面的代码为例，postTask()API被用来以尽可能高的优先级运行三个任务，并以尽可能低的优先级运行其余两个任务。

```ts
function saveSettings () {
  // Validate the form at high priority
  scheduler.postTask(validateForm, {priority: 'user-blocking'});

  // Show the spinner at high priority:
  scheduler.postTask(showSpinner, {priority: 'user-blocking'});

  // Update the database in the background:
  scheduler.postTask(saveToDatabase, {priority: 'background'});

  // Update the user interface at high priority:
  scheduler.postTask(updateUI, {priority: 'user-blocking'});

  // Send analytics data in the background:
  scheduler.postTask(sendAnalytics, {priority: 'background'});
};
```
在这里，任务的优先级以浏览器优先级任务（例如用户交互）可以正常工作的方式安排。

<div style="color:red">子任务执行顺序差异</div>

![img_6](https://web-dev.imgix.net/image/jL3OLOhcWUQDnR4XjewLBx4e3PC3/ttvI1HqusI02CAdqhjWP.png?auto=format&w=1600)

<em style="font-size:12px">当saveSettings()运行时，该函数使用postTask()对各个函数进行调度。面向用户的关键工作被安排在高优先级，而用户不知道的工作被安排在后台运行。这使得用户交互的执行速度更快，因为工作被分割开来并被适当地安排了优先次序。</em>

这是一个如何使用 postTask() 的简单示例。可以实例化不同的 TaskController 对象，这些对象可以在任务之间共享优先级，包括根据需要更改不同 TaskController 实例的优先级的能力。

> 并非所有浏览器都支持 postTask()。您可以使用特征检测来查看它是否可用，或者考虑使用 polyfill

## 内置的 yield

调度器API的一个拟议的部分，目前没有在任何浏览器中实现，就是一个内置的 yield 机制。它的使用类似于本文前面演示的 yieldToMain() 函数。

```ts
async function saveSettings () {
  // Create an array of functions to run:
  const tasks = [
    validateForm,
    showSpinner,
    saveToDatabase,
    updateUI,
    sendAnalytics
  ]

  // Loop over the tasks:
  while (tasks.length > 0) {
    // Shift the first task off the tasks array:
    const task = tasks.shift();

    // Run the task:
    task();

    // Yield to the main thread with the scheduler
    // API's own yielding mechanism:
    await scheduler.yield();
  }
}
```

您会注意到，上面的代码非常熟悉，但是您没有使用 yieldToMain()，而是调用并等待 scheduler.yield()。

![img_7](https://web-dev.imgix.net/image/jL3OLOhcWUQDnR4XjewLBx4e3PC3/fyuvJqAV0mLxfZDM9tAm.png?auto=format&w=1294)

<em style="font-size:12px">一个没有yield、yield、yield 和 continuation 的任务执行的可视化图。当使用scheduler.yield()时，任务的执行甚至在屈服点之后还能继续执行。</em>

scheduler.yield() 的好处是continuation，这意味着如果你在一组任务中间yield，其他的计划任务会在yield点之后以同样的顺序继续执行。这可以避免第三方脚本中的代码篡夺您的代码执行顺序。

## 总结

管理任务是具有挑战性的，但这样做有助于你的页面对用户的互动作出更快速的反应。在管理和确定任务的优先次序方面，没有单一的建议。相反，它是一些不同的技术。重申一下，这些是你在管理任务时要考虑的主要事项。

- 让给主线程以完成关键的、面向用户的任务。

- 当用户尝试与页面交互时，使用 isInputPending() 让步给主线程。

- 使用 postTask() 对任务进行优先级排序。

- 最后，在你的函数中做尽可能少的工作。

有了这些工具中的一个或多个，你应该能够在你的应用程序中构造工作，使其优先考虑用户的需求，同时确保不太关键的工作仍然能够完成。这将创造一个更好的用户体验，它的响应速度更快，使用起来更愉快。

Special thanks to Philip Walton for his technical vetting of this article.

Hero image sourced from Unsplash, courtesy of Amirali Mirhashemian.



