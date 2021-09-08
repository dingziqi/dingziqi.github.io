---
id: why-postmessage-execute-fail
title: postMessage execute fail 之谜
date: 2019-11-21 15:39:44
tags: bug
---

最近在使用了`postMessage`的项目中遇到了一个报错，报错的大致内容如下：

```
(index):20 Failed to execute 'postMessage' on 'DOMWindow':
The target origin provided ('http://www.a.com') does not match the recipient
window's origin ('http://www.b.com').
```

当时的html页面结构大致是这样：

```html
<html>
  ...
  <!-- www.b.com -->

  <body>
    <iframe></iframe>
    <script>
      ...
      // 这里是在一个异步操作中
      iframe.src = 'http://www.a.com';
      ...
      // 有多次 postMessage 操作
      iframe.contentWindow.postMessage('message', 'http://www.a.com');
    </script>
  </body>
</html>
```

从报错信息来看似乎是因为调用 postMessage 传入的 targetOrigin 和对应 iframe 实际的 url 不一致导致的，那这可能是 postMessage 对 targetOrigin 校验错误信息。但是我 postMessage 中设置的 targetOrigin 是和 iframe 的 url 是一模一样的。而且错误信息中提示我 recipient window 的origin 是 http://www.b.com，我并没有给 iframe 设置过类似的 url。并且后续的 postMessage 操作又没有报这个错误了。

经过我一番 debug 之后才发现，报错是发生在异步设置 iframe 的 src 之前，也就是说是当时的 iframe 的 src 并没有值。但是抛出的异常信息又说 recipient window 的 origin 的值是 b.com，简直是在误导我...

并且，我 debug 的过程中我还发现了一个更毁三观的问题。当我试着把 iframe 的 src 改成 http://www.baidu.com （与 targetOrigin 不同时），竟然不会报上面那个错。WTF！那我前面的猜想`那这可能是 postMessage 对 targetOrigin 校验错误信息` 不就是错的了。

我只好又写了几个 demo 来测试，最后发现只有在 iframe 的 src 没有值，或者它的值中的主机名与 targetOrigin 中的主机名一致，但是 origin 又不一致（即端口或者协议不同）的情况下才会抛出是上面那个错误。如： `http://www.a.com` 与 `http://www.a.com:8080` 才会报错。`http://www.a.com` 与 `http://www.b.com` 这样并不会报错，只是 message 不会被传递而已。

**另外讲一个写 demo 过程中发现的问题。** [https://codepen.io/](https://codepen.io/) 和 [https://jsbin.com/](https://jsbin.com/) 这两个在线编辑器中，如果我在 `HTML` tab 中有 iframe 标签的话，那我在 `JavaScript` tab 编写的内容会被添加我自己编写的 iframe 中...。这个 bug 也是醉人呐~
