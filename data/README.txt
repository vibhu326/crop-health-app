Put your training dataset here, one folder per class, e.g.
  data/PlantVillage/Tomato___Late_blight/img001.jpg
  data/PlantVillage/Tomato___healthy/img002.jpg
The public "PlantVillage" leaf dataset (available on Kaggle) uses exactly this layout.
Then run:  python training/train.py --data data/PlantVillage --epochs 5
