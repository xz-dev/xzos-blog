---
source_hash: "cc9a73b3"
title: "Sharing dom4j Proguard Rules Configuration"
pubDate: "2022-09-07"
description: "Resolving UpgradeAll's parsing errors caused by dom4j obfuscation on F-Droid, sharing complete proguard-rules configuration."
author: "xz-dev"
category: "UpgradeAll"
tags: ["Android", "UpgradeAll", "ProGuard", "dom"]
---

## Preface

Users reported that UpgradeAll's F-Droid configuration couldn't be parsed. Checking logs revealed dom4j-related errors. However, debugging couldn't reproduce the issue - it only occurred in release builds with obfuscation.

## Troubleshooting

### Original Error

```
2022-09-06 11:35:33 ClientProxyApi E/ClientProxyApi: org.dom4j.InvalidXPathException: Invalid XPath expression: .//application[@id="com.nextcloud.client"] org.jaxen.saxpath.base.XPathReader at org.dom4j.xpath.DefaultXPath.parse(DefaultXPath.java:355) at org.dom4j.xpath.DefaultXPath.<init>(DefaultXPath.java:59) at org.dom4j.DocumentFactory.createXPath(DocumentFactory.java:222) at org.dom4j.tree.AbstractNode.createXPath(AbstractNode.java:202) at org.dom4j.tree.AbstractNode.selectSingleNode(AbstractNode.java:178) at net.xzos.upgradeall.core.websdk.api.client_proxy.hubs.FDroid.getRelease(FDroid.kt:32) at net.xzos.upgradeall.core.websdk.api.client_proxy.ClientProxyApi.getAppReleaseList(ClientProxyApi.kt:55) at net.xzos.upgradeall.core.websdk.api.ServerApi$getAppReleaseList$value$1$1.invoke(ServerApi.kt:57) at net.xzos.upgradeall.core.websdk.api.ServerApi$getAppReleaseList$value$1$1.invoke(ServerApi.kt:57) at net.xzos.upgradeall.core.websdk.api.ServerApiKt.callOrBack(ServerApi.kt:97) at net.xzos.upgradeall.core websdk.api.ServerApiKt.access$callOrBack(ServerApi.kt:1) at net.xzos.upgradeall.core.websdk.api.ServerApi$getAppReleaseList$value$1.invoke(ServerApi.kt:57) at net.xzos.upgradeall.core.websdk.api.ServerApi$getAppReleaseList$value$1.invoke(ServerApi.kt:56) at net.xzos.upgradeall.core.utils.data_cache.DataCacheManager.get(DataCacheManager.kt:47) at net.xzos.upgradeall.core.utils.data_cache.DataCacheManager.get$default(DataCacheManager.kt:37) at net.xzos.upgradeall.core.websdk.api.ServerApi.getAppReleaseList(ServerApi.kt:56) at net.xzos.upgradeall.core.websdk.api.ServerApiProxy.getAppReleaseList(ServerApiProxy.kt:27) at net.xzos.upgradeall.core.module.Hub.getAppReleaseList$core_debug(Hub.kt:124) at net.xzos.upgradeall.core.module.app.data.DataGetter.renewVersionList(DataGetter.kt:48) at net.xzos.upgradeall.core.module.app.data.DataGetter.doGetVersionList(DataGetter.kt:34) at net.xzos.upgradeall.core.module.app.data.DataGetter.getVersionList(DataGetter.kt:29) at net.xzos.upgradeall.core.module.app.data.DataGetter.doUpdate(DataGetter.kt:41) at net.xzos.upgradeall.core.module.app.data.DataGetter.update(DataGetter.kt:24) at net.xzos.upgradeall.core.module.app.Updater.update(Updater.kt:59) at net.xzos.upgradeall.core.module.app.App.update(App.kt:74) at net.xzos.upgradeall.core.manager.AppManager.renewApp(AppManager.kt:183) at net.xzos.upgradeall.core.manager.AppManager$renewAppList$5$1.invokeSuspend(AppManager.kt:166) at kotlin.coroutines.jvm.internal.BaseContinuationImpl.resumeWith(ContinuationImpl.kt:33) at kotlinx.coroutines.DispatchedTask.run(DispatchedTask.kt:106) at kotlinx.coroutines.internal.LimitedDispatcher.run(LimitedDispatcher.kt:42) at kotlinx.coroutines.scheduling.TaskImpl.run(Tasks.kt:95) at kotlinx.coroutines.scheduling.CoroutineScheduler.runSafely(CoroutineScheduler.kt:570) at kotlinx.coroutines.scheduling.CoroutineScheduler$Worker.executeTask(CoroutineScheduler.kt:750) at kotlinx.coroutines.scheduling.CoroutineScheduler$Worker.runWorker(CoroutineScheduler.kt:677) at kotlinx.coroutines.scheduling.CoroutineScheduler$Worker.run(CoroutineScheduler.kt:664)
```

### Error Analysis

Seeing `"org.dom4j.InvalidXPathException: Invalid XPath expression:"` initially suggested an XPath syntax error. The XPath `.//application[@id="com.nextcloud.client"]` was modified to `//application[@id="com.nextcloud.client"]` following [Rookie Tutorial](https://www.runoob.com/xpath/xpath-syntax.html), but this didn't resolve the issue.

Searching `"org.dom4j.InvalidXPathException: Invalid XPath expression:"` led to [Why does dom4j throw InvalidXPathException for a valid XPath only in my test environment?](https://stackoverflow.com/questions/38398164/why-does-dom4j-throw-invalidxpathexception-for-a-valid-xpath-only-in-my-test-env), suggesting Dom4j might be hiding the original error.

Testing without obfuscation confirmed Dom4j worked normally, ruling out non-obfuscation related issues.

## Writing Proguard Rules

Rather than modifying Dom4j source code (too complex), we analyzed potential XPath issues. Since errors occurred only with obfuscation, we added consumer-rules (as this was in a module) to exclude Dom4j from obfuscation.

### Existing Proguard Rules

Searching Dom4j Issues for "proguard" revealed a [similar issue](https://github.com/dom4j/dom4j/issues/18). The suggested `"-dontwarn org.dom4j.**"` only suppressed gradle compilation warnings - not a real solution.

Referencing **[news-reader](https://github.com/avenwu/news-reader)**'s [proguard-rules.txt](https://github.com/avenwu/news-reader/blob/master/app/proguard-rules.txt#L37-L38):

```
-keep class org.dom4j.** { *; }
-keep interface org.dom4j.** { *; }
```

Testing showed the same error persisted.

### Specifying XML Driver

Another approach found online [dom4j issue solving Can't create default XMLReader; is system property org.xml.sax.driver set groovy](https://blog.csdn.net/wqbs369/article/details/117522473) suggested manually setting SaxReader driver.

Following [porting to Android: why am I getting "Can't create default XMLReader; is system property org.xml.sax.driver set?"?](https://stackoverflow.com/questions/10165477/porting-to-android-why-am-i-getting-cant-create-default-xmlreader-is-system), we added:

```java
System.setProperty("org.xml.sax.driver","org.xmlpull.v1.sax2.Driver");
```

The compiled app worked intermittently - likely due to gradle obfuscation inconsistencies. Rebuilding consistently failed.

### Manually Excluding Dom4j Dependencies

Assuming it was purely a proguard issue, we tried broad exclusions (using Android Studio autocomplete to identify libraries):

```
-keep class org.** { *; }
-keep class com.** { *; }
-keep class java.** { *; }
-keep class javax.** { *; }
-keep class net.** { *; }
```

Testing confirmed errors disappeared. We then systematically removed exclusions to identify the minimal required rules. Note: **rebuild the entire project after each change** as gradle might cache previous obfuscation.

Final testing revealed:

```
-keep class javax.** { *; }
-keep class org.** { *; }
```

## Final Proguard Rules Configuration

Examining Dom4j's [import dependencies](https://github.com/dom4j/dom4j/search?q=import+org.) via GitHub code search yielded these final rules:

```
-keep class org.dom4j.** { *; }
-keep interface org.dom4j.** { *; }
-keep class javax.xml.** { *; }
-keep class org.w3c.** { *; }
-keep class org.xml.** { *; }
-keep class org.xmlpull.** { *; }
-keep class org.jaxen.** { *; }
```

Issue resolved.