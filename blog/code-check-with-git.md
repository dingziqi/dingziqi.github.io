---
id: code-check-with-git
title: JavaScript代码检查及与gulp、git的结合使用
categories: 1/0
date: 2016-07-16 14:55:14
tags:
---

在团队开发过程中，我们可能会要浪费一些时间在代码检查上，譬如拼写的检查、代码规范的检查。作为码农，我们当然不能把自己的时间浪费这种无意义的事情上，所以本篇我将介绍一些自动化代码检查的东西和项目实际上的应用。

<!--more-->

### JSHint

#### 安装及使用

[JSHint](http://jshint.com/)是一个用于 JavaScript 代码静态检查的一些开源项目。他是运行与 node 环境，可以对我们指定的 JavaScript 文件进行一些静态的语法分析，譬如：变量定义、拼写检查、代码风格的检查等，而且检查项是灵活可配置的，可以针对不同项目的要求配置相应的检查项。JSHint 使用方式有多种，他可以通过命令行、node_module、集成到 IDE 这些方式来执行。在 IDE 中主要是通过插件的形式来使用，大家在自己顺手的 IDE 上搜`JSHint`的插件来使用，接下来我主要讲一下在命令行中使用和以 node_module 结合 gulp 使用。

我们可以通过`npm`安装 JSHint。这里需要注意的一些问题，如果我们全局安装 JSHint 他是包含了 CLI 和 JavaScript module 的，如果是本地安装则只包含 JavaScript module。_关于 node 中 CLI 和 JavaScript module 分别是怎么用的我后续再填坑，有兴趣的可以自己去了解先。_

因为我这里要测试命令行中使用，所以我们全局安装。然后就可以通过`jshint filename`来对制定的文件进行检查了。
rem 全局安装
npm i jshint -g

    rem 本地安装
    npm i jshint

#### 配置

前面我们已经知道如何对我们指定的文件进行检查了，但是他检查的规则是什么呢？JSHint 会去解析一个`.jshintrc`文件来确定如何检查，这个文件是个`json`格式的配置文件，我们可以配置一些制定项来定制我们的检查计划。里面具体的配置选项可以上官网上查找。

```json
{
  "undef": true
}
```

这里需要注意的是 JSHint 查找这个`.jshintrc`文件规则，会有多种情况：我们可以在我们命令后加上`--config filename`来执行读取对应配置文件进行检查。另外，我们可以在项目中`package.json`文件的`jshintConfig`来配置我们的`.jshintrc`文件路径。如果上面两种都没有配置的话，则是会按 JShint 默认的规则来查找配置文件：JSHint 会在当前目录查找是否有`.jshintrc`文件，如果没有找到则向文件夹上一层查找，一直到查到`.jshintrc`文件或者根目录为止。如果没有指定`.jshintrc`文件，JSHint 是不会对文件就行检查的。

除了上面这种将检查项配置在`.jshintrc`文件的方式外，我们还可以直接以注释的形式将我们的检查配置写在我们的文件中。如下，如果我们的文件中有这样的注释，我们对该文件进行检查就会对未定义的变量进行检查。我们在代码文件中增加 jshint 配置并不会终止查找`.jshintrc`文件读取配置的流程，只是如果代码文件中和`.jshintrc`有相同的配置时代码文件中的配置会更高。

```javascript
/* jshint undef: true */

your code
```

如果我们在项目中有些文件来自第三方，这些文件不要求尊求我们的规范，我们就需要将这些文件排除在我们的检查列表之外，这时我们就需要另外一个配置文件`.jshintignore`。这个文件主要用于配置哪些文件不用于 JSHint 的检查，里面可以放具体的文件名或者文件夹名（该目录下都不被检查）。

```
node_module
app/test.js
```

### gulp-jshint

在项目中我们肯定不会用命令挨个检查文件是否符合规范，所以我们通常会配合`gulp`这类自动化工具来做这些重复的事情。由于 gulp 是基于“流”的形式来处理的，所以我们无法直接使用 JSHint，我们需要安转一个`gulp-jshint`，然后就可以在我们的 gulp 任务中加入 JSHint 的检查了。下面我们罗列一个简单的使用 JSHint 检查 app 路径下所有 JS 文件的示例代码。

```javascript
var gulp = require('gulp');
var JSHint = require('gulp-jshint');

gulp.task('checkCode', function() {
  return gulp
    .src('./app/**/*.js')
    .pipe(JSHint())
    .pipe(JSHint.reporter('default'));
});
```

JSHint 检查的结果是通过命令行输出的，我们可以使用`.pipe(JSHint.reporter('default'))`来使用默认的样式输出检查结果，为了增强可读性，我们通常还会使用`jshint-stylish`来对结果进行美化。
![iamge](http://7xqhnl.com1.z0.glb.clouddn.com/jshint%E6%A0%BC%E5%BC%8F%E5%8C%96%E8%BE%93%E5%87%BA.png)

另外提下在某些情况下我们要检查的 js 代码可能位于其他类型文件内（如 HTML、JSX 等），我们可以通过配置来实现。还有就是自定义一个 reporter 而不是使用 JSHint.reporter。这些都可以通过查找[文档](https://github.com/spalger/gulp-jshint)来了解具体的操作步骤。

### git-hooks

以上我们就已经实现了使用 gulp 自动对项目文件进行规范检查，但是我们不想手动的去执行这个 gulp 任务，应该手动的话肯定就有人会偷懒了。所以我们考虑可以把 checkcode 任务集成到编译任务，因为前面都已经用到了 gulp 了，说明我们的项目肯定是会需要构建才能调试的，所以我们可以把 checkCode 任务集成进去。但是这样做有个缺点，我们的构建任务通常会是一个高频任务，但是 checkCode 任务肯定会是一个耗时的任务，而且项目稳定之后 checkCode 检查出的问题应该是很少的，所以这样做我们的时间浪费是不值得的，所以我们就得考虑把 checkCode 集成到一个低频的操作中去。这时就是我们的 git-hooks 登场了。

通常我们都会使用 svn/git 这类工具对我们的代码进行管理，除了我们常用的那些 pull/push 功能，我们还可以利用他们提供的 hooks 来在特定的操作中加入我们自己的操作，比如我们这里将要用到的`pre-commit`hook 就能在代码 commit 之前执行我们预设的脚本。因为现在比较流行 git，所以我们接下的方案将是基于 git 来做的。

我们通过`git init`或者`git clone`创建一个 git 项目时，会在项目顶层目录中生成一个`.git`文件夹（隐藏的），里面就包含了我们的一些 git 的配置信息，我们要了解的 hooks 就位于`hooks`目录下。文件夹内放置了很多 hook 的模板，不过这些`.sample`后缀的文件是不能识别的，想让他们执行只要去掉后缀即可。这里的提供的 hooks 只是客户端的 hook，在 server 端也有一些 hook，可以去[这里](https://git-scm.com/docs/githooks)查找全部 hook 的信息和用法。示例中的 hook 是用`shell`写的，但是他是支持`Ruby`或者`Python`来写的。
![image](http://7xqhnl.com1.z0.glb.clouddn.com/git-hooks.png)

下面我参考以前同事的`pre-commit`的脚本，具体内容不再叙述。

```bash
#!/bin/sh

#执行gulp任务，并将结果输出到临时文件
gulp checkCode | tee check.log

#检查gulp的check任务是否执行失败
if grep "warning" check.log || grep "error" check.log
then
echo -e "\033[31m Code check fail! Please try again! \033[0m"
exit 1
else
echo -e "\033[32m Code check success! \033[0m"
fi

#删除临时文件
rm check.log

```

至此，一套结合 git-hooks、gulp 和 JSHint 的代码检查方案就完成了。这种方案不一样会在你的项目中运用，但是了解其中运用的一些东西能帮助你拓宽下视野，对以后或许有帮助。最后，因本人水平有限，如果上文中出现一些错误，请直接指出，勿喷。
