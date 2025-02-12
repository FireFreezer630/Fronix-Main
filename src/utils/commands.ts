import { OpenAI } from 'openai';
import { Command } from '../types/commands';

const client = new OpenAI({
  baseURL: 'https://models.inference.ai.azure.com',
  apiKey: import.meta.env.VITE_OPENAI_API_KEY || 'dummy-key',
  dangerouslyAllowBrowser: true
});

const enhanceImagePrompt = async (prompt: string): Promise<string> => {
  try {
    const response = await client.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are an expert AI image generation prompt enhancer. When I provide an image prompt, your goal is to rewrite it to be more detailed, descriptive, and effective for AI image generation, specifically for use with services like Pollinations.  Incorporate algorithmically beneficial terms and descriptive language to maximize image quality and accuracy.

Your output should be a URL in the following format: \`https://pollinations.ai/prompt/<enhanced-prompt>\`, where \`<enhanced-prompt>\` is the rewritten, improved image generation prompt.`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      model: 'llama-3.3-70b-instruct',
      temperature: 0.7,
      max_tokens: 200
    });

    return response.choices[0]?.message?.content?.trim() || prompt;
  } catch (error) {
    console.error('Error enhancing prompt:', error);
    return prompt;
  }
};

export const commands: Command[] = [
  {
    name: 'gen',
    description: 'Generate an image using Pollinations AI',
    execute: async (prompt: string) => {
      try {
        const enhancedPrompt = await enhanceImagePrompt(prompt);
        const encodedPrompt = encodeURIComponent(enhancedPrompt);
        return `Generating image: ${prompt}\nhttps://pollinations.ai/prompt/${encodedPrompt}`;
      } catch (error) {
        console.error('Error executing gen command:', error);
        return `Failed to generate image. Please check the console for errors.`;
      }
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
