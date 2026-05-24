# AI Resume Analyzer

An ATS-style resume analysis platform that evaluates resumes against specific job roles using NLP preprocessing, semantic skill matching, keyword density analysis, and AI-generated feedback.

The system is designed to simulate core ATS (Applicant Tracking System) evaluation workflows while providing actionable improvement recommendations through an interactive analytics interface.

---

## Overview

Modern hiring pipelines rely heavily on automated resume screening systems to filter candidates before manual review.

This project focuses on building a lightweight AI-assisted resume intelligence system capable of:

- extracting resume text from PDF documents
- preprocessing and analyzing candidate skills
- matching resumes against target job roles
- evaluating keyword optimization strength
- generating AI-style improvement feedback

The platform combines NLP concepts, scoring systems, semantic matching, and interactive visualization into a deployable Streamlit application.

---

## Core Features

- PDF resume upload and parsing
- Automatic text extraction using PyPDF2
- NLP preprocessing and text normalization
- Semantic skill matching using grouped keyword aliases
- ATS-style role-based scoring engine
- Keyword density analysis
- AI-generated resume feedback
- Missing skill recommendations
- Interactive Streamlit dashboard interface

---

## Supported Job Roles

- ML Engineer
- Backend Developer
- Frontend Developer

---

## System Workflow

```bash
Resume PDF
    │
    ▼
PDF Text Extraction
    │
    ▼
NLP Preprocessing
    │
    ▼
Semantic Skill Matching
    │
    ├── ATS Role Scoring
    ├── Keyword Density Analysis
    └── Missing Skill Detection
            │
            ▼
AI Feedback Generation
```

---

## Technical Stack

| Layer | Technologies |
|---|---|
| Frontend | Streamlit |
| Backend Logic | Python |
| PDF Processing | PyPDF2 |
| NLP Processing | Regex-based preprocessing |
| Analysis Engine | Semantic keyword matching |

---

## Project Structure

```bash
resume-analyzer/

├── analyzer.py
├── app_streamlit.py
├── requirements.txt
├── README.md
```

---

## Local Development

### Install Dependencies

```bash
pip install -r requirements.txt
```

### Run Application

```bash
streamlit run app_streamlit.py
```

---

## ATS Analysis Capabilities

### Role-Based Resume Scoring

The analyzer evaluates resumes against role-specific skill requirements.

### Semantic Skill Detection

Related technologies and aliases are grouped together for improved matching accuracy.

Example:

```text
PyTorch → Machine Learning
ReactJS → React
GitHub → Git
```

### Keyword Density Analysis

The platform evaluates how strongly important skills are represented throughout the resume.

### AI Feedback Generation

The system generates ATS-style feedback including:

- alignment strength
- missing skills
- optimization recommendations

---

## Example Output

```text
Resume Score: 85%

Skills Found:
- Python
- SQL
- Git

Missing Skills:
- FastAPI

AI Feedback:
- Strong alignment for Backend Developer roles
- Recommended improving FastAPI experience
```

---

## Engineering Concepts Demonstrated

- NLP preprocessing pipelines
- Semantic keyword matching
- Rule-based AI scoring systems
- PDF document parsing
- Interactive analytics dashboards
- ATS simulation workflows
- Modular Python architecture

---

## Future Improvements

- Resume section analysis
- Experience-based scoring
- Project relevance analysis
- Better semantic similarity matching
- Resume formatting evaluation
- LLM integration for advanced feedback
- Multi-role comparative scoring

---

## Author

Ayush Kushwaha
