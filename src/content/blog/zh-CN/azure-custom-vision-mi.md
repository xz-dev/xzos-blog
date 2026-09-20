---
source_hash: "1caf343f"
source_lang: "en"
target_lang: "zh-CN"
lang: "zh-CN"
title: "Azure Custom Vision：使用托管标识或其他 Azure 标识"
pubDate: "2025-01-01T00:00:00+08:00"
description: "介绍如何在 Azure Custom Vision 中使用 Managed Identity 或其他 Azure Identity 进行身份验证，替代传统的 API Key 方式。"
author: "xz-dev"
category: "Tips"
tags: ["Azure", "Azure access token", "Azure Custom Vision", "Azure identity", "C#", "managed identity"]
---

> 参考：[Custom Vision: Azure role-based access control](https://github.com/MicrosoftDocs/azure-ai-docs/blob/5abf9d69b4888324d167185b627fee73bfc08f69/articles/ai-services/custom-vision-service/role-based-access-control.md)、[Custom Vision: azure.identity credentials aren't supported](https://github.com/Azure/azure-sdk-for-python/issues/33094)

## C# 代码

首先，是 C# 代码。你也可以将其翻译成其他语言，比如 Python。

```csharp
using System;
using Azure.Core;
using Azure.Identity;
using Microsoft.Azure.CognitiveServices.Vision.CustomVision.Training;
using Microsoft.Rest;

namespace ConsoleApp1
{
    internal class Program
    {
        static void Main(string[] args)
        {
            string customVisionEndpoint = "https://<your_project_name>.cognitiveservices.azure.com/";

            try
            {
                // If you are using a managed identity, you can use the following code to get the token
                //var miClientId = "<your_managed_identity_client_id>";
                //var tokenCredential = new ManagedIdentityCredential(miClientId);

                // If you are using DefaultAzureCredential for local development, you can use the following code to get the token
                var tokenCredential = new DefaultAzureCredential();

                var mercuryResourceUri = "https://cognitiveservices.azure.com";
                var tokenRequestContext = new TokenRequestContext(new[] { $"{mercuryResourceUri}/.default" });
                var token = tokenCredential.GetToken(tokenRequestContext).Token;

                // Create a CustomVisionTrainingClient
                var trainingClient = new CustomVisionTrainingClient(new TokenCredentials(token))
                {
                    Endpoint = customVisionEndpoint,
                };

                Console.WriteLine("CustomVisionTrainingClient Instance Created");

                var projects = trainingClient.GetProjects();
                foreach (var project in projects)
                {
                    Console.WriteLine($"Project Name: {project.Name}, Project ID: {project.Id}");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"exception: {ex.Message}");
            }
        }
    }
}
```

### 但是，它为什么能工作？

- 使用“托管标识”或其他标识“登录”到 Resource Manager 终结点 (cognitiveservices.azure.com)
- 获取令牌字符串
- 将该令牌用作密钥来访问 CustomVisionTrainingClient / CustomVisionPredictionClient。
- 做任何你想做的事！

## 在 Azure 门户中设置

按照 [Custom Vision: Azure role-based access control](https://github.com/MicrosoftDocs/azure-ai-docs/blob/5abf9d69b4888324d167185b627fee73bfc08f69/articles/ai-services/custom-vision-service/role-based-access-control.md)，为你的托管标识或像你这样的用户添加角色。