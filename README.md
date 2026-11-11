# Kindred

Kindred is a neighbourhood help prototype built by Georgina Radley with AI coding tools. A resident describes a small favour, another resident volunteers, and the person who asked confirms that the help happened. The full app uses React, TypeScript and Postgres. This repository contains a standalone sample of its TypeScript logic.

## How a request takes shape

A resident might write “Could someone help me carry a bookshelf upstairs?” The server asks a model to suggest a short title, a category and a duration. If the suggestion comes back as `{ "title": "Carry a bookshelf", "category": "carry", "minutes": 45 }`, Kindred keeps the title and category and caps the time at **30 minutes**. The suggestion is a draft for the resident to review.

| File | What to look for |
| --- | --- |
| [ask-shaper.server.ts](./ask-shaper.server.ts) | The server requests structured output, checks for a usable title and tries a JSON fallback when the SDK returns unstructured text. |
| [ask-shaper.ts](./ask-shaper.ts) | One normalisation function handles both response paths. It tidies titles and maps suggestions to the categories and time slots the app supports. |
| [kindness.ts](./kindness.ts) | The app checks who can accept and confirm a request. Its streak calculation groups confirmations by London calendar week, including the Sunday-to-Monday boundary during British Summer Time. |
| [kindred.test.ts](./kindred.test.ts) | Synthetic cases exercise the model-output rules, the two resident roles and the weekly boundaries. |

## Run the tests

With Node.js 24 or later, run this from the repository directory. The tests run offline with Node's built-in test runner.

```sh
npm test
```

The model adapter is included for code review. Calling it requires the dependencies in `package.json` and an authorised Lovable gateway key supplied server-side as `LOVABLE_API_KEY`. The full app invokes it behind an authenticated server function. This sample only exposes the TypeScript modules and their tests.

The source is adapted from the prototype. Site-specific configuration and gateway run-ID tracking have been omitted, and the tests use fictional inputs.
