---
phase: requirements
title: DeckAI - Yêu cầu AI Slide Generator
description: Yêu cầu, phạm vi và tiêu chí nghiệm thu cho nền tảng tạo bài thuyết trình AI bằng MERN
---

# DeckAI - Yêu cầu AI Slide Generator

## Phát biểu vấn đề
Sinh viên, giảng viên, nhà nghiên cứu và người làm kinh doanh thường mất nhiều thời gian để biến một ý tưởng thành bộ slide có cấu trúc rõ ràng. Quy trình hiện tại thường phải làm thủ công nhiều bước: lập dàn ý, viết nội dung từng slide, định dạng slide, chuẩn bị ghi chú thuyết trình và xuất sang PowerPoint.

DeckAI giải quyết vấn đề này bằng một quy trình tạo bài thuyết trình có AI hỗ trợ: người dùng nhập chủ đề, hệ thống tạo dàn ý, người dùng chỉnh sửa dàn ý, hệ thống tạo slide, người dùng chỉnh sửa thủ công, tái tạo từng slide bằng AI, xem trước bài thuyết trình và xuất ra PPTX.

## Mục tiêu

### Mục tiêu chính
- Tạo bộ slide hoàn chỉnh và có thể chỉnh sửa từ thông tin chủ đề do người dùng cung cấp.
- Giữ quyền kiểm soát cho người dùng thông qua chỉnh sửa dàn ý và chỉnh sửa slide.
- Hỗ trợ tái tạo một slide riêng lẻ mà không ảnh hưởng các slide khác.
- Xuất bài thuyết trình sang PowerPoint bằng PptxGenJS.
- Xây dựng kiến trúc MERN có thể triển khai thực tế và tích hợp Gemini API.

### Mục tiêu phụ
- Cung cấp dashboard và trình chỉnh sửa slide dễ dùng, responsive.
- Lưu deck, slide, phiên bản slide và lịch sử export trong MongoDB.
- Thiết kế hệ thống để có thể mở rộng thêm RAG, upload tài liệu, template, xuất PDF và analytics sau này.

### Không nằm trong MVP
- Cộng tác thời gian thực.
- Thanh toán, gói thuê bao hoặc workspace nhóm.
- Upload PDF/DOCX.
- RAG hoặc vector search.
- Trình thiết kế slide kéo thả nâng cao.
- Tạo hình ảnh, biểu đồ hoặc bảng nếu chưa được bổ sung rõ ràng.
- Link chia sẻ công khai.

## Người dùng mục tiêu
- Sinh viên: tạo slide cho bài tập, dự án và thuyết trình môn học.
- Giảng viên: chuẩn bị tài liệu giảng dạy nhanh hơn.
- Nhà nghiên cứu: tạo deck từ chủ đề nghiên cứu.
- Người làm kinh doanh: tạo bài thuyết trình, báo cáo và đề xuất.

## Yêu cầu chức năng
- FR-01 Xác thực: người dùng có thể đăng ký, đăng nhập, đăng xuất và xem thông tin tài khoản hiện tại. Trong MVP, logout là thao tác xóa JWT/session phía frontend; backend có thể cung cấp endpoint logout trả success nhưng chưa cần token blacklist.
- FR-02 Quản lý deck: người dùng có thể tạo, cập nhật, xóa và xem các deck của chính mình.
- FR-03 Dashboard: người dùng có thể xem tổng số bài thuyết trình, deck gần đây và tạo bài mới.
- FR-04 Tạo dàn ý bằng AI: người dùng có thể tạo outline từ topic, description, language, tone và slide count. Trong MVP, `language` chỉ hỗ trợ English/en.
- FR-05 Chỉnh sửa dàn ý: người dùng có thể sửa, thêm, xóa và sắp xếp lại các section trước khi tạo slide.
- FR-06 Tạo slide bằng AI: hệ thống tạo nội dung slide từ outline đã được duyệt.
- FR-07 Chỉnh sửa slide: người dùng có thể sửa tiêu đề, nội dung dạng text, speaker notes, layout cố định và thứ tự slide. MVP không hỗ trợ rich text, hình ảnh, biểu đồ, bảng hoặc kéo-thả thiết kế tự do.
- FR-08 Quản lý slide: người dùng có thể thêm và xóa slide.
- FR-09 Tái tạo slide bằng AI: người dùng có thể tái tạo chỉ slide đang chọn theo instruction.
- FR-10 Xem trước bài thuyết trình: người dùng có thể xem slide với điều khiển next, previous và full-screen.
- FR-11 Xuất PPTX: người dùng có thể xuất deck sang PPTX và xem lịch sử export metadata. MVP không lưu file PPTX vĩnh viễn và không hỗ trợ tải lại file cũ từ lịch sử export.

## User Stories và use case
- Là sinh viên, tôi muốn tạo bài thuyết trình từ một chủ đề để có bản nháp hoàn chỉnh nhanh chóng.
- Là giảng viên, tôi muốn chỉnh sửa outline trước khi tạo slide để deck khớp với kế hoạch bài giảng.
- Là nhà nghiên cứu, tôi muốn có speaker notes để chuẩn bị phần trình bày cho từng slide.
- Là người dùng kinh doanh, tôi muốn viết lại một slide theo giọng chuyên nghiệp hơn để polish deck mà không mất các chỉnh sửa khác.
- Là người dùng, tôi muốn xuất sang PPTX để trình chiếu hoặc tiếp tục chỉnh sửa trong PowerPoint.

## Quy trình chính
1. Người dùng đăng ký hoặc đăng nhập.
2. Người dùng mở dashboard và chọn tạo bài thuyết trình mới.
3. Người dùng nhập topic, description, language, tone và slide count.
4. Backend tạo draft deck và gọi Gemini để tạo outline.
5. Người dùng chỉnh sửa, thêm, xóa và sắp xếp các section trong outline.
6. Người dùng xác nhận outline và yêu cầu tạo slide.
7. Backend tạo slide từ outline đã lưu.
8. Người dùng chỉnh sửa slide thủ công và có thể tái tạo một slide được chọn.
9. Người dùng xem trước bài thuyết trình.
10. Người dùng xuất deck sang PPTX.

## Tiêu chí thành công
- Người dùng hoàn thành được toàn bộ luồng từ đăng ký đến export PPTX.
- Outline và slide do AI tạo ra có cấu trúc dữ liệu ổn định, lưu được mà không cần xử lý thủ công trên backend.
- Người dùng không thể truy cập, chỉnh sửa, tái tạo, xem trước hoặc export deck không thuộc sở hữu của mình.
- Tái tạo slide phải tạo một version cũ trước khi cập nhật chỉ slide được chọn.
- Export PPTX tạo file `.pptx` có thể tải xuống và có thứ tự slide chính xác.
- Frontend xử lý đầy đủ trạng thái loading, empty và failure cho các thao tác AI.

## Yêu cầu phi chức năng
- Hiệu năng: API thông thường phản hồi nhanh; thao tác AI có thể lâu hơn nhưng phải có loading state rõ ràng.
- Độ tin cậy: lỗi AI không được làm hỏng deck hoặc slide hiện có.
- Bảo mật: mật khẩu phải hash bằng bcrypt; API bảo vệ bằng JWT; mọi input phải được validate.
- Dễ bảo trì: backend dùng mô hình MVC; route điều hướng request đến controller, controller xử lý flow nghiệp vụ, model quản lý dữ liệu MongoDB, response JSON đóng vai trò View của REST API.
- Khả năng mở rộng: kiến trúc phải cho phép thêm background job, RAG, template và export PDF sau này.
- Trải nghiệm người dùng: editor phải responsive, có cơ chế lưu thủ công rõ ràng và cảnh báo khi người dùng rời trang hoặc đổi slide trong lúc còn thay đổi chưa lưu.

## Ràng buộc và giả định
- Frontend dùng React, Vite, JavaScript và CSS thuần. MVP hiện dùng React state và `fetch`; React Router, Axios và Zustand có thể bổ sung sau nếu cần tách routing/API client/state management rõ hơn.
- Backend dùng Node.js, Express.js và JavaScript thuần.
- Backend tổ chức theo mô hình MVC.
- Database là MongoDB Atlas với Mongoose.
- AI provider là Gemini API.
- Export dùng PptxGenJS.
- MVP xác thực bằng JWT và bcrypt.
- Deck trong MVP là private theo từng user.
- Export MVP dùng theme mặc định và layout cố định.
- Response từ AI phải được yêu cầu ở dạng strict JSON và được validate.
- MVP giới hạn tối đa 10 slide cho mỗi deck.
- MVP hỗ trợ chính thức tiếng Anh; frontend mặc định English và backend chỉ chấp nhận `language` là `English` hoặc `en`.
- Tone chính thức trong MVP gồm: `professional`, `academic`, `simple`, `persuasive`.
- MVP chỉ lưu history version cũ khi regenerate slide, chưa hỗ trợ restore version.
- MVP tạo PPTX và stream trực tiếp khi tải; chỉ lưu metadata trong ExportHistory, không lưu file PPTX vĩnh viễn và không đảm bảo tải lại file cũ từ export history.
- Deployment target khuyến nghị: frontend trên Vercel, backend trên Render hoặc Railway, database trên MongoDB Atlas.
- MVP chưa yêu cầu email verification và password reset.
- MVP có 1 default theme chuyên nghiệp, chưa có template selector.
- Nội dung slide MVP hỗ trợ title, content dạng `string[]` cho bullet points hoặc paragraph ngắn, speaker notes và layout enum cố định: `title`, `content`, `two_column`, `section`, `summary`.

## Ghi chú review quan trọng
- Thiết kế database ban đầu thiếu dữ liệu outline; MVP cần lưu outline trong Deck hoặc tạo collection Outline riêng.
- Requirements ban đầu chưa giới hạn layout slide; MVP nên dùng một tập layout nhỏ, rõ ràng.
- Có yêu cầu "support asynchronous AI requests" nhưng chưa có queue. MVP có thể dùng HTTP request đồng bộ với loading state; production nên chuyển sang job queue.
- Chất lượng PPTX phụ thuộc template; MVP không nên hứa hẹn thiết kế cao cấp nếu chưa có yêu cầu template.
- Kiểm tra quyền sở hữu resource là bắt buộc và phải thực hiện server-side cho deck, slide, version và export.

## Làm rõ MVP sau review
- ExportHistory trong MVP chỉ lưu metadata export gồm deckId, userId, format, fileName và thời gian export. MVP không lưu file PPTX vĩnh viễn và không hỗ trợ tải lại file cũ từ history.
- MVP chỉ hỗ trợ chính thức tiếng Anh. Frontend mặc định English; backend chỉ chấp nhận `language` là `English` hoặc `en`. Các ngôn ngữ khác là future enhancement.
- Logout trong MVP là client-side logout bằng cách xóa JWT/session khỏi frontend storage. Backend logout endpoint có thể trả success để đồng bộ flow nhưng chưa cần token blacklist.
- Slide content trong MVP là text-only, gồm title, content dạng `string[]`, speaker notes và layout enum cố định.
- MVP không hỗ trợ rich text, image, chart, table hoặc kéo-thả thiết kế tự do.
- Slide reorder phải cập nhật lại `slideNumber` theo thứ tự mới; delete slide không được làm hỏng thứ tự các slide còn lại.
- Editor dùng cơ chế explicit save. Nếu có thay đổi chưa lưu, frontend phải cảnh báo trước khi rời trang hoặc đổi slide.
- Khi regenerate slide, backend phải tạo SlideVersion trước khi ghi đè nội dung slide hiện tại.

## Quyết định đã chốt
- Số lượng slide tối đa cho mỗi deck: tối đa 10 slide cho MVP.
- Ngôn ngữ và tone hỗ trợ chính thức: MVP hỗ trợ chính thức tiếng Anh. Tone gồm: `professional`, `academic`, `simple`, `persuasive`.
- Version cũ của slide: MVP chỉ lưu history version cũ khi regenerate slide, chưa cần restore. Restore đưa vào future enhancement.
- File export: MVP tạo file PPTX và stream trực tiếp khi tải, đồng thời lưu ExportHistory metadata. Không lưu file vĩnh viễn và không hỗ trợ tải lại file cũ từ history để giảm chi phí và tránh quản lý storage phức tạp.
- Deployment target: frontend deploy Vercel, backend deploy Render hoặc Railway, database dùng MongoDB Atlas.
- Email verification và password reset: MVP chưa cần. Trước production thực tế nên bổ sung password reset; email verification có thể thêm sau nếu cần chống tài khoản giả/spam.
- Theme/template: MVP có 1 default theme chuyên nghiệp. Chưa cần template selector nhiều lựa chọn.
- Nội dung slide: MVP hỗ trợ title, content dạng `string[]` cho bullet points hoặc paragraph ngắn, speaker notes và layout enum cố định. Hình ảnh, biểu đồ, bảng, rich text và kéo-thả thiết kế tự do đưa vào future enhancement vì sẽ làm AI generation, editor và PPTX export phức tạp hơn nhiều.
