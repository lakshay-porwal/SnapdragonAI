"""
VibeGuard NeuroEdge - Model Evaluation and Metrics Suite.
Calculates Accuracy, Precision, Recall, F1-Score, Confusion Matrix,
and RUL Mean Absolute Error (MAE) and Root Mean Squared Error (RMSE).
Strict rule: Calculate real measured metrics, never fabricate.
"""
import numpy as np
import json
import os
from typing import Dict, Any

def evaluate_predictions(
    y_true_cls: np.ndarray,
    y_pred_cls: np.ndarray,
    y_true_rul: np.ndarray,
    y_pred_rul: np.ndarray,
    class_names = ["Normal", "Imbalance", "Misalignment", "Bearing Fault"]
) -> Dict[str, Any]:
    n = len(y_true_cls)
    num_classes = len(class_names)
    
    # Accuracy
    accuracy = float(np.mean(y_true_cls == y_pred_cls))
    
    # Confusion matrix [True, Pred]
    cm = np.zeros((num_classes, num_classes), dtype=int)
    for t, p in zip(y_true_cls, y_pred_cls):
        cm[t, p] += 1
        
    # Class-wise Precision, Recall, F1
    class_metrics = {}
    f1_list = []
    precision_list = []
    recall_list = []
    
    for i, name in enumerate(class_names):
        tp = cm[i, i]
        fp = np.sum(cm[:, i]) - tp
        fn = np.sum(cm[i, :]) - tp
        
        prec = float(tp / (tp + fp)) if (tp + fp) > 0 else 0.0
        rec = float(tp / (tp + fn)) if (tp + fn) > 0 else 0.0
        f1 = float(2 * prec * rec / (prec + rec)) if (prec + rec) > 0 else 0.0
        
        class_metrics[name] = {
            "precision": round(prec, 4),
            "recall": round(rec, 4),
            "f1_score": round(f1, 4),
            "support": int(np.sum(cm[i, :]))
        }
        precision_list.append(prec)
        recall_list.append(rec)
        f1_list.append(f1)
        
    macro_f1 = float(np.mean(f1_list))
    macro_precision = float(np.mean(precision_list))
    macro_recall = float(np.mean(recall_list))
    
    # RUL Metrics
    rul_mae = float(np.mean(np.abs(y_true_rul - y_pred_rul)))
    rul_rmse = float(np.sqrt(np.mean((y_true_rul - y_pred_rul) ** 2)))
    
    results = {
        "sample_count": n,
        "accuracy": round(accuracy, 4),
        "macro_precision": round(macro_precision, 4),
        "macro_recall": round(macro_recall, 4),
        "macro_f1": round(macro_f1, 4),
        "class_breakdown": class_metrics,
        "confusion_matrix": cm.tolist(),
        "rul_mae": round(rul_mae, 4),
        "rul_rmse": round(rul_rmse, 4)
    }
    return results

if __name__ == "__main__":
    # Test evaluation
    y_t = np.array([0, 1, 2, 3, 0, 1, 2, 3])
    y_p = np.array([0, 1, 2, 3, 0, 1, 2, 3])
    r_t = np.array([0.9, 0.7, 0.4, 0.1, 0.95, 0.65, 0.35, 0.15])
    r_p = np.array([0.88, 0.72, 0.41, 0.09, 0.94, 0.67, 0.33, 0.14])
    res = evaluate_predictions(y_t, y_p, r_t, r_p)
    print(json.dumps(res, indent=2))
