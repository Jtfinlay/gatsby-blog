---
path: "/blog/teach-type"
date: "2018-08-23"
title: Typing teaching component with React & Redux
---

Let's empower users to become better typers. We want to provide an interactive experience for users to come in, pick up a typing lesson, and start improving. You could build an entire site around this idea, but for sake of simplicity, we will start with a dynamic component that can react correctly to user inputs.

## Prerequisites

Some knowledge of React, Redux, Javascript. 

We will skim passed some areas. If you have questions, please let me know and I can do a deeper dive into said areas.

## Getting started

Let's start by creating our react app.

    npx create-react-app typer-component
    cd typer-component
    npm start

Then open [http://localhost:3000/](http://localhost:3000/) to see our starter app.

Great - now we can walk through our project configuration. `create-react-app` gives you an amazing base to start from. From there, you can tweak whatever you prefer, but a basic setup I like to follow is:

 - Git
 - Sass
 - Redux

Git setup is straight forward for those familiar, just initialize your git repo. I usually commit the initial project changes so we can see what we modify. `create-react-app` initializes with a .gitignore, so we're free to commit everything.

    git init
    git add .
    git commit -m "Initial project setup"


### Sass

As of [early April](https://github.com/facebook/create-react-app/pull/4195), `create-react-app` has sass support without requiring an `npm eject`. For those unfamiliar, `npm eject` will cause all of the configuration and build dependencies to be moved directly into the project. This allows us to make specific changes to any of these dependencies. When possible, it is convenient to leave ourselves unejected so we don't have to manage this extra behavior.

To get started with sass, we will install the sass CLI (command-line interface). We'll be using `npm-run-all` in a moment as well, so we can include it here.

    npm install --save node-sass-chokidar
    npm install --save-dev npm-run-all

Next, in `package.json`, we will add `build-css` and `watch-css` under scripts. To make life even easier, we can combine the css scripts with our `build` and `start` scripts to make everything execute under a single command.

    "scripts": {
        "build-css": "node-sass-chokidar src/ -o src/",
        "watch-css": "npm run build-css && node-sass-chokidar src/ -o src/ --watch --recursive",
        "start-js": "react-scripts start",
        "build-js": "react-scripts build",
        "start": "npm-run-all -p watch-css start-js",
        "build": "npm-run-all build-css build-js",

Rename all the .css files to .sass (src/index.scss -> src/index.css). When we run `npm watch-css`, all of the .sass files will have a .css file generated next to it.

Remove the .css file from git and include a rule to ignore them. We only want to be modifying or working with the .sass files. Add `src/**/*.css` to your project's .gitignore. Delete any committed .css files with 

    git rm .\src\index.css

### Redux setup

The [Flux Pattern](https://facebook.github.io/flux/docs/overview.html) provides a great architecture for front end applications that we will use to manage our state. A popular library for this is Redux. It has a steep learning curve, but it is a powerful tool to use.

Let's pull the packages we need and get started.

    npm install --save react-redux redux redux-logger prop-types

It's useful to start with a basic configuration for redux while we're here. We need to create a base store, setup any developer tools we require and wire it up.

Create `src\store\configureStore.js` with the below code. It exports a function to create the Redux store from an initialState. The empty `a => a` in createStoreWithMiddlewares will later be replaced by our reducers. 

When we not running production, we include the redux logger and `window.devToolsExtension` for debugging purposes. The developer tools extension is a powerful Chrome tool that lets us do [some cool things](https://chrome.google.com/webstore/detail/redux-devtools/lmhkpmbekcpmknklioeibfkpmmfibljd?hl=en).

    import { createStore, applyMiddleware } from 'redux';
    import logger from 'redux-logger';

    let middlewares = [];

    const isProd = process.env.NODE_ENV === 'production';

    if (!isProd) {
        middlewares = [ ...middlewares, logger ]
    }

    const createStoreWithMiddlewares = applyMiddleware(
        ...middlewares
    )( createStore );

    export default function configureStore(initialState) {
        return createStoreWithMiddlewares(
            a => a, 
            initialState,
            (!isProd && window.devToolsExtension) ? window.devToolsExtension() : f => f
        );
    }

Next, we modify `src/index.js` to initialize the store and we will pass it through the react-redux Provider.

    import React from 'react';
    import ReactDOM from 'react-dom';
    import { Provider } from 'react-redux';
    import './index.css';
    import App from './App';
    import registerServiceWorker from './registerServiceWorker';

    import configureStore from './store/configureStore';

    const store = configureStore();

    ReactDOM.render((
        <Provider store={ store }>
            <App />
        </Provider>
    ), document.getElementById('root'));

    registerServiceWorker();

Make sure everything builds. Nothing special is happening yet, but we will be ready to go once we're ready to start with our reducers.

## React components

Now we're actually getting to the real development :). We can start by breaking down the interactive session into individual pieces. This will help us decide on the different components we need and the data we require.

At the simplest form, we need to show a phrase for the user to type. 

Each character in the phrase requires its own state so we can reflect whether it was typed correctly.

We also want to provide scrolling for long phrases so we can fit within a respected size.

Eventually, we may wish to maintain state for each word so we can provide feedback on how the user is doing. We can track the time it took them to type, how many errors they hit, and more.

### Board component

For our container component, we will develop a 'Board' component that can dispatch user actions and use a collection of presentation components to reflect the current state.

I've started with the following files:



