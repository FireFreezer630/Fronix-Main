import { OpenAI } from 'openai';
import { Command } from '../types/commands';

const client = new OpenAI({
  baseURL: 'https://models.inference.ai.azure.com',
  apiKey: import.meta.env.VITE_OPENAI_API_KEY || 'dummy-key',
  dangerouslyAllowBrowser: true
});

const enhanceImagePrompt = async (prompt: string): Promise<string> => {
  const response = await client.chat.completions.create({
    messages: [
      {
        role: 'system',
        content: 'You are an expert at enhancing image generation prompts. Your task is to enhance the given prompt by adding relevant terms that will help in generating more accurate and detailed images. Only respond with the enhanced prompt, nothing else.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    model: 'gpt-4o',
    temperature: 0.7,
    max_tokens: 200
  });

  return response.choices[0]?.message?.content?.trim() || prompt;
};

export const commands: Command[] = [
  {
    name: 'gen',
    description: 'Generate an image using Pollinations AI',
    execute: async (prompt: string) => {
      const enhancedPrompt = await enhanceImagePrompt(prompt);
      const encodedPrompt = encodeURIComponent(enhancedPrompt);
      return `Generating image: ${prompt}\nhttps://pollinations.ai/prompt/${encodedPrompt}`;
    }
  }
];

export const getCommandSuggestions = (input: string) => {
  if (!input.startsWith('/')) return [];
  
  const searchTerm = input.slice(1).toLowerCase();
  return commands
    .filter(cmd => cmd.name.startsWith(searchTerm))
    .map(cmd => ({
      command: `/${cmd.name}`,
      description: cmd.description
    }));
};

export const executeCommand = async (input: string): Promise<string | null> => {
  if (!input.startsWith('/')) return null;

  const [commandName, ...args] = input.slice(1).split(' ');
  const command = commands.find(cmd => cmd.name === commandName);

  if (!command) return null;

  return await command.execute(args.join(' '));
};
