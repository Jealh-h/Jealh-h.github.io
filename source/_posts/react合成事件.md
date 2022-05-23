---
title: react事件系统
date: 2022-05-01 23:06:13
tags:
categories: react
---

## 开始注册事件

- 这里只是简单的设置一些变量值，见下面代码

```typescript
// 注册事件
// DOMPluginEventSystem.ts
SimpleEventPlugin.registerEvents();
EnterLeaveEventPlugin.registerEvents();
ChangeEventPlugin.registerEvents();
SelectEventPlugin.registerEvents();
BeforeInputEventPlugin.registerEvents();
```

```typescript

allNativeEvent:Set<DOMEventName> = {'click','keyup','keydown',...};

registrationNameDependencies["onClick"] = ["click"];
registrationNameDependencies['onMouseEnter'] = ['mouseout', 'mouseover']; //...

topLevelEventsToReactNames:Map<DOMEventName,string|null> = {"click":"onClick"};
```

<!-- more -->

## 大致流程

![flowchart](https://cdn.jsdelivr.net/gh/PancakeDogLLL/imageBed/img/202205062357.png)

## listenToAllSupportedEvent

- 接下来是让root容器监听所有支持的事件

非委托事件只有捕获阶段。
而委托事件捕获冒泡都会绑定。

```typescript
allNativeEvents.forEach(domEventName => {
  // 我们单独处理selectionchange更改，因为它不会冒泡，需要出现在document上
  if (domEventName !== 'selectionchange') {
    if (!nonDelegatedEvents.has(domEventName)) {
      // 不捕获
      listenToNativeEvent(domEventName, false, rootContainerElement);
    }
    // nonDelegatedEvents事件是是捕获阶段监听器
    // delegatedEvents是冒泡捕获都有
    listenToNativeEvent(domEventName, true, rootContainerElement);
  }
});
```

**_注意：_**selectionChange事件是监听在document上的，因为它不会冒泡。

## 绑定react的listener到root || document上

listenToNativeEvent **-->** addTrappedEventListener **-->** listener = createEventListenerWrapperWithPriority

## createEventListenerWrapperWithPriority

这里进行创建listener,listener有如下几种：

```typescript
function createEventListenerWrapperWithPriority(
  targetContainer: EventTarget,
  domEventName: DOMEventName,
  eventSystemFlags: EventSystemFlags,
): Function {
  const eventPriority = getEventPriority(domEventName);
  let listenerWrapper;
  switch (eventPriority) {
    // 一般事件都是DiscreteEventPriority
    case DiscreteEventPriority:
      listenerWrapper = dispatchDiscreteEvent;
      break;
    case ContinuousEventPriority:
      listenerWrapper = dispatchContinuousEvent;
      break;
    case DefaultEventPriority:
    default:
      listenerWrapper = dispatchEvent;
      break;
  }
  return listenerWrapper.bind(
    null,
    domEventName,
    eventSystemFlags,
    targetContainer,
  );
}
```

这三种listener存在一个优先级的差别。
最终都会调用dispatchEvent.

## dispatchEvent

- 这是react进行触发事件监听函数的地方，这里的listener是绑定到组件props上的事件处理函数。

首先判断是否是allowReplay事件：

```typescript
  const allowReplay = (eventSystemFlags & IS_CAPTURE_PHASE) === 0;
  // eventSystemFlags capture时等于4,bubble时等于0
  // capture & 4 = 4; bubble & 4 = 0
  // IS_CAPTURE_PHASE = 4
```

然后是先去尝试调度事件,判定是否会blockOn：

```typescript
  const blockedOn = attemptToDispatchEvent(
    domEventName,
    eventSystemFlags,
    targetContainer,
    nativeEvent,
  );
```

## attemptToDispatchEvent

1. 先是获取真正的事件触发元素：e.targe，这里称为nativeEventTarget
2. 获取nativeEventTarget上的Fiber,即"__reactFiber${Random...}"属性。这里是targetInst.
3. 处理让targetInst为null的情况。
    1. 节点被unmounted,即不能通过return属性到达根节点。
    2. 如果最近的mounted是SuspenseCompnent | HostRoot | 最近的mountedFiber  !== targetInst

接下来进入真正的事件调度函数。

## dispatchEventForPluginEventSystem

- 在这里面，会有一个mainLoop,去寻找一个root节点，因为在root节点上，会绑定一些事件。
- 遍历的方式是从当前节点一直往上（return）.
- 最后batchedEventUpdates ---> dispatchEventsForPlugins

```typescript
// DOMPluginEventSystem
function dispatchEventForPluginEventSystem(
  domEventName: DOMEventName,
  eventSystemFlags: EventSystemFlags,
  nativeEvent: AnyNativeEvent,
  targetInst: null | Fiber, // 触发事件的Fiber
  targetContainer: EventTarget, // root
): void {
  let ancestorInst = targetInst;
  if (
    (eventSystemFlags & IS_EVENT_HANDLE_NON_MANAGED_NODE) === 0 &&
    (eventSystemFlags & IS_NON_DELEGATED) === 0
  ) {
    const targetContainerNode = targetContainer as Node;

    if (targetInst !== null) {

      let node = targetInst;
      mainLoop: while (true) {
        // ...搜索root container
      }
    }
  }

  batchedEventUpdates(() =>
  // 进入合成事件系统
    dispatchEventsForPlugins(
      domEventName,
      eventSystemFlags,
      nativeEvent,
      ancestorInst,
      targetContainer,
    ),
  );
}
```

## dispatchEventsForPlugins

- 将nativeEvent转换成synthesizeEvent,并加入dispatchQueue，最终processDispatchQueue。

_extractEvents:_

  > 创建DispatchEntry:{event:listeners}，并添加到dispatchQueue

  1. 工厂模式确定SyntheticEventCtor
  2. accumulateSinglePhaseListeners从target到root遍历，获取绑定到props的事件处理函数，添加用户自己添加的事件处理函数到listeners数组里并返回。
  3. dispatchQueue.push({event,listeners})
  这里event也就是synthesizeEvent对象，即在事件绑定后的回调函数的默认参数event.

_processDispatchQueue:_

> 遍历dispatchQueue,处理每个事件的listeners数组

```typescript
/**
 * 调用processDispatchQueueItemsInOrder，执行事件处理函数
 * @param {Array<{
 * event: ReactSyntheticEvent,
 * listeners: Array<{
 * instance: null | Fiber,
 * listener: Function,
 * currentTarget: EventTarget,
 * }>}} dispatchQueue
 * @param {EventSystemFlags} eventSystemFlags
 */
export function processDispatchQueue(
  dispatchQueue: DispatchQueue,
  eventSystemFlags: EventSystemFlags,
): void {
  const inCapturePhase = (eventSystemFlags & IS_CAPTURE_PHASE) !== 0;
  for (let i = 0; i < dispatchQueue.length; i++) {
    // { event: ReactSyntheticEvent,listeners: Array < DispatchListener >};
    const { event, listeners } = dispatchQueue[i];

    processDispatchQueueItemsInOrder(event, listeners, inCapturePhase);
    //  event system doesn't use pooling.
    // 事件系统不使用池。
  }
  // This would be a good time to rethrow if any of the event handlers threw.
  rethrowCaughtError();
}
```

- processDispatchQueueItemsInOrder

> 根据inCapturePhase判定是capture还是bubble,

```typescript
    /**
 * 执行事件队列，根据是否捕获确定事件的执行顺序
 * []dispatchListeners
 * 捕获：重最后一个到第一个
 * 冒泡：重0到最后一个
 * @param {ReactSyntheticEvent} event
 * @param {Array<DispatchListener>} dispatchListeners
 * @param {boolean} inCapturePhase
 * @returns
 */
function processDispatchQueueItemsInOrder(
  event: ReactSyntheticEvent,
  dispatchListeners: Array<DispatchListener>,
  inCapturePhase: boolean,
): void {
  let previousInstance;
  // 捕获
  // 因为添加dispatcher时是从当前然后return到null,所以捕获是倒过来的运行
  if (inCapturePhase) {
    for (let i = dispatchListeners.length - 1; i >= 0; i--) {
      // { instance: null | Fiber,listener: Function,currentTarget: EventTarget};
      const { instance, currentTarget, listener } = dispatchListeners[i];

      // 阻止冒泡stopPropagation
      if (instance !== previousInstance && event.isPropagationStopped()) {
        return;
      }
      executeDispatch(event, listener, currentTarget);
      previousInstance = instance;
    }
  } else {
    for (let i = 0; i < dispatchListeners.length; i++) {
      const { instance, currentTarget, listener } = dispatchListeners[i];
      if (instance !== previousInstance && event.isPropagationStopped()) {
        return;
      }
      executeDispatch(event, listener, currentTarget);
      previousInstance = instance;
    }
  }
}
```

## executeDispatch

- 最终调用用户的处理函数,其中包含一些react的invoke函数，以及一些在开发环境下的createEvent事件。

> 本文还有许多细节没有提到，只是大致说明了事件系统的一个流程

## 未完待续
