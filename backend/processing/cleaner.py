import pandas as pd
from sklearn.preprocessing import StandardScaler, MinMaxScaler, LabelEncoder
from backend.processing.schemas import ProcessingConfig

def clean_and_process(df: pd.DataFrame, config: ProcessingConfig) -> pd.DataFrame:
    """Applies missing value handling, encoding, and scaling to a pandas DataFrame."""
    # Handle Missing Values
    if config.handle_missing == "drop":
        df = df.dropna()
    elif config.handle_missing in ["mean", "median", "mode"]:
        for col in df.columns:
            if pd.api.types.is_numeric_dtype(df[col]):
                if config.handle_missing == "mean":
                    df[col] = df[col].fillna(df[col].mean())
                elif config.handle_missing == "median":
                    df[col] = df[col].fillna(df[col].median())
                elif config.handle_missing == "mode":
                    df[col] = df[col].fillna(df[col].mode()[0] if not df[col].mode().empty else 0)
            else:
                df[col] = df[col].fillna(df[col].mode()[0] if not df[col].mode().empty else "Unknown")
    elif config.handle_missing == "constant" and config.missing_constant is not None:
        df = df.fillna(config.missing_constant)

    # Encoding Categorical Variables
    if config.encode_categorical:
        cat_cols = df.select_dtypes(include=['object', 'category']).columns
        if len(cat_cols) > 0:
            if config.encoding_method == "label":
                le = LabelEncoder()
                for col in cat_cols:
                    df[col] = le.fit_transform(df[col].astype(str))
            elif config.encoding_method == "onehot":
                # Only one-hot encode columns with <= 20 unique values to prevent column explosion
                safe_cols = [col for col in cat_cols if df[col].nunique() <= 20]
                if safe_cols:
                    df = pd.get_dummies(df, columns=safe_cols, drop_first=True)

    # Scaling Numeric Features
    if config.scale_features:
        num_cols = df.select_dtypes(include=['float64', 'int64']).columns
        if len(num_cols) > 0:
            scaler = StandardScaler() if config.scaling_method == "standard" else MinMaxScaler()
            df[num_cols] = scaler.fit_transform(df[num_cols])

    return df
