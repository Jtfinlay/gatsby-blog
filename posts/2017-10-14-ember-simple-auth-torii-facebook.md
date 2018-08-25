---
path: "/blog/ember-simple-auth-torii"
date: "2017-10-14"
title: Ember-simple-auth with torii
---

In this post we will be creating a simple Ember application that integrates [ember-simple-auth](https://github.com/simplabs/ember-simple-auth) with [torii](https://github.com/Vestorly/torii) as an authentication service.

Our goal is to have users sign in to our app with their Facebook account, and to include an authentication 'Bearer' to all of our network calls.

The final code for this guide is available for [fork](https://github.com/Jtfinlay/ember-simple-auth-app).

# Starting off

Ember-simple-auth and torii are two authentication libraries for Ember that simplify development with different social platforms. Torii is great for easy-to-use providers (such as Facebook, Google, or Github), while ember-simple-auth has better state management. So in this tutorial we will be integrating them both.

Create our app, and add the `ember-simple-auth` package.

    ember new ember-simple-auth-app
    ember install ember-simple-auth
    ember install torii

    // not mandatory, but helps us manage secret keys
    ember install ember-cli-dotenv

Our app should run without problem to the sample welcome page.

    ember s --watch

<img src="{{ site.baseurl }}/images/ember-simple-auth/emberstart.PNG" alt="Picture of 'Hello world' Ember application"/>

Torii comes with a number of providers to use out of the box. This includes 'facebook-connect', which we add to the `config/environment.js` file. This provider requires an appId, which we can get from the [facebook developers portal](https://developers.facebook.com/) by setting up a new app.

    // config/environment.js

    let ENV = {
        ...
        torii: {
            providers: {
                'facebook-connect': {
                    scope: 'email,user_birthday'
                }
            }
        }
    };

    if (environment === 'development') {
        ENV.torii.providers['facebook-connect'].appId = process.env.FACEBOOK_APP_ID
    }

It isn't as critical to hide our app id as it is for secret keys, but it is nice to keep it out of git history. We will use [`ember-cli-dotenv`](https://github.com/fivetanley/ember-cli-dotenv) to expose a 'FACEBOOK_APP_ID' environment variable from a `.env` file at the root of the repo, so that's accessible from the `process.env.FACEBOOK_APP_ID` property above.

First, create an `.env` file at the base of your repo (beside the `app` folder), and add the following, using the app id from the Facebook dev portal.

    FACEBOOK_APP_ID=123456789012345

Add the `.env` file to your `.gitignore` (or it defeats the entire purpose of this). We are explicitly setting the appId only in the 'development' stage. When you launch to production, you'll have to review how you want to access your keys. This allows us to use different appIds or other properties specific to each stage.

# Routes, controllers, and templates

Add some routes and controllers we'll be using.

    ember g route application
    ember g controller application
    ember g route index
    ember g route login
    ember g controller login

    ember g authenticator torii

Remove the `{% raw %}{{welcome-page}}{% endraw %}` from `application.hbs`, and we'll add our own stuff. We'll include a login/logout button depending on authentication state. Login will redirect the user to the `/login` route, while logout will be performed directly.

{% raw %}
    // app/templates/application.js

    {{#if session.isAuthenticated}}
        <a {{action 'invalidateSession'}}>Logout</a>
    {{else}}
        {{#link-to 'login'}}Login{{/link-to}}
    {{/if}}

    {{outlet}}
{% endraw %}

In order to get the authentication state, we inject the current session directly into the controller so the template can query the [`isAuthenticated` property](http://ember-simple-auth.com/api/classes/SessionService.html#property_isAuthenticated). Then, we can use ember-simple-auth's [`invalidate` method](http://ember-simple-auth.com/api/classes/SessionService.html#method_invalidate) to log the user out.

    // app/controllers/application.js

    import Ember from 'ember';

    export default Ember.Controller.extend({
        session: Ember.inject.service('session'),

        actions: {
            invalidateSession() {
                this.get('session').invalidate();
            }
        }
    });

We will first add the [ApplicationRouteMixin](http://ember-simple-auth.com/api/classes/ApplicationRouteMixin.html) to the application route. This will define the methods needed on authentication and logout. Otherwise we would have to define them explicitly. 

    // app/routes/application.js

    import Ember from 'ember';
    import ApplicationRouteMixin from 'ember-simple-auth/mixins/application-route-mixin';

    export default Ember.Route.extend(ApplicationRouteMixin);

Update the login page template to include a 'Log in' button. Then connect the Log in button to the authenticate method. You can see in the controller how we define the provider to use; this is easily extensible to allow multiple sign in options for users.

{% raw %}
    // app/templates/login.hbs

    <button onclick={{action 'login'}}>Log in</button>
{% endraw %}
<br/>

    // app/controllers/login.js

    import Ember from 'ember';

    export default Ember.Controller.extend({
        session: Ember.inject.service(),

        actions: {
            login() {
                this.get('session').authenticate('authenticator:torii', 'facebook-connect');
            }
        }
    });

The last piece to define the torii controller. If you generated the torii controller from the command line, it will contain some methods to override the `Base` authenticator that aren't needed. We just need to give it the following.

    // app/authenticators/torii.js

    import Ember from 'ember';
    import Torii from 'ember-simple-auth/authenticators/torii';

    export default Torii.extend({
      torii: Ember.inject.service()
    });


Now we can go take a look at our ember app. It's not pretty, but it should work. The root should have a 'Login' button that redirects to `/login`. Once there, clicking the button will launch a Facebook pop up for signing in with the app. If you see any Facebook errors check for any mismatched settings in the dev portal.

After sign in, we should be redirected to the '`/`' route, and we should just be seeing the 'Logout' option. You should notice that opening the app in a new tab persists the login state. On clicking the 'Logout' button, the session is invalidated, and we stay on the base route, and can go to `login` and sign in again.

# Ember Inspector

A great utility to install to help debug is the [Ember Inspector](https://chrome.google.com/webstore/detail/ember-inspector/bmdblncegkenkacieihfhpjfppoconhi?hl=en) in the Chrome web store. With this installed, we can inspect what we have in the store and containers within our Ember app. For example, when signed in, you can open the Developer Tools with F12, and go to the new 'Ember' tab. Choose 'Container' to see a list of all object instances being maintained.

Next select 'session' > 'main' and you should see properties available in the right pane. You should see `isAuthenticated` (which we use in the template to decide whether to show login or logout button) is true. Hovering over a property reveals an `$E` option to the side which, on click, assigns the property to `$E` variable. When we do this, we can interact with the property directly in the console.

<img src="{{ site.baseurl }}/images/ember-simple-auth/ember-debug.png" alt="Picture of Ember debugger"/>

Go through the explanation above and look for the 'content' property. Expanding this out in the console shows all of the stuff we got back from using the torii provider. We should see fields for `authenticator`, `userId`, `accessToken`, `expiresIn`, and `provider`.

# Authentication mixins

We have the basics working, now we can play with some ember-simple-auth features, such as using out-of-the-box mixins.

To begin, let's modify our `index.js` route to use an [AuthenticatedRouteMixin](http://ember-simple-auth.com/api/classes/AuthenticatedRouteMixin.html), which makes routes accessible only if a user is authenticated. With this change, if no user is signed in, they will be automatically redirected from the route (`/`) to the authentication route, which is `login` by default.

    // app/routes/index.js

    import Ember from 'ember';
    import AuthenticatedRouteMixin from 'ember-simple-auth/mixins/authenticated-route-mixin';

    export default Ember.Route.extend(AuthenticatedRouteMixin);

Check your changes and you should notice the redirect working.

We can also do the opposite so that users, when logged in, are redirected away from certain pages. This is useful for the `login` page, where we could redirect to the 'routeIfAlreadyAuthenticated' (by default: `index`). It is aptly named the [UnauthenticatedRouteMixin](http://ember-simple-auth.com/api/classes/UnauthenticatedRouteMixin.html).

    // app/route/login.js

    import Ember from 'ember';
    import UnauthenticatedRouteMixin from 'ember-simple-auth/mixins/unauthenticated-route-mixin';

    export default Ember.Route.extend(UnauthenticatedRouteMixin);

Now, while logged in, if you try to hit the `localhost:4200/login` route directly, you will be redirected to the `index` route.

# Wrapping up

The code is available on [github](https://github.com/Jtfinlay/ember-simple-auth-app).

As a follow up, I think it would be useful to have some guides on using the auth token from torii to query user data from Facebook. Also, showing how to integrate the identity with service calls (adding an auth header to calls going to an Express server) would be a great piece to follow up with.

Let me know your thoughts and feedback below! 