# Shorts Creator - Progress Log

## Project Overview
เว็บแอปสำหรับสร้าง YouTube Shorts แนว Hide and Seek โดยผู้ใช้สามารถ:
- เลือก Map background
- สร้างตัวละคร (ผู้รอดชีวิต + ฆาตกร)
- วาดเส้นทางเดินให้ตัวละคร
- ตั้งค่า Effects ต่างๆ (ซ่อนตัว, ตาย, หนีรอด, ฯลฯ)
- Render เป็น Animation สำหรับนำไปตัดต่อ

## Tech Stack
- **Framework**: React + Vite + TypeScript
- **Styling**: Tailwind CSS v4 (ใช้ @tailwindcss/vite plugin)
- **Animation**: Framer Motion
- **State Management**: Custom hooks (useProject, useAnimation)

## File Structure
```
src/
├── components/
│   ├── canvas/
│   │   ├── GameCanvas.tsx      # Canvas หลัก + CharacterSprite component
│   │   └── PathDrawer.tsx      # วาดเส้นทาง path ของตัวละคร
│   ├── phases/
│   │   ├── Phase1Setup.tsx     # หน้าตั้งค่าเริ่มต้น (เลือก Map, สร้างตัวละคร)
│   │   ├── Phase2Editor.tsx    # หน้า Editor วาด path + ตั้งค่า waypoints
│   │   └── Phase3Render.tsx    # หน้า Render animation สุดท้าย
│   ├── timeline/
│   │   └── Timeline.tsx        # Timeline แสดง path ของแต่ละตัวละคร
│   └── ui/
│       ├── CharacterCreator.tsx # สร้าง/แก้ไขตัวละคร
│       ├── Countdown.tsx        # นับถอยหลัง 3-2-1 ก่อน render
│       ├── EffectPicker.tsx     # เลือก effect สำหรับ waypoint
│       ├── MapSelector.tsx      # เลือก Map background
│       ├── ResultScreen.tsx     # แสดงผลลัพธ์หลังจบ animation
│       └── WaypointList.tsx     # รายการ waypoints ของตัวละคร
├── hooks/
│   ├── useAnimation.ts          # Logic การเล่น animation
│   └── useProject.ts            # State management หลัก
├── types/
│   └── index.ts                 # TypeScript types ทั้งหมด
├── App.tsx
├── index.css                    # Tailwind CSS + custom styles
└── main.tsx
```

## Features Implemented

### Phase 1: Setup
- [x] เลือก Map จาก preset
- [x] สร้างตัวละครผู้รอดชีวิต (สูงสุด 5 ตัว)
- [x] สร้างฆาตกร (1 ตัว)
- [x] กำหนดสี, ชื่อ, รูปภาพให้ตัวละคร

### Phase 2: Editor
- [x] คลิกบน Canvas เพื่อสร้าง waypoint
- [x] ลาก waypoint เพื่อเปลี่ยนตำแหน่ง
- [x] ตั้งค่า Effect ให้แต่ละ waypoint:
  - ผู้รอดชีวิต: normal, hiding (ซ่อนตัว), escaped (หนีรอด), fallen (ล้ม)
  - ฆาตกร: normal, kill (สังหาร), dead (ตาย)
- [x] ตั้งค่า Duration (เวลาหยุดที่ waypoint)
- [x] ตั้งค่าความเร็วการเดิน
- [x] Preview animation
- [x] Timeline แสดง path ทุกตัวละคร

### Phase 3: Render
- [x] Countdown 3-2-1 ก่อนเริ่ม
- [x] เล่น animation แบบ clean (ไม่มี UI)
- [x] แสดง Result screen หลังจบ
- [x] ปุ่ม Replay, Edit, New Project

### Animation System (useAnimation.ts)
- [x] คำนวณตำแหน่งตัวละครตาม path และเวลา
- [x] Smooth interpolation ระหว่าง waypoints
- [x] Killer delay - ฆาตกรเริ่มหลังผู้รอดชีวิต
- [x] Kill mechanic - ฆาตกรเดินไปหาผู้รอดชีวิต, ผู้รอดชีวิตสั่น, แสดง skull เมื่อตาย
- [x] Escaped mechanic - ตัวละครหายไปเมื่อหนีรอด
- [x] Killer death - ฆาตกรสามารถตายได้
- [x] **Pause system** - พักหน้าจอตอนเริ่ม/จบ (blur + ซ่อนตัวละคร)

### Settings
- [x] ความยาว animation (10-120 วินาที)
- [x] Killer delay (0-30 วินาที)
- [x] Start pause (0-10 วินาที) - พักหน้าจอตอนเริ่ม
- [x] End pause (0-10 วินาที) - พักหน้าจอตอนจบ

## Recent Changes (Latest Session)

### Pause Screen System
เพิ่มระบบพักหน้าจอสำหรับการตัดต่อวิดีโอ:
- เพิ่ม `startPause` และ `endPause` ใน Project type
- เพิ่ม UI ตั้งค่าใน Settings tab (slider 0-10 วินาที)
- อัพเดท useAnimation รองรับ pause phases
- หน้าจอ blur + มืดลงระหว่างพัก
- ซ่อนตัวละครทุกตัวระหว่างพัก (ไม่แสดง emoji)
- ไม่มีข้อความ indicator ระหว่างพัก

### Bug Fixes
- แก้ Countdown ค้างไม่นับต่อ (ปัญหา useEffect dependency)
- แก้ killer ไม่เริ่มหลัง survivors
- แก้ kill ไม่ทำงาน (เปลี่ยนจาก time-based เป็น position-based)
- แก้ animation ไม่ smooth (เปลี่ยนจาก spring เป็น tween)
- แก้ skull ไม่แสดงเมื่อตัวละครเคยซ่อนตัว
- แก้ Result แสดงสถานะผิด (ตายแต่ขึ้นว่ารอด)

## Key Logic Notes

### Kill Detection (useAnimation.ts)
ฆาตกรสังหารผู้รอดชีวิตเมื่อ:
1. Killer มี waypoint ที่ effect = 'kill' และ killTargetId = survivor.id
2. Killer's effective time (animTime - killerDelay) >= kill waypoint time
3. ผู้รอดชีวิตจะสั่นเมื่อ killer อยู่ห่างไม่เกิน 3 วินาทีจาก kill point

### Pause Phases (useAnimation.ts)
```
totalDuration = startPause + animationDuration + endPause

isInStartPause = time < startPause
isInEndPause = time >= startPause + animationDuration
animationTime = max(0, time - startPause)
```

### Character Visibility
- ผู้รอดชีวิต: เริ่มเห็นหลัง startPause
- ฆาตกร: เริ่มเห็นหลัง startPause + killerDelay
- ระหว่าง pause: ซ่อนทุกตัว

## Dev Server
```bash
npm run dev
# Usually runs on http://localhost:5173, 5174, or 5175
```

## TODO (Future)
- [ ] Export video functionality
- [ ] Custom map upload
- [ ] Sound effects
- [ ] More character effects
- [ ] Save/Load project
