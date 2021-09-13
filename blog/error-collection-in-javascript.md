---
id: error-collection-in-javascript
title: JavaScript中的错误收集
date: 2021-06-24 16:28:00
tags: JavaScript
---

## Error 对象

在 JavaScript 中，我们可以使用 Error 对象来描述程序出现的错误。它的原型对象是这样的：

```js
Error.prototype = {
  name, // 错误名，默认情况为 Error
  message, // 错误信息
  fileName, // 调用 Error 构造器所在文件
  lineNumber, // 调用 Error 构造器所在行数
  columnNumber, // 调用 Error 构造器所在的列数
  stack, // 用于描述调用 Error 构造器及向上的堆栈信息，每一条都会包含文件、行数及列数信息
};
```

Error 对象还是一个构造器，我们可以用它来实例化一个错误实例。需要注意的是，我们实例化错误对象时是和创建普通的对象的操作是一样的，它并不会自动被错误处理函数捕获，我们需要通过 throw 操作或将它传递给错误处理函数。构造器的使用语法是: `new Error(message[, fileName[, lineNumber]])`。

在 JavaScript 中会遇到很多种错误，为了在处理错误时能够更加方便的分辨错误的类型，我们可以直接使用预设的 Error 的子类。这些子类主要是在 `name` 属性有区别，如 `RangeError` 生成的实例的 `name` 属性都是 `RangeError`。其它的错误子类有：

- `EvalError`：表明错误与 `eval` 有关
- `InternalError`：表明错误与 JavaScript 引擎有，如“递归太多”
- `RangeError`：表明错误信与数值信息或参数超出范围有关
- `ReferenceError`：表明错误与错误引用有关
- `SyntaxError`：表明错误是由 `eval()` 过程中遇到的语法错误导致
- `TypeError`：表明错误是由变量或参数类型无效导致
- `URIError`：表明错误是由 `encodeURI()` 或 `decodeURI()` 传递的 URI 无效导致
- ...

除了使用这些内置的 Error 子类，我们还可以自定义 Error 子类：

```js
class CustomError extends Error {
  name = 'customError';

  customProps = {};
}
```

## 捕获错误的方式

我们最常见的捕获错误的方式是使用 `try-catch` 语法来包裹我们认为可能会出现错误的代码语句，需要注意的是，这种方式只能捕获到同步代码中抛出的错误，如果是异步操作中抛出的异常是无法捕获的，如：setTimeout 的回调函数中抛出异常，我们是无法在 setTimeout 这个语句外部的 `try-catch` 语句中捕获到错误的，只能在 setTimeout 的回调函数里去使用 `try-catch` 来捕获错误。

```js
try {
  const err = new Error('something wrong');
  throw err;
} catch (err) {
  // do something with err
}
```

被抛出的异常如果没有在当前的 context 下被捕获的话会被传递到调用栈外层的 context，直至遇到 `try-catch` 语句或者栈顶为止。如果一直到栈顶都没有被 `try-catch` 捕获的话，我们还可以使用全局的错误捕获函数，如在 node 中是 `process.on('uncaughtException', errorHandler)`，在 browser 中是 `window.onerror = errorHandler/window.addEventListener('error', errorHandler)`。

由于无法通过 `try-catch` 来捕获异步函数执行中抛出的异常，所以对于异步函数而言，通常会有另外特定的错误捕获方式。根据不同的异步函数与当前函数交互方式的区别，会有不同的捕获方式：

- `异步 API`：在 node 中有提供很多异步 API，如 `fs.exists` 等等。 这些异步的 API 将错误传递给我们的回调函数的方式来让调用者处理错误。
  ```js
  fs.exists('./test.js', (err, result) => {
    if (err) {
      // handle error in here
    }
  });
  ```
- `promise`：Promise 构造器传入的函数是会立即执行的，但是里面同步部分的代码抛出的异常是无法被构造器外部的 `try-catch` 捕获的，至于里面的异步代码的话既不会被 promise 捕获也不会被外层的 `try-catch`。因为这部分的错误会被 Promise 自己 catch 调。我们可以通过 `.then()` 中的 `rejectedHandler` 或者是 `.catch()` 来捕获它。如果错误没有被正确的捕获的话，则向外冒泡到全局，在 node 中是通过 `process.on(unhandledrejection, handler)` 、在 browser 中是通过 `window.onunhandledrejection = handler/window.addEventListener('unhandledrejection', handler)` 来捕获。如果全局都没有被捕获的话，则会抛出相应的异常。
- `async-await`：`async-await` 是 ES2017 引入的语法，async 函数的执行结果是一个 promise 对象，所以我们可以像处理普通的 promise 对象一样来捕获它的错误。而在它的内部，异步操作主要是在 await 操作符之后，而 await 操作符后的变量/函数都会被转换成一个 promise 对象，当中发生的错误会被转换成 rejected 的 promise，这些 rejected 的 promise 会阻塞 async 函数的继续执行，我们可以借助 `try-catch` 来捕获这些 await 操作抛出的 rejected 的 promise。