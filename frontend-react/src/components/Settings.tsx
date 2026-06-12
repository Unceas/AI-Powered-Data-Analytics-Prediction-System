import { useState, useEffect } from 'react';
import { Sliders, Shield, Palette, FileText, CheckCircle2, ChevronDown, ChevronRight } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import './Settings.css';

export function Settings() {
  const { theme, setTheme } = useTheme();
  
  // Accordion state
  const [expandedCategories, setExpandedCategories] = useState<{ [key: string]: boolean }>({
    appearance: false,
    analytics: false,
    insights: false,
    reports: false,
  });

  const toggleCategory = (key: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Appearance
  const [fontSize, setFontSizeState] = useState(() => localStorage.getItem('app-font-size') || 'standard');
  const [density, setDensityState] = useState(() => localStorage.getItem('app-density') || 'standard');
  
  // Analytics
  const [defaultModel, setDefaultModel] = useState(() => localStorage.getItem('settings-default-model') || 'randomforest');
  const [autoProcess, setAutoProcess] = useState(() => {
    const saved = localStorage.getItem('settings-auto-process');
    return saved !== null ? saved === 'true' : true;
  });
  const [confidenceThreshold, setConfidenceThreshold] = useState(() => {
    const saved = localStorage.getItem('settings-confidence-threshold');
    return saved !== null ? parseFloat(saved) : 0.85;
  });

  // AI Settings
  const [insightDetail, setInsightDetail] = useState(() => localStorage.getItem('settings-insight-detail') || 'detailed');
  const [recommendationDepth, setRecommendationDepth] = useState(() => localStorage.getItem('settings-recommendation-depth') || 'medium');

  // Report Settings
  const [reportFormat, setReportFormat] = useState(() => localStorage.getItem('settings-report-format') || 'pdf');
  const [includeBranding, setIncludeBranding] = useState(() => {
    const saved = localStorage.getItem('settings-include-branding');
    return saved !== null ? saved === 'true' : true;
  });

  const [saveSuccess, setSaveSuccess] = useState(false);

  // Apply Font Size and Density instantly
  const setFontSize = (size: string) => {
    setFontSizeState(size);
    document.documentElement.setAttribute('data-font-size', size);
    localStorage.setItem('app-font-size', size);
  };

  const setDensity = (dens: string) => {
    setDensityState(dens);
    document.documentElement.setAttribute('data-density', dens);
    localStorage.setItem('app-density', dens);
  };

  // Sync settings when loaded
  useEffect(() => {
    document.documentElement.setAttribute('data-font-size', fontSize);
    document.documentElement.setAttribute('data-density', density);
  }, [fontSize, density]);

  const handleSave = () => {
    localStorage.setItem('settings-default-model', defaultModel);
    localStorage.setItem('settings-auto-process', String(autoProcess));
    localStorage.setItem('settings-confidence-threshold', String(confidenceThreshold));
    localStorage.setItem('settings-insight-detail', insightDetail);
    localStorage.setItem('settings-recommendation-depth', recommendationDepth);
    localStorage.setItem('settings-report-format', reportFormat);
    localStorage.setItem('settings-include-branding', String(includeBranding));
    
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  return (
    <div className="tab-pane settings-tab-view animate-fade-in">
      <div className="pane-header">
        <h2>System Config</h2>
        <p>Manage execution models, telemetry visualizations, white-label branding, and local configurations.</p>
      </div>

      <div className="settings-scroll-container">
        {/* Category 1: Appearance */}
        <div className="settings-accordion-section">
          <div className="settings-accordion-header" onClick={() => toggleCategory('appearance')}>
            <div className="header-left">
              {expandedCategories.appearance ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
              <Palette size={18} className="text-accent" />
              <h3>Appearance & UI Preferences</h3>
            </div>
            <span className="section-desc">Theme, layout density, and typography scaling</span>
          </div>
          
          {expandedCategories.appearance && (
            <div className="settings-accordion-content animate-fade-in">
              <div className="form-group">
                <label className="form-label">Theme</label>
                <div className="theme-toggle-row">
                  <button 
                    className={`btn-toggle-option ${theme === 'dark' ? 'active' : ''}`}
                    onClick={() => setTheme('dark')}
                  >
                    Dark Mode
                  </button>
                  <button 
                    className={`btn-toggle-option ${theme === 'light' ? 'active' : ''}`}
                    onClick={() => setTheme('light')}
                  >
                    Light Mode
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Font Scaling</label>
                <select 
                  className="form-select"
                  value={fontSize}
                  onChange={(e) => setFontSize(e.target.value)}
                >
                  <option value="compact">Compact (Smaller UI fonts)</option>
                  <option value="standard">Standard (Default scaling)</option>
                  <option value="large">Spacious (Accessible text)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Grid Layout Density</label>
                <select 
                  className="form-select"
                  value={density}
                  onChange={(e) => setDensity(e.target.value)}
                >
                  <option value="high">High Density (Compact spacing)</option>
                  <option value="standard">Standard Density (Comfortable spacing)</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Category 2: Analytics */}
        <div className="settings-accordion-section">
          <div className="settings-accordion-header" onClick={() => toggleCategory('analytics')}>
            <div className="header-left">
              {expandedCategories.analytics ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
              <Sliders size={18} className="text-accent" />
              <h3>Analytics & Model Pipeline</h3>
            </div>
            <span className="section-desc">Default models, prediction thresholds, and pipelines</span>
          </div>

          {expandedCategories.analytics && (
            <div className="settings-accordion-content animate-fade-in">
              <div className="form-group">
                <label className="form-label">Default Predictive Model</label>
                <select 
                  className="form-select"
                  value={defaultModel}
                  onChange={(e) => setDefaultModel(e.target.value)}
                >
                  <option value="randomforest">Random Forest Classifier</option>
                  <option value="xgboost">XGBoost (Gradient Boosted Trees)</option>
                  <option value="logisticregression">Logistic Regression (Linear solver)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Confidence Threshold</label>
                <div className="slider-container">
                  <input 
                    type="range" 
                    min="0.50" 
                    max="0.99" 
                    step="0.01" 
                    className="slider"
                    value={confidenceThreshold}
                    onChange={(e) => setConfidenceThreshold(parseFloat(e.target.value))}
                  />
                  <span className="slider-value font-mono">{(confidenceThreshold * 100).toFixed(0)}%</span>
                </div>
                <span className="form-help">Lowering threshold reports findings with lower certainty.</span>
              </div>

              <div className="form-group">
                <label className="form-checkbox-label">
                  <input 
                    type="checkbox" 
                    checked={autoProcess}
                    onChange={(e) => setAutoProcess(e.target.checked)}
                  />
                  <span>Auto-run model training on file load</span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Category 3: AI Insights */}
        <div className="settings-accordion-section">
          <div className="settings-accordion-header" onClick={() => toggleCategory('insights')}>
            <div className="header-left">
              {expandedCategories.insights ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
              <Shield size={18} className="text-accent" />
              <h3>Traceable AI Insights</h3>
            </div>
            <span className="section-desc">Insight complexity levels and recommendation scope</span>
          </div>

          {expandedCategories.insights && (
            <div className="settings-accordion-content animate-fade-in">
              <div className="form-group">
                <label className="form-label">Insight Detail Level</label>
                <select 
                  className="form-select"
                  value={insightDetail}
                  onChange={(e) => setInsightDetail(e.target.value)}
                >
                  <option value="summary">Summary (Bullet points only)</option>
                  <option value="detailed">Detailed (Statistical context)</option>
                  <option value="forensic">Forensic (Deep feature-split diagnostics)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Recommendation Depth</label>
                <select 
                  className="form-select"
                  value={recommendationDepth}
                  onChange={(e) => setRecommendationDepth(e.target.value)}
                >
                  <option value="low">Low (General business tip)</option>
                  <option value="medium">Medium (Targeted actionable tasks)</option>
                  <option value="high">High (Full step-by-step remediation plan)</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Category 4: Report Export Options */}
        <div className="settings-accordion-section">
          <div className="settings-accordion-header" onClick={() => toggleCategory('reports')}>
            <div className="header-left">
              {expandedCategories.reports ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
              <FileText size={18} className="text-accent" />
              <h3>Report Export System</h3>
            </div>
            <span className="section-desc">Default report formats and header preferences</span>
          </div>

          {expandedCategories.reports && (
            <div className="settings-accordion-content animate-fade-in">
              <div className="form-group">
                <label className="form-label">Default Export Format</label>
                <select 
                  className="form-select"
                  value={reportFormat}
                  onChange={(e) => setReportFormat(e.target.value)}
                >
                  <option value="pdf">PDF (Printable Document Format)</option>
                  <option value="html">Interactive HTML Page</option>
                  <option value="markdown">Markdown Spreadsheet (.md)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-checkbox-label">
                  <input 
                    type="checkbox" 
                    checked={includeBranding}
                    onChange={(e) => setIncludeBranding(e.target.checked)}
                  />
                  <span>Include InsightGrid branding headers</span>
                </label>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="settings-save-bar">
        <button className="btn-primary btn-save-settings" onClick={handleSave}>
          Save Configuration Defaults
        </button>
        {saveSuccess && (
          <span className="save-toast animate-fade-in">
            <CheckCircle2 size={16} className="text-success" />
            Settings saved successfully!
          </span>
        )}
      </div>
    </div>
  );
}
