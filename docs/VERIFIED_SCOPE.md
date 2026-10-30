# ขอบเขตที่ตรวจสอบจากระบบจริง

Repository: `intasan/energy-drink-vending-machine`
ฐาน source ที่ตรวจ: `fbecce9a7e3a1d9fc61d828613d237104fdef986`

**สถานะ: ทดสอบ logic ผ่าน; ข้อมูลธุรกิจยังไม่มี**

4 unit tests ผ่านด้วย fixture ในหน่วยความจำเท่านั้น; runtime ใหม่ไม่สร้าง sample catalog; ไม่มี integration ชำระเงินจริง/เครื่องจ่ายจริง

## แหล่งหลักฐาน

- [evidence/verification-2026-10-30.txt](../evidence/verification-2026-10-30.txt)
- [evidence/source-audit.json](../evidence/source-audit.json)
- [evidence/api-tests.txt](../evidence/api-tests.txt)

## Traceability จาก source

| ไฟล์ที่ตรวจ | ขอบเขตที่ยืนยันได้ |
|---|---|
| [server.js](../server.js) | พบ source ใน commit ข้างต้น; การมีไฟล์ไม่ใช่การทดสอบผ่าน |

## เกณฑ์ตรวจรับ BA / SA

| เกณฑ์ | หลักฐาน / สถานะ |
|---|---|
| ขอบเขตปัจจุบันตรงกับ source | ทดสอบ logic ผ่าน; ข้อมูลธุรกิจยังไม่มี |
| End-to-end ด้วยข้อมูลจริง | 4 unit tests ผ่านด้วย fixture ในหน่วยความจำเท่านั้น; runtime ใหม่ไม่สร้าง sample catalog; ไม่มี integration ชำระเงินจริง/เครื่องจ่ายจริง |
| ผลการทดสอบที่ทำซ้ำได้ | อ่าน command, stdout, exit code ใน evidence; syntax check ไม่ใช่ runtime test |
| ข้อมูลจริงและ provenance | เฉพาะราคาทองใน live-verification.txt ที่มี URL/เวลา publication; ไม่ใช้ fixture เป็นข้อมูลจริง |
| UAT โดยเจ้าของงานหรือผู้ใช้งาน | ยังไม่ได้ดำเนินการในรอบนี้ |

## ข้อจำกัดการแสดงผลงาน

ผล unit tests เป็นการตรวจ logic โดยมี fixture ตาม suite เดิม ไม่ใช่หลักฐานธุรกรรมจริง การฝึกโมเดลจริง การทำงานของอุปกรณ์จริง หรือการรับรองจากผู้ใช้ ไม่สร้างข้อมูลธุรกิจทดแทนข้อมูลที่ขาด และไม่อนุมานว่าไม่มีข้อมูลเท่ากับปลอดภัย
