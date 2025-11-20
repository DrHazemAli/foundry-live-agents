import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Search, Volume2 } from 'lucide-react';
import type { Voice } from '../types';
import { voices } from '../data/voices';

interface VoiceSelectorProps {
  selectedVoice?: Voice;
  onSelectVoice: (voice: Voice) => void;
  disabled?: boolean;
}

export const VoiceSelector: React.FC<VoiceSelectorProps> = ({
  selectedVoice,
  onSelectVoice,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredVoices = voices.filter(voice =>
    voice.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    voice.locale.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (voice: Voice) => {
    onSelectVoice(voice);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-white dark:bg-[#1a1a1a] border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-[#252525] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <div className="flex items-center gap-3">
          <Volume2 size={18} className="text-gray-500 dark:text-gray-400" />
          <div className="text-left">
            <div className="font-medium text-gray-900 dark:text-white">
              {selectedVoice?.name || 'Select Voice'}
            </div>
            {selectedVoice && (
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {selectedVoice.locale} • {selectedVoice.gender}
              </div>
            )}
          </div>
        </div>
        <ChevronDown
          size={20}
          className={`text-gray-500 dark:text-gray-400 transition-transform ${
            isOpen ? 'transform rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 w-full bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-700 rounded-lg shadow-2xl max-h-96 overflow-hidden">
          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
            <div className="relative">
              <Search
                size={18}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="Search voices..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                autoFocus
              />
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {filteredVoices.length === 0 ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                No voices found
              </div>
            ) : (
              filteredVoices.map((voice) => (
                <button
                  key={voice.id}
                  onClick={() => handleSelect(voice)}
                  className={`w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-[#252525] transition-colors ${
                    selectedVoice?.id === voice.id ? 'bg-blue-50 dark:bg-blue-900/30' : ''
                  }`}
                >
                  <div className="flex-1 text-left">
                    <div className="font-medium text-gray-900 dark:text-white">
                      {voice.name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {voice.locale} • {voice.gender} • {voice.category}
                    </div>
                  </div>
                  {selectedVoice?.id === voice.id && (
                    <Check size={18} className="text-blue-600 dark:text-blue-400 ml-2" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
