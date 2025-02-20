export interface Command {
  name: string;
  description: string;
  execute: (args: string) => Promise<string>;
}

export interface CommandSuggestion {
  command: string;
  description: string;
}

export interface SearchResult {
  title: string;
  url: string;
  content: string;
  score: number;
  source: string;
  published_date?: string;
}
