export interface Command {
  name: string;
  description: string;
  execute: (args: string) => Promise<string>;
}

export interface CommandSuggestion {
  command: string;
  description: string;
}
