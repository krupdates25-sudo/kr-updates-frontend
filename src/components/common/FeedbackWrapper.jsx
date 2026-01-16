import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import FeedbackButton from './FeedbackButton';
import FeedbackModal from './FeedbackModal';

const FeedbackWrapper = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const location = useLocation();

  // Hide feedback button on auth pages
  const shouldShow = !['/auth', '/verify-email', '/verify-email-success'].includes(
    location.pathname
  );

  useEffect(() => {
    const handleOpenModal = () => {
      setIsModalOpen(true);
    };

    window.addEventListener('openFeedbackModal', handleOpenModal);
    return () => {
      window.removeEventListener('openFeedbackModal', handleOpenModal);
    };
  }, []);

  if (!shouldShow) return null;

  return (
    <>
      <FeedbackButton />
      <FeedbackModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
};

export default FeedbackWrapper;

