---
path: "/blog/asp-net-core-dockerfile"
date: "2019-01-29"
title: A look at the ASP.NET Core Dockerfile
tags: "ASP.NET Core, Docker, Windows"
---

I wrote a previous article that explains how to [Add Docker Support to your ASP.NET service](./asp-net-core-docker/). This article is a continuation, to look at what happened when we enabled Docker support. We will take a look at how the Dockerfile is configured by Visual Studio.

## Dockerfile

The [DockerFile](https://docs.docker.com/engine/reference/builder/) contains instructions for assembling an image. The file is generated automatically when we add Docker support, but can instead be prepared and modified by hand. The Dockerfile extends two image variants, *runtime* and *sdk*, which are hosted by Microsoft under `microsoft/dotnet`.

```
    FROM microsoft/dotnet:2.1-aspnetcore-runtime-nanoserver-1803 AS base
    ...
    FROM microsoft/dotnet:2.1-sdk-nanoserver-1803 AS build
    ...
```

The **runtime** image is slim, containing the .NET Core runtime and libraries. It is optimized to run well in **production** environments.

The **sdk** image contains the .NET Core sdk and can be used for development, unit tests, and debugging. It's more extensive than the runtime image, and is best for **development** environments.

## Docker Build (Development)

In my current version, when running the Application through Visual Studio with Docker as the target, MSBuild executes the following command for an ASP.NET Core application named *WebApplication1* located in C:\repos.

    docker build -f "C:\repos\WebApplication1\WebApplication1\Dockerfile" -t webapplication1:dev --target base  --label "com.microsoft.created-by=visual-studio" "C:\repos\WebApplication1"

As an aside, clear documentation is missing, but this MSBuild command can be controlled by adding `DockerfileBuildArguments` and `DockerfileRunArguments`, like the following. From this [Github discussion](https://github.com/aspnet/Tooling/issues/1074#issuecomment-394533908).

    <Project Sdk="Microsoft.NET.Sdk.Web">
        <PropertyGroup>
            <DockerfileRunArguments>-v "C:\HostFolder:/ContainerFolder:ro"</DockerfileRunArguments>
        </PropertyGroup>
    </Project>

Breaking down the original command (through the [Docker docs](https://docs.docker.com/) or reading through man files `docker build --help`), we can understand the following:

  - `docker build [OPTIONS] C:\repos\WebApplication1` - Build an image from a dockerfile
  - `-f c:\...\Dockerfile` - Name of the dockerfile
  - `-t webapplication1:dev` - Name and tag in the 'name:tag' format
  - `--target base` - Set the target build stage to end at, in this case 'base'
  - `--label com.microsoft...` - Set metadata for the image

We can then expect the MSBuild command to find the generated Dockerfile, to run through the *base* target, and setup the tags as described. The base target is as follows:

```
    FROM microsoft/dotnet:2.1-aspnetcore-runtime-nanoserver-1803 AS base
    WORKDIR /app
    EXPOSE 80
    EXPOSE 443
```

Building and checking the output build logs show what we expect, where it runs through the base commands and sets the label for the image.

    Step 1/5 : FROM microsoft/dotnet:2.1-aspnetcore-runtime-nanoserver-1803 AS base
    1>Step 2/5 : WORKDIR /app
    1>Step 3/5 : EXPOSE 80
    1>Step 4/5 : EXPOSE 443
    1>Step 5/5 : LABEL com.microsoft.created-by=visual-studio
    1>Successfully built 9fa997ad10b1
    1>Successfully tagged webapplication1:dev

In powershell, we can `docker images ls` to list the newly created image.

```
    C:\repos> docker container ls
    CONTAINER ID        IMAGE                 COMMAND                    CREATED             STATUS              PORTS                                           NAMES
    c73c6fff7636        webapplication1:dev   "C:\\remote_debugger\\…"   30 minutes ago      Up 30 minutes       0.0.0.0:53989->80/tcp, 0.0.0.0:44343->443/tcp   affectionate_gates
```

## Docker Build (Production)

Publishing an image to a registry, like Dockerhub, can also be performed through Visual Studio. The MSBuild command executes

    docker build -t "webapplication1" -f "Dockerfile" --label "com.microsoft.created-by=visual-studio" ".."

The options used are similar to the developer build, but does not include the `--target` option. This flag specifies the target build stage, where any commands after the given target are skipped. Without it, the build command will walk through the entire Dockerfile to generate the image. Looking at the output window, it walks through all stages as we would expect.

```
    Step 1/18 : FROM microsoft/dotnet:2.1-aspnetcore-runtime-nanoserver-1803 AS base
    Step 2/18 : WORKDIR /app
    Step 3/18 : EXPOSE 80
    Step 4/18 : EXPOSE 443
    Step 5/18 : FROM microsoft/dotnet:2.1-sdk-nanoserver-1803 AS build
    Step 6/18 : WORKDIR /src
    Step 7/18 : COPY ["WebApplication1/WebApplication1.csproj", "WebApplication1/"]
    Step 8/18 : RUN dotnet restore "WebApplication1/WebApplication1.csproj"
    Restoring packages for C:\src\WebApplication1\WebApplication1.csproj...
    Installing Microsoft.VisualStudio.Azure.Containers.Tools.Targets 1.0.2105168.
    Generating MSBuild file C:\src\WebApplication1\obj\WebApplication1.csproj.nuget.g.props.
    Generating MSBuild file C:\src\WebApplication1\obj\WebApplication1.csproj.nuget.g.targets.
    Restore completed in 1.46 min for C:\src\WebApplication1\WebApplication1.csproj.
    Removing intermediate container 0142115924db
    Step 9/18 : COPY . .
    Step 10/18 : WORKDIR "/src/WebApplication1"
    Removing intermediate container 6bec1915cbb7
    Step 11/18 : RUN dotnet build "WebApplication1.csproj" -c Release -o /app
    Microsoft (R) Build Engine version 15.9.20+g88f5fadfbe for .NET Core
    Copyright (C) Microsoft Corporation. All rights reserved.

    Restore completed in 7.37 sec for C:\src\WebApplication1\WebApplication1.csproj.
    WebApplication1 -> C:\app\WebApplication1.dll

    Build succeeded.
        0 Warning(s)
        0 Error(s)

    Time Elapsed 00:00:35.17
    Removing intermediate container 003387178aa3
    Step 12/18 : FROM build AS publish
    Step 13/18 : RUN dotnet publish "WebApplication1.csproj" -c Release -o /app
    Microsoft (R) Build Engine version 15.9.20+g88f5fadfbe for .NET Core
    Copyright (C) Microsoft Corporation. All rights reserved.

    Restore completed in 5.86 sec for C:\src\WebApplication1\WebApplication1.csproj.
    WebApplication1 -> C:\src\WebApplication1\bin\Release\netcoreapp2.1\WebApplication1.dll
    WebApplication1 -> C:\app\
    Removing intermediate container 8c68ed25fa9d
    Step 14/18 : FROM base AS final
    Step 15/18 : WORKDIR /app
    Removing intermediate container 50fbd238c3e9
    Step 16/18 : COPY --from=publish /app .
    Step 17/18 : ENTRYPOINT ["dotnet", "WebApplication1.dll"]
    Removing intermediate container f53700254de0
    Step 18/18 : LABEL com.microsoft.created-by=visual-studio
    Removing intermediate container 5a895b1c44be
    Successfully built c8acb66b9543
    Successfully tagged webapplication1:latest
```

Feel free to compare this with the generated Dockerfile - you'll find it walks through all commands and stages.

## Docker Run (Development)

After building & running, Visual Studio also executes a long `docker run` command.

    docker run -dt -v "C:\Users\<User>\onecoremsvsmon\15.0.28307.271:C:\remote_debugger:ro" -v "C:\repos\WebApplication1\WebApplication1:C:\app" -v "C:\Users\<User>\AppData\Roaming\ASP.NET\Https:C:\Users\ContainerUser\AppData\Roaming\ASP.NET\Https:ro" -v "C:\Users\<User>\AppData\Roaming\Microsoft\UserSecrets:C:\Users\ContainerUser\AppData\Roaming\Microsoft\UserSecrets:ro" -v "C:\Users\<User>\.nuget\packages\:c:\.nuget\fallbackpackages2" -v "C:\Program Files\dotnet\sdk\NuGetFallbackFolder:c:\.nuget\fallbackpackages" -e "DOTNET_USE_POLLING_FILE_WATCHER=1" -e "ASPNETCORE_ENVIRONMENT=Development" -e "ASPNETCORE_URLS=https://+:443;http://+:80" -e "NUGET_PACKAGES=c:\.nuget\fallbackpackages2" -e "NUGET_FALLBACK_PACKAGES=c:\.nuget\fallbackpackages;c:\.nuget\fallbackpackages2" -p 53989:80 -p 44343:443 --entrypoint C:\remote_debugger\x64\msvsmon.exe webapplication1:dev /noauth /anyuser /silent /nostatus /noclrwarn /nosecuritywarn /nofirewallwarn /nowowwarn /fallbackloadremotemanagedpdbs /timeout:2147483646

The `-v` flags are used to mount local volumes in the docker container. Msvsmon (Microsoft Visual Studio Remote Debugging Monitor), the web application source, Nuget files, and other logging paths are mounted. A number of environment variables are set with the `-e` flag to run ASP.NET Core in developer mode.

The `-p` flag will expose the container port to that of the local machine. The `-p 53989:80` option binds port 80 of the container to port 53989 on `127.0.0.1` of the host machine. The second `-p 44343:433` option binds port 443 of the container (so the SSL traffic) to port 44343 of the host machine.

The `--entrypoint` option overrides the default entrypoint of the image to invoke `msvsmon.exe` instead. The flags that come afterwards are options for msvsmon.exe and not for Docker. It essentially invokes the service through the debugging tools so that Visual Studio can connect and debug.