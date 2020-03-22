---
path: "/blog/docker-npm-private-registry"
date: "2020-03-22"
title: Dockerfile with npm private registry in Azure Dev Ops
tags: "Docker, Azure, Npm, Registry"
---

Whether you have several projects that share a common private module, or you are concerned about supply chain attacks and want to privatize your package sources, it is common to use a private registry. Azure Dev Ops provides its own artifacts to achieve this, but it can be confusing to load from the registry in a Dockerfile.

# Prerequisites

You have an existing feed, have published a package, and have an existing .npmrc file.

[MSDN docs](https://docs.microsoft.com/en-us/azure/devops/artifacts/get-started-npm?view=azure-devops&tabs=windows)

# Solution

In your existing Dockerfile, ensure you have a `COPY` for your .npmrc file.

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

In your `azure-pipelines.yml`, you need to ensure your npmrc file is overriden with the correct access data. This is can be done easily with Azure Dev Ops using the `npm authenticate` task.

```
- task: npmAuthenticate@0
    displayName: Override npmrc file
    inputs:
      workingFile: '.npmrc'
```

And that's it. Run your pipeline and the dockerfile will pull from your private npm registry using the task authorization.
