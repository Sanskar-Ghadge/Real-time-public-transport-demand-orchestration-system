import json

notebook_path = r"c:\Users\HP\Desktop\New folder\Real-time public transport demand orchestration system\notebooks\06_event_impact_model.ipynb"

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
            "import xgboost as xgb\n",
            "from sklearn.model_selection import train_test_split\n",
            "from sklearn.metrics import mean_absolute_error, r2_score\n",
            "\n",
            "print(\"Libraries loaded successfully\")"
        ]
    },
    {
        "cell_type": "code",
        "execution_count": None,
        "metadata": {},
        "outputs": [],
        "source": [
            "np.random.seed(42)\n",
            "n_samples = 15000\n",
            "\n",
            "# Event types: 0=concert, 1=cricket match, 2=festival, 3=protest, 4=holiday\n",
            "event_type     = np.random.randint(0, 5, n_samples)\n",
            "\n",
            "# Event size: 0=small, 1=medium, 2=large\n",
            "event_size     = np.random.randint(0, 3, n_samples)\n",
            "\n",
            "# Distance from zone to event in km\n",
            "distance_km    = np.random.uniform(0.1, 10.0, n_samples)\n",
            "\n",
            "# Hours until event starts (0 = happening now)\n",
            "hours_to_event = np.random.uniform(0, 24, n_samples)\n",
            "\n",
            "# Day of week\n",
            "day_of_week    = np.random.randint(0, 7, n_samples)\n",
            "\n",
            "# Build dataframe\n",
            "events_df = pd.DataFrame({\n",
            "    'event_type':     event_type,\n",
            "    'event_size':     event_size,\n",
            "    'distance_km':    distance_km,\n",
            "    'hours_to_event': hours_to_event,\n",
            "    'day_of_week':    day_of_week\n",
            "})\n",
            "\n",
            "print(\"Synthetic dataset created\")\n",
            "print(\"Shape:\", events_df.shape)\n",
            "events_df.head()"
        ]
    },
    {
        "cell_type": "code",
        "execution_count": None,
        "metadata": {},
        "outputs": [],
        "source": [
            "def calculate_multiplier(row):\n",
            "    base = 1.0\n",
            "\n",
            "    # Event size impact\n",
            "    size_boost = {0: 0.2, 1: 0.8, 2: 2.0}\n",
            "    base += size_boost[row['event_size']]\n",
            "\n",
            "    # Event type impact\n",
            "    type_boost = {0: 0.3, 1: 1.0, 2: 1.5, 3: 0.5, 4: 0.2}\n",
            "    base += type_boost[row['event_type']]\n",
            "\n",
            "    # Distance decay — closer = bigger impact\n",
            "    distance_factor = max(0, 1 - (row['distance_km'] / 10))\n",
            "    base *= (1 + distance_factor)\n",
            "\n",
            "    # Time factor — impact strongest 2 hours before event\n",
            "    if row['hours_to_event'] <= 2:\n",
            "        base *= 1.3\n",
            "    elif row['hours_to_event'] <= 6:\n",
            "        base *= 1.1\n",
            "\n",
            "    # Weekend boost\n",
            "    if row['day_of_week'] >= 5:\n",
            "        base *= 1.1\n",
            "\n",
            "    return round(base, 2)\n",
            "\n",
            "events_df['multiplier'] = events_df.apply(calculate_multiplier, axis=1)\n",
            "\n",
            "print(\"Multiplier stats:\")\n",
            "print(events_df['multiplier'].describe())\n",
            "print(\"\\nSample multipliers:\")\n",
            "print(events_df[['event_type','event_size','distance_km','multiplier']].head(10))"
        ]
    },
    {
        "cell_type": "code",
        "execution_count": None,
        "metadata": {},
        "outputs": [],
        "source": [
            "features = ['event_type', 'event_size', 'distance_km', \n",
            "            'hours_to_event', 'day_of_week']\n",
            "\n",
            "X = events_df[features]\n",
            "y = events_df['multiplier']\n",
            "\n",
            "X_train, X_test, y_train, y_test = train_test_split(\n",
            "    X, y, test_size=0.2, random_state=42\n",
            ")\n",
            "\n",
            "model = xgb.XGBRegressor(\n",
            "    n_estimators=200,\n",
            "    max_depth=6,\n",
            "    learning_rate=0.1,\n",
            "    random_state=42\n",
            ")\n",
            "\n",
            "model.fit(X_train, y_train)\n",
            "print(\"XGBoost model trained successfully\")"
        ]
    },
    {
        "cell_type": "code",
        "execution_count": None,
        "metadata": {},
        "outputs": [],
        "source": [
            "y_pred = model.predict(X_test)\n",
            "\n",
            "mae = mean_absolute_error(y_test, y_pred)\n",
            "r2  = r2_score(y_test, y_pred)\n",
            "\n",
            "print(\"MAE:\", round(mae, 4))\n",
            "print(\"R2 Score:\", round(r2, 4))\n",
            "print(\"Accuracy:\", round(r2 * 100, 2), \"%\")"
        ]
    },
    {
        "cell_type": "code",
        "execution_count": None,
        "metadata": {},
        "outputs": [],
        "source": [
            "# Test 1 — Large festival very close (should be HIGH multiplier > 3.0)\n",
            "large_local = pd.DataFrame([{\n",
            "    'event_type': 2,      # festival\n",
            "    'event_size': 2,      # large\n",
            "    'distance_km': 0.3,   # very close\n",
            "    'hours_to_event': 1,  # starting soon\n",
            "    'day_of_week': 6      # Sunday\n",
            "}])\n",
            "pred1 = model.predict(large_local)[0]\n",
            "print(\"Large local festival multiplier:\", round(pred1, 2),\n",
            "      \"\u2705 HIGH\" if pred1 > 3.0 else \"\u274c Should be > 3.0\")\n",
            "\n",
            "# Test 2 — Small distant event (should be LOW multiplier ~1.0)\n",
            "small_distant = pd.DataFrame([{\n",
            "    'event_type': 0,      # concert\n",
            "    'event_size': 0,      # small\n",
            "    'distance_km': 9.5,   # very far\n",
            "    'hours_to_event': 20, # far away in time\n",
            "    'day_of_week': 2      # Wednesday\n",
            "}])\n",
            "pred2 = model.predict(small_distant)[0]\n",
            "print(\"Small distant event multiplier:\", round(pred2, 2),\n",
            "      \"\u2705 LOW\" if pred2 < 1.5 else \"\u274c Should be ~1.0\")"
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
            "with open('../models/saved/event_model.pkl', 'wb') as f:\n",
            "    pickle.dump(model, f)\n",
            "\n",
            "print(\"Event model saved to models/saved/event_model.pkl\")"
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

print("Notebook 6 successfully written!")
