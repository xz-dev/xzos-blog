---
source_hash: "cc9a73b3"
source_lang: "zh"
target_lang: "zh-CN"
is_copy: true
title: "dom4j 的 proguard-rules 配置分享"
pubDate: "2022-09-07"
description: "解决 UpgradeAll 在 F-Droid 上因 dom4j 混淆导致的解析错误，分享完整的 proguard-rules 配置。"
author: "xz-dev"
category: "UpgradeAll"
tags: ["Android", "UpgradeAll", "ProGuard", "dom4j"]
---

## 前言

有用户反馈 UpgradeAll 的 F-Droid 配置无法解析，查看日志后发现 dom4j 部分报错。但是直接 debug 无法复现，只有 release 混淆才会出错。

## 排错

### 原始错误

```
2022-09-06 11:35:33 ClientProxyApi E/ClientProxyApi: org.dom4j.InvalidXPathException: Invalid XPath expression: .//application[@id="com.nextcloud.client"] org.jaxen.saxpath.base.XPathReader at org.dom4j.xpath.DefaultXPath.parse(DefaultXPath.java:355) at org.dom4j.xpath.DefaultXPath.<init>(DefaultXPath.java:59) at org.dom4j.DocumentFactory.createXPath(DocumentFactory.java:222) at org.dom4j.tree.AbstractNode.createXPath(AbstractNode.java:202) at org.dom4j.tree.AbstractNode.selectSingleNode(AbstractNode.java:178) at net.xzos.upgradeall.core.websdk.api.client_proxy.hubs.FDroid.getRelease(FDroid.kt:32) at net.xzos.upgradeall.core.websdk.api.client_proxy.ClientProxyApi.getAppReleaseList(ClientProxyApi.kt:55) at net.xzos.upgradeall.core.websdk.api.ServerApi$getAppReleaseList$value$1$1.invoke(ServerApi.kt:57) at net.xzos.upgradeall.core.websdk.api.ServerApi$getAppReleaseList$value$1$1.invoke(ServerApi.kt:57) at net.xzos.upgradeall.core.websdk.api.ServerApiKt.callOrBack(ServerApi.kt:97) at net.xzos.upgradeall.core.websdk.api.ServerApiKt.access$callOrBack(ServerApi.kt:1) at net.xzos.upgradeall.core.websdk.api.ServerApi$getAppReleaseList$value$1.invoke(ServerApi.kt:57) at net.xzos.upgradeall.core.websdk.api.ServerApi$getAppReleaseList$value$1.invoke(ServerApi.kt:56) at net.xzos.upgradeall.core.utils.data_cache.DataCacheManager.get(DataCacheManager.kt:47) at net.xzos.upgradeall.core.utils.data_cache.DataCacheManager.get$default(DataCacheManager.kt:37) at net.xzos.upgradeall.core.websdk.api.ServerApi.getAppReleaseList(ServerApi.kt:56) at net.xzos.upgradeall.core.websdk.api.ServerApiProxy.getAppReleaseList(ServerApiProxy.kt:27) at net.xzos.upgradeall.core.module.Hub.getAppReleaseList$core_debug(Hub.kt:124) at net.xzos.upgradeall.core.module.app.data.DataGetter.renewVersionList(DataGetter.kt:48) at net.xzos.upgradeall.core.module.app.data.DataGetter.doGetVersionList(DataGetter.kt:34) at net.xzos.upgradeall.core.module.app.data.DataGetter.getVersionList(DataGetter.kt:29) at net.xzos.upgradeall.core.module.app.data.DataGetter.doUpdate(DataGetter.kt:41) at net.xzos.upgradeall.core.module.app.data.DataGetter.update(DataGetter.kt:24) at net.xzos.upgradeall.core.module.app.Updater.update(Updater.kt:59) at net.xzos.upgradeall.core.module.app.App.update(App.kt:74) at net.xzos.upgradeall.core.manager.AppManager.renewApp(AppManager.kt:183) at net.xzos.upgradeall.core.manager.AppManager$renewAppList$5$1.invokeSuspend(AppManager.kt:166) at kotlin.coroutines.jvm.internal.BaseContinuationImpl.resumeWith(ContinuationImpl.kt:33) at kotlinx.coroutines.DispatchedTask.run(DispatchedTask.kt:106) at kotlinx.coroutines.internal.LimitedDispatcher.run(LimitedDispatcher.kt:42) at kotlinx.coroutines.scheduling.TaskImpl.run(Tasks.kt:95) at kotlinx.coroutines.scheduling.CoroutineScheduler.runSafely(CoroutineScheduler.kt:570) at kotlinx.coroutines.scheduling.CoroutineScheduler$Worker.executeTask(CoroutineScheduler.kt:750) at kotlinx.coroutines.scheduling.CoroutineScheduler$Worker.runWorker(CoroutineScheduler.kt:677) at kotlinx.coroutines.scheduling.CoroutineScheduler$Worker.run(CoroutineScheduler.kt:664)
```

### 原始错误分析

看见 `"org.dom4j.InvalidXPathException: Invalid XPath expression:"` 的第一反应就是 XPath 写错了，这里的 XPath 是 `.//application[@id="com.nextcloud.client"]`，所以，按照 [菜鸟教程](https://www.runoob.com/xpath/xpath-syntax.html)，修改为 `//application[@id="com.nextcloud.client"]`，解决方法无效。

直接搜索 `"org.dom4j.InvalidXPathException: Invalid XPath expression:"` 关键词，从 [Why does dom4j throw InvalidXPathException for a valid XPath only in my test environment?](https://stackoverflow.com/questions/38398164/why-does-dom4j-throw-invalidxpathexception-for-a-valid-xpath-only-in-my-test-env) 得知可能是 Dom4j 隐藏了原始错误。

尝试取消混淆后 Dom4j 正常运行，所以排除是 release 混淆之外的错误。

## 编写混淆规则

鉴于对 DOM4J 进行源码修改过于复杂，所以并未选择修改，而是尝试分析 XPath 出错的可能，考虑到混淆后出错，添加 consumer-rules（这里是因为处于模块中）取消对 Dom4j 的混淆。

### 现存的混淆规则

在 Dom4j 的 Issues 列表中搜索关键词 proguard 发现有 [相同问题](https://github.com/dom4j/dom4j/issues/18)，回答中的 `"-dontwarn org.dom4j.**"` 只能忽略 gradle 编译时的警告，自欺欺人行为，忽略。

参考 **[news-reader](https://github.com/avenwu/news-reader)** 的 [proguard-rules.txt](https://github.com/avenwu/news-reader/blob/master/app/proguard-rules.txt#L37-L38) 添加，测试的错误日志同上，错误并未解决。

```
-keep class org.dom4j.** { *; }
-keep interface org.dom4j.** { *; }
```

### 指定 XML 驱动

在网上还有另一种说法 [dom4j 问题解决Can't create default XMLReader； is system property org.xml.sax.driver set groovy](https://blog.csdn.net/wqbs369/article/details/117522473)，手动指定 SaxReader 驱动。

参考 [porting to Android: why am I getting "Can't create default XMLReader; is system property org.xml.sax.driver set?"?](https://stackoverflow.com/questions/10165477/porting-to-android-why-am-i-getting-cant-create-default-xmlreader-is-system) 添加代码：

```java
System.setProperty("org.xml.sax.driver","org.xmlpull.v1.sax2.Driver");
```

编译得到的软件**时而可用时而报错**，后预计为 gradle 编译混淆原因，因此 rebuild 后测试，均失败。

### 手动排除 Dom4j 依赖

所以考虑到应该只是混淆规则的问题，进行范围排除（这里使用了 Android Studio 补全判断项目有哪些库）

```
-keep class org.** { *; }
-keep class com.** { *; }
-keep class java.** { *; }
-keep class javax.** { *; }
-keep class net.** { *; }
```

测试发现错误排除。故尝试一个个取消，检查软件运行状态。这里需要注意在**修改后 rebuild 整个项目**，因为 gradle 可能会偷懒不混淆刚刚取消不混淆的项目。

最终测试出：

```
-keep class javax.** { *; }
-keep class org.** { *; }
```

## proguard-rules 配置

得到上面的 javax 与 org，在 Dom4j 项目库中使用 Github 的代码搜索 [import 依赖](https://github.com/dom4j/dom4j/search?q=import+org.)，最终得到以下规则：

```
-keep class org.dom4j.** { *; }
-keep interface org.dom4j.** { *; }
-keep class javax.xml.** { *; }
-keep class org.w3c.** { *; }
-keep class org.xml.** { *; }
-keep class org.xmlpull.** { *; }
-keep class org.jaxen.** { *; }
```

解决。
