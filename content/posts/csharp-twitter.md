---
title: Create a Linux Docker Container with Azure Web App
date: "2019-06-02"
template: "post"
draft: false
slug: "dotnet-console-secrets"
category: "Services"
tags:
  - ".NET"
description: "If you've played with ASP.NET Core web applications before, you've seen that it provides an easy secrets handling. But then you try it in a Console app and find that the dropdown magic in Visual Studio isn't provided. You can still get this to work, but it takes a bit more elbow grease."
---

If you've played with ASP.NET Core web applications before, you've seen that it provides an easy secrets handling. But then you try it in a Console app and find that the dropdown magic in Visual Studio isn't provided. You can still get this to work, but it takes a bit more elbow grease.

## CSProj

In `project_name.csproj`, add a new UserSecretsId id. This goes directly beneath the existing `TargetFramework` tag, within the same PropertyGroup.

```c
    ...
    <UserSecretsId>New Guid</UserSecretsId>
  </PropertyGroup>
```

I use a site like [this one](https://www.guidgenerator.com/online-guid-generator.aspx) to generate a Guid.

Next, we install the NuGet package. We have to enter the package name manually to the csproj, as there is a NuGet bug ([NuGet#4190](https://github.com/NuGet/Home/issues/4190)) that results in an error of `Package 'Microsoft.Extensions.SecretManager.Tools 2.0.0' has a package type 'DotnetCliTool' that is not supported by project`.

```
  <ItemGroup>
    <DotNetCliToolReference Include="Microsoft.Extensions.SecretManager.Tools" Version="2.2.0" />
  </ItemGroup>
```

## Create secrets

In Admin Powershell, cd to the project folder and add our secrets:

```
dotnet user-secrets set SecretName "SecretContent"
```

This will create our secret data at the following location, where the userSecretsId is the Guid we put in the csproj.

```
%APPDATA%\Microsoft\UserSecrets\<userSecretsId>\secrets.json
```
