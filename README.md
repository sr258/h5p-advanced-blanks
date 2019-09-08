# H5P Advanced Blanks

This is an advanced 'Fill the blanks' content type for h5p. In addition to most of the features of the regular 'Fill the blanks' content type it supports:

* The content creator can specify a feedback text message that should be displayed to the users when they enter a certain incorrect answer.
* The content creator can specify parts of the text that should be highlighted when the users enter a certain incorrect answer. ("signal words")
* The content creator can use text snippets to avoid retyping the same feedback message over and over.
* User are given more detailed feedback when they make spelling mistake.

It's main use is for foreign language learning, where you can give the users individual hints, why certain tenses or word forms can't be used in this case. While it is possible to have a 'Check' button at the end, it makes more sense to use the auto-check setting as the user is guided through the 'fill the blanks' exercise blank by blank.

## Architecture

This content type uses parts of h5p-blanks but is not based on it, as it was ported over from a widget written by the author for LearningApps.org. It uses a MVC style architecture with Ractive as the library responsible for creating the views. It is written in TypeScript.

## Getting started

Grab all the modules:

```bash
npm install
```

Build project with debug info:

```bash
npm run build
```

Build project in production mode:
```bash
npm run build:prod
```

Copy all relevant files to ``dist`` directory
```bash
npm run dist
```