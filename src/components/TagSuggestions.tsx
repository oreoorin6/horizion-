import React, { useRef, useEffect, useState } from 'react';

interface TagSuggestion {
  id: number;
  name: string;
  post_count: number;
  category: number;
}

interface TagSuggestionsProps {
  suggestions: TagSuggestion[];
  onSelect: (tag: string) => void;
  loading: boolean;
  onClickOutside: () => void;
  inputRef?: React.RefObject<HTMLInputElement>;
}

const TagSuggestions: React.FC<TagSuggestionsProps> = ({ 
  suggestions, 
  onSelect, 
  loading, 
  onClickOutside,
  inputRef
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  // Reset selected index when suggestions change
  useEffect(() => {
    setSelectedIndex(-1);
  }, [suggestions]);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClickOutside();
      }
    };
    
    const handleKeyDown = (event: KeyboardEvent) => {
      // If no suggestions, don't handle keyboard navigation
      if (suggestions.length === 0) return;
      
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          setSelectedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev));
          break;
        case 'ArrowUp':
          event.preventDefault();
          setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
          break;
        case 'Tab':
          // Use Tab to autocomplete with highlighted suggestion
          if (selectedIndex >= 0) {
            event.preventDefault();
            onSelect(suggestions[selectedIndex].name);
          }
          break;
        case 'Enter':
          // Close dropdown when Enter is pressed
          if (selectedIndex >= 0) {
            event.preventDefault();
            onSelect(suggestions[selectedIndex].name);
          } else {
            onClickOutside();
          }
          break;
        case 'Escape':
          event.preventDefault();
          onClickOutside();
          break;
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClickOutside, suggestions, selectedIndex, onSelect]);
  
  if (loading) {
    return (
      <div ref={dropdownRef} className="absolute top-full left-0 right-0 mt-2 bg-background border border-border rounded-md shadow-lg z-50 p-4">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div ref={dropdownRef} className="absolute top-full left-0 right-0 mt-2 bg-background border border-border rounded-md shadow-lg z-50">
      <ul>
        {suggestions.map((suggestion, index) => (
          <li
            key={suggestion.id}
            className={`px-4 py-2 cursor-pointer ${index === selectedIndex ? 'bg-primary/20 border-l-2 border-primary' : 'hover:bg-muted'}`}
            onClick={() => onSelect(suggestion.name)}
            onMouseEnter={() => setSelectedIndex(index)}
          >
            <div className="flex justify-between">
              <span className={`
                ${suggestion.category === 0 ? 'text-pink-400' : ''}
                ${suggestion.category === 1 ? 'text-green-400' : ''}
                ${suggestion.category === 3 ? 'text-yellow-400' : ''}
                ${suggestion.category === 4 ? 'text-blue-400' : ''}
                ${suggestion.category === 5 ? 'text-orange-400' : ''}
                ${suggestion.category === 6 ? 'text-purple-400' : ''}
                ${suggestion.category === 7 ? 'text-red-400' : ''}
              `}>
                {suggestion.name}
              </span>
              <span className="text-muted-foreground">{suggestion.post_count.toLocaleString()}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TagSuggestions;