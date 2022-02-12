---
title: 聊聊JavaScript事件循环
date: 2022-01-12 23:37:00
tags:
categories: javascript
---

**事情还得从这么一道题开始：**

```javascript
let p = new Promise((resolve, reject) => {
  console.log("p");
});
setTimeout(() => {
  console.log("setTime");
}, 0);
console.log("end");
```

各位想想下面的输出顺序是什么吧？
我先说一下我的答案吧：

> end
> p
> setTime

上面的输出是错误的 😥，我是怎么也不开心啊，于是我就开始翻遍各种资料，其中包括任务、微任务、JavaScript 事件循环、Promise 等等资料。下面就让我来细说吧。

<!-- more-->

**首先介绍几个重要的概念。**

## 相关概念

### 任务（宏任务）

任务有以下三类：

- 一段新程序或子程序被直接执行时（比如从一个控制台，或在一个 &lt;script&gt; 元素中运行代码）。
- 触发了一个事件，将其**回调函数**添加到任务队列时。
- 执行到一个由 setTimeout() 或 setInterval() 创建的 timeout 或 interval，以致相应的**回调函数**被添加到任务队列时。
- setImmediate()回调（nodejs）
- I/O
- UI
- postMessage

### 微任务

- promise.then(callback)中的**callback**。
- MutationObserver
- process.nextTick(Node.js)
- Object.observe

### 执行栈

函数的互相调用会让函数树形成一个调用栈，而函数的执行会按照这个栈来执行，即后进先执行。执行栈会占用 JavaScript 的 run time。

### 执行上下文

JavaScript 在运行时，是运行在执行上下文中的，每一个上下文拥有自己的变量、对象，执行上下文有如下几类：

- 全局上下文：在 JavaScript 开始执行时便创建，是最基础的上下文。
- 函数上下文（局部上下文）：在函数调用时会创建，一个函数的执行，伴随一个函数上下文的产生。
- eval 上下文：使用 eval 函数所创建的上下文。

### JavaScript RunTime

执行 js 代码时，运行时引擎拥有一系列的代理，每一个代理由一系列的执行上下文、执行栈、主线程、附加线程（worker）、任务队列、微任务队列。常见的 JavaScript run time 有 iframe、web worker、JavaScript 主线程。

### 事件循环

事件循环负责收集用事件（包括用户事件以及其他非用户事件等）、对任务进行排队以便在合适的时候执行回调。然后它执行所有处于等待中的 JavaScript 任务（宏任务），然后是微任务，然后在开始下一次循环之前执行一些必要的渲染和绘制操作。每一个 JavaScript run time 都会拥有自己的事件循环，RunTime 里面的代理由事件循环所驱动。
**事件循环分为三类：**

#### window event loop

驱动同源的窗口（Frame,Tab）的事件循环，来自相同 origin 的 window 可能共享同一个事件循环

#### worker event loop

驱动 worker 执行（web workers、 shared workers、service workers）worker 拥有一个或多个与主程序不同的代理。

#### worklet event loop

驱动 worklet 代理的运行。worklet 的类型包括（Worklet、AudioWorklet、PaintWorklet）。

### Promise

一种异步 JavaScript 的解决方案，是对异步方法的返回值的一种描述，用于在将来某个时刻将异步结果返回给使用者，最重要的一点是通过 then 链式调用。

## 事件循环机制

在每一轮事件循环开始时，RunTime 会从任务队列里面取出任务来执行，如果任务里面又添加了新任务到队列里面，新任务不会再本轮事件循环里去执行。当一个任务执行完弹出任务队列时，并且执行栈位空时，这时会开始执行微任务队列，微任务不会像任务那样每次只执行一个，而是将微任务队列里的微任务执行完，即使是在执行微任务时有新的微任务加入到微任务队列，在下一个任务开始以及事件循环迭代结束之前依然会执行微任务。
OK，说到这儿，我们就可以来分析以下刚才的题了。

## 题目分析

```javascript
let p = new Promise((resolve, reject) => {
  console.log("p");
});
setTimeout(() => {
  console.log("setTime");
}, 0);
console.log("end");
```

**最开始：**将整体代码（一段新程序）加入任务队列。此时的 JavaScript RunTime 的情况如下图：
![1](https://gitee.com/gitme-H/images-bed/raw/master/img/202201122218.png)

此时任务队列里面仅有整体程序，而微任务队列里面什么也没有。整体程序将进入执行栈中执行。
**创建 promise 对象：**在创建 promise 对象时，传入了可选参数即：

> (resolve,reject)=>{
> console.log('p');
> }

而 Promise 构造器将会在返回新对象之前执行传入的函数参数。所以在执行栈中会执行 console.log('p')，打印出 'p'。
**执行定时器：**执行定时器，会在传入的延迟时间之后将回调函数加入队列，加入什么队列呢，这里加入的是任务队列，因为 settimeoout 的回调属于宏任务。之后，当前执行栈不为空，会继续执行。
**打印 end:**在执行 console.log('end')后，现在执行栈为空了，整体程序弹出任务队列。此时任务队列是**不为空的**（包含定时器的回调()=>{console.log('setTime')}）

此时的 JavaScript RunTime 的情况如下图：
![2](https://gitee.com/gitme-H/images-bed/raw/master/img/202201122230.png)
这时的任务队列包括定时器的回调，而微任务队列依然为空（这道题就没涉及到微任务。。。）。随后定时器回调将进入执行栈，打印出 setTime。所以最终的打印结果为：

> p
> end
> setTime

**这里就注意 promise 的构建就行了，是立即执行，我错的是应为它会进入微任务队列。而 Promise 进入微任务的是 then 的回调函数。**

## 扩展题目

上面的题没有涉及微任务，那我们改改原题目看看：

```javascript
const p_2 = new Promise((res, rej) => {
  console.log("p_2");
  // 定时器1
  setTimeout(() => {
    res("定时器1");
  }, 0);
}).then((v) => console.log(v));
// 定时器2
setTimeout(() => {
  console.log("定时器2");
}, 0);
console.log("end");
```

上面新增的是在创建 Promise 对象时增加了一个定时器，以及增加了对 then 的回调。
依旧从整体程序开始，进入任务队列，当整体程序执行完时，这时的 RunTime 情况如下：
![3](https://gitee.com/gitme-H/images-bed/raw/master/img/202201122252.png)
此时输出为：

> p_2
> end

按照队列先进先出，定时器 1 先进入队列，所以其先于定时器 2 执行。此时定时器 1 的回调进入执行栈执行，执行 res('定时器 1')改变 promise 的状态为 resolve,将 then 的回调加入微任务队列，此时 RunTime 的情况如下：
![4](https://gitee.com/gitme-H/images-bed/raw/master/img/202201122258.png)

定时器 1 执行完毕弹出任务队列，一个任务执行完后，检索微任务队列，这时微任务队列存在一个 then 回调，所以将其加入执行栈。

现在的输出是：

> p_2
> end
> 定时器 1

最终，只剩下了任务队列的定时器 2 回调，重复时间循环，将定时器 2 的回调加入执行栈并执行。最终的输出结果为：

> p_2
> end
> 定时器 1
> 定时器 2

上面这题就说明了一个任务弹出任务队列后会执行微任务队列的任务，可是在上面的概念一章中还提到了一个任务出队列后是要执行所有的微任务，而上面的那一题只有一个微任务看不出什么蹊跷，那么我们再改一下吧。

```javascript
const p_2 = new Promise((res, rej) => {
  console.log("p_2");
  // 定时器1
  setTimeout(() => {
    res("定时器1");
  }, 0);
}).then((v) => {
  console.log("微任务开始");
  for (let i = 0; i < 5; i++) {
    window.queueMicrotask(() => {
      // 函数的内容
      console.log(i);
    });
  }
});
// 定时器2
setTimeout(() => {
  console.log("定时器2");
}, 0);
console.log("end");
```

这次我们更改了 then 的回调，使用了 window.queueMicrotask()来添加回调到微任务队列。这次是添加五个输出到微任务队列里面。顺着上一题的思路，我们只需将上一题的输出**‘定时器 1’**更改一下就行了。按照一次执行掉所有微任务的结论，我们可以作出如下更改。

> p_2
> end
> 微任务开始
> 0
> 1
> 2
> 3
> 4
> 定时器 2

在 chrome 里面试一下吧：）
![5](https://gitee.com/gitme-H/images-bed/raw/master/img/202201122327.png)

可以看见，结论正确。

**参考：**
[https://developer.mozilla.org/zh-CN/docs/Web/API/HTML_DOM_API/Microtask_guide](https://developer.mozilla.org/zh-CN/docs/Web/API/HTML_DOM_API/Microtask_guide)
[https://developer.mozilla.org/zh-CN/docs/Web/API/HTML_DOM_API/Microtask_guide/In_depth](https://developer.mozilla.org/zh-CN/docs/Web/API/HTML_DOM_API/Microtask_guide/In_depth)
