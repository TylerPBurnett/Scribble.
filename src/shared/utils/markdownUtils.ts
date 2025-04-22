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

// Convert Markdown to HTML (simple implementation)
export const markdownToHtml = (markdown: string): string => {
  // This is a very basic implementation
  // In a real app, you'd use a proper markdown parser
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
    } else {
      // Handle line breaks within paragraphs
      const lines = paragraph.split('\n').map(line => line.trim()).join('<br>');
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
