import json

notebook_path = r"c:\Users\HP\Desktop\New folder\Real-time public transport demand orchestration system\notebooks\05_anomaly_detection.ipynb"

cells = [
    {
        "cell_type": "code",
        "execution_count": None,
        "metadata": {},
        "outputs": [],
        "source": [
            "import pandas as pd\n",
            "import numpy as np\n",
            "import pickle\n",
            "import os\n",
            "from sklearn.ensemble import IsolationForest\n",
            "from sklearn.preprocessing import StandardScaler\n",
            "\n",
            "df = pd.read_csv('../data/processed/combined_dataset_small.csv')\n",
            "print(\"Shape:\", df.shape)\n",
            "df.head()"
        ]
    },
    {
        "cell_type": "code",
        "execution_count": None,
        "metadata": {},
        "outputs": [],
        "source": [
            "features = ['hour', 'demand', 'is_weekend']\n",
            "\n",
            "X = df[features]\n",
            "print(\"Features shape:\", X.shape)\n",
            "print(X.describe())"
        ]
    },
    {
        "cell_type": "code",
        "execution_count": None,
        "metadata": {},
        "outputs": [],
        "source": [
            "scaler = StandardScaler()\n",
            "X_scaled = scaler.fit_transform(X)\n",
            "print(\"Scaling complete\")\n",
            "print(\"Mean:\", X_scaled.mean(axis=0))\n",
            "print(\"Std:\", X_scaled.std(axis=0))"
        ]
    },
    {
        "cell_type": "code",
        "execution_count": None,
        "metadata": {},
        "outputs": [],
        "source": [
            "model = IsolationForest(\n",
            "    contamination=0.05,\n",
            "    n_estimators=100,\n",
            "    random_state=42\n",
            ")\n",
            "\n",
            "model.fit(X_scaled)\n",
            "print(\"Anomaly model trained successfully\")"
        ]
    },
    {
        "cell_type": "code",
        "execution_count": None,
        "metadata": {},
        "outputs": [],
        "source": [
            "# Test 1 — Normal rush hour (should be NORMAL = 1)\n",
            "normal_sample = scaler.transform([[8, 15.0, 0]])\n",
            "result_normal = model.predict(normal_sample)\n",
            "print(\"Rush hour 8AM weekday prediction:\", \n",
            "      \"NORMAL \u2705\" if result_normal[0] == 1 else \"ANOMALY \u274c\")\n",
            "\n",
            "# Test 2 — Midnight crowd surge (should be ANOMALY = -1)\n",
            "anomaly_sample = scaler.transform([[2, 85.0, 0]])\n",
            "result_anomaly = model.predict(anomaly_sample)\n",
            "print(\"Midnight crowd surge prediction:\", \n",
            "      \"ANOMALY \u2705\" if result_anomaly[0] == -1 else \"NORMAL \u274c\")\n",
            "\n",
            "# Test 3 — Normal weekend afternoon (should be NORMAL = 1)\n",
            "weekend_sample = scaler.transform([[14, 12.0, 1]])\n",
            "result_weekend = model.predict(weekend_sample)\n",
            "print(\"Weekend afternoon prediction:\", \n",
            "      \"NORMAL \u2705\" if result_weekend[0] == 1 else \"ANOMALY \u274c\")"
        ]
    },
    {
        "cell_type": "code",
        "execution_count": None,
        "metadata": {},
        "outputs": [],
        "source": [
            "predictions = model.predict(X_scaled)\n",
            "total = len(predictions)\n",
            "anomalies = (predictions == -1).sum()\n",
            "normal = (predictions == 1).sum()\n",
            "\n",
            "print(\"Total rows:\", total)\n",
            "print(\"Normal rows:\", normal)\n",
            "print(\"Anomaly rows:\", anomalies)\n",
            "print(\"Anomaly rate:\", round(anomalies/total * 100, 2), \"%\")"
        ]
    },
    {
        "cell_type": "code",
        "execution_count": None,
        "metadata": {},
        "outputs": [],
        "source": [
            "os.makedirs('../models/saved', exist_ok=True)\n",
            "\n",
            "with open('../models/saved/anomaly_model.pkl', 'wb') as f:\n",
            "    pickle.dump({'model': model, 'scaler': scaler}, f)\n",
            "\n",
            "print(\"Anomaly model saved to models/saved/anomaly_model.pkl\")"
        ]
    }
]

notebook_json = {
    "cells": cells,
    "metadata": {
        "kernelspec": {
            "display_name": "Python 3 (ipykernel)",
            "language": "python",
            "name": "python3"
        },
        "language_info": {
            "name": "python"
        }
    },
    "nbformat": 4,
    "nbformat_minor": 2
}

with open(notebook_path, 'w', encoding='utf-8') as f:
    json.dump(notebook_json, f, indent=1, ensure_ascii=False)

print("Notebook 5 successfully written!")
