"""
Episode-based and chronological dataset partitioning engine for GridHeal.
Strictly avoids random shuffle splitting to prevent temporal autocorrelation leakage.
Generates train, validation, and test splits with an explicit split manifest.
"""

import json
from pathlib import Path
from typing import Dict, Any, Tuple
import pandas as pd


def split_by_chronological_blocks(
    df: pd.DataFrame,
    train_ratio: float = 0.70,
    val_ratio: float = 0.15,
    test_ratio: float = 0.15,
) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame, Dict[str, Any]]:
    """
    Splits timeseries strictly by chronological blocks.
    train: [0, t_train]
    val:   (t_train, t_val]
    test:  (t_val, t_end]
    """
    total_len = len(df)
    n_train = int(total_len * train_ratio)
    n_val = int(total_len * val_ratio)

    train_df = df.iloc[:n_train].copy().reset_index(drop=True)
    val_df = df.iloc[n_train : n_train + n_val].copy().reset_index(drop=True)
    test_df = df.iloc[n_train + n_val :].copy().reset_index(drop=True)

    manifest = {
        "split_method": "chronological_block",
        "total_records": total_len,
        "train": {
            "count": len(train_df),
            "percentage": round(len(train_df) / total_len * 100, 2),
            "start_time": train_df["timestamp"].iloc[0] if len(train_df) > 0 else None,
            "end_time": train_df["timestamp"].iloc[-1] if len(train_df) > 0 else None,
        },
        "validation": {
            "count": len(val_df),
            "percentage": round(len(val_df) / total_len * 100, 2),
            "start_time": val_df["timestamp"].iloc[0] if len(val_df) > 0 else None,
            "end_time": val_df["timestamp"].iloc[-1] if len(val_df) > 0 else None,
        },
        "test": {
            "count": len(test_df),
            "percentage": round(len(test_df) / total_len * 100, 2),
            "start_time": test_df["timestamp"].iloc[0] if len(test_df) > 0 else None,
            "end_time": test_df["timestamp"].iloc[-1] if len(test_df) > 0 else None,
        },
    }

    return train_df, val_df, test_df, manifest


def split_by_episodes(
    df: pd.DataFrame,
    train_ratio: float = 0.70,
    val_ratio: float = 0.15,
    test_ratio: float = 0.15,
    seed: int = 42,
) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame, Dict[str, Any]]:
    """
    Splits by entire episode IDs so that contiguous fault episodes are never chopped across train/test.
    """
    episode_ids = list(df["episode_id"].unique())
    import numpy as np

    rng = np.random.default_rng(seed)
    shuffled_episodes = rng.permutation(episode_ids)

    n_eps = len(shuffled_episodes)
    n_train_eps = int(n_eps * train_ratio)
    n_val_eps = int(n_eps * val_ratio)

    train_eps = set(shuffled_episodes[:n_train_eps])
    val_eps = set(shuffled_episodes[n_train_eps : n_train_eps + n_val_eps])
    test_eps = set(shuffled_episodes[n_train_eps + n_val_eps :])

    train_df = df[df["episode_id"].isin(train_eps)].copy().reset_index(drop=True)
    val_df = df[df["episode_id"].isin(val_eps)].copy().reset_index(drop=True)
    test_df = df[df["episode_id"].isin(test_eps)].copy().reset_index(drop=True)

    manifest = {
        "split_method": "episode_grouped",
        "total_records": len(df),
        "total_episodes": n_eps,
        "train": {
            "count": len(train_df),
            "episodes": list(train_eps),
            "num_episodes": len(train_eps),
        },
        "validation": {
            "count": len(val_df),
            "episodes": list(val_eps),
            "num_episodes": len(val_eps),
        },
        "test": {
            "count": len(test_df),
            "episodes": list(test_eps),
            "num_episodes": len(test_eps),
        },
    }

    return train_df, val_df, test_df, manifest
