---
title: 去除disqus广告
date: 2021-09-30 11:05:52
tags: 博客,disqus
---

今天打开网站发现在文章底部居然还有广告，我一个静态站应该也不会被人黑才对，审查元素后才发现居然是 Disqus 的广告...，并且还不能在 Disqus 后台关闭，这哪能忍，直接上代码：

```css
iframe:not([src]) {
  display: none;
}
```

终于又恢复了往日的整洁了！