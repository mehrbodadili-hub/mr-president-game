---
name: Image optimization default
description: Always optimize user-uploaded images automatically before adding to project
type: preference
---
هر تصویری که کاربر آپلود می‌کند باید قبل از استفاده در پروژه به صورت خودکار بهینه‌سازی شود:
- تبدیل به WebP برای لوگو/گرافیک، JPEG progressive برای عکس
- تغییر اندازه به ابعاد مناسب کاربرد (مثلاً لوگو ≤512px)
- اضافه کردن `loading="lazy"` و `decoding="async"` (یا `fetchPriority="high"` برای LCP)
- آپلود نسخه بهینه از طریق `lovable-assets` و حذف اصل سنگین

**How to apply:** بدون پرسیدن از کاربر، روی هر تصویر آپلودی این فرایند را اجرا کن.