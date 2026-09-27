# How we work: production and test

This page explains, without assuming any Git knowledge, how changes reach the website. Claude Code follows the same rules; they are written for it in [CLAUDE.md](../CLAUDE.md) ("Branches and releases").

## Two versions of the site

| Branch | What it is | Website | Who sees it |
|---|---|---|---|
| `master` | **Production**: the real shop | [bugout.es](https://bugout.es) | Customers |
| `develop` | **Test**: where every change is tried first | [test.bugout.es](https://test.bugout.es) | Us (hidden from Google) |

A *branch* is a named version of the code. Every time new code is saved to one of these two branches, Vercel rebuilds the matching website a few minutes later, and GitHub runs the automatic checks (*CI*: tests, a build and browser tests) on it.

**The golden rule: nothing goes to production without passing through test first.** The only exception is an urgent fix for something broken on the live shop.

## Normal work: something new

New products, pages, texts, designs, features, clean-ups: anything that isn't an emergency.

1. Start a Claude Code session and say which branch in your first message, for example: *"Work on develop: add a new kit for pets."*
   If you don't say it, Claude asks you before touching anything. That is expected.
2. Claude makes the change, runs the checks, and saves it to `develop`.
3. A few minutes later, open **test.bugout.es** and check it yourself: on a computer and on a phone, and try buying if the change affects the cart or checkout.
4. If something is wrong, tell Claude (still on `develop`) and check again.

## Releasing to production

When you have checked test.bugout.es and are happy with **everything** on it (not only your change; everything on `develop` goes out together), start a session and say:

> *"Release develop to master. I checked test.bugout.es."*

Claude checks that the automatic checks on `develop` are green and then copies `develop` to `master`. Claude Code will show a confirmation before the push to production; confirm it. bugout.es updates a few minutes later.

## Emergency: something is broken on bugout.es

1. Start a session and say: *"Hotfix on master: the checkout button does nothing."*
2. Claude fixes it on `master` (Claude Code asks you to confirm the push to production) and then copies the fix to `develop`, so the test site has it too.
3. Check bugout.es.

Use this only for real problems on the live shop. Anything else goes through `develop`.

## What Claude never does by itself

- Push to `master` without your confirmation, or without the change having passed through `develop` (except a hotfix you asked for).
- Erase or rewrite the history of `master` or `develop`.
- Leave extra branches lying around: if it creates a temporary branch, it merges and deletes it before finishing.
- Change anything outside the code. Environment variables, Vercel, domains and DNS, the Shopify admin, PostHog and GitHub settings are changed only by **Carlos Chuan**. When a change needs one, Claude ends its answer with a **"Needs Carlos"** list saying exactly what to change and where; forward it to Carlos.

## Words you may see

- **Commit**: a saved step of changes, with a description.
- **Push**: sending commits to GitHub, where Vercel and CI pick them up.
- **Merge**: bringing the changes of one branch into another.
- **CI** (the green tick or red cross on GitHub): the automatic checks. Red means something is broken; Claude fixes it before anything else.
- **Hotfix**: an urgent fix made directly on production.
