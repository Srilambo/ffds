"""
FFDS EfficientNetB0 Transfer-Learning Training Script
======================================================

Phase 1 - Train custom head (base frozen, 15 epochs)
Phase 2 - Fine-tune top 30 layers of EfficientNetB0 (10 epochs, lower LR)

Expected data layout:
  data/
    fresh/        <- fresh food images
    borderline/   <- borderline / slightly off food images
    spoiled/      <- rotten / spoiled food images

Output:
  model/ffds_model.h5        <- saved Keras model
  model/class_names.json     <- ["fresh", "borderline", "spoiled"]

Usage:
  python training/train.py [--data-dir ./data] [--output ./model/ffds_model.h5]
                           [--epochs 15] [--fine-tune-epochs 10]
                           [--batch-size 32] [--img-size 224]
"""

import argparse
import json
import os
from pathlib import Path

import numpy as np
import tensorflow as tf
from sklearn.metrics import classification_report
from tensorflow.keras.applications import EfficientNetB0
from tensorflow.keras.callbacks import (
    EarlyStopping,
    ModelCheckpoint,
    ReduceLROnPlateau,
)
from tensorflow.keras.layers import (
    BatchNormalization,
    Dense,
    Dropout,
    GlobalAveragePooling2D,
)
from tensorflow.keras.models import Model
from tensorflow.keras.preprocessing.image import ImageDataGenerator

# --- Defaults ----------------------------------------------------------------
CLASS_NAMES = ["fresh", "borderline", "spoiled"]
IMG_SIZE = (224, 224)
BATCH_SIZE = 32
EPOCHS = 15            # Phase 1 - head training
FINE_TUNE_EPOCHS = 10  # Phase 2 - fine-tuning
PATIENCE = 5
FINE_TUNE_LAYERS = 30  # how many top layers of EfficientNet to unfreeze


# --- Model -------------------------------------------------------------------
def build_model(num_classes: int = 3, img_size: tuple = IMG_SIZE) -> Model:
    """EfficientNetB0 with frozen base + custom classification head."""
    base = EfficientNetB0(
        input_shape=(*img_size, 3),
        include_top=False,
        weights="imagenet",
    )
    base.trainable = False

    x = base.output
    x = GlobalAveragePooling2D()(x)
    x = BatchNormalization()(x)
    x = Dropout(0.3)(x)
    x = Dense(256, activation="relu")(x)
    x = BatchNormalization()(x)
    x = Dropout(0.2)(x)
    outputs = Dense(num_classes, activation="softmax")(x)

    model = Model(inputs=base.input, outputs=outputs)
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=1e-3),
        loss="categorical_crossentropy",
        metrics=["accuracy"],
    )
    return model


def unfreeze_top_layers(model: Model, n_layers: int, learning_rate: float = 1e-5):
    """Unfreeze last *n_layers* of EfficientNet base for fine-tuning."""
    base = model.layers[0]  # EfficientNetB0 is the first layer
    # Make base trainable then selectively freeze early layers
    base.trainable = True
    for layer in base.layers[:-n_layers]:
        layer.trainable = False

    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=learning_rate),
        loss="categorical_crossentropy",
        metrics=["accuracy"],
    )
    print(f"  Unfroze top {n_layers} layers of EfficientNetB0 for fine-tuning.")


# --- Data Generators ---------------------------------------------------------
def create_generators(data_dir: str, batch_size: int = BATCH_SIZE,
                      img_size: tuple = IMG_SIZE, classes: list = None):
    """Build train/val generators with heavy augmentation on training set."""
    if classes is None:
        classes = CLASS_NAMES

    train_aug = ImageDataGenerator(
        rescale=1.0 / 255,
        rotation_range=20,
        width_shift_range=0.15,
        height_shift_range=0.15,
        horizontal_flip=True,
        vertical_flip=False,
        brightness_range=[0.7, 1.3],
        zoom_range=0.2,
        shear_range=0.1,
        channel_shift_range=20.0,
        fill_mode="nearest",
        validation_split=0.2,
    )
    val_aug = ImageDataGenerator(
        rescale=1.0 / 255,
        validation_split=0.2,
    )

    common = dict(
        directory=data_dir,
        target_size=img_size,
        batch_size=batch_size,
        class_mode="categorical",
        classes=classes,
        seed=42,
    )

    train_gen = train_aug.flow_from_directory(
        **common, subset="training", shuffle=True
    )
    val_gen = val_aug.flow_from_directory(
        **common, subset="validation", shuffle=False
    )
    return train_gen, val_gen


# --- Main ---------------------------------------------------------------------
def main():
    parser = argparse.ArgumentParser(description="Train FFDS EfficientNetB0 model")
    parser.add_argument("--data-dir", default="./data",
                        help="Root dir with fresh/borderline/spoiled subfolders")
    parser.add_argument("--output", default="./model/ffds_model.h5",
                        help="Path to save the best model (.h5)")
    parser.add_argument("--epochs", type=int, default=EPOCHS,
                        help="Phase-1 epochs (head training)")
    parser.add_argument("--fine-tune-epochs", type=int, default=FINE_TUNE_EPOCHS,
                        help="Phase-2 epochs (fine-tuning)")
    parser.add_argument("--batch-size", type=int, default=BATCH_SIZE)
    parser.add_argument("--img-size", type=int, default=224,
                        help="Square image size (default 224)")
    parser.add_argument("--fine-tune-layers", type=int, default=FINE_TUNE_LAYERS,
                        help="Top N layers of EfficientNet to unfreeze in phase 2")
    parser.add_argument("--no-fine-tune", action="store_true",
                        help="Skip fine-tuning phase 2")
    args = parser.parse_args()

    data_dir = args.data_dir
    output_path = args.output
    img_size = (args.img_size, args.img_size)

    # -- Validate data dir -----------------------------------------------------
    data_path = Path(data_dir)
    if not data_path.exists():
        print(f"[ERROR] Data directory not found: {data_dir}")
        print("  Run: python training/download_dataset.py  first")
        return

    found_classes = [c for c in CLASS_NAMES if (data_path / c).is_dir()
                     and any((data_path / c).iterdir())]
    if not found_classes:
        print(f"[ERROR] No class subfolders found in {data_dir}")
        print("  Expected: fresh/, borderline/, spoiled/")
        return

    total_imgs = sum(
        len(list((data_path / c).glob("*"))) for c in found_classes
    )
    print(f"\n{'='*55}")
    print(f"  FFDS Training - EfficientNetB0")
    print(f"{'='*55}")
    print(f"  Data dir    : {data_dir}")
    print(f"  Classes     : {found_classes}")
    print(f"  Total images: {total_imgs:,}")
    print(f"  Image size  : {img_size[0]}x{img_size[1]}")
    print(f"  Batch size  : {args.batch_size}")
    print(f"  Phase-1 eps : {args.epochs}")
    print(f"  Phase-2 eps : {args.fine_tune_epochs}")
    print(f"{'='*55}\n")

    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    # Save class names JSON (needed at inference time)
    class_names_path = Path(output_path).parent / "class_names.json"
    with open(class_names_path, "w") as f:
        json.dump(found_classes, f)
    print(f"  Class names saved -> {class_names_path}")

    # -- Data generators -------------------------------------------------------
    print("\n Loading datasets...")
    train_gen, val_gen = create_generators(
        data_dir, args.batch_size, img_size, found_classes
    )
    print(f"  Train samples: {train_gen.n:,}")
    print(f"  Val   samples: {val_gen.n:,}")

    # -- Phase 1: Head training -------------------------------------------------
    print("\n[Building]  Phase 1 - Training classification head (base frozen)...")
    model = build_model(num_classes=len(found_classes), img_size=img_size)
    model.summary(line_length=80)

    callbacks_p1 = [
        EarlyStopping(monitor="val_accuracy", patience=args.epochs // 3,
                      restore_best_weights=True, verbose=1),
        ModelCheckpoint(output_path, monitor="val_accuracy",
                        save_best_only=True, verbose=1),
        ReduceLROnPlateau(monitor="val_loss", factor=0.5, patience=3,
                          min_lr=1e-6, verbose=1),
    ]

    history1 = model.fit(
        train_gen,
        epochs=args.epochs,
        validation_data=val_gen,
        callbacks=callbacks_p1,
        verbose=1,
    )

    best_p1_acc = max(history1.history.get("val_accuracy", [0]))
    print(f"\n  [OK] Phase 1 best val_accuracy: {best_p1_acc*100:.2f}%")

    # -- Phase 2: Fine-tuning ---------------------------------------------------
    if not args.no_fine_tune and args.fine_tune_epochs > 0:
        print(f"\n[Fine-tuning] Phase 2 - Fine-tuning top {args.fine_tune_layers} layers...")
        unfreeze_top_layers(model, args.fine_tune_layers, learning_rate=1e-5)

        callbacks_p2 = [
            EarlyStopping(monitor="val_accuracy",
                          patience=max(3, args.fine_tune_epochs // 3),
                          restore_best_weights=True, verbose=1),
            ModelCheckpoint(output_path, monitor="val_accuracy",
                            save_best_only=True, verbose=1),
            ReduceLROnPlateau(monitor="val_loss", factor=0.5, patience=3,
                              min_lr=1e-7, verbose=1),
        ]

        history2 = model.fit(
            train_gen,
            epochs=args.fine_tune_epochs,
            validation_data=val_gen,
            callbacks=callbacks_p2,
            verbose=1,
        )

        best_p2_acc = max(history2.history.get("val_accuracy", [0]))
        print(f"\n  [OK] Phase 2 best val_accuracy: {best_p2_acc*100:.2f}%")

    # -- Evaluation -----------------------------------------------------------
    print("\n[Stats] Final evaluation on validation set...")
    val_gen.reset()
    y_pred_probs = model.predict(val_gen, verbose=1)
    y_pred = np.argmax(y_pred_probs, axis=1)
    y_true = val_gen.classes
    target_names = [c.capitalize() for c in found_classes]

    print("\nClassification Report:")
    print(classification_report(y_true, y_pred, target_names=target_names))

    val_loss, val_acc = model.evaluate(val_gen, verbose=0)
    print(f"\n[OK] Final val accuracy : {val_acc*100:.2f}%")
    print(f"   Model saved to      : {output_path}")
    print(f"   Class names saved to: {class_names_path}")


if __name__ == "__main__":
    main()
