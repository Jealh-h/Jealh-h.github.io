---
title: 【译】Javascript 中的 CJS、AMD、UMD 和 ESM 到底是什么？
date: 2023-02-10 15:19:07
tags:
---

原文：[https://dev.to/iggredible/what-the-heck-are-cjs-amd-umd-and-esm-ikm](https://dev.to/iggredible/what-the-heck-are-cjs-amd-umd-and-esm-ikm)

一开始，Javascript 没有导入/导出模块的方法。这是个问题。想象一下只在一个文件中编写您的应用程序——那将是一场噩梦！

然后，比我聪明得多的人试图为 Javascript 添加模块化。其中一些是 CJS、AMD、UMD 和 ESM。您可能听说过其中一些方法（还有其他方法，但这些都是大玩家）。

<!-- more -->

## CJS

CJS 是 CommonJS 的缩写。这是它的样子：

```typescript
//importing
const doSomething = require("./doSomething.js");

//exporting
module.exports = function doSomething(n) {
  // do something
};
```

- 你们中的一些人可能立即会认为 CJS 语法来自于 nodejs。那是因为 nodejs 使用 CJS 模块格式。
- CJS 同步导入模块。
- 您可以从库 node_modules 或本地目录导入。通过 `const myLocalModule = require('./some/local/file.js')` 或 `var React = require('react');`
- 当 CJS 导入时，它会给你一个导入对象的副本。相当于一个引用地址。
- CJS 将在浏览器中不起作用。它必须被 transpiled and bundled。

```typescript
// ============ foo.js
module.exports = {
  foo: "from foo",
};

// ============ bar.js
const foo = require("./foo.js");

foo.foo = foo.foo + " and from bar";

module.exports = foo;

// ============ index.js
const foo = require("./foo.js");

console.log("before require bar:", foo); // {foo: 'from foo'}

const bar = require("./bar.js");

console.log("after require bar:", foo); // {foo: 'from foo and from bar'}

console.log("definitely same memory address:", bar === foo); // true
```

## AMD

AMD 代表异步模块定义。这是一个示例代码：

```typescript
define(["dep1", "dep2"], function (dep1, dep2) {
  //Define the module value by returning a value.
  return function () {};
});
```

or

```typescript
// "simplified CommonJS wrapping" https://requirejs.org/docs/whyamd.html
define(function (require) {
  var dep1 = require("dep1"),
    dep2 = require("dep2");
  return function () {};
});
```

- AMD 异步导入模块（因此得名）。
- AMD 是为前端而生的（当它被提议时）（而 CJS 是后端）。
- AMD 语法不如 CJS 直观。我认为 AMD 与 CJS 完全相反.

## UMD

UMD 代表通用模块定义.

```typescript
(function (root, factory) {
    if (typeof define === "function" && define.amd) {
        define(["jquery", "underscore"], factory);
    } else if (typeof exports === "object") {
        module.exports = factory(require("jquery"), require("underscore"));
    } else {
        root.Requester = factory(root.$, root._);
    }
}(this, function ($, _) {
    // this is where I defined my module implementation

    var Requester = { // ... };

    return Requester;
}));
```

- 适用于前端和后端（因此得名 universal）。
- 与 CJS 或 AMD 不同，UMD 更像是一种配置多个模块系统的模式。在[此处](https://github.com/umdjs/umd/)查看更多模式。
- 在使用 Rollup/Webpack 等打包器时，UMD 通常用作后备模块

## ESM

ESM 代表 ES 模块。实现标准的模块系统是 Javascript 的提议。相信很多人都看过这个：

```typescript
import React from 'react';

import {foo, bar} from './myLib';

...

export default function() {
  // your Function
};
export const function1() {...};
export const function2() {...};
```

- 适用于许多现代浏览器
- 它兼具两全其美：类似 CJS 的简单语法和 AMD 的异步
- Tree-shakeable，由于 ES6 的静态模块结构
- ESM 允许像 Rollup 这样的打包器删除不必要的代码，允许站点发送更少的代码以获得更快的加载。
- 可以在 HTML 中调用，只需执行以下操作：(script 标签标注 type='module')，node 环境下可以在`package.json`中添加`type='module'`

```html
<script type="module">
  import { func1 } from "my-lib";
  func1();
</script>
```

浏览器兼容性：

- Safari 10.1.
- Chrome 61.
- Firefox 60.
- Edge 16.

### 异步性

```typescript
// ========== foo.js
export default {
  foo: "from foo",
};

// ========== bar.js
import foo from "./foo.js";

foo.foo = foo.foo + " and from bar.js";

console.log(foo);

export default foo;

// ========== index.js
import foo from "./foo.js";

console.log(foo);

import bar from "./bar.js";

// 输出（import bar from './bar.js 提前了）
// bar: { foo: 'from foo and from bar.js' }
// index: { foo: 'from foo and from bar.js' }
```

## 总结

- ESM 是最好的模块格式，这要归功于其简单的语法、异步特性和 tree-shakeability。
- UMD 无处不在，通常用作 ESM 不起作用时的后备方案。
- CJS 是同步的，适合后端。
- AMD 是异步的，适合前端。
  感谢阅读，开发者！以后打算把每个模块都写的很深入，尤其是 ESM，因为里面有很多牛逼。敬请关注！
  如果您发现任何错误，请告诉我。
