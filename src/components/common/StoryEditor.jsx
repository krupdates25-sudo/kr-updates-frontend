import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Smile,
  Link,
  Image,
  Video,
  Type,
  Palette,
  Sticker,
  Download,
  Send,
  RotateCcw,
  RotateCw,
  Move,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';

const StoryEditor = ({ isOpen, onClose, onSave, initialStory = null }) => {
  const [storyData, setStoryData] = useState({
    image: initialStory?.image || null,
    video: initialStory?.video || null,
    caption: initialStory?.caption || '',
    text: initialStory?.text || '',
    stickers: initialStory?.stickers || [],
    links: initialStory?.links || [],
    background: initialStory?.background || '#000000',
    textColor: initialStory?.textColor || '#ffffff',
    textSize: initialStory?.textSize || 24,
    textStyle: initialStory?.textStyle || 'normal',
  });

  const [activeTool, setActiveTool] = useState('text');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showGifModal, setShowGifModal] = useState(false);
  const [newLink, setNewLink] = useState({ url: '', title: '' });
  const [newText, setNewText] = useState('');
  const [textPosition, setTextPosition] = useState({ x: 50, y: 50 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  // Emoji categories
  const emojiCategories = {
    recent: ['😀', '😂', '❤️', '👍', '🔥', '💯', '✨', '🎉'],
    smileys: [
      '😀',
      '😃',
      '😄',
      '😁',
      '😆',
      '😅',
      '😂',
      '🤣',
      '😊',
      '😇',
      '🙂',
      '🙃',
      '😉',
      '😌',
      '😍',
      '🥰',
      '😘',
      '😗',
      '😙',
      '😚',
      '😋',
      '😛',
      '😝',
      '😜',
      '🤪',
      '🤨',
      '🧐',
      '🤓',
      '😎',
      '🤩',
      '🥳',
    ],
    hearts: [
      '❤️',
      '🧡',
      '💛',
      '💚',
      '💙',
      '💜',
      '🖤',
      '🤍',
      '🤎',
      '💔',
      '❣️',
      '💕',
      '💞',
      '💓',
      '💗',
      '💖',
      '💘',
      '💝',
      '💟',
    ],
    gestures: [
      '👍',
      '👎',
      '👌',
      '✌️',
      '🤞',
      '🤟',
      '🤘',
      '🤙',
      '👈',
      '👉',
      '👆',
      '🖕',
      '👇',
      '☝️',
      '👋',
      '🤚',
      '🖐️',
      '✋',
      '🖖',
      '👏',
      '🙌',
      '👐',
      '🤲',
      '🤝',
      '🙏',
    ],
    objects: [
      '📱',
      '💻',
      '⌨️',
      '🖥️',
      '🖨️',
      '🖱️',
      '🖲️',
      '💽',
      '💾',
      '💿',
      '📀',
      '📼',
      '📷',
      '📸',
      '📹',
      '🎥',
      '📽️',
      '🎞️',
      '📞',
      '☎️',
      '📟',
      '📠',
      '📺',
      '📻',
      '🎙️',
      '🎚️',
      '🎛️',
      '🧭',
      '⏱️',
      '⏲️',
      '⏰',
      '🕰️',
      '⌛',
      '⏳',
      '📡',
    ],
  };

  // Sticker categories
  const stickerCategories = {
    reactions: ['🔥', '💯', '✨', '🎉', '👏', '🙌', '💪', '🤘', '👍', '❤️'],
    objects: ['📱', '💻', '🎮', '📷', '📹', '🎥', '📺', '📻', '🎙️', '🎵'],
    nature: ['🌞', '🌙', '⭐', '🌟', '💫', '🌈', '☀️', '🌤️', '⛅', '🌦️'],
    food: ['🍕', '🍔', '🍟', '🌭', '🥪', '🌮', '🌯', '🥙', '🥗', '🍝'],
    travel: ['✈️', '🚀', '🚁', '🚂', '🚗', '🚌', '🚎', '🏎️', '🚓', '🚑'],
  };

  // GIF categories (mock data - in real app, you'd fetch from Giphy API)
  const gifCategories = {
    trending: ['trending1.gif', 'trending2.gif', 'trending3.gif'],
    reactions: ['reaction1.gif', 'reaction2.gif', 'reaction3.gif'],
    animals: ['animal1.gif', 'animal2.gif', 'animal3.gif'],
    funny: ['funny1.gif', 'funny2.gif', 'funny3.gif'],
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setStoryData((prev) => ({
          ...prev,
          image: e.target.result,
          video: null,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVideoUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setStoryData((prev) => ({
          ...prev,
          video: e.target.result,
          image: null,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const addEmoji = (emoji) => {
    setStoryData((prev) => ({
      ...prev,
      stickers: [
        ...prev.stickers,
        { type: 'emoji', content: emoji, x: 50, y: 50, size: 24 },
      ],
    }));
    setShowEmojiPicker(false);
  };

  const addSticker = (sticker) => {
    setStoryData((prev) => ({
      ...prev,
      stickers: [
        ...prev.stickers,
        { type: 'sticker', content: sticker, x: 50, y: 50, size: 32 },
      ],
    }));
    setShowStickerPicker(false);
  };

  const addGif = (gif) => {
    setStoryData((prev) => ({
      ...prev,
      stickers: [
        ...prev.stickers,
        { type: 'gif', content: gif, x: 50, y: 50, size: 64 },
      ],
    }));
    setShowGifModal(false);
  };

  const addLink = () => {
    if (newLink.url && newLink.title) {
      setStoryData((prev) => ({
        ...prev,
        links: [...prev.links, { ...newLink, x: 50, y: 50 }],
      }));
      setNewLink({ url: '', title: '' });
      setShowLinkModal(false);
    }
  };

  const addText = () => {
    if (newText.trim()) {
      setStoryData((prev) => ({
        ...prev,
        stickers: [
          ...prev.stickers,
          {
            type: 'text',
            content: newText,
            x: textPosition.x,
            y: textPosition.y,
            size: storyData.textSize,
            color: storyData.textColor,
            style: storyData.textStyle,
          },
        ],
      }));
      setNewText('');
    }
  };

  const handleStickerDrag = (index, e) => {
    if (!isDragging) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setStoryData((prev) => ({
      ...prev,
      stickers: prev.stickers.map((sticker, i) =>
        i === index
          ? {
              ...sticker,
              x: Math.max(0, Math.min(100, x)),
              y: Math.max(0, Math.min(100, y)),
            }
          : sticker
      ),
    }));
  };

  const startDrag = (index, e) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const endDrag = () => {
    setIsDragging(false);
  };

  const removeSticker = (index) => {
    setStoryData((prev) => ({
      ...prev,
      stickers: prev.stickers.filter((_, i) => i !== index),
    }));
  };

  const removeLink = (index) => {
    setStoryData((prev) => ({
      ...prev,
      links: prev.links.filter((_, i) => i !== index),
    }));
  };

  const handleSave = () => {
    onSave(storyData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-700/20 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Create Story
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex h-[600px]">
          {/* Canvas Area */}
          <div className="flex-1 relative bg-gray-100 dark:bg-gray-900">
            <div
              ref={canvasRef}
              className="w-full h-full relative overflow-hidden"
              style={{ backgroundColor: storyData.background }}
            >
              {/* Background Image/Video */}
              {storyData.image && (
                <img
                  src={storyData.image}
                  alt="Story background"
                  className="w-full h-full object-cover"
                />
              )}
              {storyData.video && (
                <video
                  src={storyData.video}
                  className="w-full h-full object-cover"
                  autoPlay
                  loop
                  muted
                />
              )}

              {/* Stickers */}
              {storyData.stickers.map((sticker, index) => (
                <div
                  key={index}
                  className="absolute cursor-move select-none"
                  style={{
                    left: `${sticker.x}%`,
                    top: `${sticker.y}%`,
                    fontSize: `${sticker.size}px`,
                    color: sticker.color || storyData.textColor,
                    fontWeight: sticker.style || 'normal',
                  }}
                  draggable
                  onDragStart={(e) => startDrag(index, e)}
                  onDrag={(e) => handleStickerDrag(index, e)}
                  onDragEnd={endDrag}
                  onDoubleClick={() => removeSticker(index)}
                >
                  {sticker.type === 'emoji' || sticker.type === 'sticker' ? (
                    <span style={{ fontSize: `${sticker.size}px` }}>
                      {sticker.content}
                    </span>
                  ) : (
                    <span>{sticker.content}</span>
                  )}
                </div>
              ))}

              {/* Links */}
              {storyData.links.map((link, index) => (
                <div
                  key={index}
                  className="absolute cursor-pointer"
                  style={{
                    left: `${link.x}%`,
                    top: `${link.y}%`,
                  }}
                  onDoubleClick={() => removeLink(index)}
                >
                  <div className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm">
                    🔗 {link.title}
                  </div>
                </div>
              ))}

              {/* Caption */}
              {storyData.caption && (
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="bg-black bg-opacity-50 text-white p-3 rounded-lg">
                    {storyData.caption}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Tools Panel */}
          <div className="w-80 border-l border-gray-200 dark:border-gray-700 p-4 overflow-y-auto">
            {/* Tool Selection */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setActiveTool('media')}
                className={`p-2 rounded ${
                  activeTool === 'media'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700'
                }`}
              >
                <Image className="w-5 h-5" />
              </button>
              <button
                onClick={() => setActiveTool('text')}
                className={`p-2 rounded ${
                  activeTool === 'text'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700'
                }`}
              >
                <Type className="w-5 h-5" />
              </button>
              <button
                onClick={() => setActiveTool('sticker')}
                className={`p-2 rounded ${
                  activeTool === 'sticker'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700'
                }`}
              >
                <Sticker className="w-5 h-5" />
              </button>
              <button
                onClick={() => setActiveTool('link')}
                className={`p-2 rounded ${
                  activeTool === 'link'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700'
                }`}
              >
                <Link className="w-5 h-5" />
              </button>
            </div>

            {/* Media Upload */}
            {activeTool === 'media' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Upload Image
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                  >
                    <Image className="w-5 h-5" />
                    Choose Image
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Upload Video
                  </label>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleVideoUpload}
                    className="hidden"
                    id="video-upload"
                  />
                  <label
                    htmlFor="video-upload"
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 cursor-pointer"
                  >
                    <Video className="w-5 h-5" />
                    Choose Video
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Background Color
                  </label>
                  <div className="flex gap-2">
                    {[
                      '#000000',
                      '#ffffff',
                      '#ff6b6b',
                      '#4ecdc4',
                      '#45b7d1',
                      '#96ceb4',
                      '#feca57',
                      '#ff9ff3',
                    ].map((color) => (
                      <button
                        key={color}
                        onClick={() =>
                          setStoryData((prev) => ({
                            ...prev,
                            background: color,
                          }))
                        }
                        className="w-8 h-8 rounded-full border-2 border-gray-300"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Text Tool */}
            {activeTool === 'text' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Add Text
                  </label>
                  <textarea
                    value={newText}
                    onChange={(e) => setNewText(e.target.value)}
                    placeholder="Enter your text..."
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg resize-none"
                    rows="3"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Text Color
                    </label>
                    <input
                      type="color"
                      value={storyData.textColor}
                      onChange={(e) =>
                        setStoryData((prev) => ({
                          ...prev,
                          textColor: e.target.value,
                        }))
                      }
                      className="w-full h-10 border border-gray-300 dark:border-gray-600 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Text Size
                    </label>
                    <input
                      type="range"
                      min="12"
                      max="72"
                      value={storyData.textSize}
                      onChange={(e) =>
                        setStoryData((prev) => ({
                          ...prev,
                          textSize: parseInt(e.target.value),
                        }))
                      }
                      className="w-full"
                    />
                    <span className="text-xs text-gray-500">
                      {storyData.textSize}px
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Text Style
                  </label>
                  <select
                    value={storyData.textStyle}
                    onChange={(e) =>
                      setStoryData((prev) => ({
                        ...prev,
                        textStyle: e.target.value,
                      }))
                    }
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded"
                  >
                    <option value="normal">Normal</option>
                    <option value="bold">Bold</option>
                    <option value="italic">Italic</option>
                    <option value="bold italic">Bold Italic</option>
                  </select>
                </div>

                <button
                  onClick={addText}
                  className="w-full p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  Add Text
                </button>
              </div>
            )}

            {/* Sticker Tool */}
            {activeTool === 'sticker' && (
              <div className="space-y-4">
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="flex-1 p-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 flex items-center gap-2"
                  >
                    <Smile className="w-4 h-4" />
                    Emojis
                  </button>
                  <button
                    onClick={() => setShowStickerPicker(!showStickerPicker)}
                    className="flex-1 p-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 flex items-center gap-2"
                  >
                    <Sticker className="w-4 h-4" />
                    Stickers
                  </button>
                </div>

                {showEmojiPicker && (
                  <div className="space-y-2">
                    {Object.entries(emojiCategories).map(
                      ([category, emojis]) => (
                        <div key={category}>
                          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize mb-1">
                            {category}
                          </h4>
                          <div className="flex flex-wrap gap-1">
                            {emojis.map((emoji, index) => (
                              <button
                                key={index}
                                onClick={() => addEmoji(emoji)}
                                className="text-lg hover:bg-gray-200 dark:hover:bg-gray-700 p-1 rounded"
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                )}

                {showStickerPicker && (
                  <div className="space-y-2">
                    {Object.entries(stickerCategories).map(
                      ([category, stickers]) => (
                        <div key={category}>
                          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize mb-1">
                            {category}
                          </h4>
                          <div className="flex flex-wrap gap-1">
                            {stickers.map((sticker, index) => (
                              <button
                                key={index}
                                onClick={() => addSticker(sticker)}
                                className="text-lg hover:bg-gray-200 dark:hover:bg-gray-700 p-1 rounded"
                              >
                                {sticker}
                              </button>
                            ))}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Link Tool */}
            {activeTool === 'link' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Add Link
                  </label>
                  <input
                    type="url"
                    value={newLink.url}
                    onChange={(e) =>
                      setNewLink((prev) => ({ ...prev, url: e.target.value }))
                    }
                    placeholder="Enter URL..."
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg mb-2"
                  />
                  <input
                    type="text"
                    value={newLink.title}
                    onChange={(e) =>
                      setNewLink((prev) => ({ ...prev, title: e.target.value }))
                    }
                    placeholder="Link title..."
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg mb-2"
                  />
                  <button
                    onClick={addLink}
                    className="w-full p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  >
                    Add Link
                  </button>
                </div>

                {storyData.links.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Added Links
                    </h4>
                    {storyData.links.map((link, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-gray-100 dark:bg-gray-700 rounded mb-1"
                      >
                        <span className="text-sm">{link.title}</span>
                        <button
                          onClick={() => removeLink(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Caption */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Story Caption
              </label>
              <textarea
                value={storyData.caption}
                onChange={(e) =>
                  setStoryData((prev) => ({ ...prev, caption: e.target.value }))
                }
                placeholder="Add a caption..."
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg resize-none"
                rows="3"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
          >
            Cancel
          </button>
          <div className="flex gap-2">
            <button
              onClick={() =>
                setStoryData({
                  image: null,
                  video: null,
                  caption: '',
                  text: '',
                  stickers: [],
                  links: [],
                  background: '#000000',
                  textColor: '#ffffff',
                  textSize: 24,
                  textStyle: 'normal',
                })
              }
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              Clear All
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Save Story
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoryEditor;
