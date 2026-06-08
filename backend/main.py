import os

from app import create_app

app = create_app()

if __name__ == '__main__':
    # macOS는 5000 포트를 AirPlay Receiver가 점유함 → PORT 환경변수로 변경 가능
    port = int(os.environ.get('PORT', 5000))
    app.run(debug=True, port=port)
