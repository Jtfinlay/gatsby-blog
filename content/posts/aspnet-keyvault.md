---
title: From the Ground Up - Keeping your secrets safe
date: "2019-03-06"
template: "post"
draft: false
slug: "aspnet-keyvault"
category: "Services"
tags:
  - "ASP.NET Core"
  - "Azure"
description: "When building a web service from the ground up, one of the first issues we hit is *how to keep our secrets safe*. If we are working in a team environment or releasing our code publicly, it is important to follow best practices to keep our application and data safe. One of the most common vulnerabilities is also one of the simplest - passwords and secrets should never be shared in the source code. Azure Key Vault solves this problem providing ways to control our secrets, keys, and certificates."
---

When building a web service from the ground up, one of the first issues we hit is _how to keep our secrets safe_. If we are working in a team environment or releasing our code publicly, it is important to follow best practices to keep our application and data safe. One of the most common vulnerabilities is also one of the simplest - passwords and secrets should never be shared in the source code. Azure Key Vault solves this problem providing ways to control our secrets, keys, and certificates.

Building our applications with a security mindset is critical. If we get it right to start with, this saves us a lot of time later on. Using an ASP.NET Core 2.1 application, we will look at how to integrate with Azure Key Vault, and how to use it to hide key configuration secrets - such as the one needed for working with **Azure Table Storage**.

We'll be taking a look at

✔ Reading secrets during local development

✔ Reading secrets from Azure Key Vault

✔ Securing an **Azure Table Storage** secret with Azure Key Vault

## Setting up Azure Key Vault

From an existing Azure subscription, create a new Key Vault resource.

![View of creating a Key Vault instance](/media/aspnet-keyvault/create-keyvault.PNG)

Your Azure account is the only one authorized to access the Key Vault. From the settings, under _Access Policies_, you can add other teammates, setup Active Directory Groups, and manage access.

We will add a new secret to the Key Vault. A secret can be any string we like (though a max size is enforced). It could include passwords, connection strings, or any other simple values. In this guide, we'll add a 'BestAnimalSecret' to the vault, with the hidden value of 'Corgi'.

![Adding secret to Azure Key Vault](/media/aspnet-keyvault/corgi-secret.PNG)

### Reading configuration

ASP.NET provides a number of ways to access our secrets. The insecure approach is through the application's `appSettings.json` configuration file. In our source code we could add 'BestAnimalSecret' in the configuration file like the following.

```
{
    "BestAnimalSecret": "Beaver"
}
```

When we go to add our change to source control, this file is a main part of the repository. Any secrets we add will be shared to everyone with access to the repository. A possible workaround could be to add this file to the git ignore, but this becomes a pain point when there are changes we do want to include.

⚠ If you remove a secret from your Git repo, merging isn't enough! It will remain in your history forever. Always request a new secret if you think it could have been accessed.

### Reading a local secrets file

A better option is to use a _secrets file_ on our local machine to hold these values. In the `.csproj`, we first add a guid as a secret id. This is used to create a unique path to stores and access the secrets.

```
  <PropertyGroup>
    <TargetFramework>netcoreapp2.1</TargetFramework>
    <UserSecretsId>9fa45fe5-c16f-42a7-9889-da8b2e076517</UserSecretsId>
  </PropertyGroup>
```

On ASP.NET Core 2.0 and higher, our service is automatically configured to look for a secrets file when running in developer mode. This is a part of the `CreateDefaultBuilder` method called in the `Program.cs`.

```
public static IWebHostBuilder CreateWebHostBuilder(string[] args) =>
    WebHost.CreateDefaultBuilder(args)
```

On earlier versions of ASP.NET, the secret file needs to be [included explicitly](https://docs.microsoft.com/en-us/aspnet/core/security/app-secrets?view=aspnetcore-2.2&tabs=windows#access-a-secret).

On Windows, the secret file can be found at `%APPDATA%\Microsoft\UserSecrets\<user_secrets_id>\secrets.json`. Generate this file, and the secure a value.

```
{
    "BestAnimalSecret": "Elephant"
}
```

We now have the same secret key used in both the configuration and secret files. To test how ASP.NET handles this conflict, we will create a basic controller with access to an instance of `Microsoft.Extensions.Configuration.IConfiguration` through dependency injection. The single GET method will return the "BestAnimalSecret" value in the configuration.

```
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;

namespace MyService.Controllers.V1
{
    [Route("api/v1/[controller]")]
    [ApiController]
    public class AnimalController : ControllerBase
    {
        private readonly IConfiguration _configuration;

        public AnimalController(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        [HttpGet]
        public string GetBestAnimal()
        {
            return _configuration["BestAnimalSecret"];
        }
    }
}

```

Run locally and load `https://typerteacher.azurewebsites.net/api/v1/animal` in the browser. The string 'Elephant' is returned, which means that the value in the secrets file overrides that of the `appSettings.json`.

In developer mode, the `CreateDefaultBuilder` has a set of locations from where it loads data. In order, these are:

1.  Environment variables. By default these include things like the application name, asp.net core version, and the environment.
2.  The `appSettings.json` file.
3.  The `appSettings.Development.json` file.
4.  The `secrets.json` file.
5.  Another set of environment variables.
6.  Arguments passed in to the process when it started

Any conflicting keys found later in the flow will override those preceding it.

### Loading secrets from Key Vault (developer)

Azure Key Vault can be added to our builder chain, similar to how the secrets file is loaded. During startup, our service will read directly from Azure so that we don't have to manage keys anywhere locally.

⚠ It is a bad practice to use your production secrets in a developer setting. Consider setting up a separate KeyVault and environment for pre-production (PPE) testing and development. An alternative is to use [emulators](https://docs.microsoft.com/en-us/azure/storage/common/storage-use-emulator) instead, and avoid needing secrets outside of production.

Modify `Program.cs` with the following, replacing `<KeyVaultName>` with the name of your Key Vault.

```
public static IWebHostBuilder CreateWebHostBuilder(string[] args) =>
    WebHost.CreateDefaultBuilder(args)
        .ConfigureAppConfiguration((context, config) =>
        {
            AzureServiceTokenProvider azureServiceTokenProvider = new AzureServiceTokenProvider();
            KeyVaultClient keyVaultClient = new KeyVaultClient(
                new KeyVaultClient.AuthenticationCallback(
                    azureServiceTokenProvider.KeyVaultTokenCallback));

            config.AddAzureKeyVault(
                $"https://<KeyVaultName>.vault.azure.net/",
                keyVaultClient,
                new DefaultKeyVaultSecretManager());
        })
        .UseStartup<Startup>();
```

The [AzureServiceTokenProvider](https://azure.microsoft.com/en-us/resources/samples/app-service-msi-keyvault-dotnet/) gets access tokens to authenticate to Azure services. It tries to accomplish this in the following order.

1. Using a passed in connection string, or by looking up the _AzureServicesAuthConnectionString_ environment variable.
2. [Managed Service Identity (MSI)](https://github.com/Azure-Samples/app-service-msi-keyvault-dotnet) - used when running in Azure, and when enabled on the resource.
3. Visual Studio Access Token Provider - this for running in a local environment. The "%LOCALAPPDATA%\\.IdentityService\AzureServiceAuth\tokenprovider.json" path is parsed to find available token providers. By default this will contain _Microsoft.Asal.TokenService.exe_.
4. [Azure CLI](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli?view=azure-cli-latest) - for local environment. This requires configuration of the CLI locally for login.
5. Azure Active Directory Authentication Libraries (ADAL) - for local environment. Your application must be running on a domain-joined machine for this to work.

On Windows, the simplest option for local debugging is through the Visual Studio Provider (#3). Debugging with the Application or IIS Express profiles will pick up the identity without issue. By testing the value our controller returns, we can identify the source of our secret - this guide set 'Corgi' as the value from Key Vault.

![Showing corgi returned](/media/aspnet-keyvault/corgi-result.PNG)

⚠ Linux Docker containers do not work out of the box with this method. The %LOCALAPPDATA% path is no longer set in the environments, and I plan on following with a future post once I have done some investigation.

### Loading secrets in production

When we push to production, the application will need the authority to access Key Vault. This authority is provided through Managed Service Identity, which must be enabled on the web app. In the Azure Portal, go to the application's Settings > Identity. The system-assigned tab is shown by default, so enable the option and confirm.

![Enabling system assigned managed identity](/media/aspnet-keyvault/system-assigned-identity.PNG)

Second, we need to add the web application as an approved application in the Key Vault settings. For the Key Vault resource, go to Settings > Access Policies. Select 'Add New'. Allow management for keys, secrets, and certificates, and set the web app as the Principal. Skip 'Authorized application'.

![Enabling authorization in key vault](/media/aspnet-keyvault/add-access-policy.PNG)

When we deploy our `ConfigureAppConfiguration` changes to Azure, we can load our controller's route and see the secret returned - 'Corgi'.

## Setting up Azure Table Storage

Let's look at using the secret management for a real world scenario, such as the connection string for [Azure Table Storage](https://azure.microsoft.com/en-us/services/storage/tables/). We can create a storage account directly from Visual Studio (from _Connected Services_ next to the project overview view) or through the Azure portal.

Once created, the storage account will generate two access keys for application authentication. These values are what give our service permission to use the storage. If they fall into the wrong hands, our data would be accessible to anyone. Keep them secret.

![View of Storage Account secrets](/media/aspnet-keyvault/tables-secrets.png)

Copy the first Connection string and go to Key Vault to add a new secret. We are going to set the key name as _ConnectionStrings--AzureStorageConnection_. The double dash (`--`) notation is parsed by the ASP.NET to denote a property relationship, like the following `ConnectionStrings: { AzureStorageConnection: "DefaultEndpointsPro..." }`.

Update `Startup.cs` to access this value and create a test table. This is a very simple implementation as a sanity check. Later we can refactor this out and use proper dependency injection. We'll update the `ConfigureServices` method to include our table creation.

```
public void ConfigureServices(IServiceCollection services)
{
    services.AddMvc().SetCompatibilityVersion(CompatibilityVersion.Version_2_1);

    string connectionString = Configuration.GetConnectionString("AzureStorageConnection");

    CloudStorageAccount storageAccount = CloudStorageAccount.Parse(connectionValue);
    CloudTableClient client = storageAccount.CreateCloudTableClient();
    CloudTable table = client.GetTableReference("Books");
    table.CreateIfNotExistsAsync();
}
```

Set a breakpoint and debug. The `connectionValue` should be set to the value from the _ConnectionStrings_. Once the last line has executed, explore through the Azure portal or Microsoft Azure Storage Explorer to verify the new table was created.

![View of the Microsoft Azure Storage Explorer, where the table was created](/media/aspnet-keyvault/table-created.PNG)
