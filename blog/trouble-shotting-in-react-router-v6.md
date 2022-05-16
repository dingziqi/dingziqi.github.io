---
id: trouble-shotting-in-react-router-dom-v6
title: react-router@v6中的踩坑记录
categories: 1/0
date: 2022-05-16 15:44:23
tags: 踩坑
---

最近的项目是基于 create-react-app 官方模板进行定制，以便统一公司内部的 react 相关技术栈，避免“百花齐放”。由于是新项目模板，所以在项目中直接内置了 `react-router-dom@6.x`，本以为这个项目已经那么成熟应该不会有坑了，结果却是一坑接一坑。下面就是一些踩坑实录。

## 放弃类组件支持

在函数组件的道路上，reactr-router-dom 属实激进，在 6.x 的版本里直接只提供 hook 形式的 api。这样的做法完全没有考虑旧代码的兼容和我们这种没有推广开 hooks 的开发团队。
