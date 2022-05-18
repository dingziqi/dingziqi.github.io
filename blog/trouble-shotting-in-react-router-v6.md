---
id: trouble-shotting-in-react-router-dom-v6
title: react-router@v6中的踩坑记录
categories: 1/0
date: 2022-05-16 15:44:23
tags: 踩坑
---

最近的项目是基于 create-react-app 官方模板进行定制，以便统一公司内部的 react 相关技术栈，避免“百花齐放”。由于是新项目模板，所以在项目中直接内置了 `react-router-dom@6.x`，本以为这个项目已经那么成熟应该不会有坑了，结果却是一坑接一坑。下面就是一些踩坑实录。

## 放弃类组件支持

在函数组件的道路上，reactr-router-dom 属实激进，在 6.x 的版本里直接只提供 hook 形式的 api。这样的做法完全没有考虑旧代码的兼容和我们这种没有推广开 hooks 的开发团队。不过问题不大，官方不提供 `withRouter`，那我们自己实现一个好了。不过要注意我们实现的 `withRouter` 和旧的 api 还是有差异的。

```js
import { useLocation, useNavigate, useParams } from "react-router-dom"

function withRouter(Component) {
  function ComponentWithRouterProp(props) {
    let location = useLocation()
    let navigate = useNavigate()
    let params = useParams()
    return <Component {...props} router={{ location, navigate, params }} />
  }

  return ComponentWithRouterProp
}
```

## 路由声明的方式

在旧版中，`Route` 组件的声明位置并没有强制约束，可以和我们其它的元素混合搭配。但是在新版中对相关组件的声明做了严格的约束，所有的路由声明都在 `Routes` 组件中，并且只能包含 `Route` 元素。这样的话原先的一些布局方案就行不通了，如原来的 navbar 是 navbar 代码与 Route 混搭的。在新版中我们可以使用嵌套路由来实现类似功能。

```js
import { Outlet } from 'react-router-dom';

function Layout() {
  return (
    <>
      <Navbar />
      <Ooutlet />
    </>
  );
}


<Routes>
  <Route path="/" element={<Layout />}>
    <Route path="/" element={<Home />}>
  </Route>
</Routes>
```

上例中的 Layout 组件就是新版中用于渲染公共布局，其中的 `Outlet` 就是 react-router-dom 提供的用于渲染子路由的占位组件，其它的则为布局的元素。当然，该变更还会引发其它一系列的问题，可以继续往下看。

## 转场动画组件

在旧版中，官方是推荐使用 [react-transition-group](https://github.com/reactjs/react-transition-group) 来做转场动画，但是由于新版路由的声明方式发生变化，现在支持严格的 `Routes` 嵌套 `Route` 的方式，导致官方的 demo 现在执行不了。进过一番搜索后找到了适用于 v6.x 的写法：

```js
import { useMatch, useLocation, Routes, Route } from 'react-router-dom';
import { TransitionGroup, CSSTransition } from 'react-transitoin-group';

function Routes() {
  const location = useLocation();

  return (
    <TransitionGroup>
      <CSSTranstion key={location.pathname} timeout={150} classNames="fade">
        <Routes location={location}>
          {routes.map(({path, index, element}) => (
            <Route
              index={index}
              key={path}
              path={path}
              element={element}
            />
          ))}
        </Routes>
      </CSSTransition>
    </TransitionGroup>
  )
}
```

但是，transition 是配套有 `enter` 和 `exit` 阶段。这就意味着必然存在多页共存的场景，同时还意味着我们每个页面的布局必须为绝对定位，否则就会出现两个页面上下排列的情况，不过多页共存也是最初计划的 slide 动画必须会存在的。但是改变页面布局又会引起一系列其它的变更，导致和滚动的相关的逻辑都会发生变更，评估影响范围还是比较大。

经过一番折腾后，发现可以抛弃 `react-transition-group` 而使用 `animate.css`，将动画降级到 fade 样式即可。这样的好处是 `animate.css` 是纯 CSS 的库，这样可以解耦与 react-router-dom 的关联，并且 fade 动画可以规避多页共存的情况，并且转场效果在产品那里也是能接受的。最终代码效果如下：

```js
import 'animate.css';

function animatify(route) {
  route.element = (
    <div
      key={route.path}
      className="animate__animated animate__fast animate__fadeIn"
    >
      <route.element />
    </div>
  )
  return route;
}

const HomePage = React.lazy(() => import('@/pages/home'))

const routes = [
  path: '/', index: true, element: HomePage
].map(animatify);


export default function AppRoutes() {
  return (
    <Router>
      <Routes>
        <Route path="/" elemet={<Layout />}>
        {
          routes.map(({ index, path, element }) => (
            <Route
              key={path}
              index={index}
              path={path}
              element={element}
            />
          ))
        }
      </Routes>
    </Router>
  )
}
```

## navigationType 含义

在我们的实际业务中，我们可能会需要根据页面的前进/后退来处理一些逻辑。但是在 6.x 版本开始，react-router-dom 不再向外暴露 history 对象，这样我们就没法根据堆栈信息来判断页面进退情况。查看新版 api 后发现有一个 `useNavigationType`，文档中描述的 navigationType 值类型有 `POP`、`PUSH` 和 `REPLACE`，单纯的从字面含义上来看，应该分别是对应 `回退`、`前进` 和 `替换`。但实际情况却是首次进入页面的 navigationType 竟然是 `POP`，不过好像接下来的跳转和回退的 navigationType 的值都是正确的。不过还有一种情况也需要注意，即我们通过 `<a href="/#/next-page">next page</a>` 这样的方式跳转时，也会被当做首次进入页面，但实际情况我们并没有重载 doucment（这个坑困扰了我好几天...）。

## keep-alive 实现

keep-alive 的应用场景是单页路由回退的缓存逻辑，在未使用 keep-alive 的场景下，单页回退到的页面会重新执行完整的生命周期（即重新请求接口和渲染）。在我们大部分的场景中，回退时并不需要刷新页面，特别是一些长列表的情况，我们还需要保留跳出的滚动位置等等，keep-alive 就是用来做这个的。

在 react 生态中有 [react-keep-alive](https://github.com/StructureBuilder/react-keep-alive) 和 [react-reaction](https://github.com/CJY0208/react-activation) 两个库，但是二者目前都没有适配 react-router-dom@6.x，直接使用的会问题。经过一番搜索之后，我找到一个通过自定义一个 outlet 来实现的 keep-alive 的方案，原方案 [链接在此](https://github.com/CJY0208/react-router-cache-route/issues/132#issuecomment-1120172225)。

```js
import { ReactElement, useContext, useRef } from "react"
import { Freeze } from "react-freeze"
import { UNSAFE_RouteContext as RouteContext } from "react-router-dom"

function KeepAliveOutlet() {
  const caches = useRef({})

  const matchedElement = useContext(RouteContext).outlet // v6.3之后useOutlet会多了一层嵌套
  const matchedPath = matchedElement?.props?.value?.matches?.at(-1)?.pathname

  if (matchedElement && matchedPath) {
    caches.current[matchedPath] = matchedElement
  }

  return (
    <>
      {Object.entries(caches.current).map(([path, element]) => (
        <Freeze key={path} freeze={element !== matchedElement}>
          {element}
        </Freeze>
      ))}
    </>
  )
}
```

**使用**：

```js
// Layout.js

export default function Layout() {
  return (
    <>
      {/* 将 react-router-dom 官方的 outlet 替换成我们自己实现的 KeepAliveOutlet 即可 */}
      {/* <Outlet /> */}
      <KeepAliveOutlet />
    </>
  )
}
```

当然，上面实现的 KeepAliveOutlet 只是实现 keep-alive 的核心功能，要在实际项目中使用我们还需要拓展一下，增加回退页面时清除上一页面的缓存，支持手动清除缓存等等。

## demo

上述这些实践的我整理发布到我的 github 项目中了：[react-router-v6](https://github.com/dingziqi/react-router-v6)，有需要的可以参考参考。
