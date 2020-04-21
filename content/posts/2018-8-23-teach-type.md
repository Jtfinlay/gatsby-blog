---
title: Typing teaching component with React & Redux
date: "2018-08-23"
template: "post"
draft: false
slug: "teach-type"
category: "Front end"
tags:
  - "React"
description: "Let's empower users to become better typers. We want to provide an interactive experience for users to come in, pick up a typing lesson, and start improving. You could build an entire site around this idea, but for sake of simplicity, we will start with a dynamic component that can react correctly to user inputs."
---

Let's empower users to become better typers. We want to provide an interactive experience for users to come in, pick up a typing lesson, and start improving. You could build an entire site around this idea, but for sake of simplicity, we will start with a dynamic component that can react correctly to user inputs.

![Animation of the typer trainer in action](/media/teach-type/animated-typer.gif)

Code is [available here](https://github.com/Jtfinlay/typer-component/tree/blog1).

## Prerequisites

Some knowledge of React, Redux, Javascript.

We will skim passed some areas. If you have questions, please let me know and I can do a deeper dive into said areas.

## Getting started

Let's start by creating our react app.

```javascript
npx create-react-app typer-component
cd typer-component
npm start
```

Then open [http://localhost:3000/](http://localhost:3000/) to see our starter app.

Great - now we can walk through our project configuration. `create-react-app` gives you an amazing base to start from. From there, you can tweak whatever you prefer, but a basic setup I like to follow is:

- Git
- Sass
- Redux

Git setup is straight forward for those familiar, just initialize your git repo. I usually commit the initial project changes so we can see what we modify. `create-react-app` initializes with a .gitignore, so we're free to commit everything.

```javascript
git init
git add .
git commit -m "Initial project setup"
```

### Sass / scss

As of [early April](https://github.com/facebook/create-react-app/pull/4195), `create-react-app` has sass support without requiring an `npm eject`. For those unfamiliar, `npm eject` will cause all of the configuration and build dependencies to be moved directly into the project. This allows us to make specific changes to any of these dependencies. When possible, it is convenient to leave ourselves unejected so we don't have to manage this extra behavior.

To get started with sass, we will install the sass CLI (command-line interface). We'll be using `npm-run-all` in a moment as well, so we can include it here.

```javascript
npm install --save node-sass-chokidar
npm install --save-dev npm-run-all
```

Next, in `package.json`, we will add `build-css` and `watch-css` under scripts. To make life even easier, we can combine the css scripts with our `build` and `start` scripts to make everything execute under a single command.

```javascript
"scripts": {
    "build-css": "node-sass-chokidar src/ -o src/",
    "watch-css": "npm run build-css && node-sass-chokidar src/ -o src/ --watch --recursive",
    "start-js": "react-scripts start",
    "build-js": "react-scripts build",
    "start": "npm-run-all -p watch-css start-js",
    "build": "npm-run-all build-css build-js",
```

Rename all the .css files to .scss (src/index.scss -> src/index.css). When we run `npm watch-css`, all of the .scss files will have a .css file generated next to it.

Remove the .css file from git and include a rule to ignore them. We only want to be modifying or working with the .scss files. Add `src/**/*.css` to your project's .gitignore. Delete any committed .css files with

    git rm .\src\index.css

### Redux setup

The [Flux Pattern](https://facebook.github.io/flux/docs/overview.html) provides a great architecture for front end applications that we will use to manage our state. A popular library for this is Redux. It has a steep learning curve, but it is a powerful tool to use.

Let's pull the packages we need and get started.

```javascript
npm install --save react-redux redux redux-logger prop-types
```

It's useful to start with a basic configuration for redux while we're here. We need to create a base store, setup any developer tools we require and wire it up.

Create `src\store\configureStore.js` with the below code. It exports a function to create the Redux store from an initialState. The empty `a => a` in createStoreWithMiddlewares will later be replaced by our reducers.

When we not running production, we include the redux logger and `window.devToolsExtension` for debugging purposes. The developer tools extension is a powerful Chrome tool that lets us do [some cool things](https://chrome.google.com/webstore/detail/redux-devtools/lmhkpmbekcpmknklioeibfkpmmfibljd?hl=en).

```javascript
import { createStore, applyMiddleware } from "redux";
import logger from "redux-logger";

let middlewares = [];

const isProd = process.env.NODE_ENV === "production";

if (!isProd) {
  middlewares = [...middlewares, logger];
}

const createStoreWithMiddlewares = applyMiddleware(...middlewares)(createStore);

export default function configureStore(initialState) {
  return createStoreWithMiddlewares(
    (a) => a,
    initialState,
    !isProd && window.devToolsExtension ? window.devToolsExtension() : (f) => f
  );
}
```

Next, we modify `src/index.js` to initialize the store and we will pass it through the react-redux Provider.

```javascript
import React from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";
import "/media/teach-type/index.css";
import App from "/media/teach-type/App";
import registerServiceWorker from "/media/teach-type/registerServiceWorker";

import configureStore from "/media/teach-type/store/configureStore";

const store = configureStore();

ReactDOM.render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById("root")
);

registerServiceWorker();
```

Make sure everything builds. Nothing special is happening yet, but we will be ready to go once we're ready to start with our reducers.

## Design

Now we're actually getting to the real development :). We can start by breaking down the interactive session into individual pieces. This will help us decide on the different components we need and the data we require.

At the simplest form, we need to show a phrase for the user to type.

Each character in the phrase requires its own state so we can reflect whether it was typed correctly.

Ideas for the future:

- provide scrolling for long phrases so we can fit within a respected size.
- maintain state for each word so we can provide feedback on how the user is doing. We can track the time it took them to type, how many errors they hit, and more.

## React components

For our container component, we will develop a `Board` component that can dispatch user actions and use a collection of presentation components to reflect the current state. We will also include a simple `Letter` component to present the state of each character.

I've started with the following files:

```javascript
srcsrcsrcsrcsrcsrcsrcsrcsrcsrcsrcsrcsrcsrcsrcsrc\;
boardboardboardboardboardboardboardboardboardboardboardboardboardboardboardboard\;
index.js;
board.js;
board.scss;
letterletterletterletterletterletterletterletterletterletterletterletterletterletterletterletter\;
index.js;
letter.js;
letter.scss;
```

My preference is to include a base `index.js` to make imports a bit prettier (so we can include `.\board` instead of `.\board\board`) and to wrap our redux patterns in a separate file. For now, we will just import & export with the following.

src\board\index.js

```javascript
import Board from "board";
export default Board;
```

src\letter\index.js

```javascript
import Letter from "letter";
export default Letter;
```

We will start the board component with some static data to render. For each letter, we need an id, the text to show, and the current status.

- 'right' when the user entered the correct key
- 'wrong' if the user made a mistake

src/board/board.js

```javascript
import React, { Component } from "react";
import Letter from "./media/teach-type/letter";
import "/media/teach-type/board.css";

class Board extends Component {
  render() {
    const chars = [
      { id: "0", text: "h", status: "right" },
      { id: "1", text: "e", status: "wrong" },
      { id: "2", text: "l", status: "right" },
      { id: "3", text: "l" },
      { id: "4", text: "o" },
    ];

    return (
      <div className="board">
        {chars.map((letter) => (
          <Letter key={letter.id} text={letter.text} status={letter.status} />
        ))}
      </div>
    );
  }
}

export default Board;
```

In the `Letter` component we will change our class names depending on the state, and leverage it in our css. Let's install `classnames` to help manage the multiple classes.

```javascript
npm install --save classnames
```

src/letter/letter.js

```javascript
import React from "react";
import classNames from "classnames";

import "/media/teach-type/letter.css";

const Letter = ({ text, status }) => (
  <div
    className={classNames({
      letter: true,
      "is-right": status === "right",
      "is-wrong": status === "wrong",
    })}
  >
    {text}
  </div>
);

export default Letter;
```

Use the following scss files to make it pretty.

src/board/board.scss

```javascript
.board {
    align-content: center;
    font-size: 3em;

    display: flex;
    flex-direction: row;
    justify-content: center;
}
```

src/letter/letter.scss

```javascript
.letter {
    border-radius: 5px;
    padding: 2px;
    margin: 4px 1px;
    min-width: 21px;
    text-align: center;

    &.is-right {
        background: #dbeecf;
        color: #71b16b;
    }

    &.is-wrong {
        background: #ce3e44;
        color: #fff;
    }
}
```

And voila! Our site should build and look like the following.

![Basic components shown](/media/teach-type/basic-component.PNG)

### Wire up actions

We are showing things - great! Next we need to watch for user actions. We will monitor when user enters keys on the page, filter those keys for alphabetic values, and dispatch them as actions.

We can start by defining our available action types and actions.

```javascript
srcsrcsrcsrcsrcsrcsrcsrcsrcsrcsrcsrcsrcsrcsrcsrc\;
actionsactionsactionsactionsactionsactionsactionsactionsactionsactionsactionsactionsactionsactionsactionsactions\;
index.js;
constantsconstantsconstantsconstantsconstantsconstantsconstantsconstantsconstantsconstantsconstantsconstantsconstantsconstantsconstantsconstants\;
actionTypes.js;
```

These files are simple for our scenario. We are splitting them as a best practice so they can be referenced by different components and reducers in the future.

The constants will keep track of known action values to be shared between actions and reducers.

Actions will contain the format of actions for common access.

src\constants\actionTypes.js

```javascript
export const KEY_PRESSED = "KEY_PRESSED";
```

src\actions\index.js

```javascript
import { KEY_PRESSED } from "./media/teach-type/constants/actionTypes";

export const keyPressed = (key) => ({
  type: KEY_PRESSED,
  key,
});
```

In the `Board`'s index.js, we will connect the `KEY_PRESSED` action as a dispatch props to the component. There is no state to pass yet, so we can pass null.

src\board\index.js

```javascript
import Board from "/media/teach-type/board";
import { connect } from "react-redux";
import { keyPressed } from "./media/teach-type/actions";

const mapDispatchToProps = (dispatch) => ({
  keyPressed: (key) => dispatch(keyPressed(key)),
});

const connector = connect(null, mapDispatchToProps)(Board);

export default connector;
```

In the `Board` component, we need to watch for user actions. We will capture all key events on the page, so we are going to add an event listener directly to the document. For a full website, this would require careful consideration, because any inputs for navigation or other elements would trigger events too. So we would have to be careful not to cause what would be perceived as strange behavior to the user.

So we can modify our `Board` component by adding event handlers and a key filter.

src\board\board.js

```javascript
constructor(props) {
    super(props);
    this.bound_onKeyDown = this.handleKeyboardEvent.bind(this);
}

componentDidMount() {
    window.addEventListener('keydown', this.bound_onKeyDown);
}

componentWillUnmount() {
    window.removeEventListener('keydown', this.bound_onKeyDown);
}

handleKeyboardEvent(event) {
    if (event.key.length === 1 && /^[a-zA-Z]*$/.test(event.key)) {
        this.props.keyPressed(event.key);
    }
}
```

There's some interesting logic at play here. To begin with, we are adding an event listener to the window, which means we need a function to handle it. If we were to add an event handler like the following,

```javascript
window.addEventListener("keydown", this.handleKeyboardEvent);
```

On key press, our method is invoked, but we would find that the `this.props` does not exist. That's because our scope is at the **window** and not at our **component**. We can access window properties with `this` but not our local props. To fix this, we use `bind(this)` in order to bind the function to our component instance.

```javascript
window.addEventListener("keydown", this.handleKeyboardEvent.bind(this));
```

...except, `bind(this)` returns a new function reference, so when we then try to remove the listener, it doesn't actually detach it.

Our final solution then is to hold the result of `this.handleKeyboardEvent.bind(this)` in an internal property, and use that value as the event handler.

Another note to make is in the `handleKeyboardEvent`, we filtering by length and regex to ensure we only dispatch events for key presses of single-length characters within A-Z. We could see events for 'Shift' or 'Tab', but we are ignoring everything except alphabet characters in our typing lessons. (Future note: when we have phrases we'll have to whitelist the spacebar).

## Managing state

We have components, we have dispatched actions, and all that remains is updating state.

In our `Board` component, we have a static state which we can continue to follow.

```javascript
const chars = [
  { id: "0", text: "h", status: "right" },
  { id: "1", text: "e", status: "wrong" },
  { id: "2", text: "l", status: "right" },
  { id: "3", text: "l" },
  { id: "4", text: "o" },
];
```

This value is a collection of letter objects that compose a phrase. In the future, we may need to start worrying about maintaing the states of words, or having multiple phrases. For now we can keep it simple until we need more.

Let's strip the status fields and remove it from the component. We can place it in `src\index.js` and provide it as the base state to the `configureStore` call. On a real site, there will be many different phrases and lessons that we will query from the network as needed.

```javascript
const baseState = [
  { id: "0", text: "h" },
  { id: "1", text: "e" },
  { id: "2", text: "l" },
  { id: "3", text: "l" },
  { id: "4", text: "o" },
];

const store = configureStore(baseState);
```

We can now create a reducer to handle dispatched actions.

src\reducers\index.js

```javascript
import { KEY_PRESSED } from "./media/teach-type/constants/actionTypes";

const word = (state = [], action) => {
  switch (action.type) {
    case KEY_PRESSED: {
      const currentLetter = state.find((letter) => letter.status === undefined);

      if (!currentLetter) {
        // completed lesson
        return state;
      }

      return state.map((letter) =>
        letter.id === currentLetter.id
          ? {
              ...letter,
              status: action.key === letter.text ? "right" : "wrong",
            }
          : letter
      );
    }
    default:
      return state;
  }
};

export default word;
```

As best practice, we return the given state for any unknown actions.

When we see the `KEY_PRESSED` action, we find the next letter in our sorted array (the first one that doesn't have a status). If we can't find one, then all letters have a status and the lesson is complete. Otherwise, return a new state where we update the status next to _right_ or _wrong_ depending on if the action key matches.

Let's update our `src\store\configureStore.js` file to use this reducer. Earlier we put a useless `a => a` in its place. Now we can import our reducer instead.

```javascript
import rootReducer from './media/teach-type/reducers';
...
return createStoreWithMiddlewares(
    rootReducer,
    initialState,
    (!isProd && window.devToolsExtension) ? window.devToolsExtension() : f => f
);
```

Finally, we update our `Board` component to receive and use the state generated by the reducers.

src\board\index.js

```javascript
import Board from "/media/teach-type/board";
import { connect } from "react-redux";
import { keyPressed } from "./media/teach-type/actions";

const mapStateToProps = (state) => ({
  letters: state,
});

const mapDispatchToProps = (dispatch) => ({
  keyPressed: (key) => dispatch(keyPressed(key)),
});

const connector = connect(mapStateToProps, mapDispatchToProps)(Board);

export default connector;
```

src/board/board.js, replace the `{chars.map(letter =>` with the props

```javascript
...
return (
    <div className='board'>
        {this.props.letters.map(letter =>
            <Letter
...
```

Go check your browser and test it out. Successful letters will be green, and failures in red. Refreshing your page will restart the session.

![Animation of the typer trainer in action](/media/teach-type/animated-typer.gif)

Code is [available here](https://github.com/Jtfinlay/typer-component/tree/blog1).
