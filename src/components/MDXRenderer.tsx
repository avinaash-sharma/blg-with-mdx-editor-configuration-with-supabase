import {
  MDXEditor,
  headingsPlugin,
  listsPlugin,
  quotePlugin,
  thematicBreakPlugin,
  markdownShortcutPlugin,
  linkPlugin,
  linkDialogPlugin,
  imagePlugin,
  tablePlugin,
  codeBlockPlugin,
  codeMirrorPlugin,
  frontmatterPlugin,
} from '@mdxeditor/editor'
import '@mdxeditor/editor/style.css'

interface MDXRendererProps {
  content: string
}

export function MDXRenderer({ content }: MDXRendererProps) {
  return (
    <div className="mdx-renderer">
      <MDXEditor
        markdown={content}
        readOnly
        plugins={[
          headingsPlugin(),
          listsPlugin(),
          quotePlugin(),
          thematicBreakPlugin(),
          markdownShortcutPlugin(),
          linkPlugin(),
          linkDialogPlugin(),
          imagePlugin(),
          tablePlugin(),
          codeBlockPlugin(),
          codeMirrorPlugin({
            codeBlockLanguages: {
              js: 'JavaScript',
              javascript: 'JavaScript',
              ts: 'TypeScript',
              typescript: 'TypeScript',
              jsx: 'JSX',
              tsx: 'TSX',
              css: 'CSS',
              html: 'HTML',
              json: 'JSON',
              python: 'Python',
              bash: 'Bash',
              shell: 'Shell',
              sql: 'SQL',
              go: 'Go',
              rust: 'Rust',
            },
          }),
          frontmatterPlugin(),
        ]}
        contentEditableClassName="mdx-content-readonly"
      />
    </div>
  )
}
