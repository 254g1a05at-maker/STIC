import React, { useEffect } from 'react';

// Website & Announcements section has been permanently removed per user specification.
export default function WebsiteView({ setView }) {
  useEffect(() => {
    if (setView) setView('dashboard');
  }, [setView]);

  return null;
}
