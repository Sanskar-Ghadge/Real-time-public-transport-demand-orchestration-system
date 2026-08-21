import pickle
import torch
import torch.nn as nn
import os

# ── LSTM Model Definition ──────────────────────────────────────────
class LSTMDemandModel(nn.Module):
    def __init__(self, input_dim, hidden_dim=64, 
                 num_layers=2, output_dim=1, dropout=0.2):
        super(LSTMDemandModel, self).__init__()
        self.hidden_dim = hidden_dim
        self.num_layers = num_layers
        self.lstm = nn.LSTM(input_dim, hidden_dim, num_layers,
                            batch_first=True, dropout=dropout)
        self.fc1     = nn.Linear(hidden_dim, 16)
        self.dropout = nn.Dropout(dropout)
        self.relu    = nn.ReLU()
        self.fc2     = nn.Linear(16, output_dim)

    def forward(self, x):
        h0 = torch.zeros(self.num_layers, x.size(0), 
                         self.hidden_dim).to(x.device)
        c0 = torch.zeros(self.num_layers, x.size(0), 
                         self.hidden_dim).to(x.device)
        out, _ = self.lstm(x, (h0, c0))
        out = out[:, -1, :]
        out = self.relu(self.fc1(out))
        out = self.dropout(out)
        out = self.fc2(out)
        return out

# ── Model Paths ────────────────────────────────────────────────────
BASE_DIR     = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODELS_DIR   = os.path.join(BASE_DIR, '..', 'models', 'saved')

DEMAND_PATH  = os.path.join(MODELS_DIR, 'demand_model_best.pth')
ANOMALY_PATH = os.path.join(MODELS_DIR, 'anomaly_model.pkl')
EVENT_PATH   = os.path.join(MODELS_DIR, 'event_model.pkl')

# ── Load Demand Model ──────────────────────────────────────────────
def load_demand_model():
    model = LSTMDemandModel(input_dim=9)
    model.load_state_dict(torch.load(DEMAND_PATH, 
                          map_location=torch.device('cpu')))
    model.eval()
    print("[OK] Demand model loaded")
    return model

# ── Load Anomaly Model ─────────────────────────────────────────────
def load_anomaly_model():
    with open(ANOMALY_PATH, 'rb') as f:
        data = pickle.load(f)
    print("[OK] Anomaly model loaded")
    return data['model'], data['scaler']

# ── Load Event Model ───────────────────────────────────────────────
def load_event_model():
    with open(EVENT_PATH, 'rb') as f:
        model = pickle.load(f)
    print("[OK] Event model loaded")
    return model
