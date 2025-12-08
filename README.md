[![Atlassian license](https://img.shields.io/badge/license-Apache%202.0-blue.svg?style=flat-square)](LICENSE) [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](CONTRIBUTING.md)

# Atlassian DangerJS Plugin

A concise DangerJS plugin for Atlassian products.

Key features:

- Bitbucket Cloud: support to add PR tasks and reviewers conditionally.

## Installation

Install into your repo alongside Danger:

```sh
npm install --save-dev danger @atlassian/danger-plugin-atlassian
# npm only is supported for this project
```

## Documentation

This plugin exposes a small set of helpers designed to be used from your Dangerfile when running against Bitbucket Cloud pull requests.

### Prerequisites
- Your CI/Danger run must have Bitbucket Cloud context (Danger exposes `danger.bitbucket_cloud`).
- Use Danger’s `schedule` helper for asynchronous work inside your Dangerfile.

### Quick start (Dangerfile)
```ts
// dangerfile.ts
import { schedule } from 'danger'
import { addTasks, addReviewers } from '@atlassian/danger-plugin-atlassian'

// Add reviewers by AAID (Atlassian Account ID) - use https://id.atlassian.com/gateway/api/me to retrieve yours
schedule(addReviewers(['117058:9c6d0119-0000-1111-2222-0000d7399fff']))

// Add PR tasks only if not already present (idempotent per run)
schedule(addTasks([
  'Please add unit tests for the new utility',
  'Update the README with usage examples',
]))
```

### API reference

#### addTasks(rawTaskContentArray: string[]): Promise<void>
- Adds one or more PR tasks whose raw content matches the provided strings.
- Idempotent per run: the helper fetches existing tasks and only posts the ones that are missing.

#### addReviewers(reviewerAAIDs: string[]): Promise<void>
- Adds reviewers by their Bitbucket Cloud AAIDs.
- Merges with the current reviewer list and de-duplicates before updating the PR.
- Errors: non-OK responses from the Bitbucket API cause the helper to throw with HTTP status information.
- Example AAID: `557058:9c6d0619-9999-1111-2222-73e0d7399fff`.


## Developer notes
See `package.json` scripts for linting, building and testing.


## Contributions
Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## License
Copyright (c) [2025] Atlassian US., Inc.
Apache 2.0 licensed, see [LICENSE](LICENSE) file.

<br/>

[![With ❤️ from Atlassian](https://raw.githubusercontent.com/atlassian-internal/oss-assets/master/banner-with-thanks-light.png)](https://www.atlassian.com)
