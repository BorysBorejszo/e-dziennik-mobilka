// User API functions

export type UserRecord = {
  id: number; // This is uczen_id (student record ID in uczniowie table)
  username: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  user_id?: number; // Django user ID - THIS is what messages API uses!
};

const API_BASE = 'http://dziennik.polandcentral.cloudapp.azure.com';
const ADMIN_KEY = '7KU2mc6ZxflGYE5QqjmZ7wcN0OI3rX1p';

const headers = {
  'ADMIN-KEY': ADMIN_KEY,
  'Content-Type': 'application/json',
};

// GET all users (uczniowie/students)
export const getAllUsers = async (): Promise<UserRecord[]> => {
  try {
    const response = await fetch(`${API_BASE}/api/uczniowie/`, { headers });
    if (!response.ok) {
      console.error('[users] Failed to fetch users:', response.status);
      return [];
    }
    const data = await response.json();
    console.log('[users] Fetched users:', data.length);
    if (data.length > 0) {
      console.log('[users] Sample user record:', data[0]);
    }
    return data;
  } catch (error) {
    console.error('[users] getAllUsers error:', error);
    return [];
  }
};

// Find user by username and return user_id (Django user ID for messages)
export const findUserByUsername = async (username: string): Promise<UserRecord | null> => {
  try {
    const users = await getAllUsers();
    console.log('[users] Searching for username:', username);
    console.log('[users] Total users to search:', users.length);
    
    const found = users.find(u => {
      const matches = u.username.toLowerCase() === username.toLowerCase();
      if (matches) {
        console.log('[users] MATCH! Full user record:', JSON.stringify(u, null, 2));
      }
      return matches;
    });
    
    if (found) {
      console.log('[users] Found user by username:', { 
        username, 
        uczen_id: found.id, 
        user_id: found.user_id,
        all_fields: Object.keys(found),
        IMPORTANT: 'For messages, use user_id NOT id!'
      });
    } else {
      console.log('[users] ❌ User NOT found:', username);
      console.log('[users] Available usernames (first 10):', users.slice(0, 10).map(u => u.username));
    }
    return found || null;
  } catch (error) {
    console.error('[users] findUserByUsername error:', error);
    return null;
  }
};
