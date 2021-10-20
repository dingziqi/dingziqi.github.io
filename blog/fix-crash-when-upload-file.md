---
id: fix-crash-when-upload-file
title: 记录排查上传大视频导致浏览器奔溃的问题
date: 2021-10-20 14:46:00
tags: JavaScript
---


## 背景

负责达人后台的同事找我帮忙排查一个问题，说是在上传超过 1G 视频的时候浏览器会奔溃，浏览器提示的是内存不足，他们给我的初步判断是没有使用分片上传导致的。



## 排查过程

### 如何分片上传

因为上传一般都是用云服务商提供的 sdk，所以一般大家对如何分片上传其实都不太了解。

其实文件的分片很简单，直接对 blob 对象做切割即可。

```js
const chunks = []
const chunkSize = 1024 * 1024 // 1M

const start = 0
while(start < file.size) {
  const end = start + chunkSize
  chunks.push(file.slice(start, end))
  start += end
}
```

上传的话直接构建 FormData 对象提交即可，利用分片我们还可以实现断点续传，秒传（同一文件直接返回服务器有资源）等。

### 何时会写入内存

Chrome 目前内置有一个标签/插件级别的任务管理器，通过这个任务管理器我们就可以看到每个标签或者插件对应的内存/CPU/网络的占用情况，这个新增的功能貌似已经有半年以上了。我们可以通过在浏览器头部的空白区域点击【右键/任务管理器】来打开它。

有了这个工具，我们就可以观察我们的页面内存的变化情况，这样就能排查究竟是什么步骤占用了大量的内存。通过观察发现，内存暴增在点击 input 选择完文件后就已经发生了，所以可以确认并非是上传操作导致的。input 标签选择文件这个操作肯定不会直接把文件写入内存的，不然根本就不可能上传大文件了，所以应该还是在选择完文件后有后续的操作导致内存暴增。

阅读源码后，发现在 input 的 change 回调里有一些的操作来读取视频的信息用于对上传做限制。具体做法是：

- **文件的大小**：
  这个直接读取 event 对象下的 file 对象的 size 属性即可读到。

  ```js
  const size = file.size;
  ```

- **视频的宽高**
  视频宽度读取的操作有点迷，我解释不通...

  ```js
  const  reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = function() {
    
  }
  
  const videoObjUrl = URL.createObjectURL(file);
  const videoObj = document.createElement('video');
  
  videoObj.onloadmetadata = function() {
    URL.revokeObjectURL(videoObjUrl);
    // ... videoObj.videoHeight
    // ... videoObj.videoWidth
  }
  
  videoObj.src = videoObjUrl;
  videoObj.load();
  ```

- **视频的时长**
  时长是通过 Audio 接口获取的，具体步骤是通过 `URL.createObjectURL` 将 change 事件的 file 对象转换成可识别的 URL 供 Audio 来加载使用，然后监听实例化后的 audio 元素的 `loadedmetadata` 事件，这个事件会在获取到视频元数据后响应，而且此时是无需加载视频内容数据的。

  ```js
  const fileUrl = URL.createObjectURL(file);
  
  const audio = new Audio(fileUrl);
  audio.addEventListener('loadedmetadata', () => {
    // audio.duration
  })
  ```

要了解上述一系列的操作，我们需要熟悉以下一些知识：

#### file 对象

我们通过监听 input 的 change 事件拿到的是一个 FileList 对象，每项是一个 File 对象。File 对象是一类特殊的 Blob 对象，所以会有一些关于文件的信息，如：`name`、`size`、`lastModified` 等，这些都是只读属性。

#### ObjectURL / DataURL(s)

File 对象本身就是一个 Blob 对象，所以可以直接被 `FileReader`、`XMLHttpRequest.send()` 等 API 使用，但是如果 File 是图片或者视频时，我们还可能希望能被 `<audio>` 或 `<video>` 等元素使用（如上传时的预览）。但是这些元素都只支持通过 url 来访问资源，所以我们必须将要想办法将 blob 类型 file 转换成 url 才行。

我们可以借助 JavaScript 将 blob 对象转换成两种类型的 url：

一种是 ObjectURL/BlobURL，对应的是 `URL.createObjectURL` 方法，它是字符类型，格式是 `blob:http://xxx.com/id`。使用这种 URL 需要注意几点：ObjectURL 需要手动内存回收，通过 `URL.revokeObjectURL(target)` 来实现，另外就是每次都会创建新的 ObjectURL，即使是对同一个对象进行操作。

另一种就是 DataURL，它也是字符类型，格式为 `data:[mediatype][;base64],<data>`，我们是通过 `FileReader.prototype.readAsDataURL` 来将 File 对象转换成 DataURL 形式。

上述两种 URL 的区别是 ObjectURL 只是对 Blob 对象的引用，而 DataURL 会把 Blob 对象转换成 base64 格式。了解这个之后，我们便能发现是在获取视频宽高时使用了 DataURL 导致内存占用上升。

## 解决方案

旧方案其实是漏洞百出，可以说是错误的解决方案，只是碰巧凑到一起把问题解决了。我们的目标是获取视频的信息，所以压根就不能用 audio 来加载 metadata，因为 audio 肯定只能获取单纯的音频信息。然后就是错误的使用了 DataURL，直接使用 ObjectURL 就能让 video 加载 metadata的，所以最终的方案会是如下：

```js
const objUrl = URL.createObjectURL(file);

const video = document.createElement('video');
video.src = objUrl;
video.addEventListener('loadmetadata', () => {
  // video.duration
  // video.videoHeight
  // video.videoWidth
})
```