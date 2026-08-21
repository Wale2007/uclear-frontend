import React from 'react';
import Settings from '../components/Settings';
import { useAuth } from '../context/AuthContext';
import { useDues } from '../context/DuesContext';

export default function SettingsPage() {
  const { user, updateUser } = useAuth();
  const { settings, setSettings } = useDues();

  return (
    <Settings
      user={user}
      onUpdateUser={updateUser}
      settings={settings}
      onUpdateSettings={setSettings}
    />
  );
}
