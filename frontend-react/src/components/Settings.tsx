import { Settings as SettingsIcon } from 'lucide-react';

export function Settings() {
  return (
    <div className="tab-pane">
      <div className="pane-header">
        <h2>App Settings</h2>
        <p>Configure your preferences and system parameters.</p>
      </div>

      <div className="placeholder-tab card">
        <SettingsIcon size={48} className="upload-icon" style={{ opacity: 0.2 }} />
        <h3>Coming Soon</h3>
        <p>Settings and configurations are currently under development.</p>
      </div>
    </div>
  );
}
