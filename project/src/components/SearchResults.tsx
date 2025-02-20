import React, { useState } from 'react';
import { SearchResult } from '../utils/tavily';
import { ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';

interface SearchResultsProps {
  results: SearchResult[];
  isLoading: boolean;
  error?: string;
  query: string;
}

export default function SearchResults({ results, isLoading, error, query }: SearchResultsProps) {
  const [showQuery, setShowQuery] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-pulse text-gray-400">Searching...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 p-4">
        Error: {error}
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="text-gray-400 p-4">
        No results found
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowQuery(!showQuery)}
          className="inline-flex items-center gap-1 text-gray-400 hover:text-white text-sm"
        >
          {showQuery ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          {showQuery ? 'Hide query' : 'Show query'}
        </button>
        {showQuery && (
          <span className="text-gray-400 text-sm">"{query}"</span>
        )}
      </div>
      
      {results.map((result, index) => (
        <div key={index} className="bg-[#2A2B32] p-4 rounded-lg">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-white font-semibold mb-2">{result.title}</h3>
              <p className="text-gray-300 text-sm mb-2">{result.content}</p>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-gray-400">{result.source}</span>
                {result.published_date && (
                  <span className="text-gray-400">{new Date(result.published_date).toLocaleDateString()}</span>
                )}
              </div>
            </div>
            <a
              href={result.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 flex items-center gap-1"
            >
              <ExternalLink size={16} />
            </a>
          </div>
        </div>
      ))}
    </div>
  );
}
