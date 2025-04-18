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

// Create a safe filename from a title
export const createSafeFilename = (title: string, id: string): string => {
  return title.trim() 
    ? title.trim().replace(/[^a-z0-9]/gi, '_').toLowerCase() 
    : id;
};
