import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Search } from 'lucide-react';
import type { AgentScenario } from '../types';
import { agentScenarios } from '../data/agentScenarios';

interface AgentSelectorProps {
  selectedAgent?: AgentScenario;
  onSelectAgent: (agent: AgentScenario) => void;
  disabled?: boolean;
}

export const AgentSelector: React.FC<AgentSelectorProps> = ({
  selectedAgent,
  onSelectAgent,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredAgents = agentScenarios.filter(agent =>
    agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    agent.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    agent.category.toLowerCase().includes(searchQuery.toLowerCase())
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

  const handleSelect = (agent: AgentScenario) => {
    onSelectAgent(agent);
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
          <div className="text-2xl">{selectedAgent?.icon || '🤖'}</div>
          <div className="text-left">
            <div className="font-medium text-gray-900 dark:text-white">
              {selectedAgent?.name || 'Select Agent'}
            </div>
            {selectedAgent && (
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {selectedAgent.category}
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
                placeholder="Search agents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                autoFocus
              />
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {filteredAgents.length === 0 ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                No agents found
              </div>
            ) : (
              filteredAgents.map((agent) => (
                <button
                  key={agent.id}
                  onClick={() => handleSelect(agent)}
                  className={`w-full flex items-start gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-[#252525] transition-colors ${
                    selectedAgent?.id === agent.id ? 'bg-blue-50 dark:bg-blue-900/30' : ''
                  }`}
                >
                  <div className="text-2xl mt-0.5">{agent.icon}</div>
                  <div className="flex-1 text-left">
                    <div className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                      {agent.name}
                      {selectedAgent?.id === agent.id && (
                        <Check size={16} className="text-blue-600 dark:text-blue-400" />
                      )}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {agent.description}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                        {agent.category}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {agent.languages.length} language{agent.languages.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
