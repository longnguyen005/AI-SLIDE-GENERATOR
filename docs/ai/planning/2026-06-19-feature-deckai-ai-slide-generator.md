---
phase: planning
title: DeckAI - Kế hoạch triển khai AI Slide Generator
description: Milestone, task breakdown, dependency, rủi ro và hàng đợi task cho AI coding agent
---

# DeckAI - Kế hoạch triển khai AI Slide Generator

## Milestone
- [ ] Milestone 1: Backend JavaScript/Express và frontend JavaScript/CSS thuần được cấu hình với environment loading, routing và database connection.
- [ ] Milestone 2: Authentication và protected frontend routes hoàn tất.
- [ ] Milestone 3: Deck dashboard và deck management hoàn tất.
- [ ] Milestone 4: AI outline generation và outline editor hoàn tất.
- [ ] Milestone 5: Slide generation, editing, reordering và deletion hoàn tất.
- [ ] Milestone 6: Single-slide regeneration và version history hoàn tất.
- [ ] Milestone 7: Presentation preview và PPTX export hoàn tất.
- [ ] Milestone 8: Security, validation, testing và deployment readiness hoàn tất.

## Task Breakdown

### Phase 1: Foundation
- [ ] Task 1.1: Tạo cấu trúc backend JavaScript Express theo MVC trong `Backend/src` gồm `controllers`, `models`, `routes`, `middleware`, `validators`, `services` hỗ trợ và `utils`.
- [ ] Task 1.2: Thêm environment config cho MongoDB URI, JWT secret, Gemini key, CORS origin và server port.
- [ ] Task 1.3: Thêm MongoDB connection bằng Mongoose.
- [ ] Task 1.4: Thêm global error middleware, async handler và API error utility dùng chung.
- [ ] Task 1.5: Tạo cấu trúc frontend Vite React JavaScript trong `Frontend/src`.
- [ ] Task 1.6: Cấu hình CSS thuần, React app shell, API helper bằng `fetch` và app providers nếu cần.

### Phase 2: Authentication
- [ ] Task 2.1: Tạo User model với `fullName`, `email`, `passwordHash`, `avatar`, timestamps.
- [ ] Task 2.2: Implement register endpoint với validation và bcrypt hashing.
- [ ] Task 2.3: Implement login endpoint với password verification và JWT creation.
- [ ] Task 2.4: Implement auth middleware và `GET /api/auth/me`.
- [ ] Task 2.5: Xây Login page và Register page.
- [ ] Task 2.6: Thêm auth store, protected routes và logout behavior.

### Phase 3: Deck Management
- [ ] Task 3.1: Tạo Deck model với metadata, status và embedded outline.
- [ ] Task 3.2: Implement deck CRUD endpoint với ownership check.
- [ ] Task 3.3: Implement dashboard stats endpoint.
- [ ] Task 3.4: Xây Dashboard page với total presentations và recent decks.
- [ ] Task 3.5: Xây My Presentations page với list, open, edit và delete actions.

### Phase 4: AI Outline Workflow
- [ ] Task 4.1: Thêm Gemini configuration và AI service wrapper.
- [ ] Task 4.2: Tạo prompt outline strict JSON và response validation.
- [ ] Task 4.2a: Validate create presentation input: tiếng Anh, tối đa 10 slide và tone thuộc `professional`, `academic`, `simple`, `persuasive`.
- [ ] Task 4.3: Implement `POST /api/decks/:deckId/outline/generate`.
- [ ] Task 4.4: Implement endpoint get/update outline.
- [ ] Task 4.5: Xây Create Presentation form.
- [ ] Task 4.6: Xây Outline Editor với edit, add, delete và rearrange.

### Phase 5: Slide Generation And Editing
- [ ] Task 5.1: Tạo Slide model.
- [ ] Task 5.2: Tạo prompt slide-generation strict JSON và response validation.
- [ ] Task 5.3: Implement `POST /api/decks/:deckId/slides/generate`.
- [ ] Task 5.4: Implement endpoint list, create, update và delete slide.
- [ ] Task 5.5: Implement atomic slide reorder endpoint.
- [ ] Task 5.6: Xây Slide Editor page với thumbnails, editor canvas và properties panel.
- [ ] Task 5.7: Thêm speaker notes editing.

### Phase 6: AI Slide Regeneration
- [ ] Task 6.1: Tạo SlideVersion model.
- [ ] Task 6.2: Lưu current slide version trước khi regeneration.
- [ ] Task 6.3: Implement prompt và endpoint single-slide regeneration.
- [ ] Task 6.4: Implement slide version history endpoint.
- [ ] Task 6.5: Xây Regenerate Slide modal với instruction phổ biến và custom instruction input.

### Phase 7: Preview And PPTX Export
- [ ] Task 7.1: Xây Presentation Preview page với next, previous và full-screen controls.
- [ ] Task 7.2: Tạo ExportHistory model.
- [ ] Task 7.3: Implement PptxGenJS export helper/service và gọi từ export controller với default theme và layout rendering.
- [ ] Task 7.4: Implement endpoint export creation, authorized PPTX stream trực tiếp và ExportHistory metadata. MVP không tạo endpoint tải lại file cũ từ history.
- [ ] Task 7.5: Thêm frontend export button, export progress state và xử lý tải file ngay sau khi export.

### Phase 8: Hardening And Quality
- [ ] Task 8.1: Thêm schema validation cho mọi request body và route params.
- [ ] Task 8.2: Thêm rate limiting cho auth endpoint và AI endpoint.
- [ ] Task 8.3: Thêm loading, empty và error state nhất quán trên frontend.
- [ ] Task 8.4: Thêm backend test cho auth, ownership, deck CRUD, slide reorder, regeneration và export authorization.
- [ ] Task 8.5: Thêm frontend smoke test cho login, create deck, outline edit, slide edit, preview và export.
- [ ] Task 8.6: Thêm deployment documentation và production environment checklist.

## Sprint Breakdown
- [ ] Sprint 1: Foundation và authentication.
- [ ] Sprint 2: Deck dashboard và deck management.
- [ ] Sprint 3: Create presentation và outline workflow.
- [ ] Sprint 4: Slide generation và editor.
- [ ] Sprint 5: Slide regeneration và version history.
- [ ] Sprint 6: Preview, PPTX export và export history.
- [ ] Sprint 7: Security, validation, tests và deployment readiness.

## Dependencies
- Authentication phải hoàn tất trước các feature deck, slide và export được bảo vệ.
- Deck model phải tồn tại trước outline generation.
- Outline persistence phải tồn tại trước slide generation.
- Slide model phải tồn tại trước regeneration, preview và export.
- SlideVersion model phụ thuộc Slide.
- ExportHistory phụ thuộc Deck và chỉ lưu metadata của lần export; không lưu file PPTX vĩnh viễn.
- Gemini API key và MongoDB Atlas URI cần cho full integration testing.

## Timeline và ước lượng
- Phase 1: 1-2 ngày.
- Phase 2: 1-2 ngày.
- Phase 3: 2-3 ngày.
- Phase 4: 2-3 ngày.
- Phase 5: 3-5 ngày.
- Phase 6: 2-3 ngày.
- Phase 7: 2-4 ngày.
- Phase 8: 3-5 ngày.

Tổng MVP ước lượng: 16-27 ngày engineering tập trung, tùy mức UI polish và độ sâu test.

## Rủi ro và giảm thiểu
- Rủi ro: Gemini trả output không hợp lệ hoặc không nhất quán.
  Giảm thiểu: yêu cầu strict JSON, validate response và retry một lần trước khi trả lỗi rõ ràng.
- Rủi ro: Chất lượng PPTX thấp hơn kỳ vọng.
  Giảm thiểu: định nghĩa tập layout nhỏ và default theme trước khi implement export.
- Rủi ro: AI request lâu tạo UX kém.
  Giảm thiểu: hiển thị progress/loading state cho MVP; thêm background job sau.
- Rủi ro: User truy cập deck hoặc export của user khác.
  Giảm thiểu: enforce ownership check trong controller hoặc helper dùng chung cho mọi resource.
- Rủi ro: Scope slide editor phình to vượt MVP.
  Giảm thiểu: giới hạn MVP ở text, notes, layout, ordering, add và delete.
- Rủi ro: Mất dữ liệu khi regeneration hoặc reorder.
  Giảm thiểu: tạo slide version trước AI update và xử lý reorder atomic.

## Tài nguyên cần có
- MongoDB Atlas database.
- Gemini API key.
- JWT secret.
- Node.js và npm environment.
- Frontend và backend deployment target.
- Package PptxGenJS.
- Lựa chọn test framework cho backend và frontend.

## Hàng đợi task cho AI coding agent
- [ ] Agent Task 01: Scaffold backend MVC foundation và environment config.
- [ ] Agent Task 02: Scaffold frontend foundation bằng JavaScript, CSS thuần và API helper bằng `fetch`.
- [ ] Agent Task 03: Implement authentication backend và frontend.
- [ ] Agent Task 04: Implement Deck model, APIs, dashboard và My Presentations page.
- [ ] Agent Task 05: Implement Gemini AI service và outline generation.
- [ ] Agent Task 06: Implement Outline Editor và outline persistence.
- [ ] Agent Task 07: Implement Slide model và slide generation từ outline.
- [ ] Agent Task 08: Implement Slide Editor CRUD, notes và reorder.
- [ ] Agent Task 09: Implement SlideVersion và single-slide regeneration.
- [ ] Agent Task 10: Implement Presentation Preview.
- [ ] Agent Task 11: Implement PPTX export service và export history.
- [ ] Agent Task 12: Thêm validation, rate limiting, security hardening và tests.
- [ ] Agent Task 13: Thêm deployment và production readiness documentation.

## Bước tiếp theo
Chạy `/review-requirements` cho requirements document, sau đó chạy `/review-design` cho design document. Khi cả hai đạt yêu cầu, bắt đầu `/execute-plan` với planning document này.
