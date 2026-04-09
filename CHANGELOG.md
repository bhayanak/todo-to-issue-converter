# Changelog

All notable changes to the **TODO to Issue** extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2026-04-09

### Added
- **Token validation on save** — GitHub and Jira credentials are now verified immediately when configured, with clear success/failure feedback
- **Persistent issue links** — linked TODO ↔ issue mappings now survive VS Code restarts (stored in workspace state)
- **GitHub auto-detection** — owner and repo are automatically detected from the git remote URL when not explicitly configured
- **GitHub Release workflow** — CI now creates GitHub Releases with `.vsix` artifact attached on version tags

### Fixed
- Git `stderr` output no longer floods the Extension Host console (`stdio` pipes added to all `execSync` calls)
- "Illegal value for `line`" error when using the right-click context menu (arg type validation)
- Configure Jira/GitHub commands now appear in the Command Palette
- Git utility functions return `null` gracefully when no working directory is available

### Changed
- `parseOwnerRepoFromUrl` now handles SSH URLs (`git@host:owner/repo.git`) in addition to HTTPS
- Error messages for API failures include actionable guidance (check token scopes, base URL, etc.)

## [0.1.1] - 2026-04-08

### Fixed
- Pinned `@vscode/vsce` to v2.31.1 for Node 18 compatibility in CI
- Removed `activationEvents: ["onLanguage:*"]` which caused marketplace upload rejection
- SSH URL normalization (`git@host:owner/repo` → HTTPS) now uses regex capture groups instead of naive string replace

## [0.1.0] - 2026-04-07

### Added
- Right-click context menu to create Jira/GitHub issues from TODO comments
- Auto-context extraction (file, line, surrounding code, git blame)
- Jira REST API v3 integration
- GitHub REST API integration
- Issue body template rendering with sanitization
- Duplicate detection before issue creation
- CodeLens showing linked issue status above TODO comments
- Inline decorations for linked/unlinked TODOs
- Bulk workspace scan for TODO comments
- Link existing issues to TODO comments
- Secure credential storage via VS Code SecretStorage
- Auto-labeling by TODO type (enhancement, bug, tech-debt, needs-review)
- Configurable patterns (TODO, FIXME, HACK, BUG, XXX)
- CI pipeline with Node 18/20/22 matrix
