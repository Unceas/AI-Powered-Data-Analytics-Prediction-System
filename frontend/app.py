import streamlit as st
import plotly.express as px
import requests
import pandas as pd
import json

API_URL = "http://localhost:8000/api"

# Check backend connection
try:
    health_check = requests.get("http://localhost:8000/health", timeout=2)
    backend_online = health_check.status_code == 200
except:
    backend_online = False

if not backend_online:
    st.error("⚠️ Backend API is not reachable. Please start the backend first with: `uvicorn backend.main:app --reload`")
    st.stop()

st.set_page_config(
    page_title="Autonomous Data Intelligence Platform",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Theme management
if 'theme' not in st.session_state:
    st.session_state.theme = 'light'

def get_theme_css(theme):
    if theme == 'dark':
        return """
        <style>
        .stApp { background: #0b0f1a; }
        .hero { background: #0a0a0a; border-color: #1e1e1e; }
        .hero h1 { color: #f1f5f9; }
        .hero p { color: #94a3b8; }
        .metric-card, .pipeline-step { background: #0a0a0a; border-color: #1e1e1e; }
        .metric-value { color: #60a5fa; }
        .step-sub, .metric-label { color: #64748b; }
        .section-header { color: #e2e8f0; }
        .step-label { color: #3b82f6; }
        .stTabs [data-baseweb="tab-list"] { background: #0a0a0a; border-color: #1e1e1e; }
        .stTabs [data-baseweb="tab"] { color: #64748b; }
        .stTabs [aria-selected="true"] { background: #1e40af !important; }
        .stSelectbox > div > div, .stTextInput > div > div > input, .stTextArea > div > div > textarea { background: #0a0a0a !important; border-color: #1e1e1e !important; color: #e2e8f0 !important; }
        .stCheckbox label { color: #94a3b8 !important; }
        [data-testid="stFileUploader"] { background: #0a0a0a !important; border-color: #1e1e1e !important; }
        .stDataFrame { border-color: #1e1e1e !important; }
        hr { border-color: #1e1e1e !important; }
        </style>
        """
    else:
        return """
        <style>
        .stApp { background: #f8fbff; }
        .hero { background: #ffffff; border-color: #e2e8f0; }
        .hero h1 { color: #0f172a; }
        .hero p { color: #475569; }
        .metric-card, .pipeline-step { background: #ffffff; border-color: #e2e8f0; }
        .metric-value { color: #1e40af; }
        .step-sub, .metric-label { color: #64748b; }
        .section-header { color: #0f172a; }
        .step-label { color: #2563eb; }
        .stTabs [data-baseweb="tab-list"] { background: #ffffff; border-color: #e2e8f0; }
        .stTabs [data-baseweb="tab"] { color: #64748b; }
        .stTabs [aria-selected="true"] { background: #1e40af !important; }
        .stSelectbox > div > div, .stTextInput > div > div > input, .stTextArea > div > div > textarea { background: #ffffff !important; border-color: #cbd5e1 !important; color: #0f172a !important; }
        .stCheckbox label { color: #475569 !important; }
        [data-testid="stFileUploader"] { background: #ffffff !important; border-color: #cbd5e1 !important; }
        .stDataFrame { border-color: #e2e8f0 !important; }
        hr { border-color: #e2e8f0 !important; }
        </style>
        """

# Apply theme
st.markdown(get_theme_css(st.session_state.theme), unsafe_allow_html=True)

# Sidebar theme toggle
with st.sidebar:
    st.markdown("### App Settings")
    theme_choice = st.radio("Theme", ["Light", "Dark"], index=0 if st.session_state.theme == 'light' else 1)
    new_theme = 'light' if theme_choice == 'Light' else 'dark'
    if new_theme != st.session_state.theme:
        st.session_state.theme = new_theme
        st.markdown(get_theme_css(new_theme), unsafe_allow_html=True)

# ── THEME CSS ──────────────────────────────────────────────────────────────
light_css = """
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

html, body, [class*="css"] { font-family: 'Inter', sans-serif; }
.stApp { background: #f8fafc; min-height: 100vh; }

#MainMenu, footer, header { visibility: hidden; }
.block-container { padding: 2rem 3rem; max-width: 1400px; }

/* Hero */
.hero {
    background: linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%);
    border: 1px solid #e2e8f0;
    border-radius: 16px;
    padding: 2.5rem 3rem;
    margin-bottom: 2rem;
    box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
    transition: box-shadow 0.3s ease;
}
.hero:hover { box-shadow: 0 10px 40px rgba(0,0,0,0.08); }
.hero h1 { font-size: 2.2rem; font-weight: 800; color: #0f172a; margin: 0 0 0.5rem 0; }
.hero p { color: #475569; font-size: 1rem; margin: 0; }
.hero .badge {
    display: inline-block; background: #eff6ff; border: 1px solid #bfdbfe;
    color: #1d4ed8; padding: 0.25rem 0.75rem; border-radius: 999px;
    font-size: 0.75rem; font-weight: 600; margin-bottom: 1rem;
    letter-spacing: 0.05em; text-transform: uppercase;
}

/* Cards */
.metric-card, .pipeline-step {
    background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px;
    padding: 1.2rem; text-align: center;
    box-shadow: 0 1px 3px rgba(0,0,0,0.04);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.metric-card:hover, .pipeline-step:hover {
    transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.08);
}
.metric-value { font-size: 1.8rem; font-weight: 700; color: #1e40af; line-height: 1.1; }
.step-sub, .metric-label { font-size: 0.75rem; color: #64748b; font-weight: 500; margin-top: 0.3rem; text-transform: uppercase; letter-spacing: 0.05em; }
.step-icon { font-size: 1.6rem; margin-bottom: 0.3rem; }
.step-title { font-weight: 600; color: #1e293b; font-size: 0.9rem; margin-top: 0.3rem; }

/* Section */
.section-header { font-size: 1.2rem; font-weight: 700; color: #0f172a; margin: 1.5rem 0 1rem 0; display: flex; align-items: center; gap: 0.5rem; }
.section-header::after { content: ''; flex: 1; height: 1px; background: #e2e8f0; margin-left: 0.75rem; }
.step-label { font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.07em; color: #2563eb; margin-bottom: 0.4rem; }

/* Tabs */
.stTabs [data-baseweb="tab-list"] { background: #ffffff; border-radius: 10px; padding: 0.25rem; gap: 0.2rem; border: 1px solid #e2e8f0; }
.stTabs [data-baseweb="tab"] { background: transparent; color: #64748b; border-radius: 8px; font-weight: 600; font-size: 0.85rem; padding: 0.5rem 1rem; border: none; transition: all 0.2s ease; }
.stTabs [data-baseweb="tab"]:hover { background: #f1f5f9; color: #1e40af; }
.stTabs [aria-selected="true"] { background: #1e40af !important; color: white !important; }
.stTabs [data-baseweb="tab-panel"] { padding-top: 1.5rem; }

/* Buttons */
.stButton > button { background: #1e40af !important; color: white !important; border: none !important; border-radius: 8px !important; padding: 0.6rem 1.5rem !important; font-weight: 600 !important; font-size: 0.9rem !important; transition: all 0.2s ease !important; width: 100% !important; }
.stButton > button:hover { background: #1e3a8a !important; transform: translateY(-1px) !important; }

/* Inputs */
.stSelectbox > div > div, .stTextInput > div > div > input, .stTextArea > div > div > textarea {
    background: #ffffff !important; border-color: #cbd5e1 !important; color: #0f172a !important; border-radius: 8px !important;
}
.stSelectbox > div > div:focus-within, .stTextInput > div > div > input:focus, .stTextArea > div > div > textarea:focus {
    border-color: #2563eb !important; box-shadow: 0 0 0 3px rgba(37,99,235,0.1) !important;
}

/* Alerts */
.stSuccess > div { background: #f0fdf4 !important; border: 1px solid #86efac !important; color: #166534 !important; border-radius: 8px !important; }
.stError > div { background: #fef2f2 !important; border: 1px solid #fca5a5 !important; color: #dc2626 !important; border-radius: 8px !important; }
.stWarning > div { background: #fffbeb !important; border: 1px solid #fcd34d !important; color: #d97706 !important; border-radius: 8px !important; }
.stInfo > div { background: #eff6ff !important; border: 1px solid #93c5fd !important; color: #1d4ed8 !important; border-radius: 8px !important; }

/* Dataframe */
.stDataFrame { border-radius: 10px; border: 1px solid #e2e8f0 !important; }

/* Spinner */
.stSpinner > div { border-top-color: #2563eb !important; }

/* File Uploader */
[data-testid="stFileUploader"] { background: #ffffff; border: 2px dashed #cbd5e1; border-radius: 12px; padding: 1rem; transition: all 0.2s ease; }
[data-testid="stFileUploader"]:hover { border-color: #2563eb; }

/* Divider */
hr { border-color: #e2e8f0 !important; }

/* Status Pill */
.status-pill { display: inline-flex; align-items: center; gap: 0.4rem; background: #f0fdf4; border: 1px solid #86efac; color: #166534; padding: 0.3rem 0.9rem; border-radius: 999px; font-size: 0.8rem; font-weight: 600; }
.status-dot { width: 7px; height: 7px; background: #22c55e; border-radius: 50%; animation: pulse 2s infinite; }
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }

/* Expander */
.streamlit-expanderHeader { background: #ffffff !important; border: 1px solid #e2e8f0 !important; border-radius: 8px !important; }

/* Responsive */
@media (max-width: 768px) { .block-container { padding: 1rem !important; } .hero { padding: 1.5rem !important; } .hero h1 { font-size: 1.6rem !important; } }
</style>
"""

dark_css = """
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

html, body, [class*="css"] { font-family: 'Inter', sans-serif; }
.stApp { background: #000000; min-height: 100vh; }

#MainMenu, footer, header { visibility: hidden; }
.block-container { padding: 2rem 3rem; max-width: 1400px; }

/* Hero */
.hero {
    background: #0a0a0a; border: 1px solid #1e1e1e; border-radius: 16px;
    padding: 2.5rem 3rem; margin-bottom: 2rem;
    box-shadow: 0 1px 3px rgba(255,255,255,0.03);
    transition: box-shadow 0.3s ease;
}
.hero:hover { box-shadow: 0 10px 40px rgba(255,255,255,0.05); }
.hero h1 { font-size: 2.2rem; font-weight: 800; color: #f1f5f9; margin: 0 0 0.5rem 0; }
.hero p { color: #94a3b8; font-size: 1rem; margin: 0; }
.hero .badge {
    display: inline-block; background: #1e3a8a; border: 1px solid #3b82f6;
    color: #93c5fd; padding: 0.25rem 0.75rem; border-radius: 999px;
    font-size: 0.75rem; font-weight: 600; margin-bottom: 1rem;
    letter-spacing: 0.05em; text-transform: uppercase;
}

/* Cards */
.metric-card, .pipeline-step {
    background: #0a0a0a; border: 1px solid #1e1e1e; border-radius: 12px;
    padding: 1.2rem; text-align: center;
    box-shadow: 0 1px 3px rgba(0,0,0,0.3);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.metric-card:hover, .pipeline-step:hover {
    transform: translateY(-2px); box-shadow: 0 4px 12px rgba(255,255,255,0.05);
}
.metric-value { font-size: 1.8rem; font-weight: 700; color: #60a5fa; line-height: 1.1; }
.step-sub, .metric-label { font-size: 0.75rem; color: #64748b; font-weight: 500; margin-top: 0.3rem; text-transform: uppercase; letter-spacing: 0.05em; }
.step-icon { font-size: 1.6rem; margin-bottom: 0.3rem; }
.step-title { font-weight: 600; color: #e2e8f0; font-size: 0.9rem; margin-top: 0.3rem; }

/* Section */
.section-header { font-size: 1.2rem; font-weight: 700; color: #e2e8f0; margin: 1.5rem 0 1rem 0; display: flex; align-items: center; gap: 0.5rem; }
.section-header::after { content: ''; flex: 1; height: 1px; background: #1e1e1e; margin-left: 0.75rem; }
.step-label { font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.07em; color: #3b82f6; margin-bottom: 0.4rem; }

/* Tabs */
.stTabs [data-baseweb="tab-list"] { background: #0a0a0a; border-radius: 10px; padding: 0.25rem; gap: 0.2rem; border: 1px solid #1e1e1e; }
.stTabs [data-baseweb="tab"] { background: transparent; color: #64748b; border-radius: 8px; font-weight: 600; font-size: 0.85rem; padding: 0.5rem 1rem; border: none; transition: all 0.2s ease; }
.stTabs [data-baseweb="tab"]:hover { background: #1e1e1e; color: #93c5fd; }
.stTabs [aria-selected="true"] { background: #1e40af !important; color: white !important; }
.stTabs [data-baseweb="tab-panel"] { padding-top: 1.5rem; }

/* Buttons */
.stButton > button { background: #1e40af !important; color: white !important; border: none !important; border-radius: 8px !important; padding: 0.6rem 1.5rem !important; font-weight: 600 !important; font-size: 0.9rem !important; transition: all 0.2s ease !important; width: 100% !important; }
.stButton > button:hover { background: #2563eb !important; transform: translateY(-1px) !important; }

/* Inputs */
.stSelectbox > div > div, .stTextInput > div > div > input, .stTextArea > div > div > textarea {
    background: #0a0a0a !important; border-color: #1e1e1e !important; color: #e2e8f0 !important; border-radius: 8px !important;
}
.stSelectbox > div > div:focus-within, .stTextInput > div > div > input:focus, .stTextArea > div > div > textarea:focus {
    border-color: #3b82f6 !important; box-shadow: 0 0 0 3px rgba(59,130,246,0.15) !important;
}

/* Alerts */
.stSuccess > div { background: #052e16 !important; border: 1px solid #166534 !important; color: #4ade80 !important; border-radius: 8px !important; }
.stError > div { background: #450a0a !important; border: 1px solid #dc2626 !important; color: #f87171 !important; border-radius: 8px !important; }
.stWarning > div { background: #451a03 !important; border: 1px solid #d97706 !important; color: #fbbf24 !important; border-radius: 8px !important; }
.stInfo > div { background: #172554 !important; border: 1px solid #1d4ed8 !important; color: #60a5fa !important; border-radius: 8px !important; }

/* Dataframe */
.stDataFrame { border-radius: 10px; border: 1px solid #1e1e1e !important; }

/* Spinner */
.stSpinner > div { border-top-color: #3b82f6 !important; }

/* File Uploader */
[data-testid="stFileUploader"] { background: #0a0a0a; border: 2px dashed #1e1e1e; border-radius: 12px; padding: 1rem; transition: all 0.2s ease; }
[data-testid="stFileUploader"]:hover { border-color: #3b82f6; }

/* Divider */
hr { border-color: #1e1e1e !important; }

/* Status Pill */
.status-pill { display: inline-flex; align-items: center; gap: 0.4rem; background: #052e16; border: 1px solid #166534; color: #4ade80; padding: 0.3rem 0.9rem; border-radius: 999px; font-size: 0.8rem; font-weight: 600; }
.status-dot { width: 7px; height: 7px; background: #22c55e; border-radius: 50%; animation: pulse 2s infinite; }
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }

/* Expander */
.streamlit-expanderHeader { background: #0a0a0a !important; border: 1px solid #1e1e1e !important; border-radius: 8px !important; }

/* Responsive */
@media (max-width: 768px) { .block-container { padding: 1rem !important; } .hero { padding: 1.5rem !important; } .hero h1 { font-size: 1.6rem !important; } }
</style>
"""

# Apply theme
st.markdown(light_css if st.session_state.theme == 'light' else dark_css, unsafe_allow_html=True)


# ── HERO HEADER ─────────────────────────────────────────────────────────────
st.markdown("""
<div class="hero">
    <div class="badge">⚡ Groq-Powered Pipeline</div>
    <h1>🧠 Autonomous Data Intelligence Platform</h1>
    <p>Upload any dataset and watch it flow through ingestion → cleaning → analytics → ML → AI insights, automatically.</p>
</div>
""", unsafe_allow_html=True)


# ── PIPELINE OVERVIEW ────────────────────────────────────────────────────────
cols = st.columns(5)
steps = [
    ("📥", "Ingest", "CSV or API"),
    ("🧹", "Clean", "Auto-process"),
    ("📊", "Analyze", "Stats & Corr"),
    ("🤖", "ML Model", "Auto-detect"),
    ("✨", "AI Insights", "Groq AI"),
]
for col, (icon, title, sub) in zip(cols, steps):
    with col:
        st.markdown(f"""
        <div class="pipeline-step">
            <div class="step-icon">{icon}</div>
            <div class="step-title">{title}</div>
            <div class="step-sub">{sub}</div>
        </div>
        """, unsafe_allow_html=True)

st.markdown("<div style='margin-top:1.5rem'></div>", unsafe_allow_html=True)

# ── FILE UPLOAD ──────────────────────────────────────────────────────────────
st.markdown('<div class="step-label">Step 1 — Load your data</div>', unsafe_allow_html=True)
uploaded_file = st.file_uploader(
    "Drop your CSV dataset here, or click to browse",
    type=["csv"],
    help="Supports any structured CSV file. All processing happens locally via the FastAPI backend."
)

if uploaded_file is None:
    st.markdown("""
    <div style="text-align:center;padding:2rem;color:#475569;">
        <div style="font-size:3rem">📂</div>
        <div style="font-weight:600;font-size:1.05rem;color:#64748b;margin-top:0.5rem">No file uploaded yet</div>
        <div style="font-size:0.85rem;margin-top:0.3rem">Upload a CSV above to unlock the full pipeline</div>
    </div>
    """, unsafe_allow_html=True)
    st.stop()

# File loaded
try:
    preview_df = pd.read_csv(uploaded_file)
    uploaded_file.seek(0)
    file_bytes = uploaded_file.getvalue()
    r, c = preview_df.shape
    nulls = int(preview_df.isnull().sum().sum())
    num_cols = int(preview_df.select_dtypes(include='number').shape[1])
    cat_cols = int(preview_df.select_dtypes(include='object').shape[1])
except Exception:
    r, c, nulls, num_cols, cat_cols = "?", "?", "?", "?", "?"

st.markdown("""
<div class="status-pill"><div class="status-dot"></div>Dataset Loaded</div>
""", unsafe_allow_html=True)
st.markdown("<div style='margin-top:0.8rem'></div>", unsafe_allow_html=True)

m1, m2, m3, m4, m5 = st.columns(5)
for col, val, label in zip(
    [m1, m2, m3, m4, m5],
    [r, c, nulls, num_cols, cat_cols],
    ["Rows", "Columns", "Missing Values", "Numeric Cols", "Categorical Cols"]
):
    with col:
        st.markdown(f"""
        <div class="pipeline-step">
            <div class="metric-value">{val}</div>
            <div class="step-sub" style="margin-top:0.3rem">{label}</div>
        </div>
        """, unsafe_allow_html=True)

with st.expander("👁️ Preview raw data", expanded=False):
    st.dataframe(preview_df.head(10), use_container_width=True)

st.markdown("<div style='margin-top:1rem'></div>", unsafe_allow_html=True)
st.markdown("---")

# ── TABS ─────────────────────────────────────────────────────────────────────
tab1, tab2, tab3, tab4 = st.tabs([
    "🧹  Data Processing",
    "📊  Analytics",
    "🤖  Machine Learning",
    "✨  AI Insights"
])

# ═══════════════════════════════════════════════════════════════════════
# TAB 1 — DATA PROCESSING
# ═══════════════════════════════════════════════════════════════════════
with tab1:
    st.markdown('<div class="section-header">Clean & Preprocess</div>', unsafe_allow_html=True)
    st.markdown('<p style="color:#64748b;font-size:0.9rem;margin-bottom:1.5rem">Configure how the pipeline handles missing values, encoding, and feature scaling.</p>', unsafe_allow_html=True)

    col_a, col_b = st.columns([1, 1], gap="large")

    with col_a:
        st.markdown('<div class="step-label">Missing Value Strategy</div>', unsafe_allow_html=True)
        handle_missing = st.selectbox(
            "Strategy",
            ["mean", "median", "mode", "drop", "constant"],
            label_visibility="collapsed"
        )
        strategy_desc = {
            "mean": "🔵 Fill numeric nulls with column mean; categorical with mode.",
            "median": "🟣 Fill numeric nulls with column median; categorical with mode.",
            "mode": "🟢 Fill all nulls with the most frequent value.",
            "drop": "🔴 Drop all rows containing any null value.",
            "constant": "🟡 Fill all nulls with a constant value (0 / 'Unknown').",
        }
        st.markdown(f'<div style="color:#94a3b8;font-size:0.82rem;margin-top:0.4rem">{strategy_desc[handle_missing]}</div>', unsafe_allow_html=True)

    with col_b:
        st.markdown('<div class="step-label">Feature Engineering</div>', unsafe_allow_html=True)
        scale_features    = st.checkbox("⚖️  Scale numeric features (StandardScaler)", value=True)
        encode_categorical = st.checkbox("🔤  Encode categoricals (OneHot encoding)", value=True)

    st.markdown("<div style='margin-top:1rem'></div>", unsafe_allow_html=True)
    run_processing = st.button("🚀  Run Processing Pipeline", key="btn_process")

    if run_processing:
        with st.spinner("Running preprocessing pipeline…"):
            config = {
                "handle_missing": handle_missing,
                "scale_features": scale_features,
                "encode_categorical": encode_categorical,
                "scaling_method": "standard",
                "encoding_method": "onehot"
            }
            try:
                res = requests.post(
                    f"{API_URL}/process-csv",
                    data={"config": json.dumps(config)},
                    files={"file": ("data.csv", file_bytes, "text/csv")}
                )
            except requests.exceptions.ConnectionError:
                st.error("Cannot connect to backend API. Make sure it's running on http://localhost:8000")
                st.stop()
        if res.status_code == 200:
            data = res.json()
            st.success(f"✅ Processed **{data['rows']}** rows × **{len(data['columns'])}** columns successfully!")
            st.markdown('<div class="step-label" style="margin-top:1rem">Output Preview (first 5 rows)</div>', unsafe_allow_html=True)
            st.dataframe(pd.DataFrame(data["preview"]), use_container_width=True)
        else:
            st.error(f"Processing failed: {res.text}")


# ═══════════════════════════════════════════════════════════════════════
# TAB 2 — ANALYTICS
# ═══════════════════════════════════════════════════════════════════════
with tab2:
    st.markdown('<div class="section-header">Exploratory Data Analytics</div>', unsafe_allow_html=True)
    st.markdown('<p style="color:#64748b;font-size:0.9rem;margin-bottom:1.5rem">Auto-generate descriptive statistics, feature correlations, and categorical breakdowns.</p>', unsafe_allow_html=True)

    run_analytics = st.button("📊  Generate Full Analytics Report", key="btn_analytics")

    if run_analytics:
        with st.spinner("Analyzing dataset…"):
            try:
                res = requests.post(
                    f"{API_URL}/analyze-csv",
                    files={"file": ("data.csv", file_bytes, "text/csv")}
                )
            except requests.exceptions.ConnectionError:
                st.error("Cannot connect to backend API. Make sure it's running on http://localhost:8000")
                st.stop()
        if res.status_code == 200:
            data = res.json()
            st.session_state["analytics_data"] = data
            st.success("✅ Analytics generated and cached for AI Insights!")

            st.markdown('<div class="section-header">Descriptive Statistics</div>', unsafe_allow_html=True)
            st.dataframe(pd.DataFrame(data["descriptive_statistics"]), use_container_width=True)

            if data.get("correlation_matrix"):
                st.markdown('<div class="section-header">Correlation Matrix</div>', unsafe_allow_html=True)
                corr_df = pd.DataFrame(data["correlation_matrix"])
                # Use Plotly for interactive heatmap
                fig = px.imshow(
                    corr_df.values,
                    labels=dict(x="Features", y="Features", color="Correlation"),
                    x=list(corr_df.columns),
                    y=list(corr_df.index),
                    color_continuous_scale="RdYlGn",
                    title="Feature Correlation Heatmap"
                )
                fig.update_layout(height=500)
                st.plotly_chart(fig, use_container_width=True)

            # Distribution charts for numeric features
            if data.get("distributions"):
                st.markdown('<div class="section-header">Distributions</div>', unsafe_allow_html=True)
                dist_map = data["distributions"]
                for col, dist in dist_map.items():
                    try:
                        bins = dist.get("bins", [])
                        counts = dist.get("counts", [])
                        if not counts or len(bins) < 2:
                            continue
                        centers = [ (bins[i] + bins[i+1]) / 2 for i in range(len(bins)-1) ]
                        fig = px.bar(x=centers, y=counts, labels={"x": col, "y": "Count"}, title=f"Distribution: {col}")
                        st.plotly_chart(fig, use_container_width=True)
                    except Exception:
                        pass

            if data.get("categorical_summaries"):
                st.markdown('<div class="section-header">Categorical Feature Summaries</div>', unsafe_allow_html=True)
                for feat, info in data["categorical_summaries"].items():
                    with st.expander(f"📌 {feat}  —  {info['unique_count']} unique values"):
                        bar_data = pd.Series(info["top_values"], name="Count")
                        st.bar_chart(bar_data, use_container_width=True)
        else:
            st.error(f"Analytics failed: {res.text}")

    elif "analytics_data" in st.session_state:
        st.info("ℹ️ Analytics already cached from a previous run. Click above to refresh.")


# ═══════════════════════════════════════════════════════════════════════
# TAB 3 — MACHINE LEARNING
# ═══════════════════════════════════════════════════════════════════════
with tab3:
    st.markdown('<div class="section-header">Auto-ML Engine</div>', unsafe_allow_html=True)

    # ── Predictive Modeling ──
    st.markdown('<div class="step-label">Supervised — Predictive Modeling</div>', unsafe_allow_html=True)
    st.markdown('<p style="color:#64748b;font-size:0.85rem;margin-bottom:0.8rem">Enter the column you want to predict. The engine auto-detects Classification vs Regression and trains a Random Forest baseline.</p>', unsafe_allow_html=True)

    target_col = st.text_input("🎯 Target column name", placeholder="e.g. price, churn, fraud_flag", key="target_col")
    run_ml = st.button("🤖  Train Baseline Model", key="btn_ml")

    if run_ml:
        if not target_col.strip():
            st.warning("⚠️ Please enter the name of a target column.")
        else:
            with st.spinner(f"Training model to predict **{target_col}**…"):
                try:
                    res = requests.post(
                        f"{API_URL}/predict-csv",
                        data={"target_column": target_col},
                        files={"file": ("data.csv", file_bytes, "text/csv")}
                    )
                except requests.exceptions.ConnectionError:
                    st.error("Cannot connect to backend API. Make sure it's running on http://localhost:8000")
                    st.stop()
            if res.status_code == 200:
                data = res.json()
                if data.get("status") == "error":
                    st.error(f"❌ {data['message']}")
                else:
                    # 1. Primary User-Facing Result
                    pred_obj = data.get("prediction", {})
                    rel = data.get("reliability", "Medium")
                    summary = pred_obj.get("summary") or f"Expected value: {pred_obj.get('value')}"
                    
                    st.markdown(f"### 🎯 {summary}")
                    st.caption("Predicted value: **" + str(pred_obj.get("value", "N/A")) + "**")
                    
                    c1, c2 = st.columns(2)
                    with c1:
                        if pred_obj.get("change"):
                            st.metric("Estimated Change", str(pred_obj.get("change")), delta=pred_obj.get("direction"))
                    with c2:
                        rel_desc = data.get("reliability_description") or "Based on validation quality and available data."
                        st.metric("Reliability Assessment", rel, help=rel_desc)

                    # Warnings
                    warnings = data.get("warnings", [])
                    if warnings:
                        for w in warnings:
                            st.warning(f"⚠️ {w}")

                    # Key Influencing Factors
                    drivers = data.get("drivers") or []
                    if drivers:
                        st.markdown('<div class="section-header" style="margin-top:1rem">Key Influencing Factors</div>', unsafe_allow_html=True)
                        for d in drivers:
                            f_name = d.get("feature", "")
                            inf = d.get("influence", "Moderate influence")
                            st.markdown(f"- **{f_name}** — *{inf}*")

                    # 2. Collapsible Advanced / Developer Details
                    with st.expander("⚙️ Advanced details", expanded=False):
                        st.markdown(f"**Selected Model Algorithm:** `{data.get('technical', {}).get('model', data.get('model_type'))}`")
                        
                        metrics = data.get("metrics", {})
                        if metrics:
                            st.markdown("**Validation Metrics:**")
                            met_cols = st.columns(len(metrics))
                            for col, (k, v) in zip(met_cols, metrics.items()):
                                with col:
                                    val_str = f"{v*100:.1f}%" if k in ['accuracy', 'precision', 'recall', 'f1_score', 'r2_score'] else f"{v:.4f}"
                                    st.metric(label=k.replace('_', ' ').title(), value=val_str)

                        cands = data.get("technical", {}).get("candidate_evaluations", [])
                        if cands:
                            st.markdown("**Candidate Selection Results:**")
                            st.dataframe(pd.DataFrame(cands), use_container_width=True)

                        training_info = data.get("technical", {}).get("training", {})
                        if training_info:
                            st.json(training_info)
            else:
                st.error(f"Request failed: {res.text}")

    st.markdown("---")

    # ── Anomaly Detection ──
    st.markdown('<div class="step-label">Unsupervised — Anomaly Detection</div>', unsafe_allow_html=True)
    st.markdown('<p style="color:#64748b;font-size:0.85rem;margin-bottom:0.8rem">Uses Isolation Forest to flag statistical outliers without needing labels.</p>', unsafe_allow_html=True)

    contamination = st.slider(
        "Estimated anomaly rate (contamination %)",
        min_value=1, max_value=20, value=5,
        format="%d%%", key="contamination"
    )
    run_anomaly = st.button("🔍  Detect Anomalies", key="btn_anomaly")

    if run_anomaly:
        with st.spinner("Running Isolation Forest…"):
            try:
                res = requests.post(
                    f"{API_URL}/detect-anomalies",
                    data={"contamination": contamination / 100},
                    files={"file": ("data.csv", file_bytes, "text/csv")}
                )
            except requests.exceptions.ConnectionError:
                st.error("Cannot connect to backend API. Make sure it's running on http://localhost:8000")
                st.stop()
        if res.status_code == 200:
            data = res.json()
            if data["status"] == "error":
                st.error(f"❌ {data['message']}")
            else:
                a1, a2, a3 = st.columns(3)
                with a1:
                    st.markdown(f'<div class="pipeline-step"><div class="metric-value">{data["total_records"]}</div><div class="step-sub" style="margin-top:0.3rem">Total Records</div></div>', unsafe_allow_html=True)
                with a2:
                    st.markdown(f'<div class="pipeline-step"><div class="metric-value" style="color:#ef4444">{data["anomalies_detected"]}</div><div class="step-sub" style="margin-top:0.3rem">Anomalies Found</div></div>', unsafe_allow_html=True)
                with a3:
                    st.markdown(f'<div class="pipeline-step"><div class="metric-value" style="color:#fb923c">{data["anomaly_percentage"]}%</div><div class="step-sub" style="margin-top:0.3rem">Anomaly Rate</div></div>', unsafe_allow_html=True)

                if data.get("anomalies_preview"):
                    st.markdown('<div class="section-header" style="margin-top:1.5rem">Anomalous Records (preview)</div>', unsafe_allow_html=True)
                    st.dataframe(pd.DataFrame(data["anomalies_preview"]), use_container_width=True)
        else:
            st.error("Request failed.")


# ═══════════════════════════════════════════════════════════════════════
# TAB 4 — AI INSIGHTS
# ═══════════════════════════════════════════════════════════════════════
with tab4:
    st.markdown('<div class="section-header">Groq AI Insights</div>', unsafe_allow_html=True)
    st.markdown('<p style="color:#64748b;font-size:0.9rem;margin-bottom:1rem">The Groq LLM reads your analytics output and returns actionable, human-readable insights.</p>', unsafe_allow_html=True)

    if "analytics_data" not in st.session_state:
        st.warning("⚠️ Analytics not yet generated. Please go to the **📊 Analytics** tab first and run the report.")
    else:
        st.markdown('<div class="step-label">AI Prompt Context</div>', unsafe_allow_html=True)
        context = st.text_area(
            "Prompt context",
            value="You are a senior data scientist. Identify the top 3 actionable insights from this dataset. Be specific, concise, and business-focused.",
            height=100,
            label_visibility="collapsed"
        )
        run_ai = st.button("✨  Generate Natural Language Insights", key="btn_ai")

        if run_ai:
            with st.spinner("Groq is analyzing your data…"):
                payload = {
                    "analysis_data": st.session_state["analytics_data"],
                    "context": context
                }
                res = None
                try:
                    res = requests.post(f"{API_URL}/generate-insights", json=payload)
                except requests.exceptions.ConnectionError:
                    st.error("Cannot connect to backend API. Make sure it's running on http://localhost:8000")
                    st.stop()
                except Exception as e:
                    st.error(f"Error: {str(e)}")
                    st.stop()
            
            if res and res.status_code == 200:
                insight_text = res.json().get("insights", "")
                st.info("📊 AI Insights")
                # Use st.text to display plain text (no markdown rendering)
                st.text(insight_text)
            elif res:
                st.error(f"Groq API error: {res.text}")


# ── FOOTER ───────────────────────────────────────────────────────────────────
st.markdown("---")
st.markdown("""
<div style="text-align:center;color:#334155;font-size:0.8rem;padding:0.5rem 0">
    🧠 <strong style="color:#1e40af">Autonomous Data Intelligence Platform</strong> &nbsp;·&nbsp;
    FastAPI + Streamlit + Groq AI &nbsp;·&nbsp;
    Built for production-grade data pipelines
</div>
""", unsafe_allow_html=True)
