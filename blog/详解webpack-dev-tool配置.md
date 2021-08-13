---
id: webpack-devtool-config
title: 详解 webpack devtool 配置
categories: 1/0
date: 2019-05-17 19:41:52
tags:
---

# 什么是 sourceMap？

sourceMap 是一类用于描述文件压缩混淆前后内容映射的文件，它以 .map 为后缀名，内容为一个 JavaScript 对象。

sourceMap 的产生是由于现在前端开发过程中为了节省带宽，通常会对源码文件进行压缩和混淆，这就导致我们在浏览器中 debug 代码时面对的是压缩和混淆后的代码。所以浏览器提供了一项 souceMap 能力，通过 map 文件来描述压缩文件和原始文件间内容的映射，这样我们在 source 面板下可以对原始文件进行打点调试。

souceMap 并不仅限于 js 文件，css 也支持 sourceMap。

# webpack 中的 sourceMap

我们以 webpack@4 为例，我们可以通过 devTool 配置来控制如何生成 sourceMap。webpack 提供了很多种方式：source-map、cheap-source-map 等等。总的来说可以根据功能分类成以下几种：

1. eval：源码以字符的形式被 eval(...) 来调用，不会生成 sourceMap 信息，只会通过一个 sourceURL 来存储原始文件的位置。
2. source-map：会生成 sourceMap 信息，默认会输出到一个 .map 文件中，且源码中会通过 sourceMappingURL 来指定对应 map 文件位置。
3. cheap：生成的 sourceMap 信息不包含列信息。
4. module：生成的 sourceMap 信息还包含 loader 处理前后的映射信息，比如源码是 jsx，如果没有使用含 module 的 sourceMap，则只能解析回 js 形式，使用了含 module 的则可以解析回 jsx。
5. inline: map 信息以 DataURI 的方式存放在源码文件中。
   具体各种值的打包效果可以参见参考 1。

# 踩坑

使用了 react-hot-loader 需要使用 cheap-module-eval-source-map sourceMap 的行号映射才正确。

#参考

1. webpack 支持的各种 sourceMap 类型
