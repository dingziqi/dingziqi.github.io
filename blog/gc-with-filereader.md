---
id: fix-crash-when-upload-file
title: FileReader的内存回收
date: 2021-10-21 15:22:00
tags: 内存回收
---

最近在研究文件上传，由于需要计算文件的 hash 值，所以会使用到 FileReader 来读取文件的内容。但是使用 FileReader 读取文件会写入到内存中，如果是大文件的话可能会因为内存不足导致浏览器奔溃。我在网上找了一圈也没看到介绍如何回收 FileReader 占用的内容，所以在这里记录一下自己找到的一些知识。以下是一段 FileReader 的示例代码：

```js
const reader = new FileReader()

reader.readAsArrayBuffer(file)

reader.onload = (e) => {
  // e.target.result 为读取结果
}

```

## FileReader 会自动回收吗？

通常 JavaScript 的内存都是自动回收的，引擎判断是否内存能否被回收的依据是是否被引用，所以我们也可以通过变量置空来手动触发内存回收。但是在 FileReader 的示例中，变量是存储在 reader 的 onload 事件中，`e.target.result` 是一个只读的属性，所以我们没法手动释放内存。但是经过我的观察，读取完一段时间后浏览器是会把文件内容占用的内存释放，期间我没有做任何的操作。

## FileReader 最佳实践

关于 FileReader 的正确用法我还是在阅读 [js-spark-md5](https://github.com/satazor/js-spark-md5) 的 README 发现的。虽然前面我们已经发现了浏览器会帮我们处理 FileReader 的内存回收问题，但是如果我们单次读取过大的文件，也会导致内存占用过大。最合理的做法是将文件分片，控制单次读取内容的大小，同时复用 reader，避免增加新的内存占用，示例代码如下：

```js
const spark = new SparkMd5.ArrayBuffer()
const chunkSize = 100 * 1024 * 1024 // 100M，分片大小会导致读取很慢
const reader = new FileReader()
let start = 0

reader.onload = (e) => {
  spark.apend(e.target.result)

  if(start < file.size) {
    loadChunk()
  } else {
    spark.end()
    // 读取完毕
  }
}

function loadChunk() {
  const end = start + chunkSize
  reader.readAsArrayBuffer(file.slice(start, end))
  start = end
}
```

