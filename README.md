# can-steal-ssg

This package adds Static Site Generation (SSG) to your CanJS+StealJS application.  SSG pre-renders the HTML that a CanJS app would create at startup for a particular route, for the purpose of serving the HTML for fast display before hydrating into an interactive app.



## Configuration basics

To begin the process of configuring your application for SSG, add can-steal-ssg as a steal plugin.  In your package.json it looks like this:

```json
{
  "steal": {
    "plugins": [
      "can-steal-ssg"
    ]
  }
}
```

After this step, create an SSG config file.  The convention is to put this file alongside your app component and give it the extension ".ssgjs"

The config file is a JavaScript file, and has three important functions:
1. import the main app component
2. export the tag name used for the app component as `mainElementName`
3. export an optionally async function `getRoutes()`

Additionally, the config file _may_ export a function `updateDocumentBeforeScrape()` which receives the document object after the site has been statically generated. This allows for SSG-specific changes to the document that will exist when the route is loaded until hydration.  Some examples of why you might want to update only the SSG'ed version of the document include:
 * SSG will wait for all timeouts on app startup and only finalize the view once all timeouts have expired.  If you have a popup that shows up five seconds after page load, it will be displayed immediately when serving SSG unless you use `updateDocumentBeforeScrape()` to remove it from the SSG'ed version.
 * Buttons and inputs will not have actions until the page hydrates.  It may make UX sense to disable all buttons and inputs until their respective user actions can be handled after hydration.


Here's an example app.ssgjs from the example app in this repo:

```js
import "./app";

export const mainElementName = "app-main";

export function getRoutes() {
  return ['/', '/home', '/about', '/contact'];
}

export function updateDocumentBeforeScrape(document) {
  document.querySelectorAll("input, button")
    .forEach(input => input.setAttribute("disabled", "disabled"));
}
```

In the hypothetical matching app.js imported from our ssgjs module, there is a `customElements.define()` call that uses "app-main" as the tag name attached to our main application's StacheElement subclass.  By setting the exported `mainElementName` variable in the ssgjs to the same "app-main" string, it lets can-steal-ssg know that "app-main" is the custom element responsible for rendering the application, and a matching tag will be inserted into the document when initiation static generation.

can-steal-ssg does not currently support custom HTML documents that include Steal and the steal main.  It generates a document with a Steal script tag and the main element tag before statically generating a page.  The same generated document is served as a fallback when `can-steal-ssg serve` is invoked, so it is not necessary to have a main HTML document for an application using `can-steal-ssg`.


## Building


```bash
$ npx can-steal-ssg build
```

will make a static build of all routes returned by getRoutes() using default settings.

The build command takes the following arguments:
  * `-e, --environment`: which environment to build from, `dev` or `prod`.  the prod build includes a build of script and asset bundles and gets put in its own dist directory, while dev builds are placed in the dev directory.
  * `-m, --main`: path to the steal main for building SSG mode. The default is based off of your main script in package.json, replacing any extension on it with ".ssgjs", so if your main is "src/app/app.js", the default SSG main becomes "~/src/app/app.ssgjs"
  * `-c, --config-path` Use this flag to change the path to your steal config file for production builds, if not using package.json
  * `-d, --dest`: the root folder where production build output is replaced; unlike dev builds, prod builds are kept separate from the source tree and are expected to be able to be zipped up and deployed elsewhere without source script files or node_modules. The default is "prod"
  * `-n, --num-threads`: Maximum number of worker threads to spawn for SSG jobs.  8 is the default but other numbers may yield better performance on your platform.



## Serving

```bash
$ npx can-steal-ssg serve
```

will start a local express server that is configured to serve SSG content and other assets needed to make SSG builds available.

The serve command takes the following arguments:
  * `-e, --environment`:  which build environment to serve, "dev" or "prod". Defaults to "dev".  To serve SSG, the matching environment must have already been built with the `build` command.  However, the server is also able to fall back to SPA mode if the app has not been built for SSG yet.
  * `-m --main`: path to the steal main for serving SSG mode.  This must be the same value as used for the build command, and has the same default value as when building.
  * `-d --dist`: root of the build distribution for production mode. This must be the same value as used for the "prod" environment's `build`, and has the same default.
  * `-p --port`: port number to serve on. Defaults to either the PORT environment variable if set, or 8080.

  ## Feedback

  Please report any bugs or issues in this GitHub repo and follow up in the [Bitovi Community Slack](https://bitovi-community.slack.com/) in #canjs.