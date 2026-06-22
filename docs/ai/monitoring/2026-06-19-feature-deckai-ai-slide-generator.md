---
phase: monitoring
title: DeckAI - Monitoring và Observability
description: Chiến lược monitoring, metric, alert và incident response cho DeckAI
---

# DeckAI - Monitoring và Observability

## Metric quan trọng

### Metric hiệu năng
- API response time theo endpoint.
- Tỷ lệ request thành công/thất bại.
- Thời gian tạo outline bằng AI.
- Thời gian tạo slide bằng AI.
- Thời gian export PPTX.
- CPU, memory và disk usage của backend.

### Metric sản phẩm
- Số user đăng ký.
- Số deck được tạo.
- Số lần generate outline.
- Số lần generate slide.
- Số lần regenerate slide.
- Số lần export PPTX.
- Tỷ lệ flow hoàn tất từ create deck đến export.

### Metric lỗi
- Auth failure rate.
- AI generation failure rate.
- Invalid AI JSON response count.
- PPTX export failure rate.
- Unauthorized access attempt count.
- Backend exception count.

## Công cụ monitoring
- Application monitoring/APM tùy nền tảng deploy.
- Log aggregation từ backend.
- MongoDB Atlas monitoring cho database.
- Frontend analytics hoặc error tracking nếu được thêm.
- Uptime monitoring cho backend health endpoint.

## Chiến lược logging
- Dùng structured logging cho backend.
- Log request id, user id khi an toàn, endpoint, status code và duration.
- Không log password, JWT, Gemini API key hoặc nội dung nhạy cảm.
- Log AI failure với metadata đủ debug nhưng tránh lưu prompt chứa dữ liệu nhạy cảm nếu chưa có chính sách rõ ràng.
- Thiết lập log retention phù hợp với môi trường.

## Alert và notification

### Alert critical
- AI failure rate tăng cao trong thời gian ngắn -> kiểm tra Gemini API, prompt validation và quota.
- Export PPTX failure rate cao -> kiểm tra export service, file storage và memory.
- Unauthorized access attempt tăng bất thường -> kiểm tra abuse hoặc lỗi auth.
- Backend health check fail -> rollback hoặc restart service.

### Alert warning
- API latency tăng vượt ngưỡng.
- MongoDB connection error xuất hiện lặp lại.
- Gemini response invalid JSON tăng.
- Disk usage cao nếu lưu file export trên server.

## Dashboard
- System health dashboard: uptime, latency, error rate, CPU, memory.
- AI operations dashboard: outline generation, slide generation, regeneration success/failure.
- Export dashboard: số export, thời gian export, lỗi export.
- Product dashboard: user, deck, preview và export funnel.

## Incident Response

### Quy trình incident
1. Phát hiện và phân loại mức độ.
2. Xác định phạm vi ảnh hưởng: auth, AI, editor, export hoặc database.
3. Kiểm tra log, metric và thay đổi deploy gần nhất.
4. Mitigate: rollback, disable feature tạm thời, tăng rate limit hoặc restart service.
5. Ghi post-mortem và tạo task phòng ngừa.

### Đường leo thang
- Lỗi bảo mật hoặc mất dữ liệu: xử lý ngay ở mức critical.
- Lỗi AI/Export không làm mất dữ liệu: xử lý high hoặc medium tùy mức ảnh hưởng.
- Lỗi UI nhỏ: xử lý theo backlog.

## Health Checks
- Backend health endpoint trả trạng thái app.
- Dependency check cho MongoDB connection.
- Optional check cho Gemini API nếu không làm tốn quota quá mức.
- Smoke test tự động sau deployment: login, create deck, generate outline mock/staging, export sample deck.
