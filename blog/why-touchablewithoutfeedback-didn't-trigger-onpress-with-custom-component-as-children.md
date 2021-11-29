---
id: why-touchablewithoutfeedback-didn't-trigger-onpress-with-custom-component-as-children
title: 自定义组件外层TouchableWithoutFeedback无法触发onPress
categories: 1/0
date: 2021-11-28 22:55:14
tags: react-native
---

最近在整理 React-Native 项目的公共组件时重新封装了一些新组件，但是在验证组件时却发现了 bug，同样的一个元素结构直接作为 `TouchableWithoutFeedback` 的 children 的话表现是正常的，但是被封装到自定义组件内后就无法触发 onPress 事件了，大致的代码示例如下：

```jsx
const MyText = ({children}) => {
  return <Text>{children}</Text>
} 

...
<TouchableWithoutFeedback onpress={...}>
  <Text>onPress 能正常触发</Text>
</TouchableWithoutFeedback>

<TouchableWithoutFeedback onpress={...}>
  <MyText>onPress 不能触发</MyText>
</TouchableWithoutFeedback>
```

经过一番 google 后，发现原来官网有解释这个问题：

>  Importantly, TouchableWithoutFeedback works by cloning its child and applying responder props to it.

意思就是 TouchableWithoutFeed 会代理它 children 的 responder 属性，并通过属性传递下去，在上述封装的自定义场景中，TouchableWithoutFeedback 是把封装到的 responder 属性传递给了我们的 MyText 属性，但是我们的自定义组件并不能触发这些 responder，所以我们必须在封装自定义组件的时候再把剩余的属性全部向下传递。

最终我们改造一下 MyText 组件即可正常触发 onPress 事件了。

```jsx
const MyText = ({children, passedProps}) => {
  return <Text {...passedProps}>{children}</Text>
}

另外，TouchableOpacity 和 TouchableHightlight 并没有上述问题。我猜应该是这两个组件内部有子元素来接收封装的 responder 属性，因为这两个组件还有一些样式的行为也是需要有内部的元素来承担实现的。