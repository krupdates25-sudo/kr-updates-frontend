import { useState } from 'react';
import {
  Upload,
  X,
  Image as ImageIcon,
  Video,
  AlertCircle,
} from 'lucide-react';

const CloudinaryUpload = ({
  onUpload,
  currentImage,
  onRemove,
  type = 'image',
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  // Cloudinary configuration
  const cloudName = 'dj7rtkqaf'; // Your cloud name
  const uploadPreset = 'omtours'; // Using default preset as fallback

  const isVideo = type === 'video';

  const openCloudinaryWidget = () => {
    setIsUploading(true);
    setUploadError('');

    // Check if Cloudinary is available
    if (!window.cloudinary) {
      setUploadError(
        'Cloudinary is not loaded. Please refresh the page and try again.'
      );
      setIsUploading(false);
      return;
    }

    // Create Cloudinary upload widget
    const widget = window.cloudinary.createUploadWidget(
      {
        cloudName,
        uploadPreset,
        sources: ['local', 'url', 'camera'],
        multiple: false,
        resourceType: isVideo ? 'video' : 'image',
        clientAllowedFormats: isVideo
          ? ['mp4', 'mov', 'wmv', 'flv', 'avi', 'webm']
          : ['jpg', 'jpeg', 'png', 'gif', 'webp'],
        maxFileSize: isVideo ? 100000000 : 10000000, // 100MB for video, 10MB for image
        maxImageWidth: isVideo ? undefined : 2000,
        maxImageHeight: isVideo ? undefined : 2000,
        cropping: false, // Disable cropping to avoid preset issues
        showSkipCropButton: true,
        styles: {
          palette: {
            window: '#FFFFFF',
            windowBorder: '#90A0B3',
            tabIcon: '#5755FE',
            menuIcons: '#5A616A',
            textDark: '#000000',
            textLight: '#FFFFFF',
            link: '#5755FE',
            action: '#5755FE',
            inactiveTabIcon: '#0E2F5A',
            error: '#F44235',
            inProgress: '#5755FE',
            complete: '#20B832',
            sourceBg: '#E4EBF1',
          },
        },
      },
      (error, result) => {
        setIsUploading(false);

        if (error) {
          console.error('Cloudinary upload error:', error);
          if (error.message && error.message.includes('preset')) {
            setUploadError(
              'Upload preset not configured. Please use the URL upload option below.'
            );
          } else {
            setUploadError(
              'Error uploading image. Please try the URL upload option.'
            );
          }
          return;
        }

        if (result && result.event === 'success') {
          const mediaUrl = result.info.secure_url;
          const mediaData = {
            url: mediaUrl,
            ...(isVideo &&
              result.info.video && {
                thumbnail: result.info.video.thumbnail_url || mediaUrl,
                duration: result.info.video.duration || 0,
              }),
          };
          onUpload(isVideo ? mediaData : mediaUrl);
          setUploadError('');
        }
      }
    );

    widget.open();
  };

  const handleUrlUpload = () => {
    const url = prompt(`Enter ${isVideo ? 'video' : 'image'} URL:`);
    if (url && url.trim()) {
      // Basic URL validation
      const imagePattern = /\.(jpeg|jpg|gif|png|webp)$/i;
      const videoPattern = /\.(mp4|mov|wmv|flv|avi|webm)$/i;

      if (
        (isVideo &&
          (videoPattern.test(url) ||
            url.includes('cloudinary.com') ||
            url.includes('youtube.com') ||
            url.includes('vimeo.com'))) ||
        (!isVideo &&
          (imagePattern.test(url) ||
            url.includes('cloudinary.com') ||
            url.includes('imgur.com') ||
            url.includes('unsplash.com')))
      ) {
        onUpload(isVideo ? { url: url.trim() } : url.trim());
        setUploadError('');
      } else {
        setUploadError(
          isVideo
            ? 'Please enter a valid video URL (mp4, mov, wmv, flv, avi, webm)'
            : 'Please enter a valid image URL (jpg, png, gif, webp)'
        );
      }
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (isVideo) {
      if (!file.type.startsWith('video/')) {
        setUploadError('Please select a video file');
        return;
      }
      // Validate file size (100MB for video)
      if (file.size > 100 * 1024 * 1024) {
        setUploadError('File size must be less than 100MB');
        return;
      }
    } else {
      if (!file.type.startsWith('image/')) {
        setUploadError('Please select an image file');
        return;
      }
      // Validate file size (10MB for image)
      if (file.size > 10 * 1024 * 1024) {
        setUploadError('File size must be less than 10MB');
        return;
      }
    }

    // Create a local URL for preview
    const reader = new FileReader();
    reader.onload = (e) => {
      if (isVideo) {
        onUpload({ url: e.target.result, thumbnail: e.target.result });
      } else {
        onUpload(e.target.result);
      }
      setUploadError('');
    };
    reader.readAsDataURL(file);
  };

  const getMediaUrl = () => {
    if (!currentImage) return null;
    if (typeof currentImage === 'string') return currentImage;
    return currentImage.url;
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-semibold text-gray-700 mb-4">
        {isVideo ? (
          <Video className="w-4 h-4 inline mr-2" />
        ) : (
          <ImageIcon className="w-4 h-4 inline mr-2" />
        )}
        {isVideo ? 'Featured Video' : 'Featured Image'}
      </label>

      {uploadError && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}

      {currentImage ? (
        <div className="relative group">
          {isVideo ? (
            <div className="relative">
              <video
                src={getMediaUrl()}
                className="w-full h-40 object-cover rounded-xl transition-all duration-200"
                controls={false}
                muted
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-xl flex items-center justify-center">
                <button
                  onClick={onRemove}
                  className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                  title="Remove video"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                <Video className="w-3 h-3 inline mr-1" />
                Video
              </div>
            </div>
          ) : (
            <div className="relative">
              <img
                src={getMediaUrl()}
                alt="Featured media"
                className="w-full h-40 object-cover rounded-xl transition-all duration-200"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-xl flex items-center justify-center">
                <button
                  onClick={onRemove}
                  className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                  title="Remove image"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {/* File Upload */}
          <div className="w-full">
            <input
              type="file"
              accept={isVideo ? 'video/*' : 'image/*'}
              onChange={handleFileUpload}
              className="hidden"
              id={`file-upload-${type}`}
            />
            <label
              htmlFor={`file-upload-${type}`}
              className="w-full h-32 border-2 border-dashed border-purple-300 rounded-xl cursor-pointer hover:border-purple-400 hover:bg-purple-50/50 transition-all duration-200 flex flex-col items-center justify-center text-gray-600"
            >
              {isVideo ? (
                <Video className="w-6 h-6 mb-2" />
              ) : (
                <Upload className="w-6 h-6 mb-2" />
              )}
              <span className="text-sm font-medium">Upload from Device</span>
              <span className="text-xs text-gray-500 mt-1">
                Click to select {isVideo ? 'video' : 'image'} file
              </span>
            </label>
          </div>

          {/* Cloudinary Upload (as backup) */}
          <button
            onClick={openCloudinaryWidget}
            disabled={isUploading}
            className="w-full py-2 px-4 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? 'Uploading...' : 'Upload via Cloudinary'}
          </button>

          {/* URL Input Alternative */}
          <div className="text-center">
            <span className="text-xs text-gray-400">or</span>
          </div>

          <button
            onClick={handleUrlUpload}
            className="w-full py-2 px-4 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Add {isVideo ? 'Video' : 'Image'} URL
          </button>
        </div>
      )}
    </div>
  );
};

export default CloudinaryUpload;
