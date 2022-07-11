---
id: confused-history-dot-length
title: 令人迷惑的history.length
categories: 1/0
date: 2022-07-10 10:25:55
tags: JavaScript
---

最近在开发 APP 内嵌 HTML 页面时需要开发一个自定义的导航栏来实现一些全屏的页面效果，期间就遇到一个问题页面返回的问题。我们的页面通常是在运行在原生的某个容器当中，可以类比成浏览器中的标签页。在这个容器中我们同样可以通过 JS API 来实现页面的前进后退功能，但是当页面退到第一个页面时，我们期望的行为是关闭当前容器，返回容器堆栈的上一个。但是你觉得 JS API 能有这个权限吗？显示是没有的，所以当我们到达第一个页面时，需要调用 APP 提供我们的 JS Bridge 接口来关闭当前容器。

所以上述的方案就是在页面处于非历史栈底时我们调用 `history.back()` ，而到了栈底的页面时，我们调用 APP 关闭容器的 Bridge 接口。那么问题的关键就是我们如何判断当前是否处于页面历史的栈底。我脑海里第一反应是想到 `history.length` 这个 API，我大概有一些印象 `history` 这个 API 是浏览器开发给开发者返回页面历史堆栈信息的接口，虽然我们不能直接读取到栈中某个历史记录的详情信息，但是我们可以通过 `history.length` 获取栈的长度信息，第一个页面不就是对应栈的长度为 1 嘛。

我快速的重写了自定义导航栏组件，然后打开一个页面点击返回，果然是进入到调用关闭容器的逻辑，看来这个问题搞定了。但现实却总是事与愿违，当我跳转到更深层级的页面再返回到首页时却触发不了关闭容器的逻辑了，然后我打印 `history.length` 一看，居然不是 1...，这大脸来得也太快了。那就只能在去找文档复习一下了，在 MDN 中关于 `history.length` 的描述是:

> The History.length read-only property returns an integer representing the number of elements in the session history, including the currently loaded page.

这段话并不能解释为啥我回到首页时 `history.length` 不是 1，于是我又 google 了一下，然后在 stackoverflow 上找到了以下的答案：

> Think of window.history as a logically growing list or array of pages visited. Initially, there is only the initial page. When you navigate forward, a new entry is added to the end of the list and window.history.length increases by one. When you go back a page, the list does not have the entry you were previously at removed. Instead, it remains and you then have the opportunity to go forward (back to the page you just came back from).

看完我不禁要拍断大腿，原来页面返回的时候不会做出栈操作，只通过索引来引用相应历史记录信息，不过这不也是为什么浏览器都有前进和后退两个方向的操作，以前确实没有留意为啥能向前跳转...。

那么访问过的历史记录会一直存在栈里不会被删除吗？对于这个问题，我们则需要吸取下教训，谨慎行事。既然浏览器的前进后退功能是依赖 session history 来实现的，我们不妨从浏览器的行为来反推一下。我们访问多个页面都可以通过前进直接回到历史页面，那么就意味着这些历史记录时没变删除的，但是我们回退后再跳转到一个新的页面，这个时候前进按钮置灰了，这个时候我们回退后的前进操作只能回来这个新的页面了，我们似乎没法再回到第一轮进去的页面了，那么这些无法访问的页面历史记录是不是就可以删除了。

于是我又赶紧测试了一下，果然和预期的一样，重新推入新页面时会删除掉那么在当前页面之后的历史记录。那到目前为止 `history` 的核心逻辑我了解的也差不多了，但是回顾下我们需求，`history.length` 显然已经不适用我们的业务场景了，其实我觉得 `history` 还缺一个关键的 API，那就是 `history.current`，如果我能知道当前处于栈的位置，那么问题自然也能迎刃而解了。

最后再说一下我最终的解决方案吧，我是通过介入 router 库的跳转逻辑，手动记录了一份页面历史堆栈信息，但是需要注意，我这里记录的是当前 Web APP 的历史堆栈信息，我们还需要配合 `document.referrer` 才能判断出是否是容器的首个页面页面。

期间我也找到过其它的一些方案，如兼容性还不够的 [navigation.canGoBack](https://caniuse.com/?search=canGoBack)，或者让 APP 端来监听 WebView 的 `NavigationState.canGoBack` 来做判断。