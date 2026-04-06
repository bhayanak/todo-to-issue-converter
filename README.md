<p align="center">
  <img src="logo.png" alt="TODO to Issue — VS Code Extension" width="180" height="180"/>
</p>

<h1 align="center">TODO to Issue — VS Code Extension</h1>

> Right-click a `TODO`, `FIXME`, `HACK`, or `BUG` comment in your code and instantly create a **Jira** or **GitHub Issue** — pre-populated with file context, line number, surrounding code snippet, and git blame info.

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

### 1. Install the Extension

Install from the VS Code Marketplace, or manually via `.vsix`:

```bash
code --install-extension todo-to-issue-0.1.0.vsix
```

### 2. Configure Provider

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

### 3. Store Credentials Securely

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

## Requirements

- VS Code 1.85+
- Node.js 18+
- Git (for blame info)

## License

[MIT](LICENSE)
