---
title: Dockerfile with npm private registry in Azure Dev Ops
date: "2020-03-22"
template: "post"
draft: false
slug: "docker-npm-private-registry"
category: "Services"
tags:
  - "Docker"
  - "Azure"
  - "Npm"
description: "Whether you have projects that share a common private module, or are concerned about supply chain attacks and want a private package source, it is common to use a private npm registry. Azure Dev Ops provides its own artifacts to achieve this, but it is not clear how to load from the registry in a Dockerfile."
---

Whether you have projects that share a common private module, or are concerned about supply chain attacks and want a private package source, it is common to use a private npm registry. Azure Dev Ops provides its own artifacts to achieve this, but it is not clear how to load from the registry in a Dockerfile.

## Prerequisites

You have an existing feed artifact, have published a private package, and have an existing .npmrc file.

[MSDN docs](https://docs.microsoft.com/en-us/azure/devops/artifacts/get-started-npm?view=azure-devops&tabs=windows)

## Solution

In the existing Dockerfile, add a `COPY` for your .npmrc file.

```
FROM mhart/alpine-node:12.16

WORKDIR /app
COPY package.json yarn.lock .npmrc ./
COPY dist/ ./dist

RUN yarn install

ENV environment development
ENV PORT 80

EXPOSE 80
CMD ["yarn", "start"]
```

In `azure-pipelines.yml`, we must ensure the .npmrc file contains the correct authentication to connect to the private npm registry. This must be populated during the build and **not checked into the codebase**. This is easy in Azure Dev Ops bu using the `npm authenticate` task before your docker build.

```
- task: npmAuthenticate@0
    displayName: Override npmrc file
    inputs:
      workingFile: '.npmrc'
```

And that's it. Run your pipeline and the dockerfile will pull from your private npm registry using the task authorization.