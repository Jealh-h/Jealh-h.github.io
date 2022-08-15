---
title: svg基础
date: 2022-07-21 15:52:53
tags:
---

## 一 、定义

svg（Scalable Vector Graphics）可缩放的矢量图形，是 W3C XML 的分支语言之一，用于标记可缩放的矢量图形。

<!-- more -->

## 二、命名空间

定义的命名空间可以把通配、元素、属性选择器限制在指定命名空间里的元素。

### 声明命名空间

使用xmlns属性进行命名空间的声明，下面的声明意味着svg以及它的子节点都属于“http://www.w3.org/2000/svg”这个svg命名空间。

```
<svg xmlns="http://www.w3.org/2000/svg">

</svg>
```

## 三、SVG 元素

See more：[mdn-svg元素参考](https://developer.mozilla.org/zh-CN/docs/Web/SVG/Element#svg_%E5%85%83%E7%B4%A0%EF%BC%88%E6%8C%89%E7%B1%BB%E5%88%AB%E5%88%86%E7%B1%BB%EF%BC%89)
> 上面列出了一些常见以及常用的svg元素，下面我们可以来看看它们是什么样子的以及怎么改变它们的属性。

## 四、图形元素

### 基础图形元素

{% iframe https://codepen.io/l-jour/pen/RwMVwNE %}

### 线段属性

对于stroke填充的线段来说，stroke-dasharray与stroke-dashoffset是两个比较有用的属性。

-   stroke-dasharray：控制用控制线段实线与虚线的单元长度。

<!---->

-   stroke-dasharray：控制虚线的偏移

> stroke-dasharray结合animate的例子

{% iframe https://codepen.io/l-jour/pen/ZExoMmN %}

> 使用stroke-dashoffset与animateTransform、animate绘制加载动画

用animate控制stroke-dashoffset虚线部分的偏移，同时animateTransform控制整个圆环的自转。

{% iframe https://codepen.io/l-jour/pen/ExELqMa %}

> 心电图

这里主要思路就是使用polyline绘制折线图，使用stroke-dasharray绘制虚线，stroke-dashoffset控制虚线空白处的偏移，然后用animate控制stroke-dashoffset的值，就能看见这种线段移动的效果了🫥

{% iframe https://codepen.io/l-jour/pen/qBoYyxL %}

### 强大的path元素

上面的基本图形都是可以用path来创建的，而path的功能远远不止上面这些图形😏。path元素的形状通过属性d来定义，属性d的值是一个“命令+参数”的序列。下面就列出了一些常用的命令。

#### 直线命令

1.  Moveto

    1.  `M x,y` 在这里x和y是绝对坐标，分别代表水平坐标和垂直坐标。
    1.  `m dx,dy` 在这里dx和dy是相对于当前点的距离，分别是向右和向下的距离。

<!---->

2.  Lineto

-   `Lineto`指令将绘制一条直线段。这个直线段从当前位置移到指定位置
-   -   `Lx,y` x与y是绝对坐标，分别代表水平坐标和垂直坐标
    -   `ldx,dy` dx和dy是相对于当前点的距离，分别是向右和向下的距离
    -   `Hx` 绝对坐标，水平移动
    -   `Vy` 绝对坐标，垂直移动
    -   `hdx` 水平移动相对距离
    -   `vdy` 垂直移动相对距离

3.  Z or z：闭合路径

{% iframe https://codepen.io/l-jour/pen/NWYjyxL %}

#### 曲线命令

小写的指令意义同上，都是跟相对的距离

1.  Curveto

    1.    C命令创建一个三次贝塞尔曲线，其中 (x1,y1) (x2,y2)为控制点，x,y为曲线终点
    1.  ` C x1 y1, x2 y2, x y  `or `c dx1 dy1, dx2 dy2, dx dy`

<!---->

2.  Smooth Curveto

    1.    S命令可以用来创建于与前面一样的贝塞尔曲线，如果S命令跟在一个C或S命令后面，则它的第一个控制点会被假设成前一个命令曲线的第二个控制点的中心对称点。如果S命令单独使用，前面没有C或者S命令，那当前点将作为第一个控制点。最大的作用就是光滑地连接两条曲线
    1.  `S x2 y2,x y` or `s dx2 dy2, dx dy`

> C、S命令例子

{% iframe https://codepen.io/l-jour/pen/rNdmJma %}

3.  Quadratic Bézier curveto

-   Q命令用来创建一条二次贝塞尔曲线，只需要一个控制点
-   -   `Q x1 y1,x y` or `q dx1 dx2,dx dy`

4.  Smooth quadratic Bézier curveto

-   T命令类似S命令，用于平滑链接二次贝塞尔曲线
-   -   ` T x1 y1  `or `t dx dy`

> Q、T命令例子

{% iframe https://codepen.io/l-jour/pen/PoRJaqN %}

5.  Arc

-   A命令也可以用于绘制曲线
-   -   `A rx ry x-axis-rotation large-arc-flag sweep-flag x y` `a rx ry x-axis-rotation large-arc-flag sweep-flag dx dy`
    -     参数说明：
    -     rx ry: x、y轴半径
    -     X-axis-rotation: 绕x轴旋转角度
    -     large-arc-flag：0-弧小于180度、1-弧大于180度
    -     sweep-flag：0-逆时针画弧、1-顺时针画弧
    -     x y：终点坐标

## 五、动画

> 放入形状元素内部，在指定的时间段里，设置相关属性的开始与结束值，变化曲线等。

-   #### 动画元素
-   -   animate：用来定义一个元素的某个属性在相应时间的变化
    -   animateTransform：改变目标元素上的一个变形属性，控制旋转、缩放、平移、斜切变换
    -   animateMotion：定义目标元素如何沿一个路径运动
    -   discard：指定在何时丢弃特定元素，从而减少 SVG 用户代理所需的资源。
    -   mpath：配合animateMotion，可代替animateMotion的path属性，用于引用一个外部的path
    -   set：可以用来设定一个属性值，并为该值赋予一个持续时间。它支持所有的属性类型， 包括那些原理上不能插值的， 例如值为字符串和布尔类型的属性。 set 元素是非叠加的。无法在其上使用 additive 属性或 accumulate 属性，即使声明了这些属性也会自动被忽略。

{% iframe https://codepen.io/l-jour/pen/wvmrYLy %}

#### 动画属性

这里大致可以分为三类：

1.  取值属性：控制要动画的属性（如x坐标，width等属性）的值

    1.  **calcMode：** 设置动画的变化曲线（discrete | linear | paced | spline），除了animateMotion默认是paced外，其他是默认linear，当一些不支持线性变化的属性值（string类型的）就会变为discrete。

    1.  **values：** 定义动画过程中的值序列（一个或多个值的分号分隔列表）的值。 如果指定了此属性，则将忽略在元素上设置的任何 `from`, `to`, 和 `by` 属性值。

    1.  **keyTimes：** 以分号分隔的时间值列表，用于控制动画的执行步骤。列表中的每个值与`values`中的值一一对应，定义了`values`中的值在动画中何时执行，keyTimes 列表中的每一个值都是指定在 [0-1] 之间的浮点数，表示动画的完成时间。每一个连续的时间值必须大于等于前一个时间值。

        -   对于 linear 和 spline动画，列表中的第一个时间值必须为 0，列表的最后一个时间值必须为 1。与每个 value 关联的时间值定义了何时设置该 value，该 value 在 keyTimes 的时间 值的中间插值。
        -   对于 discrete动画，列表中的第一个值必须为 0。与每个 value 关联的时间值定义了何时设置该 value，动画函数使用该 value，直到 keyTimes 中定义的下一个时间值。
        -   如果插值模式是 paced动画，keyTimes 属性被忽略。

    1.  **keySplines：** 定义了一组与 keyTimes 列表关联的 Bézier 曲线控制点，定义了一个控制间隔（keyTimes的值列表长度减1即为间隔数）的三次 Bézier 函数。只有spline动画才会有效。

    1.  **from：** 指定属性的开始值

    1.  **by：** 指定将在动画期间修改的属性的相对偏移值

    1.  **to：** 表示将在动画期间修改的属性的最终值

> 取值属性例子

{% iframe https://codepen.io/l-jour/pen/WNzdXNZ %}

2.  时间属性：控制动画如何开始，何时开始、重复次数等

    1.  **begin：** 动画开始时间

    1.  **end：** 动画结束时间

    1.  **dur：** 动画持续时间

    1.  **min/max：** 限制动画的最小/大持续时间

    1.  **restart：** 控制动画是否可以重新开始

        -   `always` ：任何时候都可重新开始
        -   `whenNotActive` ：非动画时可重新开始
        -   `never` ：任何时候都不能重新开始

    1.  **repeatCount：** 指定动画重复的次数、值必须大于 0。

    1.  **repeatDur：** 指定动画的重复时间

    1.  **fill：** 控制动画结束时的状态。有两个值可选

        -   remove：在动画的激活持续时间结束后，动画效果会移除（不再应用）。在动画的激活结束后，动画不再对目标元素有影响（除非动画重新开始）。
        -   freeze：在动画激活持续时间结束后，文档持续时间的剩余时间里（或者直到动画重新开始）动画效果会“冻结”着。（保持动画终态）

<!---->

3.  目标属性：控制要动画的属性

    1.  a**ttributeType：** 当attributeType="XML"时，attributeName被认为是XML的属性；当attributeType="CSS"时，attributeName被认为是css的属性；不指定attributeType时，默认为"auto"，会先将attributeName作为css的属性，如果无效，再将attributeName作为XML的属性。
    1.  **attributeName：** 要动画的属性名

<!---->

4.  其他属性：additive、accumulate

    1.  **additive：** 控制动画属性是否是附加的。
    1.  **accumulate：** 在原来的结果的基础上重复动画的时候每一次循环都累加。这个属性告诉动画是否是每次循环，前一个动画属性值要加上去。需要设置from与to属性。

> additive、accumulate例子

{% iframe https://codepen.io/l-jour/pen/PoREOjj %}

## 六、结构元素

> 结构元素关注的是复用

-   **defs：** 定义一个复用的图形。在`defs`元素中定义的图形元素不会直接呈现。 你可以在你的视口的任意地方利用 `use`元素呈现这些元素。

<!---->

-   **g：** 组合子元素的容器，g元素的属性会被其所有的子元素继承 。与`defs`相比，g定义的除了复用外，在定义时会进行渲染。

<!---->

-   **symbol：** 定义一个图形模版对象，使用`use`元素实例化。`symbol`元素对图形的作用是在同一文档中多次使用，添加结构和语义。symbol通过`use`调用时，` <use  ``/``>`可以设置height、width控制实际绘制的大小。

<!---->

-   **svg** **：** 如果 `svg` 不是根元素，`svg` 元素可以用于在当前文档（比如说，一个 HTML 文档）内嵌套一个独立的 svg 片段 。 这个独立片段拥有独立的视口和坐标系统。

<!---->

-   **marker：** 定义了在特定的path元素、line元素、polyline元素或者polygon元素上绘制箭头或者多边形标记图形。

    -   refx：定义元素参考点的x坐标 (默认是0)
    -   refy：定义元素参考点的y坐标 (默认是0)
    -   markerWidth：表示根据 viewBox 和 preserveAspectRatio 属性渲染 `<marker>` 时要适合的视口宽度
    -   markerHeight：表示根据 viewBox 和 preserveAspectRatio 属性渲染 ` <marker>  `时要适合的视口高度
    -   markerUnits：指示标记放置在形状上的位置时如何旋转

<!---->

-   mask

{% iframe https://codepen.io/l-jour/pen/GRxmgEN %}

## 七、滤镜元素

### 相关标签

> 滤镜通过`<filter>`在`<defs>`中进行定义，在filter标签中提供一系列图元，使用滤镜只需为svg元素设置filter属性即可。

### 常见属性

-   in：标识输入的原语

    -   SourceGraphic：该关键词表示图形元素自身将作为`<filter>`原语的原始输入
    -   SourceAlpha：该关键词表示图形元素自身将作为`<filter>`原语的原始输入. SourceAlpha 与 SourceGraphic 具有相同的规则除了 SourceAlpha 只使用元素的透明度。
    -   BackgroundImage：该关键词表示 filter 元素当前底下的区域的图形快照将被调用。
    -   BackgroundAlpha：BackgroundImage 相同除了只使用透明度。
    -   FillPaint：此关键字表示过滤效果的目标元素上的`fill`属性值。在许多情况下，FillPaint 在任何地方都是不透明的，但如果形状是使用渐变或图案绘制的，它本身包括透明或半透明部分，则情况可能并非如此。
    -   StrokePaint：此关键字表示滤镜效果的目标元素上的笔画属性的值。在许多情况下，StrokePaint 在任何地方都是不透明的，但如果形状是使用渐变或图案绘制的，它本身包括透明或半透明部分，则情况可能并非如此。

<!---->

-   in2：in2 属性标识给定filter原语的第二个输入。它的工作原理与 in 属性完全相同。


> colorMatrix颜色矩阵变换

```typescript
/* R G B A 1 颜色矩阵计算 */
 1 0 0 0 0 // R = 1*R + 0*G + 0*B + 0*A + 0 
 0 1 0 0 0 // G = 0*R + 1*G + 0*B + 0*A + 0 
 0 0 1 0 0 // B = 0*R + 0*G + 1*B + 0*A + 0 
 0 0 0 1 0 // A = 0*R + 0*G + 0*B + 1*A + 0
```

{% iframe https://codepen.io/l-jour/pen/xxWzjde %}


> 使用feGaussianBlur、feColorMatrix、feBlend实现粘稠效果

{% iframe https://codepen.io/l-jour/pen/JjLZbQO %}


> 使用feComposite并设置operator为in，控制显示图像的一部分。

关于feComposite，更多可以看这里：[feComposite](https://apike.ca/prog_svg_filter_feComposite.html)

{% iframe https://codepen.io/l-jour/pen/wvmXOwZ %}



> feDisplacementMap、feTurbulence

feDisplacementMap推荐看这篇：[深入理解SVG feDisplacementMap滤镜及实际应用](https://www.zhangxinxu.com/wordpress/2017/12/understand-svg-fedisplacementmap-filter/)

feTurbulence推荐看这篇：[说说SVG的feTurbulence滤镜](https://zhuanlan.zhihu.com/p/366438535)

位置转换公式：

`P'(x,y) ← P(x + scale * (XC(x,y) - 0.5), y + scale * (YC(x,y) - 0.5))`

{% iframe https://codepen.io/l-jour/pen/OJvwJqV %}

## 八、渐变元素
-   -   ###   linearGradient：线性渐变-   gradientUnits: 控制渐变坐标的单位-   gradientTransform: 对渐变坐标系进行变换（translate、skew、rotate。。。）-   x1：线性渐变起点x坐标-   y1：线性渐变起点y坐标-   x2：线性渐变终点x坐标-   y2：线性渐变终点y坐标-   spreadMethod：定义如何在渐变之外填充

            -   pad：用渐变终点颜色去填充额外区域
            -   repeat：按照开始的渐变顺序重复
            -   reflect：按照开始的渐变相反顺序重复
{% iframe https://codepen.io/l-jour/pen/JjLMMjR %}
    -   ###   radialGradient：径向渐变-   gradientUnits：控制渐变坐标的单位-   gradientTransform：对渐变坐标系进行变换（translate、skew、rotate。。。）-   cx: 用来定义径向渐变终止圆的 x 轴坐标(默认50%)。-   cy：用来定义径向渐变终止圆的 y 轴坐标。-   r：用来定义径向渐变终止圆的半径。-   fx：用来定义径向渐变的焦点的 x 轴坐标-   fy：用来定义径向渐变的焦点的 y 轴坐标-   spreadMethod：确定如何在渐变的定义边缘之外填充形状。

            -   pad：用渐变终点颜色去填充额外区域
            -   repeat：按照开始的渐变顺序重复
            -   reflect：按照开始的渐变相反顺序重复
    -   stop：渐变的颜色坡度
{% iframe https://codepen.io/l-jour/pen/OJvwJqV %}

## 九、关于svg与canvas

可以看看msdn的文章[如何为您的网站在Canvas和SVG之间做出选择](https://docs.microsoft.com/zh-cn/previous-versions/msdn10/Hh377884(v=MSDN.10))

## 总结

svg的世界非常丰富，并且很多属性可以作用不同的元素、拥有不同的效果。元素直接有可以搭配使用，如多个动画，多个滤镜等等，滤镜元素还涉及更多领域知识。总之，元素种类、元素属性非常多，还是需要得慢慢地学习、阅读相关的案例并操作一下才能有所掌握。

-   ## Reference
-   -   [feComposite](https://apike.ca/prog_svg_filter_feComposite.html)
    -   [贝塞尔曲线-wiki](https://zh.wikipedia.org/zh-cn/%E8%B2%9D%E8%8C%B2%E6%9B%B2%E7%B7%9A)

