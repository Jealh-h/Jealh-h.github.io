---
title: 对javaScript事件冒泡与事件捕获的再学习
date: 2021-10-21 00:39:16
tags: Event
categories: javascript
---

# 对 javaScript 事件冒泡与事件捕获的再学习

## DOM 树结构

我们在浏览器上会看见一颗 dom 树，这样的树状结构决定了事件的冒泡与捕获。

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Document</title>
  </head>
  <body>
    <h1>hello Github Action</h1>
    <div class="out-A">
      <div class="out-B">
        <div class="out-C">hello, I'am C</div>
      </div>
    </div>
  </body>
</html>
```

<!--more-->

## 事件捕获与事件冒泡流程

![事件冒泡与捕获](https://cdn.jsdelivr.net/gh/PancakeDogLLL/imageBed/img/bubbling-capturing.png)

#### 首先，事件冒泡捕获建立在父子节点绑定了相同类型的事件。比如：都绑定了 onclick 点击事件。

##### 1.当我们点击最里面的 div 标签时，

会先沿着 window->document->parentNodes->EventTarget 路线进行事件捕获，在捕获时会进行对每个 html 对象询问是否绑定了该事件的 listener,如果有则执行它。而事件冒泡则与上面路线相反，但询问行为相同。 ######一般我们给 html 元素添加事件时，会使用 HTMLElement.addEventListener(type, listener, useCapture)给其添加事件处理函数，这里的参数详见[EventTarget.addEventListener](https://developer.mozilla.org/zh-CN/docs/Web/API/EventTarget/addEventListener)。需要特别说明的是第三个参数:

```JavaScript
useCapture:boolean

OR

{
	capture:boolean,
	once:boolean,
	passive:boolean
}
```

这里的 useCapture 以及 capture 就是设置该事件 listener 是否会在捕获阶段触发，默认为 false。

##### 2.我们以如下例子为例：

###### 这里绘制一个三层嵌套的 div，并给它们添加点击事件。

![div](https://cdn.jsdelivr.net/gh/PancakeDogLLL/imageBed/img/div.png)

```javascript
var diva = document.querySelector(".out-A");
var divb = document.querySelector(".out-B");
var divc = document.querySelector(".out-C");
diva.addEventListener("click", function () {
  console.log("A");
});
divb.addEventListener("click", function () {
  console.log("B");
});
divc.addEventListener("click", function () {
  console.log("C");
});
```

然后我们点击 C,出现如下结果：
![output](https://cdn.jsdelivr.net/gh/PancakeDogLLL/imageBed/img/output.png)
可以看见点击 C 后出现了 C->B->A 的输出顺序，为什么会出现 CBA 的输出顺序呢，因为我们在添加事件时，使用了 capture 的默认值 false,即在事件捕获阶段不会触发事件处理函数。

###### 将 capture 的值设置为 true

```javascript
diva.addEventListener(
  "click",
  function () {
    console.log("A");
  },
  true
);
divb.addEventListener(
  "click",
  function () {
    console.log("B");
  },
  true
);
divc.addEventListener(
  "click",
  function () {
    console.log("C");
  },
  true
);
```

输出结果为：
![](https://cdn.jsdelivr.net/gh/PancakeDogLLL/imageBed/img/202110202333.png)
这里可以看见输出结果变为了 ABC，这就是从父节点到 EventTarget 节点的捕获。同时我们也可以发现，如果只给节点添加一个事件处理，这样只会进行捕获或者冒泡。所以下面我们给一个节点添加两个 click 事件，并且把其中一个的 capture 设置为 true,另一个为 false.

###### 给一个节点添加两个 click 事件，并且把其中一个的 capture 设置为 true,另一个为 false.

```javascript
diva.addEventListener(
  "click",
  function () {
    console.log("A:capture=true");
  },
  true
);
divb.addEventListener(
  "click",
  function () {
    console.log("B:capture=true");
  },
  true
);
divc.addEventListener(
  "click",
  function () {
    console.log("C:capture=true");
  },
  true
);
//   默认false
diva.addEventListener("click", function () {
  console.log("A:capture=false");
});
divb.addEventListener("click", function () {
  console.log("B:capture=false");
});
divc.addEventListener("click", function () {
  console.log("C:capture=false");
});
```

我们再次点击 C,输出结果如下：
![](https://cdn.jsdelivr.net/gh/PancakeDogLLL/imageBed/img/202110202341.png)
看看，这里的结果表示同时出现了事件捕获与事件冒泡。
<font color="green">到了这里，想必大家对于事件的捕获与冒泡流程有了一定的了解吧。</font>下面我们再来聊聊 Event.stopPropagation()与 Event.preventDefault()

## Event.stopPropagation()与 Event.preventDefault()

#### Event.stopPropagation()

###### 同样是上面的例子。我们给 A:capture=true（捕获阶段）的那个事件处理加上 stopPropagation().看看下面的输出：

![](https://cdn.jsdelivr.net/gh/PancakeDogLLL/imageBed/img/202110202353.png)

###### 只输出了捕获阶段的 A 处理函数，后面子节点的事件函数都没有触发。那我们在冒泡阶段添加这一行又会发生什么呢？下面将添加 stopPropagation 到 C 的冒泡处理函数里，即在 C:capture=false 里面。下面是输出结果：

![](https://cdn.jsdelivr.net/gh/PancakeDogLLL/imageBed/img/202110210005.png)

###### 同样的，事件捕获与事件冒泡流程被截断了。

##### 看到这里，想必明白了吧，stopPropagation 就好比一把‘刀’，你把它添加到什么阶段，那么这个阶段后面的就会被截去。

- 而整个流程是：

###### 事件捕获到事件冒泡

###### 父节点到 EventTarget 节点再到父节点

#### Event.preventDefault()

那把上面的改成 preventDefault 又会是怎样的结果呢？那就试试看咯：
![](https://cdn.jsdelivr.net/gh/PancakeDogLLL/imageBed/img/202110202356.png)
没有影响！！！preventDefault 在没有对事件捕获产生影响，那冒泡阶段呢？也没有影响。所以 preventDefault 只是单纯的阻止了 html 元素的默认事件，比如一个 a 标签能够跳转链接，加上 preventDefault 后就不能跳转了。

## 总结

###### 我们可以看到，可以使用 stopPropagation 阻止事件的冒泡。通常我们在给 html 元素添加事件时，一般都会使用 capture 的默认值：false,这样就只会在冒泡阶段触发事件处理函数，这样通常我们只需要在 capture 为 false 的情况下，给 EventTarget 元素添加 stopPropagation 就行了，这样，无论在捕获阶段还是在冒泡阶段都只会触发 EventTarget 的事件处理函数，从而减少不必要的副作用。

参考：[JavaScript eventing deep dive](https://web.dev/eventing-deepdive/)
