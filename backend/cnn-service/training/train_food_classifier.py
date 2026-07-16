"""
FFDS Food Classification Training Script

Trains a food item classifier using the Kaggle dataset structure.
This model identifies specific food items (Apple, Banana, etc.) 
separate from freshness detection.

Expected data layout from Kaggle dataset:
  /kaggle_raw/extracted/Fruits_Vegetables_Dataset(12000)/
    Fruits/
      FreshApple/
      FreshBanana/
      FreshMango/
      FreshOrange/
      FreshStrawberry/
      RottenApple/
      RottenBanana/
      RottenMango/
      RottenOrange/
      RottenStrawberry/
    Vegetables/
      FreshBellpepper/
      FreshCarrot/
      FreshCucumber/
      FreshPotato/
      FreshTomato/
      RottenBellpepper/
      RottenCarrot/
      RottenCucumber/
      RottenPotato/
      RottenTomato/
"""

import argparse
import os
from pathlib import Path

import numpy as np
import tensorflow as tf
from sklearn.metrics import classification_report
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint, ReduceLROnPlateau
from tensorflow.keras.layers import Dense, Dropout, GlobalAveragePooling2D
from tensorflow.keras.models import Model
from tensorflow.keras.preprocessing.image import ImageDataGenerator

# Food classes from the Kaggle dataset
FOOD_CLASSES = [
    'Apple', 'Banana', 'Mango', 'Orange', 'Strawberry',
    'Bellpepper', 'Carrot', 'Cucumber', 'Potato', 'Tomato'
]
IMG_SIZE = (224, 224)
BATCH_SIZE = 32
EPOCHS = 10  # Reduced for faster training
PATIENCE = 3


def build_model(num_classes: int = 10) -> Model:
    """Create MobileNetV2 with frozen base and custom head for food classification."""
    base_model = MobileNetV2(
        input_shape=(*IMG_SIZE, 3),
        include_top=False,
        weights="imagenet",
    )
    base_model.trainable = True
    for layer in base_model.layers[:-30]:
        layer.trainable = False

    x = base_model.output
    x = GlobalAveragePooling2D()(x)
    x = Dropout(0.3)(x)
    x = Dense(128, activation="relu")(x)
    x = Dropout(0.2)(x)
    outputs = Dense(num_classes, activation="softmax")(x)

    model = Model(inputs=base_model.input, outputs=outputs)
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=1e-5),
        loss="categorical_crossentropy",
        metrics=["accuracy"],
    )
    return model


def create_food_data_generators(extract_dir: str):
    """Build train/val/test generators from Kaggle dataset structure."""
    
    # Collect all food images from both Fresh and Rotten folders
    food_data_dir = Path(extract_dir) / "food_data"
    
    if not food_data_dir.exists():
        # Reorganize data into food-specific folders
        print("Reorganizing Kaggle dataset for food classification...")
        food_data_dir.mkdir(parents=True, exist_ok=True)
        
        dataset_root = Path(extract_dir) / "Fruits_Vegetables_Dataset(12000)"
        
        for food_class in FOOD_CLASSES:
            class_dir = food_data_dir / food_class
            class_dir.mkdir(parents=True, exist_ok=True)
            
            # Look for both Fresh and Rotten variants
            for freshness in ['Fresh', 'Rotten']:
                source_folder = None
                if food_class in ['Apple', 'Banana', 'Mango', 'Orange', 'Strawberry']:
                    source_folder = dataset_root / "Fruits" / f"{freshness}{food_class}"
                else:
                    source_folder = dataset_root / "Vegetables" / f"{freshness}{food_class}"
                
                if source_folder and source_folder.exists():
                    # Copy images to food class folder
                    for img_file in source_folder.glob('*'):
                        if img_file.is_file() and img_file.suffix.lower() in {'.jpg', '.jpeg', '.png', '.webp'}:
                            dest_file = class_dir / img_file.name
                            import shutil
                            shutil.copy2(img_file, dest_file)
            
            print(f"  {food_class}: {len(list(class_dir.glob('*')))} images")
    
    train_datagen = ImageDataGenerator(
        rescale=1.0 / 255,
        rotation_range=15,
        horizontal_flip=True,
        brightness_range=[0.8, 1.2],
        zoom_range=0.15,
        validation_split=0.2,
    )
    test_datagen = ImageDataGenerator(rescale=1.0 / 255)

    train_gen = train_datagen.flow_from_directory(
        food_data_dir,
        target_size=IMG_SIZE,
        batch_size=BATCH_SIZE,
        class_mode="categorical",
        classes=FOOD_CLASSES,
        subset="training",
        shuffle=True,
        seed=42,
    )
    val_gen = train_datagen.flow_from_directory(
        food_data_dir,
        target_size=IMG_SIZE,
        batch_size=BATCH_SIZE,
        class_mode="categorical",
        classes=FOOD_CLASSES,
        subset="validation",
        shuffle=False,
        seed=42,
    )
    test_gen = test_datagen.flow_from_directory(
        food_data_dir,
        target_size=IMG_SIZE,
        batch_size=BATCH_SIZE,
        class_mode="categorical",
        classes=FOOD_CLASSES,
        shuffle=False,
    )
    return train_gen, val_gen, test_gen


def main():
    parser = argparse.ArgumentParser(description="Train FFDS Food Classification Model")
    parser.add_argument(
        "--extract-dir",
        default="./kaggle_raw/extracted",
        help="Directory with extracted Kaggle dataset",
    )
    parser.add_argument(
        "--output",
        default="./model/food_classifier.h5",
        help="Path to save the food classification model",
    )
    args = parser.parse_args()

    extract_dir = args.extract_dir
    output_path = args.output
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    if not Path(extract_dir).exists():
        print(f"Warning: extract directory '{extract_dir}' not found.")
        print("Please extract the Kaggle dataset first.")
        return

    print("Loading food classification datasets...")
    train_gen, val_gen, test_gen = create_food_data_generators(extract_dir)

    print("Building food classification model...")
    model = build_model(num_classes=len(FOOD_CLASSES))

    callbacks = [
        EarlyStopping(
            monitor="val_accuracy",
            patience=PATIENCE,
            restore_best_weights=True,
            verbose=1,
        ),
        ModelCheckpoint(
            output_path,
            monitor="val_accuracy",
            save_best_only=True,
            verbose=1,
        ),
        ReduceLROnPlateau(
            monitor="val_loss",
            factor=0.2,
            patience=3,
            min_lr=1e-6,
            verbose=1,
        ),
    ]

    print("Training food classification model...")
    model.fit(
        train_gen,
        epochs=EPOCHS,
        validation_data=val_gen,
        callbacks=callbacks,
    )

    print("\nEvaluating on test split...")
    test_gen.reset()
    y_pred_probs = model.predict(test_gen, verbose=1)
    y_pred = np.argmax(y_pred_probs, axis=1)
    y_true = test_gen.classes

    print("\nClassification Report:")
    print(classification_report(y_true, y_pred, target_names=FOOD_CLASSES))

    test_loss, test_acc = model.evaluate(test_gen, verbose=0)
    print(f"\nTest accuracy: {test_acc * 100:.2f}%")
    print(f"Food classification model saved to: {output_path}")


if __name__ == "__main__":
    main()
