import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';

export const useAppUser = () => {
  const { user: clerkUser, isLoaded, isSignedIn } = useUser();
  const [appUser, setAppUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isLoaded && isSignedIn && clerkUser) {
      const fetchAppUser = async () => {
        try {
          const response = await fetch(
            `${import.meta.env.VITE_API_URL}/api/users/me?clerkId=${
              clerkUser.id
            }`
          );
          if (response.ok) {
            const data = await response.json();
            setAppUser(data);
          } else {
            console.warn("User exists in Clerk but not yet in the app database.");
            setAppUser({ role: 'attendee' });
          }
        } catch (error) {
          console.error("Failed to fetch app user profile:", error);
          setAppUser({ role: 'attendee' });
        } finally {
          setLoading(false);
        }
      };
      fetchAppUser();
    } else if (isLoaded) {
      setLoading(false);
      setAppUser(null);
    }
  }, [isLoaded, isSignedIn, clerkUser]);

  return { user: appUser, isLoading: loading };
};
