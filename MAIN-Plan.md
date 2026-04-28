---
name: BMS Requirements Analysis
overview: تحليل متطلبات شامل لنظام إدارة وتوزيع المخبز (BMS) يغطي قاعدة البيانات، الصفحات، API Routes، والهيكل التقني الكامل — قبل بدء البناء.
todos:
  - id: setup
    content: "إعداد المشروع: Next.js + Prisma + MySQL + NextAuth + shadcn/ui + Tailwind RTL"
    status: pending
  - id: db-schema
    content: كتابة Prisma Schema الكامل (User, Shop, Product, Order, Assignment, Vehicle, Payment, AuditLogs)
    status: pending
  - id: db-migrate
    content: تشغيل migration الأولى وتجهيز seed data للاختبار
    status: pending
  - id: auth
    content: تنفيذ NextAuth.js (Credentials) + middleware حماية المسارات + RBAC
    status: pending
  - id: phase-a
    content: "المرحلة أ: إدارة المستخدمين + المحلات (مع Google Maps picker) + المنتجات + سجل الأسعار"
    status: pending
  - id: phase-b
    content: "المرحلة ب: CRUD الطلبات + قائمة العمل اليومية + سجل الأحداث"
    status: pending
  - id: phase-c
    content: "المرحلة ج: واجهة التوزيع (تعيين يدوي) + واجهة الموزّع المقيّدة"
    status: pending
  - id: phase-d
    content: "المرحلة د: تحديث حالة التسليم (mobile-first responsive)"
    status: pending
  - id: phase-e
    content: "المرحلة هـ: تسجيل المدفوعات + تقارير الإجماليات والأرصدة"
    status: pending
isProject: false
---

# تحليل متطلبات نظام BMS — الخطة الكاملة

## Tech Stack المحدد

- **Framework:** Next.js 14+ (App Router)
- **ORM:** Prisma
- **Database:** MySQL
- **Auth:** NextAuth.js (Credentials Provider — Email + Password)
- **UI:** shadcn/ui + Tailwind CSS (RTL)
- **Maps:** Google Maps API (Places + Geocoding + Maps JavaScript API)
- **Currency:** EUR
- **Language:** Arabic (RTL — `dir="rtl"`)

---

## هيكل قاعدة البيانات (Prisma Schema)

### الكيانات الرئيسية

**User**
- `id, name, email, passwordHash, role (ADMIN | DISTRIBUTOR), isActive, createdAt, updatedAt`

**Shop (محل)**
- `id, name, phone, email?, shopType, address (text), latitude, longitude, isActive, createdAt, updatedAt`

**Product (منتج)**
- `id, name, sku?, unit, unitPrice (Decimal), isActive, createdAt, updatedAt`
- علاقة: `ProductAuditLog` → من / متى / ماذا تغيّر

**Order (طلب)**
- `id, shopId, deliveryDate, status (OrderStatus), notes, createdById, createdAt, updatedAt`
- علاقة: `OrderItem` → `productId, quantity, unitPriceSnapshot, subtotal`
- علاقة: `OrderEvent` → سجل الأحداث (الفاعل، الطابع الزمني، الوصف)

**DistributionAssignment (تعيين)**
- `id, orderId, distributorId, vehicleId?, assignedById, assignedAt, notes`

**Vehicle (مركبة) — DB فقط بدون واجهة**
- `id, name, plateNumber, capacity?, isActive`

**Payment (دفعة)**
- `id, shopId, orderId?, amount (Decimal), method (CASH | BANK_TRANSFER | CHECK | OTHER), paymentDate, reference?, notes, createdById, createdAt`

### دورة حياة الطلب

```mermaid
flowchart LR
    draft["draft\nمسودة"] --> confirmed["confirmed\nمؤكد"]
    confirmed --> ready["ready_for_distribution\nجاهز للتوزيع"]
    ready --> out["out_for_delivery\nخارج للتسليم"]
    out --> delivered["delivered\nمُسلَّم"]
    confirmed --> cancelled["cancelled\nملغى"]
    ready --> cancelled
```

---

## هيكل الصفحات (App Router)

```
app/
├── (auth)/
│   └── login/                  — صفحة تسجيل الدخول
│
├── (admin)/                    — محمية بـ middleware (ADMIN فقط)
│   ├── dashboard/              — نظرة عامة + إحصائيات
│   ├── shops/                  — قائمة + CRUD + خريطة Google Maps
│   │   └── [id]/edit/
│   ├── products/               — قائمة + CRUD + سجل التسعير
│   │   └── [id]/history/
│   ├── orders/                 — قائمة مفلترة بالتاريخ (قائمة العمل اليومية)
│   │   ├── new/
│   │   └── [id]/               — تفاصيل + سجل الأحداث + زر التعيين
│   ├── distribution/           — خطة التوزيع اليومية + التعيين اليدوي
│   ├── payments/               — قائمة + تسجيل دفعة جديدة
│   ├── reports/                — إجماليات يومية + أرصدة مستحقة
│   └── settings/users/         — إدارة المستخدمين والأدوار
│
├── (distributor)/              — محمية بـ middleware (DISTRIBUTOR فقط)
│   └── my-orders/              — طلبات اليوم المعيّنة له
│       └── [id]/               — تفاصيل + زر تحديث الحالة
│
└── api/
    ├── auth/[...nextauth]/
    ├── shops/[id]?/
    ├── products/[id]?/
    │   └── [id]/history/
    ├── orders/[id]?/
    │   ├── [id]/events/
    │   ├── [id]/status/
    │   └── [id]/assign/
    ├── distribution/
    ├── payments/[id]?/
    └── reports/
```

---

## تدفق بيانات العمليات الرئيسية

```mermaid
flowchart TD
    subgraph admin [لوحة المدير]
        A1[إنشاء محل + دبوس خريطة]
        A2[إضافة منتجات]
        A3[إدخال طلب اليوم]
        A4[تعيين الطلب لموزّع]
        A5[تسجيل الدفعة]
    end

    subgraph dist [واجهة الموزّع - موبايل]
        D1[رؤية طلباته اليوم]
        D2[تحديث حالة التسليم]
    end

    subgraph db [MySQL Database]
        DB1[(Shop)]
        DB2[(Product)]
        DB3[(Order + Items)]
        DB4[(Assignment)]
        DB5[(Payment)]
        DB6[(Events Log)]
    end

    A1 --> DB1
    A2 --> DB2
    A3 --> DB3
    A4 --> DB4
    D1 --> DB4
    D2 --> DB6
    A5 --> DB5
```

---

## الصلاحيات (RBAC)

| العملية | ADMIN | DISTRIBUTOR |
|---------|-------|-------------|
| إدارة المستخدمين | نعم | لا |
| CRUD المحلات والمنتجات | نعم | لا |
| إنشاء الطلبات | نعم | لا |
| قائمة العمل اليومية الكاملة | نعم | لا |
| تعيين الطلبات | نعم | لا |
| رؤية طلباته المعيّنة فقط | — | نعم |
| تحديث حالة التسليم | نعم | نعم (طلباته فقط) |
| تسجيل المدفوعات | نعم | لا |
| التقارير | نعم | لا |

---

## Middleware (حماية المسارات)

- `/login` — عام
- `/(admin)/*` — يتطلب ADMIN
- `/(distributor)/*` — يتطلب DISTRIBUTOR
- `/api/*` — يتطلب جلسة + التحقق من الدور داخل كل route

---

## القرارات المحسومة (النقاط المفتوحة سابقاً)

- **GPS عند التسليم:** لا — الموزّع يضغط فقط زر تحديث الحالة، بدون إرسال موقع.
- **المناطق (Zones):** لا — التعيين يدوي بالكامل طلب بطلب، بدون تقسيم جغرافي ثابت.
- **الضرائب البلجيكية:** لا — النظام مخفي ولا علاقة له بحسابات VAT.
- **الإشعارات:** لا — الموزّع يدخل التطبيق ويرى طلباته بنفسه.
- **البساطة:** الأولوية القصوى — أقل عدد من الخطوات لإنجاز كل مهمة.

---

## سيناريوهات العمل اليومي

### سيناريو 1 — المدير (يوم عمل كامل)

```mermaid
flowchart TD
    L[تسجيل الدخول\nEmail + Password] --> DA[Dashboard\nنظرة عامة على اليوم]

    DA --> SETUP{إعداد أولي\nمرة واحدة فقط}
    SETUP -->|نعم - أول مرة| S1[إضافة محلات\n+ دبوس خريطة]
    SETUP -->|نعم - أول مرة| S2[إضافة منتجات\n+ أسعار]
    SETUP -->|نعم - أول مرة| S3[إضافة موزّعين\nمن إدارة المستخدمين]
    S1 & S2 & S3 --> DAILY

    DA --> DAILY[قائمة الطلبات\nفلتر بتاريخ اليوم]
    DAILY --> O1[إنشاء طلب جديد\nاختر محل + أضف بنود]
    O1 --> O2[تأكيد الطلب\nconfirmed]
    O2 --> O3[تغيير الحالة:\nجاهز للتوزيع]
    O3 --> DIST[صفحة التوزيع\nقائمة طلبات اليوم]
    DIST --> ASSIGN[تعيين كل طلب\nلموزّع بضغطة واحدة]
    ASSIGN --> MONITOR[متابعة حالة التسليم\nمن قائمة الطلبات]
    MONITOR --> PAY[تسجيل الدفعة\nبعد التسليم]
    PAY --> REP[التقارير\nإجمالي اليوم + الأرصدة]
    REP --> END([تسجيل الخروج])
```

**الخطوات بالتفصيل:**

- الخطوة 1: يفتح المدير الموقع ويسجّل دخوله
- الخطوة 2: يرى Dashboard يعرض عدد طلبات اليوم + حالاتها
- الخطوة 3 (إعداد أولي فقط): يضيف المحلات والمنتجات والموزّعين مرة واحدة
- الخطوة 4: يفتح صفحة الطلبات ويختار تاريخ اليوم
- الخطوة 5: يُنشئ الطلبات (يختار المحل + يضيف المنتجات والكميات)
- الخطوة 6: يؤكد الطلبات ويغيّر حالتها إلى "جاهز للتوزيع"
- الخطوة 7: يفتح صفحة التوزيع ويعيّن كل طلب لموزّع بضغطة
- الخطوة 8: يتابع حالة التسليمات طوال اليوم من نفس الصفحة
- الخطوة 9: بعد التسليم يسجّل الدفعة (مبلغ + طريقة + مرجع)
- الخطوة 10: يراجع تقرير نهاية اليوم (إجماليات + أرصدة مستحقة)

---

### سيناريو 2 — الموزّع (يوم عمل كامل)

```mermaid
flowchart TD
    L2[تسجيل الدخول\nمن الهاتف] --> MW[صفحة طلباتي اليوم\nقائمة بسيطة]
    MW --> CHK{هل يوجد طلبات\nمعيّنة له؟}
    CHK -->|لا| WAIT[ينتظر — المدير\nلم يعيّن بعد]
    CHK -->|نعم| OL[يرى قائمة طلباته:\nاسم المحل + العنوان]
    OL --> OD[يفتح تفاصيل الطلب:\nالبنود + الكميات + الموقع]
    OD --> MAP[يضغط على الخريطة\nللتنقل للمحل]
    MAP --> DEL[عند الوصول:\nيضغط زر تم التسليم]
    DEL --> NEXT{طلبات أخرى؟}
    NEXT -->|نعم| OL
    NEXT -->|لا| DONE([انتهى عمل اليوم\nتسجيل الخروج])
```

**الخطوات بالتفصيل:**

- الخطوة 1: يفتح المتصفح على هاتفه ويسجّل دخوله
- الخطوة 2: يرى مباشرةً قائمة طلبات اليوم المعيّنة له فقط
- الخطوة 3: يضغط على أي طلب ليرى: اسم المحل، العنوان، البنود والكميات
- الخطوة 4: يضغط على زر الخريطة للتنقل (يفتح Google Maps)
- الخطوة 5: بعد التسليم يضغط زر "تم التسليم" — تتغير الحالة تلقائياً
- الخطوة 6: يكمل باقي طلباته بنفس الطريقة حتى ينتهي

---

## ترتيب مراحل البناء

1. **الإعداد:** Next.js + Prisma + MySQL + NextAuth + shadcn/ui + RTL
2. **قاعدة البيانات:** Schema الكامل + migrations + seed data
3. **المصادقة:** تسجيل الدخول + middleware + RBAC
4. **المرحلة أ:** إدارة المستخدمين، المحلات (+ خريطة)، المنتجات
5. **المرحلة ب:** الطلبات (CRUD + قائمة يومية + سجل الأحداث)
6. **المرحلة ج:** التوزيع (تعيين + واجهة الموزّع)
7. **المرحلة د:** تحديث حالة التسليم (mobile-first)
8. **المرحلة هـ:** المدفوعات + تقارير الإجماليات والأرصدة
