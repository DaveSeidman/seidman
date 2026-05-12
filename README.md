# Seidman

A command-line chatbot about Dave Seidman.

The idea is simple: instead of sending a normal portfolio link or resume, Dave can send people an npm package they can run in their terminal.

```sh
npx seidman
```

It opens a local terminal conversation where people can ask about Dave's work, projects, background, preferences, and other biographical details.

## How It Works

This is intentionally not a hosted AI service. It runs locally in Node, uses `node-nlp` to classify what the user is asking, and answers from authored local data. The goal is for the bot to feel conversational without making things up.

The basic flow is:

```text
user question
  -> local NLP intent classification
  -> matching answer or action
  -> typewriter-style terminal response
```

Some answers have multiple variants. The app shuffles and cycles through them so repeated questions do not always get the exact same response.

## Where The Data Lives

If you want to jump straight into the content, start here:

- `data/profile.json` - biographical information, personal details, education, personality, music, hobbies.
- `data/experience.json` - work history, technical stack, learning habits, motivation.
- `data/projects.json` - structured project records.
- `data/stories.json` - longer project stories and interview-style examples.
- `data/interview.json` - prompts and draft answers for common interview questions.
- `data/voice.json` - writing and interaction guidelines for how the bot should sound.

The current runtime still gets most direct answers from:

- `modules/nlp/intents/*.json`

Each intent file contains example questions and, when applicable, answer variants. After editing intent files, retrain the NLP model:

```sh
npm run train
```

That updates:

```text
modules/nlp/model.nlp
```

## Development

Install dependencies:

```sh
npm install
```

Run the CLI locally:

```sh
npm run dev
```

Run it in watch mode while editing data, intents, or source files:

```sh
npm run dev:watch
```

## Publishing

Patch versions are enough while this is evolving:

```sh
npm version patch --no-git-tag-version
npm publish
```

Then test the published package:

```sh
npx seidman@latest
```
