import React, { useState, useMemo } from 'react';
import { Search, Heart, Play, Filter } from 'lucide-react';
import type { Voice } from '../types';
import { voices } from '../data/voices';

interface VoiceGalleryProps {
  onSelectVoice: (voice: Voice) => void;
  selectedVoice?: Voice;
}

export const VoiceGallery: React.FC<VoiceGalleryProps> = ({ onSelectVoice, selectedVoice }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedGender, setSelectedGender] = useState<string>('All');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const categories = ['All', 'OpenAI', 'Azure Standard', 'Azure HD', 'Custom'];
  const genders = ['All', 'Male', 'Female', 'Neutral'];

  const filteredVoices = useMemo(() => {
    return voices.filter(voice => {
      const matchesSearch = voice.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          voice.locale.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          voice.description?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = selectedCategory === 'All' || voice.category === selectedCategory;
      const matchesGender = selectedGender === 'All' || voice.gender === selectedGender;

      return matchesSearch && matchesCategory && matchesGender;
    });
  }, [searchQuery, selectedCategory, selectedGender]);

  const toggleFavorite = (voiceId: string) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(voiceId)) {
        newFavorites.delete(voiceId);
      } else {
        newFavorites.add(voiceId);
      }
      return newFavorites;
    });
  };

  return (
    <div className="voice-gallery">
      {/* Header */}
      <div className="gallery-header mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Voice Gallery</h2>
        <p className="text-gray-600 dark:text-gray-400">Choose from 600+ professional voices</p>
      </div>

      {/* Search and Filters */}
      <div className="search-filters space-y-4 mb-6">
        <div className="search-bar relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by name, language, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="filters flex gap-4">
          <div className="filter-group flex-1">
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white rounded-lg"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="filter-group flex-1">
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Gender</label>
            <select
              value={selectedGender}
              onChange={(e) => setSelectedGender(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white rounded-lg"
            >
              {genders.map(gender => (
                <option key={gender} value={gender}>{gender}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="results-count text-sm text-gray-600 dark:text-gray-400 mb-4">
        Showing {filteredVoices.length} voice{filteredVoices.length !== 1 ? 's' : ''}
      </div>

      {/* Voice Grid */}
      <div className="voice-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredVoices.map(voice => (
          <div
            key={voice.id}
            className={`voice-card p-4 border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1a1a1a] rounded-lg cursor-pointer transition-all hover:shadow-md ${
              selectedVoice?.id === voice.id ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/30' : ''
            }`}
            onClick={() => onSelectVoice(voice)}
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-semibold text-lg text-gray-900 dark:text-white">{voice.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{voice.locale}</p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFavorite(voice.id);
                }}
                className="p-1 hover:bg-gray-100 dark:hover:bg-[#252525] rounded"
              >
                <Heart
                  size={18}
                  className={favorites.has(voice.id) ? 'fill-red-500 text-red-500' : 'text-gray-400'}
                />
              </button>
            </div>

            <div className="flex gap-2 mb-2">
              <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">{voice.gender}</span>
              <span className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded">{voice.category}</span>
            </div>

            {voice.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{voice.description}</p>
            )}

            <div className="flex gap-2">
              <button
                className="flex-1 flex items-center justify-center gap-1 px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                onClick={(e) => {
                  e.stopPropagation();
                  // Preview functionality would go here
                  console.log('Preview voice:', voice.id);
                }}
              >
                <Play size={14} />
                Preview
              </button>
              <button
                className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-50 dark:hover:bg-[#252525]"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectVoice(voice);
                }}
              >
                Select
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredVoices.length === 0 && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <Filter size={48} className="mx-auto mb-4 opacity-50" />
          <p>No voices found matching your criteria</p>
        </div>
      )}
    </div>
  );
};
