import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, Heart, Shuffle, Repeat, MoreHorizontal } from 'lucide-react';
import musicData from '../db/db.json'; // Your actual import

const Home = () => {
  const [songs, setSongs] = useState(musicData.items);
  const [currentSong, setCurrentSong] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [favorites, setFavorites] = useState([]);
  const [isShuffled, setIsShuffled] = useState(false);
  const [repeatMode, setRepeatMode] = useState(0); // 0: no repeat, 1: repeat all, 2: repeat one
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('home'); // home, library, favorites

  const audioRef = useRef(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => {
      if (repeatMode === 2) {
        audio.currentTime = 0;
        audio.play();
      } else if (repeatMode === 1 || currentSong < songs.length - 1) {
        nextSong();
      } else {
        setIsPlaying(false);
      }
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [currentSong, repeatMode, songs.length]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const togglePlayPause = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const nextSong = () => {
    if (isShuffled) {
      const randomIndex = Math.floor(Math.random() * songs.length);
      setCurrentSong(randomIndex);
    } else {
      setCurrentSong((prev) => (prev + 1) % songs.length);
    }
    setIsPlaying(true);
  };

  const prevSong = () => {
    setCurrentSong((prev) => (prev - 1 + songs.length) % songs.length);
    setIsPlaying(true);
  };

  const handleProgressClick = (e) => {
    const progressBar = e.currentTarget;
    const clickX = e.nativeEvent.offsetX;
    const width = progressBar.offsetWidth;
    const newTime = (clickX / width) * duration;
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (time) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleVolumeChange = (e) => {
    const newVolume = e.target.value;
    setVolume(newVolume);
  };

  const selectSong = (index) => {
    setCurrentSong(index);
    setIsPlaying(true);
  };

  const toggleRepeat = () => {
    setRepeatMode((prev) => (prev + 1) % 3);
  };

  const toggleFavorite = (songId) => {
    setFavorites((prev) =>
      prev.includes(songId)
        ? prev.filter((id) => id !== songId)
        : [...prev, songId]
    );
  };

  // Filtering songs based on activeTab and searchTerm
  const filteredSongs = songs.filter((song) => {
    // Tab filtering
    if (activeTab === 'favorites' && !favorites.includes(song.id)) {
      return false;
    }
    if (activeTab === 'home') {
      return true;
    }
    if (activeTab === 'library') {
      return true;
    }
    return true;
  }).filter((song) => {
    // Search filtering
    const term = searchTerm.toLowerCase();
    return (
      song.title.toLowerCase().includes(term) ||
      song.singer.toLowerCase().includes(term) ||
      song.genre.toLowerCase().includes(term)
    );
  });

  const currentSongData = songs[currentSong];

  return (
    <div className="min-h-screen bg-black text-white flex">
      {/* Sidebar */}
      <div className="w-64 bg-black border-r border-blue-900 flex flex-col">
        <div className="p-6 border-b border-blue-900">
          <h1 className="text-white font-bold text-2xl mb-6">Music Player</h1>
          <nav className="flex flex-col space-y-4">
            {['home', 'library', 'favorites'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`text-left px-4 py-2 rounded hover:bg-blue-900 transition-colors ${
                  activeTab === tab ? 'bg-blue-900 text-blue-400 font-semibold' : ''
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header with Search */}
        <div className="p-4 border-b border-blue-900 flex justify-between items-center bg-black">
          <h2 className="text-xl font-semibold text-white">
            {activeTab === 'favorites' ? 'Your Favorites' : activeTab === 'library' ? 'Your Library' : 'Discover Music'}
          </h2>
          <input
            type="text"
            placeholder="Search songs..."
            className="w-80 p-2 rounded bg-blue-950 border border-blue-700 placeholder-blue-400 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Song Cards Grid */}
        <div className="flex-1 overflow-y-auto bg-black p-6">
          {filteredSongs.length === 0 && (
            <div className="text-center mt-20">
              <p className="text-blue-400 text-lg">No songs found.</p>
              <p className="text-blue-300 text-sm mt-2">Try adjusting your search or browse different categories.</p>
            </div>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {filteredSongs.map((song, index) => {
              const originalIndex = songs.findIndex((s) => s.id === song.id);
              const isCurrent = currentSong === originalIndex;
              const isFavorite = favorites.includes(song.id);
              return (
                <div
                  key={song.id}
                  className={`group bg-gray-900 rounded-lg p-4 cursor-pointer transition-all duration-300 hover:bg-gray-800 hover:scale-105 ${
                    isCurrent ? 'ring-2 ring-blue-500 bg-blue-900 bg-opacity-30' : ''
                  }`}
                  onClick={() => selectSong(originalIndex)}
                >
                  <div className="relative mb-4">
                    <img
                      src={song.imgUrl}
                      alt={song.title}
                      className="w-full aspect-square rounded-lg object-cover shadow-lg"
                     
                    />
                    
                    {/* Play Button Overlay */}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 rounded-lg transition-all duration-200 flex items-center justify-center">
                      <button
                        className={`w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center transform scale-0 group-hover:scale-100 transition-transform duration-200 hover:bg-blue-400 shadow-lg ${
                          isCurrent && isPlaying ? 'scale-100 bg-blue-400' : ''
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isCurrent) {
                            togglePlayPause();
                          } else {
                            selectSong(originalIndex);
                          }
                        }}
                      >
                        {isCurrent && isPlaying ? (
                          <Pause size={20} className="text-black" />
                        ) : (
                          <Play size={20} className="text-black ml-0.5" />
                        )}
                      </button>
                    </div>
                    
                    {/* Heart Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(song.id);
                      }}
                      className={`absolute top-2 right-2 p-2 rounded-full bg-black bg-opacity-50 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-opacity-70 ${
                        isFavorite ? 'opacity-100' : ''
                      }`}
                      aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                    >
                      <Heart
                        size={16}
                        fill={isFavorite ? '#60a5fa' : 'none'}
                        stroke={isFavorite ? '#60a5fa' : 'white'}
                        className="transition-colors duration-200"
                      />
                    </button>

                    {/* Current Playing Indicator */}
                    {isCurrent && isPlaying && (
                      <div className="absolute bottom-2 left-2 flex space-x-1">
                        <div className="w-1 h-3 bg-blue-400 rounded-full animate-pulse"></div>
                        <div className="w-1 h-4 bg-blue-400 rounded-full animate-pulse" style={{animationDelay: '0.1s'}}></div>
                        <div className="w-1 h-2 bg-blue-400 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                        <div className="w-1 h-3 bg-blue-400 rounded-full animate-pulse" style={{animationDelay: '0.3s'}}></div>
                      </div>
                    )}
                  </div>
                  
                  {/* Song Info */}
                  <div className="space-y-1">
                    <h3 className={`font-semibold text-sm truncate ${isCurrent ? 'text-blue-400' : 'text-white'} group-hover:text-blue-300 transition-colors`}>
                      {song.title}
                    </h3>
                    <p className="text-blue-300 text-xs truncate hover:text-blue-200 transition-colors">
                      {song.singer}
                    </p>
                    <p className="text-blue-400 text-xs opacity-70">
                      {song.genre}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Player */}
        <div className="bg-gray-900 border-t border-blue-800 p-4 flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
          {/* Now Playing Info */}
          <div className="flex items-center space-x-4 w-full md:w-1/3 min-w-0">
            <img
              src={currentSongData.imgUrl}
              alt={currentSongData.title}
              className="w-16 h-16 rounded object-cover ring-1 ring-blue-500 ring-opacity-50"
              onError={(e) => {
                e.target.src = 'https://via.placeholder.com/56x56/1e40af/60a5fa?text=♪';
              }}
            />
            <div className="min-w-0">
              <p className="text-white font-semibold truncate">
                {currentSongData.title}
              </p>
              <p className="text-blue-300 text-sm truncate hover:underline cursor-pointer hover:text-blue-200">
                {currentSongData.singer}
              </p>
            </div>
            <button
              onClick={() => toggleFavorite(currentSongData.id)}
              className={`p-1 hover:bg-blue-800 rounded transition-colors ${
                favorites.includes(currentSongData.id) ? 'text-blue-400' : 'text-blue-300'
              }`}
            >
              <Heart
                size={16}
                fill={favorites.includes(currentSongData.id) ? 'currentColor' : 'none'}
                stroke={favorites.includes(currentSongData.id) ? 'none' : 'currentColor'}
              />
            </button>
          </div>

          {/* Player Controls */}
          <div className="flex items-center space-x-4 w-full md:w-1/3 justify-center">
            <button
              onClick={() => setIsShuffled(!isShuffled)}
              className={`p-2 rounded-full transition-colors ${
                isShuffled ? 'text-blue-400' : 'text-blue-300 hover:text-white'
              }`}
              aria-label="Shuffle"
            >
              <Shuffle size={16} />
            </button>

            <button
              onClick={prevSong}
              className="p-2 text-blue-300 hover:text-white transition-colors"
              aria-label="Previous"
            >
              <SkipBack size={20} />
            </button>

            <button
              onClick={togglePlayPause}
              className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center hover:scale-105 transition-transform hover:bg-blue-400 shadow-md shadow-blue-500/50"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <Pause size={16} className="text-black" />
              ) : (
                <Play size={16} className="text-black ml-0.5" />
              )}
            </button>

            <button
              onClick={nextSong}
              className="p-2 text-blue-300 hover:text-white transition-colors"
              aria-label="Next"
            >
              <SkipForward size={20} />
            </button>

            <button
              onClick={toggleRepeat}
              className={`p-2 rounded-full transition-colors relative ${
                repeatMode > 0
                  ? 'text-blue-400'
                  : 'text-blue-300 hover:text-white'
              }`}
              aria-label="Repeat mode"
            >
              <Repeat size={16} />
              {repeatMode === 2 && (
                <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-blue-400 rounded-full"></span>
              )}
            </button>
          </div>

          {/* Progress Bar + Volume */}
          <div className="flex items-center space-x-4 w-full md:w-1/3 justify-end">
            <span className="text-xs text-blue-300 w-10 text-right">
              {formatTime(currentTime)}
            </span>
            <div
              className="flex-1 h-1 bg-blue-900 rounded-full cursor-pointer group"
              onClick={handleProgressClick}
              aria-label="Progress bar"
              role="slider"
              aria-valuemin={0}
              aria-valuemax={duration}
              aria-valuenow={currentTime}
            >
              <div
                className="h-1 bg-blue-400 rounded-full relative group-hover:bg-blue-300 transition-colors"
                style={{ width: `${(currentTime / duration) * 100 || 0}%` }}
              >
                <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-blue-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm shadow-blue-400/50"></div>
              </div>
            </div>
            <span className="text-xs text-blue-300 w-10">
              {formatTime(duration)}
            </span>
            <Volume2 size={16} className="text-blue-300" />
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={handleVolumeChange}
              className="w-24 h-1 bg-blue-900 rounded-full group cursor-pointer"
              aria-label="Volume control"
            />
          </div>
        </div>

        {/* Audio Element */}
        <audio
          ref={audioRef}
          src={currentSongData.songUrl}
          onLoadedData={() => isPlaying && audioRef.current.play()}
        />
      </div>
    </div>
  );
};

export default Home;