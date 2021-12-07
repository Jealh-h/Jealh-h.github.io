---
title: 一次base64指令的powershell
date: 2021-11-18 22:33:12
tags:
categories: 一些趣事的🌟
---

**事情发生是在一个月黑风高的晚上。。。。不好意思搞错了 😬。**
**事情是这样的，今天在使用 webpack-dev-middleware 构建开发环境的时候，想要使用 node 启动浏览器并自动打开相关的本地网址。于是就发生了下面的一幕。**
![](https://gitee.com/gitme-H/images-bed/raw/master/img/u=1178727920,923148390&fm=26&fmt=auto.webp)

<!--more-->

# 关于 open 这个 node_module

**这是一个 node 的依赖包，使用其提供的相关 api 可以用浏览器打开具体的网址。具体用法如下**

```javascript
const open = require("open");

// Opens the image in the default image viewer and waits for the opened app to quit.
await open("unicorn.png", { wait: true });
console.log("The image viewer app quit");

// Opens the URL in the default browser.
await open("https://sindresorhus.com");

// Opens the URL in a specified browser.
await open("https://sindresorhus.com", { app: { name: "firefox" } });

// Specify app arguments.
await open("https://sindresorhus.com", {
  app: { name: "google chrome", arguments: ["--incognito"] },
});

// Open an app
await open.openApp("xcode");

// Open an app with arguments
await open.openApp(open.apps.chrome, { arguments: ["--incognito"] });
```

**为了一探究竟，它是怎样打开浏览器的，所以我就开始了查看源代码之旅。然后就出现了 powershell 执行 base64 编码的命令这个有趣的事情了。**

# 在 powershell 中使用 base64 编码的指令

**在 open 的源码中，有个 encodeArguments 的数组，大概是这个样子['start', 'http://....' ]，其打开浏览的的主要命令就是**

```powershell
 start (application) <网址>
```

**而它在传递 powershell 命令时有这样一行代码代码,通过注释我们可以明白这是一个使用 base64 编码的 powershell 命令。于是乎我就开始了我的实验性探究了了**🥳。

```javascript
// Using Base64-encoded command, accepted by PowerShell, to allow special characters.
target = Buffer.from(encodedArguments.join(" "), "utf16le").to;
```

**果不其然，在微软的文档里确实查到了 😃,不过需要注意的是需要 utf-16le 的编码。**
**_铛铛铛铛！！_**
![](https://gitee.com/gitme-H/images-bed/raw/master/img/encodedCommand.png)

# 实际测试

**下面我就以 node 打开浏览器为例子，进行 base64 编码命令的测试。**
**node 打开浏览器的代码如下：**

```javascript
const cp = require('child_process');

// 获取base64编码的指令
let command = Buffer.from(<目标指令> 'utf16le').toString('base64');

let subprocess = cp.spawn(`${process.env.SYSTEMROOT}\\System32\\WindowsPowerShell\\v1.0\\powershell`, [
    "-EncodedCommand",
    'cwB0AGEAcgB0ACAAaAB0AHQAcAA6AC8ALwBiAGEAaQBkAHUALgBjAG8AbQA='
    // 'start http://baidu.com' 上面是这一行命令的编码
], {
    windowsVerbatimArguments: true
})
```

**下面是效果图**
![](https://gitee.com/gitme-H/images-bed/raw/master/img/20211191146.gif)
**奇怪的知识又增加了 🌟**
