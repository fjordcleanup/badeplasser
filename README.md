# Fjord CleanUP · Map showing water quality on the beaches in and around Oslo.

[![GitHub Actions](https://github.com/fjordcleanup/badeplasser/actions/workflows/test-and-release.yaml/badge.svg)](https://github.com/fjordcleanup/badeplasser/actions/workflows/test-and-release.yaml)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)
[![Renovate](https://img.shields.io/badge/renovate-enabled-brightgreen.svg)](https://renovatebot.com)
[![@commitlint/config-conventional](https://img.shields.io/badge/%40commitlint-config--conventional-brightgreen)](https://github.com/conventional-changelog/commitlint/tree/master/@commitlint/config-conventional)
[![code style: oxfmt](https://img.shields.io/badge/code_style-oxfmt-32f3e9.svg)](https://oxc.rs/docs/guide/usage/formatter.html)
[![Oxlint](https://img.shields.io/badge/Ox-lint-blue.svg)](https://oxc.rs/docs/guide/usage/linter.html)

This is the web application that is served on
[badeplasser.fjordcleanup.org](https://badeplasser.fjordcleanup.org/).

## Setup

Install the dependencies:

```bash
npm ci
```

## Run

```bash
npm start
```

## Node & NPM

This project requires Node.js `>=24.18.1 <25` and npm `>=12.0.2 <13` (enforced
via `check-node-version` on `npm install` and `npm ci`). The check is skipped
during `npm publish` and `npm pack`, because `semantic-release` bundles its own
npm (`@semantic-release/npm` depends on `npm@^11.6.2`) and runs the publish with
that version rather than the one installed in CI.
