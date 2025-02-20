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

const processSearchResults = async (query: string, results: any) => {
  try {
    const client = getOpenAIClient();
    const { searchPrompt } = useChatStore.getState();
    const response = await client.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: searchPrompt
        },
        {
          role: 'user',
          content: `Original user query: "${query}"

Search results:
${results.results.map((result: any, index: number) => `
${index + 1}. ${result.title}
${result.content}
Source: ${result.url}
${result.published_date ? `Published: ${new Date(result.published_date).toLocaleDateString()}` : ''}
`).join('\n')}

Based on these search results, provide a comprehensive answer to the user's original query: "${query}"`
        }
      ],
      model: 'Phi-4',
      temperature: 0.7,
      max_tokens: 1000
    });

    return response.choices[0]?.message?.content?.trim() || 'No summary could be generated from the search results.';
  } catch (error) {
    console.error('Error processing search results:', error);
    if (error instanceof Error && error.message.includes('API key')) {
      throw new Error('Please add your OpenAI API key in the settings to use this feature.');
    }
    throw new Error('Failed to process search results. Please try again.');
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
  {
    name: 'search',
    description: 'Search the web and get a summarized answer',
    execute: async (query: string) => {
      if (!query.trim()) {
        return 'Please provide a search query.';
      }

      try {
        // First, acknowledge the search request
        const initialResponse = `Searching for: "${query}"\n\nPlease wait while I gather and analyze the results...`;

        // Start the search process
        const searchPromise = performSearch(query).then(async results => {
          try {
            // Process the results with AI
            const summary = await processSearchResults(query, results);
            return summary;
          } catch (error: any) {
            throw new Error(`Error processing results: ${error.message}`);
          }
        });

        // Return the initial response immediately
        const response = await Promise.race([
          searchPromise,
          Promise.resolve(initialResponse)
        ]);

        return response;

      } catch (error: any) {
        if (error.message.includes('API key')) {
          if (error.message.includes('Tavily')) {
            return 'To use the search feature, please add your Tavily API key in the settings (available at https://tavily.com).';
          }
          if (error.message.includes('OpenAI')) {
            return 'To use the search feature, please add your OpenAI API key in the settings.';
          }
        }
        return `Unable to complete the search. ${error.message}`;
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

  if (!command) {
    return `Unknown command: /${commandName}. Available commands: ${commands.map(cmd => '/' + cmd.name).join(', ')}`;
  }

  return await command.execute(args.join(' '));
};
