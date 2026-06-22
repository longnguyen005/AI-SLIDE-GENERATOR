---
phase: testing
title: DeckAI - Chiến lược kiểm thử
description: Cách tiếp cận kiểm thử, test case và đảm bảo chất lượng cho DeckAI
---

# DeckAI - Chiến lược kiểm thử

## Mục tiêu test coverage
- Unit test cho phần logic mới hoặc thay đổi quan trọng.
- Integration test cho các luồng API chính và xử lý lỗi.
- End-to-end hoặc smoke test cho hành trình người dùng quan trọng.
- Test phải bám theo acceptance criteria trong requirements và design.

## Unit Tests

### Auth Module
- [ ] Test register hash password và không trả `passwordHash`.
- [ ] Test login thành công trả JWT.
- [ ] Test login sai password trả lỗi phù hợp.
- [ ] Test duplicate email bị từ chối.

### Deck và Slide Controllers/Models
- [ ] Test user chỉ lấy được deck của chính mình.
- [ ] Test update/delete deck kiểm tra ownership.
- [ ] Test slide reorder cập nhật đúng `slideNumber`.
- [ ] Test delete slide không làm hỏng thứ tự còn lại.

### Gemini Helper/Service
- [ ] Test parse JSON hợp lệ từ Gemini response.
- [ ] Test response sai schema bị reject.
- [ ] Test retry một lần khi response không hợp lệ.

### Export Controller/Helper
- [ ] Test export load slide đúng thứ tự.
- [ ] Test unauthorized export stream bị chặn.
- [ ] Test ExportHistory được tạo sau export thành công.

## Integration Tests
- [ ] Register -> login -> `GET /api/auth/me`.
- [ ] Create deck -> generate outline -> update outline.
- [ ] Generate slides from outline -> list slides.
- [ ] Update slide -> regenerate slide -> check SlideVersion.
- [ ] Export PPTX -> stream authorized file -> create ExportHistory metadata.
- [ ] User A không truy cập được deck/slide/export của User B.

## End-to-End Tests
- [ ] User đăng ký, tạo deck, tạo outline, chỉnh outline và tạo slide.
- [ ] User chỉnh sửa slide, thêm speaker notes và reorder slide.
- [ ] User regenerate một slide và xác nhận các slide khác không đổi.
- [ ] User mở preview và điều hướng next/previous.
- [ ] User export PPTX và tải file ngay sau khi export.

## Test Data
- Tạo fixture user hợp lệ và user thứ hai để test ownership.
- Tạo fixture deck với outline đã lưu.
- Tạo fixture slide có nhiều layout khác nhau.
- Mock Gemini API trong test để tránh phụ thuộc network.
- Dùng test database riêng hoặc MongoDB memory server nếu phù hợp.

## Báo cáo test và coverage
- Backend nên có script test và coverage riêng.
- Frontend nên có smoke test hoặc component test cho các flow chính.
- Báo cáo những phần chưa đạt coverage và lý do.
- Trước release cần ghi nhận kết quả manual testing.

## Manual Testing
- Kiểm tra responsive UI trên desktop và mobile.
- Kiểm tra loading, empty và error state.
- Kiểm tra form validation và thông báo lỗi.
- Kiểm tra preview full-screen.
- Kiểm tra file PPTX mở được bằng PowerPoint hoặc ứng dụng tương thích.

## Performance Testing
- Kiểm tra thời gian tạo outline và slide với nhiều slide count khác nhau.
- Kiểm tra export PPTX với deck dài.
- Kiểm tra API dashboard không load dữ liệu quá mức.
- Kiểm tra rate limit cho auth và AI endpoint.

## Bug Tracking
- Phân loại bug theo mức độ: critical, high, medium, low.
- Bug critical: mất dữ liệu, bypass auth, export sai file, app crash.
- Mỗi bug đã fix cần regression test tương ứng.
