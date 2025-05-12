import TurndownService from 'turndown';

// Create an instance of TurndownService
const turndownService = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  emDelimiter: '*',
});

// Convert HTML to Markdown
export const htmlToMarkdown = (html: string): string => {
  return turndownService.turndown(html);
};

// Convert Markdown to HTML (enhanced implementation)
export const markdownToHtml = (markdown: string): string => {
  // This is a basic implementation with support for common markdown elements
  if (!markdown || markdown.trim() === '') {
    return '<p></p>';
  }

  let html = '';

  // Split by double newlines (paragraphs)
  const paragraphs = markdown.split(/\n\n+/);

  for (const paragraph of paragraphs) {
    if (paragraph.trim() === '') continue;

    // Check for headings
    if (paragraph.startsWith('# ')) {
      const text = paragraph.substring(2).trim();
      html += `<h1>${text}</h1>`;
    } else if (paragraph.startsWith('## ')) {
      const text = paragraph.substring(3).trim();
      html += `<h2>${text}</h2>`;
    } else if (paragraph.startsWith('### ')) {
      const text = paragraph.substring(4).trim();
      html += `<h3>${text}</h3>`;
    } else if (paragraph.startsWith('- ') || paragraph.startsWith('* ')) {
      // Unordered list
      const items = paragraph.split(/\n/).filter(line => line.trim().startsWith('- ') || line.trim().startsWith('* '));
      if (items.length > 0) {
        html += '<ul>';
        for (const item of items) {
          const text = item.replace(/^[-*]\s+/, '').trim();
          html += `<li>${text}</li>`;
        }
        html += '</ul>';
      }
    } else if (/^\d+\.\s/.test(paragraph)) {
      // Ordered list
      const items = paragraph.split(/\n/).filter(line => /^\d+\.\s/.test(line.trim()));
      if (items.length > 0) {
        html += '<ol>';
        for (const item of items) {
          const text = item.replace(/^\d+\.\s+/, '').trim();
          html += `<li>${text}</li>`;
        }
        html += '</ol>';
      }
    } else if (paragraph.startsWith('```')) {
      // Code block
      const endIndex = paragraph.indexOf('```', 3);
      if (endIndex !== -1) {
        const code = paragraph.substring(paragraph.indexOf('\n') + 1, endIndex).trim();
        html += `<pre><code>${code}</code></pre>`;
      } else {
        // If no closing backticks, treat as regular paragraph
        const lines = paragraph.split('\n').map(line => line.trim()).join('<br>');
        html += `<p>${lines}</p>`;
      }
    } else if (paragraph.startsWith('>')) {
      // Blockquote
      const text = paragraph.replace(/^>\s?/gm, '').trim();
      html += `<blockquote>${text}</blockquote>`;
    } else {
      // Regular paragraph with basic formatting
      let lines = paragraph;

      // Bold
      lines = lines.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      lines = lines.replace(/__(.*?)__/g, '<strong>$1</strong>');

      // Italic
      lines = lines.replace(/\*(.*?)\*/g, '<em>$1</em>');
      lines = lines.replace(/_(.*?)_/g, '<em>$1</em>');

      // Inline code
      lines = lines.replace(/`(.*?)`/g, '<code>$1</code>');

      // Handle line breaks within paragraphs
      lines = lines.split('\n').map(line => line.trim()).join('<br>');

      html += `<p>${lines}</p>`;
    }
  }

  return html || '<p></p>';
};

// Create a safe filename from a title
export const createSafeFilename = (title: string, id: string): string => {
  return title.trim()
    ? title.trim().replace(/[^a-z0-9]/gi, '_').toLowerCase()
    : id;
};
