"""Fine-tune MobileNetV3-small on an ImageFolder dataset (e.g. PlantVillage).
Usage:  python training/train.py --data data/PlantVillage --epochs 5
Writes backend/models/crop_model.pt and prints validation accuracy per epoch."""
import argparse, os, torch, torch.nn as nn
from torch.utils.data import DataLoader, Subset, random_split
from torchvision import datasets, models, transforms
here = os.path.dirname(os.path.abspath(__file__))
a = argparse.ArgumentParser(); a.add_argument("--data", required=True); a.add_argument("--epochs", type=int, default=5)
a.add_argument("--out", default=os.path.join(here, "..", "backend", "models", "crop_model.pt")); a = a.parse_args()
norm = transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
tr = transforms.Compose([transforms.Resize((224, 224)), transforms.RandomHorizontalFlip(), transforms.ColorJitter(.2, .2, .2), transforms.ToTensor(), norm])
te = transforms.Compose([transforms.Resize((224, 224)), transforms.ToTensor(), norm])
full, val_full = datasets.ImageFolder(a.data, tr), datasets.ImageFolder(a.data, te)
n = int(.8 * len(full)); tri, vai = random_split(range(len(full)), [n, len(full) - n], generator=torch.Generator().manual_seed(0))
tl = DataLoader(Subset(full, tri.indices), 32, shuffle=True, num_workers=0); vl = DataLoader(Subset(val_full, vai.indices), 64, num_workers=0)
dev = "cuda" if torch.cuda.is_available() else "cpu"
m = models.mobilenet_v3_small(weights=models.MobileNet_V3_Small_Weights.DEFAULT)
m.classifier[3] = nn.Linear(m.classifier[3].in_features, len(full.classes)); m.to(dev)
opt, lf = torch.optim.AdamW(m.parameters(), 1e-3), nn.CrossEntropyLoss()
for ep in range(a.epochs):
    m.train()
    for x, y in tl: opt.zero_grad(); lf(m(x.to(dev)), y.to(dev)).backward(); opt.step()
    m.eval(); ok = tot = 0
    with torch.no_grad():
        for x, y in vl: ok += (m(x.to(dev)).argmax(1).cpu() == y).sum().item(); tot += len(y)
    print(f"epoch {ep+1}/{a.epochs}: validation accuracy {ok/tot:.4f}", flush=True)
os.makedirs(os.path.dirname(a.out), exist_ok=True)
torch.save({"state_dict": m.cpu().state_dict(), "classes": full.classes}, a.out); print("saved", os.path.abspath(a.out))
