// src/utils/webSearch.ts
    import { performSearch, SearchResponse } from './tavily';

    export const webSearchTool = {
      type: "function",
      function: {
        name: "performWebSearch",
        description: "Searches the web for information based on a query and returns summarized results.",
        parameters: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "The search query to look up on the web",
            },
          },
          required: ["query"],
        },
      },
    };

    export async function performWebSearch({ query }: { query: string }): Promise<string> {
      try {
        const results: SearchResponse = await performSearch(query);
        const formattedResults = results.results
          .map((result, index) =>
            `${index + 1}. **${result.title}**\n   - ${result.content}\n   - Source: ${result.url}`
          )
          .join('\n');
        return formattedResults || "No results found.";
      } catch (error) {
        return `Error performing web search: ${error instanceof Error ? error.message : 'Unknown error'}`;
      }
    }

    export const namesToFunctions = {
      performWebSearch: (data: { query: string }) => performWebSearch(data),
    };
