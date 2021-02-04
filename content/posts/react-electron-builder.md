---
title: Electron builder from create-react-app
date: "2019-01-04"
template: "post"
draft: false
slug: "react-electron-builder"
category: "Services"
tags:
  - "React"
  - "Electron"
description: "[Electron](https://electronjs.org/) is a great modern solution for building cross-platform desktops apps with Javascript, and CSS. Visual Studio Code, Teams, Slack, and many other popular software applications use electron as part of their toolkit. I found few resources online that provided a useful way to integrate [electron-builder](https://www.electron.build/) with an existing application, such as from [create-react-app](https://github.com/facebook/create-react-app). I hope this guide will help bridge these great resources."
---

[Electron](https://electronjs.org/) is a great modern solution for building cross-platform desktops apps with Javascript, and CSS. Visual Studio Code, Teams, Slack, and many other popular software applications use electron as part of their toolkit. I found few resources online that provided a useful way to integrate [electron-builder](https://www.electron.build/) with an existing application, such as from [create-react-app](https://github.com/facebook/create-react-app). I hope this guide will help bridge these great resources.

![Screenshot of create-react-app running in electron](./end-result.PNG)

## Create-react-app

I'm becoming a big fan of `create-react-app`. It allows you to start off running and has everything setup to build to a production-ready state.

```javascript
npx create-react-app electron-react
cd electron-react
```

## Add electron

Add `electron` and `electron-builder` as dev dependencies.

```javascript
yarn add electron electron-builder -D
```

## Developer environment

For our developer environment, we expect changes to be fast and to have support for hot reload. To accomplish this with electron, we are going to run our regular node service through `yarn start`, and concurrently serve it through our electron app.

First, we can leverage the `electron-is-dev` package to distinguish dev from prod.

```javascript
yarn add electron-is-dev
```

Then we can use it in our electron start up script which will setup the world. Code is below, which is a lightly modified version from [electron-webpack-quick-start](https://github.com/electron-userland/electron-webpack-quick-start/blob/master/src/main/index.js). We are creating a new `electron.js` file in the public directory.

public/electron.js

```javascript
const electron = require("electron");
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;

const path = require("path");
const url = require("url");
const isDev = require("electron-is-dev");

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({ width: 900, height: 680 });
  mainWindow.loadURL(
    isDev
      ? "http://localhost:3000"
      : `file://${path.join(__dirname, "../build/index.html")}`
  );
  mainWindow.toggleDevTools();
  mainWindow.on("closed", () => (mainWindow = null));
}

app.on("ready", createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  }
});
```

Above we use the `electron-is-dev` package to switch between the dev and prod environment. In dev mode, we point to the hot reload environment (`http://localhost:3000`) that is triggered by `yarn start`. To test production, we point tod `../build/index.html` which is the production build.

To load our above code, we modify our `package.json` configuration to define our build script. Start with the following field, which points electron to initiate with the `electron.js` starter script we added.

package.json

```javascript
    "main": "public/electron.js",
```

Next, we can add an `electron-dev` script to the configuration. We want to concurrently run `yarn start` and `electron` together, so we will bring ine the [concurrently](https://www.npmjs.com/package/concurrently) package. We also can't start electron until `localhost:3000` is ready, so we will grab [wait-on](https://www.npmjs.com/package/wait-on) too.

```javascript
yarn add concurrently wait-on -D
```

package.json

```javascript
    "scripts": {
        ...
        "electron-dev": "concurrently \"yarn start\" \"wait-on http://localhost:3000 && electron .\""
    }
```

Pull packages and run.

```javascript
yarn
yarn electron-dev
```

So, uh, both our default browser and electron launched, which isn't ideal. That's because node will launch the browser on start (from the `yarn start`). We can clean that up by setting BROWSER=none as an environment variable. Since we are cross platform and env variables behave funny on Windows, we can add [cross-env](https://www.npmjs.com/package/cross-env) as a dev dependency.

```javascript
yarn add cross-env -D
```

...and update our script to

```javascript
{
    ...
    "electron-dev": "concurrently \"cross-env BROWSER=none yarn start\" \"wait-on http://localhost:3000 && electron .\""
}
```

Since we don't actually need the existing `yarn start` script, which just invokes "react-scripts start", we can refactor our `electron-dev` into the `start` script. Like the following package.json (version numbers may not match):

```javascript
{
  "name": "electron-react",
  "version": "0.1.0",
  "private": false,
  "main": "public/electron.js",
  "dependencies": {
    "electron-is-dev": "^0.3.0",
    "react": "^16.4.2",
    "react-dom": "^16.4.2",
    "react-scripts": "1.1.5"
  },
  "scripts": {
    "start": "concurrently \"cross-env BROWSER=none react-scripts start\" \"wait-on http://localhost:3000 && electron .\"",
    "build": "react-scripts build",
    "test": "react-scripts test --env=jsdom",
    "eject": "react-scripts eject"
  },
  "devDependencies": {
    "concurrently": "^4.0.1",
    "electron": "^2.0.8",
    "electron-builder": "^20.28.4",
    "wait-on": "^3.0.1"
  }
}
```

Boom! Development environment for electron with hot reload is live.

## Production environment

Production was a bit trickier to figure out, but _allons-y_.

Many guides and threads end up pulling in references to the src/ and node_modules/ directory which isn't right (at least in our case). Webpack is doing a bunch of work for us to generate a minified build directory. That directory should be all we need to pull in to electron!

We need to define our electron-build configuration. It sits on the top level of our package.json under the `build` key.

While we are here, we can add a `dist` script that will perform the build.

package.json

```javascript
    "main": "public/electron.js",
    "build": {
        "appId": "com.electron.test",
        "files": [
            "build/**/*"
        ]
    },
    "scripts": {
        ...
        "dist": "yarn build && electron-builder"
    }
```

By default, electron-builder will generate a distribution for our current platform. If we go and check out the /dist folder after building on Windows, we should find an `'electron-react Setup 0.1.0.exe'` file. Let's run it to launch our electron app.

```javascript
yarn dist
```

![Screenshot of ERR_FILE_NOT_FOUND error on deployment](./err_file_not_found.PNG)

We are hitting ERR_FILE_NOT_FOUND errors for the generated .css and .js files. If we check the 'sources' tab we can see that the index.html file is loading, which is good, but other imports are failing.

Hovering over the console errors reveals that electron is trying to load the included files from an absolute path - in my case `file:////C:/static/css/main.c17080f1.css` - instead of the relative path. To fix this, we need to make another edit in our package.json to tell create-react-app to [build for relative paths](https://github.com/facebook/create-react-app/blob/master/packages/react-scripts/template/README.md#building-for-relative-paths).

package.json

```javascript
    "homepage": "./",
```

Running `yarn dist` will regenerate the .exe and everything will be running correctly.

![Screenshot of create-react-app running in electron](./end-result.PNG)

Our final package.json file came out to,

```javascript
{
  "name": "electron-react",
  "version": "0.1.0",
  "private": false,
  "main": "public/electron.js",
  "homepage": "./",
  "build": {
    "appId": "com.electron.test",
    "files": [
      "build/**/*"
    ]
  },
  "dependencies": {
    "electron-is-dev": "^0.3.0",
    "react": "^16.4.2",
    "react-dom": "^16.4.2",
    "react-scripts": "1.1.5"
  },
  "scripts": {
    "start": "concurrently \"cross-env BROWSER=none react-scripts start\" \"wait-on http://localhost:3000 && electron .\"",
    "build": "react-scripts build",
    "test": "react-scripts test --env=jsdom",
    "eject": "react-scripts eject",
    "dist": "yarn build && electron-builder"
  },
  "devDependencies": {
    "concurrently": "^4.0.1",
    "cross-env": "^5.2.0",
    "electron": "^2.0.8",
    "electron-builder": "^20.28.4",
    "wait-on": "^3.0.1"
  }
}
```
