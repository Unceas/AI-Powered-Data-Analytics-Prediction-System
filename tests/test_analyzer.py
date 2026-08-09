import pandas as pd
import numpy as np
from backend.analytics.analyzer import analyze_dataframe


def test_analyze_dataframe_basic():
    df = pd.DataFrame({
        'num1': [1.0, 2.0, 3.0, 4.0],
        'num2': [10, 20, np.nan, 40],
        'cat': ['a','b','a','c']
    })
    desc, corr, cat, dist, health_score, health_details = analyze_dataframe(df)
    assert isinstance(desc, dict)
    assert isinstance(corr, dict) or corr is None
    assert isinstance(cat, dict)
    assert isinstance(dist, dict)
