import pandas as pd
import numpy as np
from backend.processing.cleaner import clean_and_process
from backend.processing.schemas import ProcessingConfig


def _config():
    return ProcessingConfig(handle_missing="mean", scale_features=False, encode_categorical=False, scaling_method="standard", encoding_method="onehot")


def test_cleaner_mean_numeric():
    df = pd.DataFrame({"a": [1.0, None, 3.0], "b": [4.0, 5.0, None]})
    cfg = _config()
    out = clean_and_process(df, cfg)
    assert isinstance(out, pd.DataFrame)
    assert not out.isna().any().any()


def test_cleaner_drop_missing():
    df = pd.DataFrame({"a": [1, None], "b": [2, 3]})
    cfg = ProcessingConfig(handle_missing="drop", scale_features=False, encode_categorical=False, scaling_method="standard", encoding_method="onehot")
    out = clean_and_process(df, cfg)
    assert len(out) == 1
