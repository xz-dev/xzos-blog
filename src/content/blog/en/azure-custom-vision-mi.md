---
source_hash: "3d9e8161"
title: "Azure Custom Vision: Use managed identity or other Azure Identity"
pubDate: "2025-01-01"
description: "Introduces how to use Managed Identity or other Azure Identity for authentication in Azure Custom Vision, replacing the traditional API Key approach."
author: "xz-dev"
category: "Tips"
tags: ["Azure", "Azure access token", "Azure Custom Vision", "Azure identity", "C#", "managed identity"]
---

> Reference: [Custom Vision: Azure role-based access control](https://github.com/MicrosoftDocs/azure-ai-docs/blob/5abf9d69b4888324d167185b627fee73bfc08f69/articles/ai-services/custom-vision-service/role-based-access-control.md), [Custom Vision: azure.identity credentials aren't supported](https://github.com/Azure/azure-sdk-for-python/issues/33094)

## C# Code

First of all, the C# Code. You can also translate it to other languages like Python.

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

### But, why does it work?

- Use "managed identity" or other identity to "login" to Resource Manager Endpoint (cognitiveservices.azure.com)
- Obtain token string
- Use the token as a key to access CustomVisionTrainingClient / CustomVisionPredictionClient
- Do anything you want!

## Setting in Azure portal

Follow [Custom Vision: Azure role-based access control](https://github.com/MicrosoftDocs/azure-ai-docs/blob/5abf9d69b4888324d167185b627fee73bfc08f69/articles/ai-services/custom-vision-service/role-based-access-control.md), add a role for your Managed Identity or a user like yourself.