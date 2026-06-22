---
phase: deployment
title: DeckAI - Chiến lược triển khai
description: Quy trình deployment, hạ tầng và release cho DeckAI
---

# DeckAI - Chiến lược triển khai

## Hạ tầng
- Frontend khuyến nghị deploy lên Vercel.
- Backend khuyến nghị deploy lên Render hoặc Railway.
- Database dùng MongoDB Atlas.
- File PPTX export trong MVP được stream trực tiếp khi tải; chỉ lưu metadata trong ExportHistory.
- Cần tách môi trường development, staging và production.

## Deployment Pipeline

### Build Process
- Backend: cài dependencies, chạy syntax/import check JavaScript và chạy test.
- Frontend: cài dependencies, chạy lint/test nếu có, build Vite, kiểm tra asset output.
- Cấu hình environment theo từng môi trường.

### CI/CD Pipeline
- Chạy backend syntax/import check, frontend lint và test trước khi build/deploy.
- Chạy backend tests và frontend smoke tests.
- Chỉ deploy khi test pass.
- Production deployment nên có bước xác nhận hoặc protected branch.

## Cấu hình môi trường

### Development
- Dùng local frontend và backend dev server.
- Backend dùng MongoDB Atlas dev database hoặc local MongoDB.
- Gemini API key có quota riêng cho dev nếu có thể.

### Staging
- Dùng database staging riêng.
- CORS chỉ cho staging frontend origin.
- Dùng để test full flow trước production.

### Production
- Dùng MongoDB Atlas production database.
- JWT secret mạnh và quản lý bằng secret store của nền tảng deploy.
- Gemini API key production không dùng chung với local nếu có thể.
- Bật monitoring, logging và alert.

## Các bước deployment
1. Kiểm tra checklist trước deployment: env vars, test pass, build pass, migration/index sẵn sàng.
2. Deploy backend.
3. Deploy frontend với API base URL production.
4. Kiểm tra health endpoint.
5. Chạy smoke test: login, create deck, generate outline, generate slide, preview, export.
6. Theo dõi log và metric sau release.

## Database Migrations
- MongoDB schema thay đổi chủ yếu qua Mongoose model, nhưng vẫn cần kiểm soát index và data migration.
- Tạo index cho email, deck ownership và slide order trước production traffic.
- Backup database trước migration có rủi ro.
- Nếu migration thất bại, rollback app version và restore dữ liệu nếu cần.

## Quản lý secrets
- Không commit `.env`.
- Lưu secret trong environment variables hoặc secret manager của deployment platform.
- Secret quan trọng: `MONGODB_URI`, `JWT_SECRET`, `GEMINI_API_KEY`, `CORS_ORIGIN`.
- Có kế hoạch rotate JWT secret và Gemini key khi bị lộ.

## Rollback Plan
- Rollback khi login lỗi diện rộng, AI generation làm hỏng dữ liệu, export sai quyền hoặc app crash.
- Giữ bản build trước đó để rollback nhanh.
- Nếu schema/data migration đã chạy, cần xác định migration có backward-compatible không.
- Thông báo cho team/stakeholder nếu production incident ảnh hưởng người dùng.
