import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, Edit } from 'lucide-react';
import StoryEditor from './StoryEditor';

const BreakingNewsStories = ({ stories = [], onStoryClick, onClose }) => {
  const [selectedStory, setSelectedStory] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showStoryEditor, setShowStoryEditor] = useState(false);
  const intervalRef = useRef(null);

  const STORY_DURATION = 5000; // 5 seconds per story
  const PROGRESS_UPDATE_INTERVAL = 50; // Update progress every 50ms

  useEffect(() => {
    if (isModalOpen && isPlaying && selectedStory) {
      intervalRef.current = setInterval(() => {
        setProgress((prev) => {
          const newProgress =
            prev + (PROGRESS_UPDATE_INTERVAL / STORY_DURATION) * 100;
          if (newProgress >= 100) {
            handleNextStory();
            return 0;
          }
          return newProgress;
        });
      }, PROGRESS_UPDATE_INTERVAL);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isModalOpen, isPlaying, selectedStory]);

  const handleStoryClick = (story, index) => {
    setSelectedStory(story);
    setCurrentStoryIndex(index);
    setIsModalOpen(true);
    setProgress(0);
    setIsPlaying(true);
  };

  const handleCreateStory = () => {
    setShowStoryEditor(true);
  };

  const handleSaveStory = (storyData) => {
    // Here you would typically save to backend
    console.log('Saving story:', storyData);
    // For now, just close the editor
    setShowStoryEditor(false);
  };

  const handleNextStory = () => {
    if (currentStoryIndex < stories.length - 1) {
      setCurrentStoryIndex(currentStoryIndex + 1);
      setSelectedStory(stories[currentStoryIndex + 1]);
    } else {
      handleCloseModal();
    }
    setProgress(0);
  };

  const handlePrevStory = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(currentStoryIndex - 1);
      setSelectedStory(stories[currentStoryIndex - 1]);
    }
    setProgress(0);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedStory(null);
    setIsPlaying(false);
    setProgress(0);
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  const handleResume = () => {
    setIsPlaying(true);
  };

  if (stories.length === 0) {
    return null;
  }

  return (
    <>
      {/* Instagram Stories Style Carousel */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 py-4 px-6">
        <div className="flex items-center gap-4 overflow-x-auto">
          {/* Add Story Button */}
          <div className="flex-shrink-0 flex flex-col items-center">
            <div className="relative">
              <div
                className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                onClick={handleCreateStory}
              >
                <Plus className="w-6 h-6 text-gray-600 dark:text-gray-400" />
              </div>
            </div>
            <span className="text-xs text-gray-600 dark:text-gray-400 mt-1 text-center">
              Add Story
            </span>
          </div>

          {/* Story Circles */}
          {stories.map((story, index) => (
            <div
              key={story._id}
              className="flex-shrink-0 flex flex-col items-center"
            >
              <div className="relative">
                {/* Story Circle with Gradient Border */}
                <div
                  className="w-16 h-16 rounded-full p-0.5 cursor-pointer hover:scale-105 transition-transform"
                  style={{
                    background: `linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1, #96ceb4, #feca57, #ff9ff3)`,
                  }}
                  onClick={() => handleStoryClick(story, index)}
                >
                  <div className="w-full h-full rounded-full bg-white dark:bg-gray-800 flex items-center justify-center overflow-hidden">
                    {story.image?.url ? (
                      <img
                        src={story.image.url}
                        alt={story.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
                        <span className="text-white font-bold text-lg">
                          {story.title.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* LIVE Badge for active stories */}
                {story.isActive && new Date(story.expiresAt) > new Date() && (
                  <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
                    <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                      LIVE
                    </span>
                  </div>
                )}
              </div>

              {/* Story Title */}
              <span className="text-xs text-gray-600 dark:text-gray-400 mt-1 text-center max-w-16 truncate">
                {story.title.length > 12
                  ? `${story.title.substring(0, 12)}...`
                  : story.title}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Story Modal - Clean Instagram Style */}
      {isModalOpen && selectedStory && (
        <div className="fixed inset-0 bg-gray-700/20 flex items-center justify-center z-50">
          <div className="relative w-full h-full max-w-sm mx-auto">
            {/* Progress Bar */}
            <div className="absolute top-4 left-4 right-4 z-10">
              <div className="flex gap-1">
                {stories.map((_, index) => (
                  <div
                    key={index}
                    className="flex-1 h-1 bg-white bg-opacity-30 rounded-full overflow-hidden"
                  >
                    <div
                      className={`h-full transition-all duration-75 ${
                        index === currentStoryIndex
                          ? 'bg-white'
                          : index < currentStoryIndex
                          ? 'bg-white'
                          : 'bg-transparent'
                      }`}
                      style={{
                        width:
                          index === currentStoryIndex
                            ? `${progress}%`
                            : index < currentStoryIndex
                            ? '100%'
                            : '0%',
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={handleCloseModal}
              className="absolute top-4 right-4 z-10 text-white hover:text-gray-300 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Story Content - Clean View */}
            <div className="w-full h-full flex flex-col">
              {/* Story Image/Video */}
              <div className="flex-1 relative">
                {selectedStory.image?.url ? (
                  <img
                    src={selectedStory.image.url}
                    alt={selectedStory.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
                    <span className="text-white font-bold text-6xl">
                      {selectedStory.title.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}

                {/* Navigation Areas */}
                <div
                  className="absolute left-0 top-0 w-1/3 h-full cursor-pointer"
                  onClick={handlePrevStory}
                />
                <div
                  className="absolute right-0 top-0 w-1/3 h-full cursor-pointer"
                  onClick={handleNextStory}
                />

                {/* Pause/Resume on Hover */}
                <div
                  className="absolute inset-0 flex items-center justify-center"
                  onMouseEnter={handlePause}
                  onMouseLeave={handleResume}
                >
                  {!isPlaying && (
                    <div className="bg-black bg-opacity-50 rounded-full p-4">
                      <div className="w-8 h-8 border-l-4 border-white border-l-4 border-t-0 border-b-0 border-r-0 ml-1" />
                    </div>
                  )}
                </div>
              </div>

              {/* Minimal Story Info */}
              <div className="absolute bottom-4 left-4 right-4">
                <div className="bg-black bg-opacity-50 text-white p-3 rounded-lg">
                  <h3 className="font-bold text-lg mb-1">
                    {selectedStory.title}
                  </h3>
                  <p className="text-sm opacity-90">{selectedStory.excerpt}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Story Editor Modal */}
      <StoryEditor
        isOpen={showStoryEditor}
        onClose={() => setShowStoryEditor(false)}
        onSave={handleSaveStory}
      />
    </>
  );
};

export default BreakingNewsStories;
