import { TodoContext } from '../models/todo-item';

const DEFAULT_TEMPLATE = `## 📋 TODO Found in Code

**Type**: {{todoType}}
**File**: \`{{filePath}}:{{lineNumber}}\`
**Branch**: \`{{gitBranch}}\`
**Author**: {{gitBlameAuthor}} ({{gitBlameDate}})

### Comment
> {{todoText}}

### Code Context
\`\`\`{{language}}
{{surroundingCode}}
\`\`\`

### Source
- **Repository**: {{repoUrl}}
- **Permalink**: {{codePermalink}}

---
*Created by [TODO-to-Issue Converter](https://marketplace.visualstudio.com/items?itemName=bhayanak.todo-to-issue)*`;

export function renderTemplate(context: TodoContext, template?: string): string {
  const tpl = template || DEFAULT_TEMPLATE;

  const replacements: Record<string, string> = {
    '{{todoType}}': sanitize(context.todoType),
    '{{filePath}}': sanitize(context.filePath),
    '{{lineNumber}}': String(context.lineNumber),
    '{{gitBranch}}': sanitize(context.gitBranch || 'N/A'),
    '{{gitBlameAuthor}}': sanitize(context.gitBlame?.author || 'N/A'),
    '{{gitBlameDate}}': sanitize(context.gitBlame?.date || 'N/A'),
    '{{todoText}}': sanitize(context.todoText),
    '{{language}}': sanitize(context.language),
    '{{surroundingCode}}': context.surroundingCode, // Code blocks are safe in markdown
    '{{repoUrl}}': sanitize(context.repoUrl || 'N/A'),
    '{{codePermalink}}': sanitize(context.codePermalink || 'N/A'),
  };

  let result = tpl;
  for (const [placeholder, value] of Object.entries(replacements)) {
    result = result.replaceAll(placeholder, value);
  }

  return result;
}

export function buildTitle(context: TodoContext): string {
  const maxLength = 100;
  const prefix = `[${context.todoType}]`;
  const text = context.todoText || `in ${context.filePath}:${context.lineNumber}`;
  const title = `${prefix} ${text}`;
  return title.length > maxLength ? title.substring(0, maxLength - 3) + '...' : title;
}

function sanitize(input: string): string {
  // Prevent markdown/HTML injection in issue bodies
  return input.replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
