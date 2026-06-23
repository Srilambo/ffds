"""
FFDS MobileNetV2 Transfer-Learning Training Script

Trains a 3-class freshness classifier (Fresh / Borderline / Spoiled)
using a frozen MobileNetV2 base and a custom classification head.

Expected data layout:
  /data/
    fresh/
    borderline/
    spoiled/

Environment variables: none required (paths are CLI args or defaults).
"""

import argparse
import os
from pathlib import Path

import numpy as np
import tensorflow as tf
from sklearn.metrics import classification_report
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint
from tensorflow.keras.layers import Dense, Dropout, GlobalAveragePooling2D
from tensorflow.keras.models import Model
from tensorflow.keras.preprocessing.image import ImageDataGenerator

CLASS_NAMES = ["fresh", "borderline", "spoiled"]
IMG_SIZE = (224, 224)
BATCH_SIZE = 32
EPOCHS = 30
PATIENCE = 5


def build_model(num_classes: int = 3) -> Model:
    """Create MobileNetV2 with frozen base and custom head."""
    base_model = MobileNetV2(
        input_shape=(*IMG_SIZE, 3),
        include_top=False,
        weights="imagenet",
    )
    base_model.trainable = False

    x = base_model.output
    x = GlobalAveragePooling2D()(x)
    x = Dropout(0.3)(x)
    x = Dense(128, activation="relu")(x)
    x = Dropout(0.2)(x)
    outputs = Dense(num_classes, activation="softmax")(x)

    model = Model(inputs=base_model.input, outputs=outputs)
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=1e-4),
        loss="categorical_crossentropy",
        metrics=["accuracy"],
    )
    return model


def create_generators(data_dir: str, batch_size: int = BATCH_SIZE):
    """Build train/val/test generators with augmentation on training set."""
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
        data_dir,
        target_size=IMG_SIZE,
        batch_size=batch_size,
        class_mode="categorical",
        classes=CLASS_NAMES,
        subset="training",
        shuffle=True,
        seed=42,
    )
    val_gen = train_datagen.flow_from_directory(
        data_dir,
        target_size=IMG_SIZE,
        batch_size=batch_size,
        class_mode="categorical",
        classes=CLASS_NAMES,
        subset="validation",
        shuffle=False,
        seed=42,
    )
    test_gen = test_datagen.flow_from_directory(
        data_dir,
        target_size=IMG_SIZE,
        batch_size=batch_size,
        class_mode="categorical",
        classes=CLASS_NAMES,
        shuffle=False,
    )
    return train_gen, val_gen, test_gen


def main():
    parser = argparse.ArgumentParser(description="Train FFDS MobileNetV2 model")
    parser.add_argument(
        "--data-dir",
        default="./data",
        help="Root directory with fresh/borderline/spoiled subfolders",
    )
    parser.add_argument(
        "--output",
        default="./model/ffds_mobilenetv2.h5",
        help="Path to save the best model",
    )
    parser.add_argument(
        "--epochs",
        type=int,
        default=EPOCHS,
        help="Number of epochs to train",
    )
    parser.add_argument(
        "--batch-size",
        type=int,
        default=BATCH_SIZE,
        help="Batch size for training",
    )
    parser.add_argument(
        "--patience",
        type=int,
        default=PATIENCE,
        help="Early stopping patience",
    )
    args = parser.parse_args()

    data_dir = args.data_dir
    output_path = args.output
    epochs = args.epochs
    batch_size = args.batch_size
    patience = args.patience
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    if not Path(data_dir).exists():
        print(f"Warning: data directory '{data_dir}' not found.")
        print("Create /data/fresh, /data/borderline, /data/spoiled with images.")
        return

    print("Loading datasets...")
    train_gen, val_gen, test_gen = create_generators(data_dir, batch_size=batch_size)

    print("Building model...")
    model = build_model(num_classes=len(CLASS_NAMES))

    callbacks = [
        EarlyStopping(
            monitor="val_accuracy",
            patience=patience,
            restore_best_weights=True,
            verbose=1,
        ),
        ModelCheckpoint(
            output_path,
            monitor="val_accuracy",
            save_best_only=True,
            verbose=1,
        ),
    ]

    print("Training...")
    model.fit(
        train_gen,
        epochs=epochs,
        validation_data=val_gen,
        callbacks=callbacks,
    )

    print("\nEvaluating on test split...")
    test_gen.reset()
    y_pred_probs = model.predict(test_gen, verbose=1)
    y_pred = np.argmax(y_pred_probs, axis=1)
    y_true = test_gen.classes
    target_names = [c.capitalize() for c in CLASS_NAMES]

    print("\nClassification Report:")
    print(classification_report(y_true, y_pred, target_names=target_names))

    test_loss, test_acc = model.evaluate(test_gen, verbose=0)
    print(f"\nTest accuracy: {test_acc * 100:.2f}%")
    print(f"Model saved to: {output_path}")


if __name__ == "__main__":
    main()
