import { OpenAI } from 'openai';
    import { Command } from '../types/commands';
    import { performSearch } from './tavily';
    import { useChatStore } from '../store/chatStore';

    const getOpenAIClient = () => {
      const { apiKey, baseUrl } = useChatStore.getState();
      if (!apiKey) {
        throw new Error('Please add your OpenAI API key in the settings to use this feature.');
      }
      return new OpenAI({
        baseURL: baseUrl,
        apiKey,
        dangerouslyAllowBrowser: true
      });
    };

    const enhanceImagePrompt = async (prompt: string): Promise<string> => {
      try {
        const client = getOpenAIClient();
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
        if (error instanceof Error && error.message.includes('API key')) {
          throw new Error('Please add your OpenAI API key in the settings to use this feature.');
        }
        return prompt;
      }
    };

    export const commands: Command[] = [
      {
        name: 'gen',
        description: 'Generate an image using Pollinations AI',
        execute: async (prompt: string) => {
          if (!prompt.trim()) {
            return 'Please provide a description of the image you want to generate.';
          }

          try {
            const enhancedPrompt = await enhanceImagePrompt(prompt);
            const encodedPrompt = encodeURIComponent(enhancedPrompt);
            return `Generating image: ${prompt}\nhttps://pollinations.ai/prompt/${encodedPrompt}`;
          } catch (error) {
            if (error instanceof Error) {
              return error.message;
            }
            return 'Failed to generate image. Please try again later.';
          }
        }
      },
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

      if (!command) {
        return `Unknown command: /${commandName}. Available commands: ${commands.map(cmd => '/' + cmd.name).join(', ')}`;
      }

      return await command.execute(args.join(' '));
    };
