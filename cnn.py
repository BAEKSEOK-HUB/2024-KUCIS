import os
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from PIL import Image, ImageDraw, ImageFont
import tensorflow as tf
from sklearn.model_selection import train_test_split
from IPython.display import display  # 코랩에서 이미지 표시를 위한 모듈

# 1. Google Drive 마운트 (이미 마운트된 경우 force_remount 사용)
from google.colab import drive
drive.mount('/content/drive', force_remount=True)

# 2. 데이터셋 불러오기
dataset_path = '/content/drive/MyDrive/okt/combined_labeled_dataset_with_transformed_rows.csv'  # 데이터셋 경로
df = pd.read_csv(dataset_path)

# 3. 텍스트를 이미지로 변환하는 함수 정의
def text_to_image(text, font_path='/content/drive/MyDrive/wfonts/gulim.ttc', font_size=50, text_color=(0, 0, 0), bg_color=(255, 255, 255), img_size=(224, 224)):
    """텍스트를 이미지로 변환하고 크기를 고정하는 함수"""
    # 임시 이미지 생성 (텍스트 크기 측정을 위한 더미 이미지)
    img = Image.new('RGB', (1, 1), color=bg_color)
    d = ImageDraw.Draw(img)

    # 폰트 설정 (유니코드 및 한글 지원 폰트 사용)
    try:
        font = ImageFont.truetype(font_path, font_size)
    except IOError:
        font = ImageFont.load_default()  # 폰트를 찾지 못하면 기본 폰트 사용

    # 텍스트 크기 측정
    text_bbox = d.textbbox((0, 0), text, font=font)
    text_width = text_bbox[2] - text_bbox[0]
    text_height = text_bbox[3] - text_bbox[1]

    # 텍스트 크기에 맞는 새로운 이미지 생성 (여유 공간 추가)
    padding = 10  # 텍스트 주변에 여유 공간 추가
    total_width = text_width + 2 * padding
    total_height = text_height + 2 * padding
    img = Image.new('RGB', (total_width, total_height), color=bg_color)
    d = ImageDraw.Draw(img)

    # 텍스트를 이미지에 그리기
    d.text((padding, padding), text, fill=text_color, font=font)

    # 이미지를 고정 크기로 리사이즈
    img = img.resize(img_size)

    return np.array(img)

# 4. 텍스트 데이터를 이미지로 변환
X_images = np.array([text_to_image(text) for text in df['Word']])
y_labels = np.array(df['Label'])

# 5. 샘플로 몇 개의 이미지를 출력하여 확인
def show_sample_images(X_images, y_labels, sample_count=5):
    plt.figure(figsize=(10, 10))
    for i in range(sample_count):
        plt.subplot(1, sample_count, i + 1)
        plt.imshow(X_images[i])
        plt.title(f"Label: {y_labels[i]}")
        plt.axis('off')
    plt.show()

# 6. 샘플 이미지 확인
show_sample_images(X_images, y_labels, sample_count=5)

# 7. 학습 및 테스트 데이터셋 분할
X_train, X_test, y_train, y_test = train_test_split(X_images, y_labels, test_size=0.2, random_state=42)

# 8. CNN 모델 구성 (Functional API 사용)
inputs = tf.keras.Input(shape=(224, 224, 3))
x = tf.keras.layers.Conv2D(32, (3, 3), activation='relu', name="conv1")(inputs)
x = tf.keras.layers.MaxPooling2D((2, 2))(x)
x = tf.keras.layers.Conv2D(64, (3, 3), activation='relu', name="conv2")(x)
x = tf.keras.layers.MaxPooling2D((2, 2))(x)
x = tf.keras.layers.Conv2D(128, (3, 3), activation='relu', name="conv3")(x)
x = tf.keras.layers.MaxPooling2D((2, 2))(x)
x = tf.keras.layers.Flatten()(x)
x = tf.keras.layers.Dense(128, activation='relu')(x)
outputs = tf.keras.layers.Dense(1, activation='sigmoid')(x)

model = tf.keras.Model(inputs, outputs)

# 9. 모델 컴파일
model.compile(optimizer='adam',
              loss='binary_crossentropy',
              metrics=['accuracy'])

# 8. Grad-CAM 구현을 위한 함수 (자동으로 마지막 컨볼루션 레이어 찾기)
def find_last_conv_layer(model):
    # 모델에서 컨볼루션 레이어 목록 추출
    for layer in reversed(model.layers):
        if 'conv' in layer.name:
            return layer.name
    raise ValueError("No convolutional layer found in the model.")

def make_gradcam_heatmap(img_array, model, last_conv_layer_name, pred_index=None):
    grad_model = tf.keras.Model([model.inputs], [model.get_layer(last_conv_layer_name).output, model.output])

    with tf.GradientTape() as tape:
        last_conv_layer_output, preds = grad_model(img_array)
        if pred_index is None:
            pred_index = tf.argmax(preds[0])
        class_channel = preds[:, pred_index]

    grads = tape.gradient(class_channel, last_conv_layer_output)
    pooled_grads = tf.reduce_mean(grads, axis=(0, 1, 2))
    last_conv_layer_output = last_conv_layer_output[0]
    heatmap = last_conv_layer_output @ pooled_grads[..., tf.newaxis]
    heatmap = tf.squeeze(heatmap)
    heatmap = tf.maximum(heatmap, 0) / tf.math.reduce_max(heatmap)
    return heatmap.numpy()

# Grad-CAM을 이미지에 적용하고 시각화하는 함수 (밝기 조정)
def display_gradcam(img_array, heatmap, alpha=0.6):
    img = img_array[0]

    # 히트맵을 정규화 및 밝기 조정
    heatmap = np.uint8(255 * heatmap)
    heatmap = np.expand_dims(heatmap, axis=-1)
    heatmap = np.tile(heatmap, [1, 1, 3])

    # 히트맵을 원본 이미지 크기에 맞게 리사이즈
    heatmap = tf.image.resize(heatmap, (img.shape[0], img.shape[1]))

    # 밝기를 더 명확하게 하기 위해 히트맵과 원본 이미지 합성
    superimposed_img = heatmap * alpha + img
    superimposed_img = np.clip(superimposed_img, 0, 255).astype('uint8')

    # 이미지를 출력
    plt.figure(figsize=(6, 6))
    plt.imshow(superimposed_img)
    plt.axis('off')
    plt.show()

# Grad-CAM 시각화 콜백 함수
class GradCAMCallback(tf.keras.callbacks.Callback):
    def on_epoch_end(self, epoch, logs=None):
        last_conv_layer_name = find_last_conv_layer(model)  # 마지막 Conv 레이어 자동 추출
        sample_image = np.expand_dims(X_test[0], axis=0) / 255.0  # 테스트 데이터의 첫 번째 이미지
        heatmap = make_gradcam_heatmap(sample_image, model, last_conv_layer_name)  # 마지막 Conv 레이어 사용
        print(f"Epoch {epoch+1}: Grad-CAM 시각화")
        display_gradcam(sample_image, heatmap)

# 9. 모델 학습 (에포크 수 5로 줄임, Grad-CAM 시각화 콜백 추가)
history = model.fit(X_train, y_train, epochs=5, validation_data=(X_test, y_test), callbacks=[GradCAMCallback()])

# 10. 학습 결과 시각화
plt.plot(history.history['accuracy'], label='Accuracy')
plt.plot(history.history['val_accuracy'], label='Validation Accuracy')
plt.legend()
plt.show()

plt.plot(history.history['loss'], label='Loss')
plt.plot(history.history['val_loss'], label='Validation Loss')
plt.legend()
plt.show()

# 11. 모델 평가
test_loss, test_acc = model.evaluate(X_test, y_test)
print(f'Test accuracy: {test_acc}')

# 12. 테스트를 위한 사용자 입력 함수 (Grad-CAM 시각화 포함)
def test_model_on_input():
    last_conv_layer_name = find_last_conv_layer(model)  # 마지막 Conv 레이어 자동 추출
    while True:
        user_input = input("Enter a word to test (or 0 to exit): ")
        if user_input == '0':
            print("Exiting.")
            break
        else:
            input_image = np.array([text_to_image(user_input)])
            input_image = input_image / 255.0  # 스케일링
            prediction = model.predict(input_image)
            heatmap = make_gradcam_heatmap(input_image, model, last_conv_layer_name)
            display_gradcam(input_image, heatmap)

            if prediction > 0.5:
                print(f"The word '{user_input}' is likely a curse word.")
            else:
                print(f"The word '{user_input}' is likely not a curse word.")

# 13. 사용자가 직접 테스트
test_model_on_input()
