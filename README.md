<p align="center">
  <img src="logo.png" alt="TODO to Issue — VS Code Extension" width="180" height="180"/>
</p>

<h1 align="center">TODO to Issue — VS Code Extension</h1>

<p align="center">
  <a href="https://github.com/bhayanak/todo-to-issue-converter/actions/workflows/ci.yml"><img src="https://github.com/bhayanak/todo-to-issue-converter/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://github.com/bhayanak/todo-to-issue-converter/releases/latest"><img src="https://img.shields.io/github/v/release/bhayanak/todo-to-issue-converter?label=release" alt="GitHub Release"></a>
  <img src="https://img.shields.io/badge/node-%3E%3D18-brightgreen" alt="Node.js">
  <img src="https://img.shields.io/badge/vscode-%3E%3D1.85-blue" alt="VS Code">
  <a href="https://github.com/bhayanak/todo-to-issue-converter/blob/main/LICENSE.txt"><img src="https://img.shields.io/github/license/bhayanak/todo-to-issue-converter" alt="License"></a>
  <img src="https://img.shields.io/badge/coverage-96%25-brightgreen" alt="Coverage">
</p>

<p align="center">
  Right-click a <code>TODO</code>, <code>FIXME</code>, <code>HACK</code>, or <code>BUG</code> comment in your code and instantly create a <strong>Jira</strong> or <strong>GitHub Issue</strong> — pre-populated with file context, line number, surrounding code snippet, and git blame info.
</p>

---

## Features

- **Right-Click → Create Issue**: Context menu on any TODO/FIXME/HACK/BUG comment line
- **Auto-Context Extraction**: File path, line number, surrounding code (± 5 lines), git blame
- **Jira Integration**: Create issues in configured Jira project with labels
- **GitHub Integration**: Create GitHub issues with code permalink and labels
- **CodeLens**: Show linked issue status above TODO comments
- **Inline Decoration**: Highlight TODOs with issue link after creation
- **Bulk Scan**: Scan entire workspace for unlinked TODOs
- **Duplicate Detection**: Check for existing issues before creating duplicates
- **Secure Credentials**: API tokens stored in VS Code SecretStorage, never in settings

## Setup

### Configure Provider

Open VS Code Settings (`Cmd+,`) and search for **"TODO to Issue"**:

| Setting | Description | Default |
|---------|-------------|---------|
| `todoToIssue.provider` | Issue tracker: `jira` or `github` | `jira` |
| `todoToIssue.jira.baseUrl` | Jira instance URL | — |
| `todoToIssue.jira.projectKey` | Default Jira project key | — |
| `todoToIssue.jira.issueType` | Default issue type | `Task` |
| `todoToIssue.github.owner` | GitHub repo owner | auto-detected |
| `todoToIssue.github.repo` | GitHub repo name | auto-detected |
| `todoToIssue.patterns` | Comment patterns to detect | `["TODO","FIXME","HACK","BUG","XXX"]` |
| `todoToIssue.contextLines` | Surrounding code lines in issue | `5` |
| `todoToIssue.includeGitBlame` | Include git blame info | `true` |
| `todoToIssue.autoLabel` | Auto-add labels by type | `true` |
| `todoToIssue.showCodeLens` | Show CodeLens above TODOs | `true` |
| `todoToIssue.duplicateDetection` | Check duplicates before creating | `true` |

### Store Credentials Securely

Use the Command Palette (`Cmd+Shift+P`):

- **Jira**: `TODO to Issue: Configure Jira Credentials` — enter email + API token
- **GitHub**: `TODO to Issue: Configure GitHub Token` — enter PAT

Credentials are stored in VS Code's encrypted SecretStorage. Never in `settings.json`.

## Usage

### Create Issue from TODO

1. Place cursor on a line with `TODO`, `FIXME`, `HACK`, or `BUG`
2. Right-click → **TODO → Create Issue**
3. Issue is created with full context and linked inline

### Link Existing Issue

1. Place cursor on a TODO line
2. Right-click → **TODO → Link Existing Issue**
3. Enter issue key (e.g., `PROJ-123` or `#456`)

### Bulk Scan

1. Command Palette → **TODO → Scan Workspace**
2. View counts of linked vs unlinked TODOs

## Auto-Labels

| TODO Type | Label |
|-----------|-------|
| `TODO` | `enhancement` |
| `FIXME` | `bug` |
| `HACK` | `tech-debt` |
| `BUG` | `bug` |
| `XXX` | `needs-review` |

## Installation

### From GitHub Releases

Download the latest `.vsix` from [Releases](https://github.com/bhayanak/todo-to-issue-converter/releases/latest) and install:

```bash
code --install-extension todo-to-issue-*.vsix
```

### From Source

```bash
git clone https://github.com/bhayanak/todo-to-issue-converter.git
cd todo-to-issue-converter
npm ci && npm run build
npx @vscode/vsce package --no-dependencies
code --install-extension todo-to-issue-*.vsix
```

## Requirements

- VS Code 1.85+
- Node.js 18+
- Git (for blame info)

## Contributing

PRs welcome! Run the test suite before submitting:

```bash
npm ci
npm test -- --coverage
npm run lint
```

## License

[MIT](LICENSE.txt)
