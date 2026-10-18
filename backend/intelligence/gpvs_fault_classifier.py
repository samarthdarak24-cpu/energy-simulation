"""
GPVS Experimental Photovoltaic Waveform Fault Classifier.
Trained and evaluated on genuine experimental oscilloscope data from GPVS-Faults
(yasinahmadpoor/FaultDiagnosis).
Classifies 8 physical PV electrical states:
  0. fault_free_normal
  1. pv_string_open_circuit
  2. pv_line_to_line_fault
  3. pv_array_open_circuit
  4. pv_high_impedance_ground_fault
  5. pv_cell_degradation
  6. pv_partial_shading
  7. pv_bypass_diode_bridging

Maintains rigorous separation: Does NOT classify battery thermal runaway, grid substation islanding,
or EV charging surges, which are non-PV events modeled separately in the synthetic digital twin.
"""

from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple
import pandas as pd
import numpy as np
from sklearn.ensemble import HistGradientBoostingClassifier
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score


class GPVSFaultClassifier:
    """Classifies high-frequency PV electrical waveform anomalies."""

    FEATURE_NAMES = [
        "pv_current_a", "pv_voltage_v", "pv_power_kw", "dc_bus_voltage_v",
        "current_phase_a", "current_phase_b", "current_phase_c",
        "voltage_phase_a", "voltage_phase_b", "voltage_phase_c",
        "i_rms_abc", "current_frequency_hz", "v_rms_abc", "voltage_frequency_hz"
    ]

    def __init__(self, data_path: Optional[Path] = None):
        self.data_path = data_path or Path("gridheal_synthetic_data/data/processed/gpvs_ingested.csv")
        self.model: Optional[HistGradientBoostingClassifier] = None
        self.classes: List[str] = []
        self.evaluation_results: Dict[str, Any] = {}
        self.is_trained = False

    def train_and_evaluate(self, test_size: float = 0.25, random_state: int = 42) -> Dict[str, Any]:
        """
        Train on stratified multi-operating-mode split and evaluate on held-out test set.
        Also evaluates cross-mode zero-shot generalization to test transferability.
        """
        if not self.data_path.exists():
            from backend.data_ingestion.gpvs_adapter import GPVSFaultsAdapter
            adapter = GPVSFaultsAdapter()
            df = adapter.ingest()
        else:
            df = pd.read_csv(self.data_path)

        X = df[self.FEATURE_NAMES]
        y = df["fault_class"]

        # Stratified train/test split across both operating modes
        from sklearn.model_selection import train_test_split
        stratify_key = df["fault_class"].astype(str) + "_" + df["operating_mode"].astype(str)
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=test_size, random_state=random_state, stratify=stratify_key
        )

        self.model = HistGradientBoostingClassifier(max_iter=100, random_state=random_state)
        self.model.fit(X_train, y_train)
        self.classes = list(self.model.classes_)
        self.is_trained = True

        y_pred = self.model.predict(X_test)
        acc = float(accuracy_score(y_test, y_pred))
        report = classification_report(y_test, y_pred, output_dict=True, zero_division=0)
        cm = confusion_matrix(y_test, y_pred, labels=self.classes).tolist()

        # Cross-operating-mode zero-shot transfer test:
        # Train solely on Limited MPPT, test solely on Maximum MPPT
        lim_mask = df["operating_mode"] == "limited_power_point"
        max_mask = df["operating_mode"] == "maximum_power_point"

        cross_mode_acc = None
        if lim_mask.sum() > 0 and max_mask.sum() > 0:
            clf_lim = HistGradientBoostingClassifier(max_iter=75, random_state=random_state)
            clf_lim.fit(df.loc[lim_mask, self.FEATURE_NAMES], df.loc[lim_mask, "fault_class"])
            y_max_pred = clf_lim.predict(df.loc[max_mask, self.FEATURE_NAMES])
            cross_mode_acc = round(float(accuracy_score(df.loc[max_mask, "fault_class"], y_max_pred)) * 100.0, 2)

        self.evaluation_results = {
            "dataset": "GPVS-Faults Laboratory Waveform Dataset",
            "data_origin": "experimental_lab",
            "total_records": len(df),
            "train_samples": len(X_train),
            "test_samples": len(X_test),
            "classes_evaluated": self.classes,
            "overall_accuracy_pct": round(acc * 100.0, 2),
            "macro_f1": round(report["macro avg"]["f1-score"], 4),
            "weighted_f1": round(report["weighted avg"]["f1-score"], 4),
            "per_class_metrics": {
                cls: {
                    "precision": round(report[cls]["precision"], 4),
                    "recall": round(report[cls]["recall"], 4),
                    "f1_score": round(report[cls]["f1-score"], 4),
                    "support": report[cls]["support"],
                }
                for cls in self.classes if cls in report
            },
            "confusion_matrix": cm,
            "cross_mode_transfer_accuracy_pct": cross_mode_acc,
            "scientific_limitations": [
                "GPVS-Faults specifically tests PV array electrical faults at 100 Hz oscilloscope resolution.",
                "Cross-operating-mode transfer (trained on Limited MPPT, tested on Max MPPT) achieves lower accuracy without multi-mode exposure.",
                "Battery chemical runaway, EV fleet concurrent charging peaks, and external substation trips are NOT measured in GPVS-Faults and belong to the separate SCADA digital twin."
            ]
        }
        return self.evaluation_results

    def predict_sample(self, features_dict: Dict[str, float]) -> Dict[str, Any]:
        """Diagnose a single electrical waveform telemetry sample."""
        if not self.is_trained or self.model is None:
            self.train_and_evaluate()

        sample_vec = np.array([[features_dict.get(fn, 0.0) for fn in self.FEATURE_NAMES]])
        probs = self.model.predict_proba(sample_vec)[0]
        best_idx = int(np.argmax(probs))
        pred_cls = self.classes[best_idx]
        conf = float(probs[best_idx])

        return {
            "model": "HistGradientBoosting (GPVS Experimental Waveform Classifier)",
            "data_origin": "experimental_lab",
            "predicted_fault_class": pred_cls,
            "is_anomaly": pred_cls != "fault_free_normal",
            "confidence": round(conf, 4),
            "probabilities": {cls: round(float(p), 4) for cls, p in zip(self.classes, probs)}
        }


gpvs_fault_classifier = GPVSFaultClassifier()

if __name__ == "__main__":
    results = gpvs_fault_classifier.train_and_evaluate()
    print("GPVS Training & Evaluation Complete:")
    print(f"Accuracy: {results['overall_accuracy_pct']}%")
    print(f"Cross-Mode Transfer: {results['cross_mode_transfer_accuracy_pct']}%")
