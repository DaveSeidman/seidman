# Seidman Data

This folder is the curated knowledge base for the CLI.

The bot should answer from these files instead of inventing facts. Intent files can route a question to a topic, but approved records here should be the source of truth for what the CLI says about Dave.

## Status Values

- `approved`: safe to show to interviewers.
- `needs_expansion`: true enough to seed the system, but too thin for a polished answer.
- `draft`: captured notes or prompts that still need Dave's review.
- `low_priority`: valid, but probably not important for the interviewer experience.

## Authoring Rule

New answers should keep facts and voice separate:

- Facts go in `facts`, `notes`, or project fields.
- Final phrasing goes in `answerVariants`.
- Anything uncertain stays in `draft` until reviewed.
