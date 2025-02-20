import { useChatStore } from '../store/chatStore';

export interface SearchResult {
  title: string;
  url: string;
  content: string;
  score: number;
  source: string;
  published_date?: string;
}

export interface SearchResponse {
  results: SearchResult[];
  query: string;
}

export async function performSearch(query: string): Promise<SearchResponse> {
  const { tavilyApiKey } = useChatStore.getState();
  
  if (!tavilyApiKey) {
    throw new Error('Please add your Tavily API key in the settings to use the search feature. You can get one at https://tavily.com');
  }

  if (!query.trim()) {
    throw new Error('Search query cannot be empty.');
  }

  try {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tavilyApiKey}`
      },
      body: JSON.stringify({
        query: query.trim(),
        search_depth: "advanced",
        include_domains: [],
        exclude_domains: [],
        max_results: 5
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      let errorMessage = 'Search failed';
      
      try {
        const parsedError = JSON.parse(errorData);
        if (parsedError.error?.message) {
          errorMessage = parsedError.error.message;
        }
      } catch {
        errorMessage = `${response.status} ${response.statusText}`;
      }

      if (response.status === 401) {
        throw new Error('Invalid Tavily API key. Please check your settings and ensure you have entered a valid API key from https://tavily.com');
      }

      throw new Error(errorMessage);
    }

    const data = await response.json();
    
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid response format from Tavily API');
    }

    if (!Array.isArray(data.results)) {
      console.warn('Unexpected response structure:', data);
      throw new Error('Invalid search results format');
    }

    return {
      results: data.results.map(result => ({
        ...result,
        title: result.title || 'Untitled',
        content: result.content || 'No content available',
        url: result.url || '#',
        source: result.source || result.url || 'Unknown source'
      })),
      query: data.query || query
    };
  } catch (error) {
    if (error instanceof Error) {
      // Pass through our custom error messages
      throw error;
    }
    // For unexpected errors
    throw new Error('An unexpected error occurred while performing the search. Please try again later.');
  }
}
