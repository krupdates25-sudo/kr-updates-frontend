import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import FontFamily from '@tiptap/extension-font-family';
import TextAlign from '@tiptap/extension-text-align';
import Blockquote from '@tiptap/extension-blockquote';
import { useState, useEffect } from 'react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Quote,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Image as ImageIcon,
  Link as LinkIcon,
  Table as TableIcon,
  Type,
  Palette,
  Heading1,
  Heading2,
  Heading3,
  Undo,
  Redo,
  Plus,
  Minus,
  MoreHorizontal,
  Send,
  X,
  Sparkles,
} from 'lucide-react';
import aiService from '../../services/aiService';

const RichTextEditor = ({ content, onChange, placeholder }) => {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showFontPicker, setShowFontPicker] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [showAiPrompt, setShowAiPrompt] = useState(false);
  const [aiPromptPosition, setAiPromptPosition] = useState({ x: 0, y: 0 });
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [showImageLinkDialog, setShowImageLinkDialog] = useState(false);
  const [imageLinkUrl, setImageLinkUrl] = useState('');
  const [showAdDialog, setShowAdDialog] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'rounded-lg max-w-full h-auto object-cover',
          style: 'max-height: 400px; min-height: 200px;',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-purple-600 underline hover:text-purple-800',
        },
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'border-collapse border border-gray-300 w-full my-4',
        },
      }),
      TableRow.configure({
        HTMLAttributes: {
          class: 'border border-gray-300',
        },
      }),
      TableHeader.configure({
        HTMLAttributes: {
          class: 'border border-gray-300 bg-gray-50 p-2 font-semibold',
        },
      }),
      TableCell.configure({
        HTMLAttributes: {
          class: 'border border-gray-300 p-2',
        },
      }),
      TextStyle,
      Color,
      FontFamily.configure({
        types: ['textStyle'],
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Blockquote.configure({
        HTMLAttributes: {
          class: 'border-l-4 border-purple-500 pl-4 italic text-gray-700 my-4',
        },
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    onSelectionUpdate: ({ editor }) => {
      const { from, to } = editor.state.selection;
      const text = editor.state.doc.textBetween(from, to);

      if (text.trim().length > 0) {
        setSelectedText(text);
        // Get selection coordinates for AI prompt positioning
        const coords = editor.view.coordsAtPos(from);
        setAiPromptPosition({
          x: coords.left,
          y: coords.top - 80, // Position above selection
        });
        setShowAiPrompt(true);
        setAiPrompt(''); // Clear previous prompt
      } else {
        setSelectedText('');
        setShowAiPrompt(false);
        setAiPrompt('');
      }
    },
    editorProps: {
      attributes: {
        class: 'prose prose-lg max-w-none focus:outline-none min-h-[400px] p-6',
        style: 'font-family: "Inter", "Noto Sans Devanagari", sans-serif;',
      },
    },
  });

  // Close AI prompt when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showAiPrompt && !event.target.closest('.ai-prompt-box')) {
        setShowAiPrompt(false);
        setAiPrompt('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showAiPrompt]);

  if (!editor) {
    return null;
  }

  // AI Function to process selected text with custom prompt
  const processSelectedText = async () => {
    if (!selectedText.trim() || !aiPrompt.trim()) return;

    setAiLoading(true);
    try {
      const result = await aiService.processTextWithPrompt(
        selectedText,
        aiPrompt
      );
      if (result.success) {
        // Replace selected text with AI processed version
        const { from, to } = editor.state.selection;
        editor
          .chain()
          .focus()
          .deleteRange({ from, to })
          .insertContent(result.content)
          .run();
        setShowAiPrompt(false);
        setAiPrompt('');
      }
    } catch (error) {
      console.error('Error processing text:', error);
    } finally {
      setAiLoading(false);
    }
  };

  // Handle Enter key in prompt input
  const handlePromptKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      processSelectedText();
    }
  };

  // Quick prompt suggestions
  const quickPrompts = [
    'Improve this text',
    'Convert to Hindi',
    'Convert to English',
    'Make it more formal',
    'Make it more casual',
    'Fix grammar',
    'Make it shorter',
    'Make it more detailed',
    'Translate to Spanish',
    'Simplify this',
  ];

  const addImage = () => {
    const url = window.prompt('Enter image URL:');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  const addLink = () => {
    if (linkUrl) {
      editor.chain().focus().setLink({ href: linkUrl }).run();
      setLinkUrl('');
      setShowLinkDialog(false);
    }
  };

  const removeLink = () => {
    editor.chain().focus().unsetLink().run();
  };

  const addTable = () => {
    editor
      .chain()
      .focus()
      .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
      .run();
  };

  const addImageWithLink = () => {
    const imageUrl = window.prompt('Enter image URL:');
    if (imageUrl) {
      setImageLinkUrl('');
      setShowImageLinkDialog(true);
      // Store the image URL temporarily
      window.tempImageUrl = imageUrl;
    }
  };

  const insertImageWithLink = () => {
    if (imageLinkUrl && window.tempImageUrl) {
      const imageHtml = `<a href="${imageLinkUrl}" target="_blank" rel="noopener noreferrer"><img src="${window.tempImageUrl}" alt="Linked Image" class="rounded-lg max-w-full h-auto object-cover" style="max-height: 400px; min-height: 200px;" /></a>`;
      editor.chain().focus().insertContent(imageHtml).run();
      setImageLinkUrl('');
      setShowImageLinkDialog(false);
      window.tempImageUrl = null;
    }
  };

  const insertAd = () => {
    const adHtml = `
      <div class="ad-container my-8 p-4 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg text-center">
        <p class="text-gray-600 text-sm mb-2">Advertisement Space</p>
        <div class="bg-white p-4 rounded border">
          <p class="text-xs text-gray-500">Ad content will be inserted here</p>
        </div>
      </div>
    `;
    editor.chain().focus().insertContent(adHtml).run();
    setShowAdDialog(false);
  };

  const colors = [
    '#000000',
    '#374151',
    '#6B7280',
    '#9CA3AF',
    '#EF4444',
    '#F97316',
    '#F59E0B',
    '#EAB308',
    '#84CC16',
    '#22C55E',
    '#10B981',
    '#14B8A6',
    '#06B6D4',
    '#0EA5E9',
    '#3B82F6',
    '#6366F1',
    '#8B5CF6',
    '#A855F7',
    '#D946EF',
    '#EC4899',
  ];

  const fonts = [
    { name: 'Inter', value: 'Inter, sans-serif' },
    { name: 'Noto Sans Devanagari', value: 'Noto Sans Devanagari, sans-serif' },
    { name: 'Roboto', value: 'Roboto, sans-serif' },
    { name: 'Open Sans', value: 'Open Sans, sans-serif' },
    { name: 'Lato', value: 'Lato, sans-serif' },
    { name: 'Montserrat', value: 'Montserrat, sans-serif' },
    { name: 'Poppins', value: 'Poppins, sans-serif' },
    { name: 'Playfair Display', value: 'Playfair Display, serif' },
    { name: 'Merriweather', value: 'Merriweather, serif' },
  ];

  const ToolbarButton = ({ onClick, isActive, children, title }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`p-2 rounded-lg transition-all duration-200 hover:bg-gray-100 ${
        isActive ? 'bg-purple-100 text-purple-600' : 'text-gray-600'
      }`}
    >
      {children}
    </button>
  );

  const ToolbarDivider = () => (
    <div className="w-px h-6 bg-gray-300 mx-1"></div>
  );

  return (
    <div className="border-0 rounded-lg overflow-hidden relative">
      {/* AI Prompt Box for Selected Text */}
      {showAiPrompt && selectedText && (
        <div
          className="ai-prompt-box fixed z-50 bg-white border border-gray-200 rounded-lg shadow-xl p-4 min-w-[400px]"
          style={{
            left: aiPromptPosition.x,
            top: aiPromptPosition.y,
            transform: 'translateX(-50%)',
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-purple-500" />
            <span className="text-sm font-medium text-gray-700">
              AI Assistant - Selected: "{selectedText.substring(0, 50)}
              {selectedText.length > 50 ? '...' : ''}"
            </span>
            <button
              onClick={() => {
                setShowAiPrompt(false);
                setAiPrompt('');
              }}
              className="ml-auto p-1 hover:bg-gray-100 rounded"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          {/* Prompt Input */}
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              onKeyPress={handlePromptKeyPress}
              placeholder="Type your instruction (e.g., 'convert to Hindi', 'improve this', 'make it formal')"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
              disabled={aiLoading}
            />
            <button
              onClick={processSelectedText}
              disabled={aiLoading || !aiPrompt.trim()}
              className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {aiLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Processing...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Apply
                </>
              )}
            </button>
          </div>

          {/* Quick Prompt Suggestions */}
          <div className="space-y-2">
            <div className="text-xs text-gray-500 mb-2">Quick suggestions:</div>
            <div className="flex flex-wrap gap-1">
              {quickPrompts.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => setAiPrompt(prompt)}
                  className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors"
                  disabled={aiLoading}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="bg-gray-50 border-b border-gray-200 p-3 flex flex-wrap items-center gap-1">
        {/* Undo/Redo */}
        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          title="Undo"
        >
          <Undo className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          title="Redo"
        >
          <Redo className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarDivider />

        {/* Headings */}
        <ToolbarButton
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
          isActive={editor.isActive('heading', { level: 1 })}
          title="Heading 1"
        >
          <Heading1 className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          isActive={editor.isActive('heading', { level: 2 })}
          title="Heading 2"
        >
          <Heading2 className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
          isActive={editor.isActive('heading', { level: 3 })}
          title="Heading 3"
        >
          <Heading3 className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarDivider />

        {/* Text Formatting */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive('bold')}
          title="Bold"
        >
          <Bold className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive('italic')}
          title="Italic"
        >
          <Italic className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          isActive={editor.isActive('strike')}
          title="Strikethrough"
        >
          <Strikethrough className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCode().run()}
          isActive={editor.isActive('code')}
          title="Code"
        >
          <Code className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarDivider />

        {/* Font Family */}
        <div className="relative">
          <ToolbarButton
            onClick={() => setShowFontPicker(!showFontPicker)}
            title="Font Family"
          >
            <Type className="w-4 h-4" />
          </ToolbarButton>
          {showFontPicker && (
            <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[200px]">
              <div className="p-2 space-y-1">
                {fonts.map((font) => (
                  <button
                    key={font.value}
                    type="button"
                    onClick={() => {
                      editor.chain().focus().setFontFamily(font.value).run();
                      setShowFontPicker(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded hover:bg-gray-100 transition-colors"
                    style={{ fontFamily: font.value }}
                  >
                    {font.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Text Color */}
        <div className="relative">
          <ToolbarButton
            onClick={() => setShowColorPicker(!showColorPicker)}
            title="Text Color"
          >
            <Palette className="w-4 h-4" />
          </ToolbarButton>
          {showColorPicker && (
            <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10 p-3">
              <div className="grid grid-cols-5 gap-2">
                {colors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => {
                      editor.chain().focus().setColor(color).run();
                      setShowColorPicker(false);
                    }}
                    className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={() => {
                  editor.chain().focus().unsetColor().run();
                  setShowColorPicker(false);
                }}
                className="w-full mt-2 px-3 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200 transition-colors"
              >
                Remove Color
              </button>
            </div>
          )}
        </div>

        <ToolbarDivider />

        {/* Text Alignment */}
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          isActive={editor.isActive({ textAlign: 'left' })}
          title="Align Left"
        >
          <AlignLeft className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          isActive={editor.isActive({ textAlign: 'center' })}
          title="Align Center"
        >
          <AlignCenter className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          isActive={editor.isActive({ textAlign: 'right' })}
          title="Align Right"
        >
          <AlignRight className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('justify').run()}
          isActive={editor.isActive({ textAlign: 'justify' })}
          title="Justify"
        >
          <AlignJustify className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarDivider />

        {/* Lists */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive('bulletList')}
          title="Bullet List"
        >
          <List className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive('orderedList')}
          title="Numbered List"
        >
          <ListOrdered className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarDivider />

        {/* Quote */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive('blockquote')}
          title="Quote"
        >
          <Quote className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarDivider />

        {/* Media */}
        <ToolbarButton onClick={addImage} title="Add Image">
          <ImageIcon className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={addImageWithLink} title="Add Image with Link">
          <LinkIcon className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={insertAd} title="Insert Advertisement">
          <Plus className="w-4 h-4" />
        </ToolbarButton>

        {/* Link */}
        <div className="relative">
          <ToolbarButton
            onClick={() => setShowLinkDialog(!showLinkDialog)}
            isActive={editor.isActive('link')}
            title="Add Link"
          >
            <LinkIcon className="w-4 h-4" />
          </ToolbarButton>
          {showLinkDialog && (
            <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10 p-3 min-w-[300px]">
              <div className="space-y-3">
                <input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="Enter URL..."
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={addLink}
                    className="px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
                  >
                    Add Link
                  </button>
                  <button
                    type="button"
                    onClick={removeLink}
                    className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                  >
                    Remove Link
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowLinkDialog(false)}
                    className="px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <ToolbarDivider />

        {/* Table */}
        <ToolbarButton onClick={addTable} title="Add Table">
          <TableIcon className="w-4 h-4" />
        </ToolbarButton>

        {/* Table Controls (show when table is active) */}
        {editor.isActive('table') && (
          <>
            <ToolbarButton
              onClick={() => editor.chain().focus().addRowBefore().run()}
              title="Add Row Before"
            >
              <Plus className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().addRowAfter().run()}
              title="Add Row After"
            >
              <Plus className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().deleteRow().run()}
              title="Delete Row"
            >
              <Minus className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().addColumnBefore().run()}
              title="Add Column Before"
            >
              <Plus className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().addColumnAfter().run()}
              title="Add Column After"
            >
              <Plus className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().deleteColumn().run()}
              title="Delete Column"
            >
              <Minus className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().deleteTable().run()}
              title="Delete Table"
            >
              <MoreHorizontal className="w-4 h-4" />
            </ToolbarButton>
          </>
        )}
      </div>

      {/* Editor Content */}
      <div className="bg-white min-h-[400px]">
        <EditorContent
          editor={editor}
          placeholder={placeholder}
          className="focus-within:outline-none"
        />
      </div>

      {/* Callout Helper */}
      <div className="bg-gray-50 border-t border-gray-200 p-3 text-sm text-gray-600">
        <div className="flex flex-wrap gap-4">
          <span>
            💡 <strong>Tip:</strong> Type in Hindi/English/Mixed languages
          </span>
          <span>
            🤖 <strong>AI:</strong> Select text and type custom prompts like
            "convert to Hindi", "improve this", "make formal"
          </span>
          <span>
            📝 <strong>Shortcuts:</strong> Ctrl+B (Bold), Ctrl+I (Italic)
          </span>
          <span>
            🔗 <strong>Links:</strong> Select text then click link button
          </span>
          <span>
            📊 <strong>Tables:</strong> Click table icon to insert
          </span>
        </div>
      </div>

      {/* Image with Link Dialog */}
      {showImageLinkDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Add Image with Link</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Link URL
                </label>
                <input
                  type="url"
                  value={imageLinkUrl}
                  onChange={(e) => setImageLinkUrl(e.target.value)}
                  placeholder="Enter the URL to link to..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={insertImageWithLink}
                  disabled={!imageLinkUrl.trim()}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Insert Image with Link
                </button>
                <button
                  onClick={() => {
                    setShowImageLinkDialog(false);
                    setImageLinkUrl('');
                    window.tempImageUrl = null;
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RichTextEditor;
