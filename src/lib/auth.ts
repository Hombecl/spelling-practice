import { getSupabase, isSupabaseConfigured } from './supabase';
import { UserProgress, getProgress } from './progress';

// Simple hash function for PIN (client-side)
// In production, you might want to use a more secure hashing
async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin + 'spelling-practice-salt');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Verify PIN against hash
async function verifyPin(pin: string, hash: string): Promise<boolean> {
  const inputHash = await hashPin(pin);
  return inputHash === hash;
}

// Auth result types
export interface AuthResult {
  success: boolean;
  error?: string;
  user?: AuthUser;
}

export interface AuthUser {
  id: string;
  displayName: string;
  createdAt: string;
}

// Session storage key
const SESSION_KEY = 'spelling_practice_session';

// Get current session from localStorage
export function getCurrentSession(): AuthUser | null {
  if (typeof window === 'undefined') return null;

  try {
    const session = localStorage.getItem(SESSION_KEY);
    if (session) {
      return JSON.parse(session);
    }
  } catch {
    // Invalid session data
  }
  return null;
}

// Save session to localStorage
function saveSession(user: AuthUser): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

// Clear session
export function logout(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(SESSION_KEY);
}

// Register a new user
export async function register(
  displayName: string,
  pin: string
): Promise<AuthResult> {
  // Validate inputs
  if (!displayName || displayName.trim().length < 2) {
    return { success: false, error: '名字最少要2個字' };
  }

  if (!pin || pin.length < 4 || pin.length > 6 || !/^\d+$/.test(pin)) {
    return { success: false, error: 'PIN 碼要 4-6 位數字' };
  }

  const supabase = getSupabase();

  if (!supabase) {
    return { success: false, error: '雲端儲存未設定' };
  }

  try {
    // Check if display name already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .ilike('display_name', displayName.trim())
      .single();

    if (existingUser) {
      return { success: false, error: '呢個名已經有人用咗' };
    }

    // Hash the PIN
    const pinHash = await hashPin(pin);

    // Create user
    const { data: newUser, error } = await supabase
      .from('users')
      .insert({
        display_name: displayName.trim(),
        pin_hash: pinHash,
      })
      .select()
      .single();

    if (error) {
      console.error('Registration error:', error);
      return { success: false, error: '註冊失敗，請再試' };
    }

    const user: AuthUser = {
      id: newUser.id,
      displayName: newUser.display_name,
      createdAt: newUser.created_at,
    };

    // Save session
    saveSession(user);

    // Create default progress in cloud
    await saveProgressToCloud(user.id, getProgress());

    return { success: true, user };
  } catch (err) {
    console.error('Registration error:', err);
    return { success: false, error: '網絡錯誤，請再試' };
  }
}

// Login with display name and PIN
export async function login(
  displayName: string,
  pin: string
): Promise<AuthResult> {
  if (!displayName || !pin) {
    return { success: false, error: '請輸入名字同 PIN 碼' };
  }

  const supabase = getSupabase();

  if (!supabase) {
    return { success: false, error: '雲端儲存未設定' };
  }

  try {
    // Find user by display name
    const { data: dbUser, error } = await supabase
      .from('users')
      .select('*')
      .ilike('display_name', displayName.trim())
      .single();

    if (error || !dbUser) {
      return { success: false, error: '搵唔到呢個用戶' };
    }

    // Verify PIN
    const pinValid = await verifyPin(pin, dbUser.pin_hash);
    if (!pinValid) {
      return { success: false, error: 'PIN 碼唔啱' };
    }

    // Update last login time
    await supabase
      .from('users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', dbUser.id);

    const user: AuthUser = {
      id: dbUser.id,
      displayName: dbUser.display_name,
      createdAt: dbUser.created_at,
    };

    // Save session
    saveSession(user);

    return { success: true, user };
  } catch (err) {
    console.error('Login error:', err);
    return { success: false, error: '網絡錯誤，請再試' };
  }
}

// Save progress to cloud
export async function saveProgressToCloud(
  userId: string,
  progress: UserProgress
): Promise<boolean> {
  const supabase = getSupabase();

  if (!supabase) {
    return false;
  }

  try {
    // Upsert progress (insert or update)
    const { error } = await supabase
      .from('user_progress')
      .upsert(
        {
          user_id: userId,
          progress_data: progress,
        },
        {
          onConflict: 'user_id',
        }
      );

    if (error) {
      console.error('Save progress error:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Save progress error:', err);
    return false;
  }
}

// Load progress from cloud
export async function loadProgressFromCloud(
  userId: string
): Promise<UserProgress | null> {
  const supabase = getSupabase();

  if (!supabase) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('user_progress')
      .select('progress_data')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      return null;
    }

    return data.progress_data as UserProgress;
  } catch (err) {
    console.error('Load progress error:', err);
    return null;
  }
}

// Check if a display name is available
export async function checkDisplayNameAvailable(
  displayName: string
): Promise<boolean> {
  const supabase = getSupabase();

  if (!supabase) {
    return true; // If no cloud, always available
  }

  try {
    const { data } = await supabase
      .from('users')
      .select('id')
      .ilike('display_name', displayName.trim())
      .single();

    return !data;
  } catch {
    return true;
  }
}
