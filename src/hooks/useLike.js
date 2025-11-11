import { useState, useCallback } from 'react';
import confetti from 'canvas-confetti';
import postService from '../services/postService';
import { useAuth } from '../contexts/AuthContext';

const useLike = (postId, initialLiked = false, initialCount = 0) => {
  const [isLiked, setIsLiked] = useState(initialLiked);
  const [likeCount, setLikeCount] = useState(initialCount);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const triggerConfetti = useCallback(() => {
    // Create a heart-themed confetti burst
    const colors = ['#ff6b6b', '#ee5a52', '#ff8787', '#faa2c1', '#ff6b9d'];

    // Main burst
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: colors,
      shapes: ['circle'],
      scalar: 0.8,
      gravity: 0.6,
      drift: 0,
      ticks: 200,
    });

    // Side bursts for more dynamic effect
    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.6 },
        colors: colors,
      });
    }, 200);

    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.6 },
        colors: colors,
      });
    }, 400);
  }, []);

  const handleLike = useCallback(
    async (event) => {
      if (event) {
        event.preventDefault();
        event.stopPropagation();
      }

      if (!user) {
        // Show a notification or redirect to login
        alert('Please log in to like posts');
        return;
      }

      if (isLoading) return;

      setIsLoading(true);

      try {
        const response = await postService.toggleLike(postId);

        if (response.success) {
          const wasLiked = isLiked;
          setIsLiked(response.data.liked);
          setLikeCount(response.data.likeCount);

          // Trigger confetti only when liking (not unliking)
          if (!wasLiked && response.data.liked) {
            triggerConfetti();
          }
        }
      } catch (error) {
        console.error('Error toggling like:', error);
        // Optionally show error toast/notification
      } finally {
        setIsLoading(false);
      }
    },
    [postId, isLiked, isLoading, user, triggerConfetti]
  );

  return {
    isLiked,
    likeCount,
    setLikeCount,
    isLoading,
    handleLike,
  };
};

export default useLike;
