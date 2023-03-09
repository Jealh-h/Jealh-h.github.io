---
title: JavaScript 的隐式转换
date: 2023-03-09 21:28:10
tags: 隐式转换
categories: javascript
---

对于 JavaScript 中的一些运算符（如：==）来说是比较迷惑的。它们产生的结果有时会让我们变得混淆，那这一切的背后就是“隐式转换”在作祟了。

## 前置

### Number 强制转换

|   target   |                       number                       |
| :--------: | :------------------------------------------------: |
| undefined  |                        NaN                         |
|    null    |                         0                          |
| true/false |                        1/0                         |
|   string   |                  解析失败返回 NaN                  |
|   BigInt   |                     TypeError                      |
|   Symbol   |                     TypeError                      |
|   Object   | [@@toPrimitive]("number") → valueOf() → toString() |

**string 解析失败：**

- 忽略前导与尾随的空格/行终止符
- 前导 0 不会识别为八进制文本
- +和-允许在字符串开头，且只能出现一次，后面不能跟空格
- Infinity 和 -Infinity 当作字面量
- 空串或全为空格解析成 0
- 不能含数字分割符

<!-- more -->

### 强制 boolean 转换

|              target               | Boolean |
| :-------------------------------: | :-----: |
|              0 / -0               |  false  |
|               null                |  false  |
|                NaN                |  false  |
|             undefined             |  false  |
|                ""                 |  false  |
| Object / "anything but not empty" |  true   |

### 复杂类型转换成原始类型

复杂数据类型转换为原始类型有以下规则：

- 强制原始值转换：[@@toPrimitive]("default") → valueOf() → toString()
- 强制数字类型转换、强制 number 类型转换、强制 BigInt 类型转换：[@@toPrimitive]("number") → valueOf() → toString()
- 强制字符串类型转换：[@@toPrimitive]("string") → toString() → valueOf()
- Date 和 Symbol 对象是唯一重写 [@@toPrimitive] 方法的对象。Date.prototype[@@toPrimitive] 将 "default" hint 视为 "string"，而 Symbol.prototype[@@toPrimitive] 忽略 hint 并始终返回一个 symbol。

其中 [@@toPrimitive] 为一个内置的 Symbol 属性，其部署方式为：

```typescript
const obj = {
  [Symbol.toPrimitive](hint) {
    if (hint === "number") {
      return 10;
    }
    if (hint === "string") {
      return "hello";
    }
    // 'default'
    return true;
  },
};

// 那么当遇到原始类型转换时就相当于自定义转化了
const num = +obj;
// hint为 number, 结果： 10
```

## 操作符

### ==

首当其冲的肯定是 ”==“， 想必其已经臭名昭著了。那么我们先来看看它的一些坑坑吧 😀。

```typescript
{} == []
null == undefined
new String("str") == true
```

首先，我们明确一下 == 的规则，那么就非常容易去判断结果了，其规则为：

1. <span id="same primitve">相同类型</span>：

- Object 类型：比较引用地址
- Number: 有 NaN 则返回 false, +0 与 -0 相等，操作数相等则返回 true。
- String：只有当两个操作数具有相同的字符且顺序相同时才返回 true。
- Boolean：仅当操作数都为 true 或都为 false 时返回 true。
- BigInt：仅当两个操作数值相同时返回 true。
- Symbol：仅当两个操作数引用相同的符号时返回 true。
- null: 另一个数为 undefined 或 null 才返回 true。否则返回 false。
- undefined: 另一个数为 undefined 或 null 才返回 true。否则返回 false。

2. 其中一个是对象，另一个是基本类型。会按照**<a href="#前置">前置</a>**的规则进行转换成基本类型。

3. 这时都是**基本类型**了，那么有如下规则。

- 都是基本类型，按照<a href="#same primitve">规则 1</a>进行对比。
- 其中一个是 Symbol, 另一个不是，返回 false。
- 其中一个是 boolean, 另一个不是，则将 boolean 转换成数字。
- Number 与 String 对比：使用与 <a href="#Number 强制转换">Number() 构造函数相同的算法</a>将字符串转换为数字。转换失败将导致 NaN，这将保证相等是 false。
- Number 与 BigInt 对比：按数值进行比较。如果数值为 ±∞ 或 NaN，返回 false。
- String 与 BigInt 对比：使用与 BigInt() 构造函数相同的算法将字符串转换为 BigInt。如果转换失败，返回 false。

#### 回到上题

```typescript
{} == []
// 相同类型都是 Object, 比较引用地址，因此返回 false

null == undefined
// null 与 undefined 返回 true

new String("str") == true
// 不同类型
// 先将 new String("str") 转换成基本类型（强制字符串类型转换）得到：
// "str" == true
//其中一个是 boolean 类型，转成 number
// "str" == 1
// 将 string 装换成 number
// NaN == 1
// 最后：false
```

### +

**在求值时，它首先将两个操作数强制转换为基本类型。然后，检查两个操作数的类型**:

- 多个值运算，进行相加操作，如果其中有一个是字符串，那么会将另一个数转换成字符串，进行字符串连接。
- 多个值运算，都是 BigInt, 执行 BigInt 加法，一方是 BigInt,另一个不是，抛出 TypeError。
- 多个值运算，没有 String、BigInt, 都转为数字。
- 单值运算，转换成数字

#### 下面来看一下常见的运算 😏

```typescript
{} + [] + {} + []
// 这里有一个坑就是 {} 会识别为一个 block, 然后就成了下面这种情况
// + [] + {} + []
// 前部分就相当于单目运算，转换成数字类型 []--valueOf-->[]--toString-->''--toNumber-->0
// 0 + {} + []
// 先转换成基本类型
// 0 + '[object Object]' + []
// '0[object Object]' + []
// 转换成基本类型
// '0[object Object]' + ''
// 拼接
//'0[object Object]'

true + 1
// 已经都是基本类型了
// 没有 String、BigInt，都转换成数字
// 1 + 1
// 2

NaN + 1
// 已经都是基本类型了
// 没有 String、BigInt，都转换成数字
// NaN + 1
// NaN

[] + {}
// 装换成基本类型
// '' + '[object Object]'
// [object Object]

{} + []
// 同样的坑就是 {} 会识别为一个 block, 然后就成了下面这种情况
// + []
// 这里成了单目运算，将后面的转换为数值
// 0

（{}） + []
// 这种情况就与 [] + {} 类似了
// '[object Object]'

// {} + {}
// 前面识别为 block
// + {}
// 单目运算。转换成数字
// {} --valueOf-->{}--toString-->'[object Object]'--toNumber-->NaN
// NaN

// [] + []
// 转换成基本类型
// '' + ''
// 拼接
// ''


```

### -

- 两个操作数：将两个操作数转换为数值，并根据两个操作数的类型执行数字减法或 BigInt 减法。如果类型不匹配，则抛出 TypeError。
- 一个操作数：数字则取反，否则转换成数字类型。

#### 看看例题

```typescript
[] - {};
// 转成数字
// [] --valueOf--》 [] --toString--》 "" --toNumber--》 0
// {}--valueOf--》 {}--toString--》 '[object Object]'--toNumber--》 NaN
// 0 - NaN
// NaN
```

### !

- 运算符将真值或假值转换为对应的相反值
- 当与非布尔值使用时，如果其操作数可以转化为 true，则返回 false，否则返回 true。

#### !!

双非运算符，将运算值转换成相应的 boolean 类型。

#### 看看例题

```typescript
![];
// 将 [] 转成 boolean, 根据强制Boolean转换(Object类型）：[] --> true
// !true
// false
```

### > / <

**所有的比较操作符都是先强制转化左操作数再强制转化右操作数。**
首先，通过依次调用其 [@@toPrimitive]（以 "number" 作为提示）、valueOf() 和 toString() 方法，将对象转换为原始类型。左边的操作数总是在右边的操作数之前被强制转换。

- 如果两个值都是字符串，则根据它们所包含的 Unicode 码位的值，将它们作为字符串进行比较。
- 否则，尝试将非数值类型转化为数值类型。
- 如果一个为 NaN, 返回 false。

#### 看看例题

```typescript
"a" < 3;
// 先将左边转化为数值类型
// NaN < 3
// 有一个为NaN, 返回 false
// false

0 < [];
// 左边为数字类型，将右边转换为数字类型
// [] --toString--> '' --toNumber--> 0
// 0 < 0
// false
```

## 总结

隐式转换的规则非常多，但都是向基本类型转换，所以理解<a href="#复杂类型转换成原始类型">复杂类型转换成原始类型</a>比较重要，特别的还需要注意 {} 识别为一个 block 的情况。

## Reference

- <https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Operators/Equality>
- <https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Data_structures#%E5%BC%BA%E5%88%B6%E5%8E%9F%E5%A7%8B%E5%80%BC%E8%BD%AC%E6%8D%A2>
- <https://www.zhihu.com/question/45478070>
