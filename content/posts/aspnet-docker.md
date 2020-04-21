---
title: Adding Docker support to your ASP.NET service
date: "2019-01-28"
template: "post"
draft: false
slug: "asp-net-core-docker"
category: "Services"
tags:
  - "ASP.NET Core"
  - "Docker"
description: "Whether starting with a new project or publishing an existing, integrating your ASP.NET Core project with Docker is a powerful way to manage and ship your programs. It's straight forward to achieve with Visual Studio, and this guide is to help add this support."
---

Whether starting with a new project or publishing an existing, integrating your ASP.NET Core project with Docker is a powerful way to manage and ship your programs. It's straight forward to achieve with Visual Studio, and this guide is to help add this support.

You'll learn to:

✔ Create an ASP.NET Core API Service

✔ Setup Docker for Windows

✔ Enable Docker support for your service

Using Visual Studio Installer (with VS2017), ensure you have the following options installed:

- ASP.NET and web development
- Azure development

![Visual Studio Installer required workloads](/media/aspnet-docker/vs_installer.PNG)

These options can be accessed through the 'Modify option' of the Visual Studio Installer.

![Visual Studio Installer 'modify' option](/media/aspnet-docker/installer-modify.PNG)

Before we create or update our project, another required tool is [Docker for Windows](https://docs.docker.com/docker-for-windows/?install_site=vsonwin). Install it following the guidance on the Docker for Windows site, which today points to [Docker Hub](https://hub.docker.com/editions/community/docker-ce-desktop-windows).

During installation, we will configure Docker to use Windows containers instead of Linux. ASP.NET Core projects are cross-platform, so we can configure our project to run on either OS. It is simple to switch between Windows containers and Linux containers - we just need to access this option through the Docker settings once it has launched.

![Use Windows Containers instead of Linux Containers](/media/aspnet-docker/docker-config.PNG)

![Switch between Windows Containers and Linux Containers](/media/aspnet-docker/switch-containers.PNG)

Launch Docker For Windows from the start menu. This will take a minute or two, and you can see the progress by the animating icon on your toolbar. Once it's complete, it will launch a login window.

Register for an account if needed and sign in. An important note when working with Docker is to pay attention to whether you need to sign in with your _email address_ or _docker id_. They both use the same password. Your email address is used your website login, and your docker id for pretty much everything else. This can cause some confusion where login with email often authenticates successfully but causes problems afterwards.

In my case, Docker launched for Linux containers, so I switched to Windows containers modes. You will be given a warning regarding not being able to manage existing Linux containers, which is expected. Select 'switch' in this case.

![Switch warning from Docker when changing container mode](/media/aspnet-docker/switch-warning.PNG)

## New Project

Launch Visual Studio, and go to create a new ASP.NET Core Web Application. Check 'Enable Docker Support', verify the dropdown for Windows, and select your service of choice (in my case, an API service).

![Creating a new ASP.NET Core](/media/aspnet-docker/new-aspnet-project.PNG)

Once created, tap F5 to build & run your project.

## Existing Project

For an existing ASP.NET Core project, including docker support is straight forward as well. Right-click on your project > Add > Docker Support.

![Add docker support to an existing project](/media/aspnet-docker/add-docker-support.PNG)

In the next post, we will take a look at what the changes that occur when adding Docker Support. Specifically, [A look at the ASP.NET Core Dockerfile](/media/aspnet-docker/asp-net-core-dockerfile/).
