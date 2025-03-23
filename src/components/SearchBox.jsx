import React, { useState, useEffect, useRef } from 'react';
import { InputGroup, Form, Button } from 'react-bootstrap';
import { Search, XCircle } from 'react-bootstrap-icons';

/**
 * Reusable search box with debounce functionality
 */
function SearchBox({ 
  value, 
  onChange, 
  placeholder = 'Suchen...', 
  debounceTime = 300,
  onFocus,
  onBlur,
  className = '' // Add className prop support
}) {
  const [localValue, setLocalValue] = useState(value || '');
  const debounceTimer = useRef(null);

  // Handle value changes from parent
  useEffect(() => {
    setLocalValue(value || '');
  }, [value]);

  // Handle local changes with debounce
  const handleChange = (e) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    
    debounceTimer.current = setTimeout(() => {
      onChange(e);
    }, debounceTime);
  };

  // Clear search
  const handleClear = () => {
    setLocalValue('');
    const event = { target: { value: '' } };
    onChange(event);
  };

  return (
    <div className={`search-container ${className}`}>
      <div className="search-box">
        <InputGroup>
          <InputGroup.Text className="search-icon">
            <Search />
          </InputGroup.Text>
          <Form.Control
            type="text"
            placeholder={placeholder}
            value={localValue}
            onChange={handleChange}
            className="search-input"
            onFocus={onFocus}
            onBlur={onBlur}
          />
          {localValue && (
            <Button 
              className="clear-search" 
              onClick={handleClear}
              aria-label="Clear search"
            >
              <XCircle />
            </Button>
          )}
        </InputGroup>
      </div>
    </div>
  );
}

export default React.memo(SearchBox);
