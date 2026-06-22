---
phase: implementation
title: DeckAI - Hướng dẫn triển khai
description: Ghi chú kỹ thuật, pattern và guideline code cho quá trình triển khai DeckAI
---

# DeckAI - Hướng dẫn triển khai

## Thiết lập môi trường phát triển
- Cài Node.js và npm tương thích với Vite, Express và backend JavaScript thuần.
- Chuẩn bị MongoDB Atlas connection string.
- Chuẩn bị Gemini API key.
- Tạo file environment cho backend với `MONGODB_URI`, `JWT_SECRET`, `GEMINI_API_KEY`, `CORS_ORIGIN` và `PORT`.
- Tạo file environment cho frontend với base URL của backend API.

## Cấu trúc code
- Backend đặt trong `Backend/src`.
- Frontend đặt trong `Frontend/src` và viết bằng JavaScript/JSX với CSS thuần.
- Backend tổ chức theo mô hình MVC: `routes`, `controllers`, `models`, `middleware`, `validators`, `utils` và `services` hỗ trợ.
- `routes` khai báo endpoint và middleware.
- `controllers` xử lý request/response, nghiệp vụ chính và ownership check.
- `models` chứa Mongoose schema, indexes và validation cơ bản.
- `views` trong REST API là JSON response/DTO; MVP không dùng server-rendered view.
- `services` chỉ dùng cho tích hợp kỹ thuật như Gemini và PptxGenJS, không phải tầng nghiệp vụ chính.
- Frontend chia theo `pages`, `components`, `services`, `stores` và `styles`.
- Không dùng TypeScript trong backend hoặc frontend. Backend dùng `.js`; frontend dùng `.jsx`, `.js` và `.css`, không dùng TailwindCSS.

## Ghi chú triển khai

### Core Features
- Authentication: dùng bcrypt để hash password và JWT cho protected routes.
- Deck management: mọi query deck phải filter theo `userId` của user hiện tại.
- Create presentation: validate tối đa 10 slide, chỉ hỗ trợ tiếng Anh và tone `professional`, `academic`, `simple`, `persuasive`.
- Outline generation: tạo deck draft trước, sau đó lưu outline vào deck.
- Slide generation: tạo slide từ outline đã lưu, không phụ thuộc trực tiếp vào dữ liệu tạm trên frontend.
- Slide regeneration: tạo SlideVersion trước khi update slide được chọn.
- PPTX export: chỉ export slide thuộc deck của user hiện tại và render theo thứ tự `slideNumber`.
- Export MVP: stream file PPTX trực tiếp về client và chỉ lưu ExportHistory metadata, không lưu file PPTX vĩnh viễn.

### Pattern và best practices
- Route chỉ map endpoint đến controller.
- Controller xử lý flow nghiệp vụ, gọi model và trả JSON response.
- Mongoose model không nên chứa logic phức tạp ngoài schema/index cơ bản.
- Gemini service phải validate JSON trước khi controller lưu dữ liệu.
- Frontend service API nên tách khỏi component để component tập trung vào UI state.
- MVP có thể dùng React state cho auth/session/editor state; nếu state phức tạp hơn, có thể bổ sung Zustand sau. State client không thay thế nguồn dữ liệu chính trong MongoDB.

## Điểm tích hợp
- Frontend MVP gọi backend bằng `fetch` với base URL và JWT trong Authorization header. Có thể tách Axios client/interceptor sau nếu cần.
- Backend kết nối MongoDB Atlas bằng Mongoose.
- Backend controller gọi Gemini thông qua helper/service wrapper.
- Backend controller export dùng PptxGenJS thông qua helper/service export.
- File export trong MVP được stream trực tiếp; không lưu vĩnh viễn trên server.

## Xử lý lỗi
- Dùng error middleware chung cho Express.
- Trả error shape nhất quán, ví dụ `{ message, code, details }`.
- AI failure phải trả lỗi rõ ràng và không ghi dữ liệu không hợp lệ.
- Nếu Gemini trả JSON lỗi format, retry một lần rồi fail có kiểm soát.
- Frontend phải hiển thị trạng thái loading, empty, error và retry khi phù hợp.

## Cân nhắc hiệu năng
- Index các field quan trọng: `User.email`, `Deck.userId`, `Slide.deckId`, `Slide.slideNumber`.
- Query slide theo `deckId` và sort `slideNumber`.
- Tránh load toàn bộ dữ liệu không cần thiết trên dashboard.
- AI request có thể lâu; MVP dùng loading state, production nên dùng background queue.
- Export PPTX có thể tốn CPU; cân nhắc giới hạn slide count và kích thước nội dung.

## Ghi chú bảo mật
- Không lưu password plaintext; dùng `passwordHash`.
- Không gửi Gemini API key ra frontend.
- Validate mọi request body và params.
- Kiểm tra ownership trong controller hoặc helper backend dùng chung, không chỉ ở frontend.
- Rate limit auth và AI endpoints.
- Cấu hình CORS allowlist.
- Export PPTX stream trực tiếp và export history metadata phải kiểm tra user có quyền với deck/export.
