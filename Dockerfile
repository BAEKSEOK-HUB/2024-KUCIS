# 베이스 이미지로 Python 3.9을 사용
FROM python:3.9-slim

# 작업 디렉토리 설정
WORKDIR /app

# 요구 사항 파일을 컨테이너로 복사
COPY requirements.txt .

# 필요한 패키지 설치
RUN pip install --no-cache-dir -r requirements.txt

# 코드 파일을 컨테이너로 복사
COPY . .

# 애플리케이션 실행
CMD ["python", "cnn.py"]
