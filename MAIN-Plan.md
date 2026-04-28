---
name: BMS — خطة البناء الكاملة
overview: >
  خطة تقنية شاملة محدَّثة بناءً على الواقع التشغيلي الفعلي (ملفات Excel مايو 2025).
  الموزّع يُسجِّل الدفع والمرتجعات من الهاتف. السائق يُعيَّن عند إنشاء الطلب.
  البنود ✅ مكتملة. البنود ⏳ هي خارطة الطريق القادمة بالترتيب.
todos:
  - id: setup
    content: "إعداد المشروع: Next.js + Prisma + MySQL + NextAuth + shadcn/ui + Tailwind RTL"
    status: completed
  - id: db-schema-v1
    content: "Schema v1: User, Shop, Product, Order, Assignment, Vehicle, Payment, AuditLogs"
    status: completed
  - id: db-migrate-v1
    content: تشغيل migration الأولى + seed data
    status: completed
  - id: auth
    content: تنفيذ NextAuth.js (Credentials) + middleware + RBAC
    status: completed
  - id: phase-a
    content: "المرحلة أ: إدارة المستخدمين + المحلات + المنتجات + سجل الأسعار"
    status: completed
  - id: phase-b
    content: "المرحلة ب: CRUD الطلبات + قائمة العمل اليومية + سجل الأحداث"
    status: completed
  - id: phase-c
    content: "المرحلة ج: واجهة التوزيع + واجهة الموزّع المقيّدة"
    status: completed
  - id: phase-d
    content: "المرحلة د: تحديث حالة التسليم (mobile-first)"
    status: completed
  - id: phase-e-basic
    content: "المرحلة هـ (أساسي): تسجيل المدفوعات البسيطة + تقارير الإجماليات"
    status: completed
  - id: p1-schema-v2
    content: "Schema v2: city للمحل + distributorId للطلب + PaymentMethod الكامل + OrderReturn + RouteRun + RouteExpense"
    status: pending
  - id: p1-migration
    content: prisma migrate dev --name v2_full_features
    status: pending
  - id: p2-order-creation
    content: "تحديث فورم إنشاء الطلب: تعيين السائق + دعم الدفع المجزأ"
    status: pending
  - id: p3-distributor-payment
    content: "واجهة الموزّع: تسجيل الدفع + تسجيل المرتجعات من الهاتف"
    status: pending
  - id: p3-distributor-balance
    content: "واجهة الموزّع: عرض رصيد دين المحل في صفحة التفاصيل"
    status: pending
  - id: p4-shop-balance
    content: "رصيد الدين: API + بطاقة في صفحة المحل + عمود في قائمة الطلبات"
    status: pending
  - id: p5-route-run
    content: "جولة اليوم (RouteRun): إنشاء + مصروفات + ملخص الصافي"
    status: pending
  - id: p6-reports
    content: "التقارير: إجمالي اليوم + تقرير لكل سائق + ديون المحلات"
    status: pending
isProject: true
---

# BMS — خطة البناء الكاملة (الإصدار 3.0)

> **آخر تحديث:** 28 أبريل 2026
> **الوضع الحالي:** المراحل أ → هـ (الأساسي) مُنجزة ✅
> **التالي:** Schema v2 ← تعيين السائق عند إنشاء الطلب ← الموزّع يُسجِّل الدفع والمرتجعات ← رصيد الدين ← جولة اليوم ← التقارير

---

## Tech Stack ✅

- **Framework:** Next.js 14+ (App Router)
- **ORM:** Prisma v7
- **Database:** MySQL
- **Auth:** NextAuth.js (Credentials)
- **UI:** shadcn/ui + Tailwind CSS (RTL)
- **Maps:** Google Maps API
- **Currency:** EUR | **Language:** Arabic RTL

---

## القرارات المحسومة كاملة

| السؤال | القرار |
|--------|--------|
| متى يُعيَّن السائق؟ | **عند إنشاء الطلب** — dropdown في فورم الإنشاء |
| من يُسجِّل الدفع؟ | **الموزّع من الهاتف** (أساساً) + المدير من اللوحة |
| متى تُحدَّد طريقة الدفع؟ | **عند التسليم** — لا عند إنشاء الطلب |
| الدفع المجزأ؟ | **مسموح** — دفعتان (CASH + CREDIT) مرتبطتان بنفس الطلب |
| من يُسجِّل المرتجعات؟ | **الموزّع** من الميدان لحظة الرفض |
| المرتجع يؤثر على قيمة الطلب؟ | **نعم** — قيمة التسليم = أصلية − مرتجع |
| الطلب الأصلي عند المرتجع؟ | **يبقى كما هو** — المرتجع سجل منفصل |
| رصيد الدين يُحسَب من؟ | **الطلبات المُسلَّمة فقط** (status=delivered) |
| حد الدين الأقصى؟ | **لا يوجد** — تنبيه مرئي فقط |
| الموزّع يرى رصيد الدين؟ | **نعم** — قراءة فقط لمساعدته على التحصيل |
| عدد الجولات في اليوم؟ | **متعدد** — كل سائق جولة مستقلة |
| الكمية الاحتياطية؟ | المدير أو السائق — لا فرق |
| تقرير المدير؟ | **إجمالي اليوم + تقرير لكل سائق على حدة** |
| طباعة أو PDF؟ | **لا** — غير مطلوب |
| VAT؟ | **لا تُحتسب إطلاقاً** |
| GPS؟ | **لا** — زر تحديث الحالة فقط |
| الهدايا؟ | **ملاحظة في notes** — لا بند مستقل |

---

## هيكل قاعدة البيانات

### Schema v1 — موجود حالياً ✅

```
User                   — ADMIN | DISTRIBUTOR
Shop                   — محلات + خريطة
Product                — منتجات + ProductAuditLog
Order                  — طلبات + OrderItem + OrderEvent
DistributionAssignment — تعيين طلب لموزّع + مركبة
Vehicle                — مركبات
Payment                — CASH | BANK_TRANSFER | CHECK | OTHER
```

### Schema v2 — التعديلات المطلوبة ⏳

#### 1. `Shop` — إضافة المدينة

```prisma
model Shop {
  // ... الحقول الحالية ...
  city String  // المدينة / المنطقة — إلزامي
}
```

#### 2. `PaymentMethod` — توسيع enum

```prisma
enum PaymentMethod {
  CASH           // نقداً
  BANK_TRANSFER  // بالبنك
  CREDIT         // دين — لا مبلغ مُستلَم، يُضاف للرصيد
  INSTALLMENT    // دفعة على الدين القديم
  SETTLEMENT     // تسديد الرصيد المتراكم
}
```

#### 3. `Order` — إضافة distributorId

```prisma
model Order {
  // ... الحقول الحالية ...
  distributorId String?  // السائق المُعيَّن عند الإنشاء
  distributor   User?    @relation("OrderDistributor", fields: [distributorId], references: [id])
  returns       OrderReturn[]
  payments      Payment[]  // علاقة موجودة — تدعم دفعات متعددة لنفس الطلب
}
```

> **ملاحظة:** `DistributionAssignment` يبقى كما هو للتوافق — عند إنشاء الطلب مع سائق يُنشأ assignment تلقائياً.

#### 4. `OrderReturn` — مرتجعات مرتبطة بالطلب (ليس بالجولة)

```prisma
model OrderReturn {
  id          String   @id @default(cuid())
  orderId     String
  productId   String
  quantity    Int
  reason      String?
  createdById String   // الموزّع الذي سجّل المرتجع
  createdAt   DateTime @default(now())

  order     Order   @relation(fields: [orderId], references: [id], onDelete: Cascade)
  product   Product @relation(fields: [productId], references: [id])
  createdBy User    @relation(fields: [createdById], references: [id])

  @@map("order_returns")
}
```

#### 5. `RouteRun` — جولة اليوم (وحدة تجميع وملخص)

```prisma
model RouteRun {
  id              String   @id @default(cuid())
  date            DateTime @db.Date
  distributorId   String
  vehicleId       String?
  whiteBagsLoaded Int      @default(0)
  brownBagsLoaded Int      @default(0)
  reserveBags     Int      @default(0)
  notes           String?  @db.Text
  createdAt       DateTime @default(now())

  distributor User           @relation(fields: [distributorId], references: [id])
  vehicle     Vehicle?       @relation(fields: [vehicleId], references: [id])
  expenses    RouteExpense[]

  @@map("route_runs")
}
```

#### 6. `RouteExpense` — مصروفات الجولة (ديزل...)

```prisma
enum ExpenseType { FUEL OTHER }

model RouteExpense {
  id         String      @id @default(cuid())
  routeRunId String
  type       ExpenseType @default(FUEL)
  amount     Decimal     @db.Decimal(10, 2)
  note       String?
  createdAt  DateTime    @default(now())

  routeRun RouteRun @relation(fields: [routeRunId], references: [id])

  @@map("route_expenses")
}
```

### صيغة حساب رصيد الدين (ديناميكي — لا جدول)

```
رصيد_الدين(محل) =
  SUM( (OrderItem.quantity - OrderReturn.quantity) × OrderItem.unitPriceSnapshot )
    WHERE Order.shopId = X
      AND Order.status = 'delivered'
      AND Payment linked to order has method IN ('CREDIT')
  −
  SUM( Payment.amount )
    WHERE Payment.shopId = X
      AND Payment.method IN ('CASH', 'BANK_TRANSFER', 'INSTALLMENT', 'SETTLEMENT')
```

---

## الصلاحيات المحدَّثة (RBAC)

| العملية | ADMIN | DISTRIBUTOR |
|---------|-------|-------------|
| إدارة المستخدمين والمحلات والمنتجات | ✅ | ❌ |
| إنشاء الطلبات + تعيين السائق | ✅ | ❌ |
| قائمة الطلبات الكاملة | ✅ | ❌ |
| إنشاء جولة اليوم (RouteRun) | ✅ | ❌ |
| إدخال مصروفات الوقود | ✅ | ❌ |
| التقارير الكاملة | ✅ | ❌ |
| رؤية طلباته المعيّنة فقط | ❌ | ✅ |
| رؤية رصيد دين المحل (قراءة) | ✅ | ✅ |
| **تسجيل الدفع (طلباته فقط)** | ✅ | **✅ جديد** |
| **تسجيل المرتجعات (طلباته فقط)** | ✅ | **✅ جديد** |
| تحديث حالة التسليم (طلباته فقط) | ✅ | ✅ |

---

## السيناريو 1 — المدير (يوم عمل كامل)

```mermaid
flowchart TD
    L[تسجيل الدخول] --> DA[Dashboard\nطلبات اليوم + إجمالي الديون]
    DA --> SETUP{إعداد أولي؟}
    SETUP -->|نعم| S1[محل + مدينة + خريطة]
    SETUP -->|نعم| S2[منتجات + أسعار]
    SETUP -->|نعم| S3[موزّعون]
    S1 & S2 & S3 --> DAILY
    DA --> DAILY[قائمة طلبات اليوم]
    DAILY --> O1[إنشاء طلب:\nمحل + بنود + السائق]
    O1 --> O2[تأكيد → جاهز للتوزيع]
    O2 --> RR[إنشاء جولة اليوم\nكميات محمَّلة + احتياطي]
    RR --> MONITOR[متابعة التسليمات]
    MONITOR --> EXP[إدخال مصروف الوقود]
    EXP --> SUMMARY[ملخص: مقبوضات − مصروفات = الصافي]
    SUMMARY --> REP[تقارير: لكل سائق + إجمالي + ديون المحلات]
    REP --> END([خروج])
```

**الخطوات التفصيلية:**

1. يفتح الداشبورد → يرى: طلبات اليوم + إجمالي الديون المتراكمة
2. _(مرة واحدة)_ يُضيف المحلات + مدن + خريطة، المنتجات، الموزّعين
3. يُنشئ طلبات اليوم — لكل طلب: محل + بنود + كميات + **اختيار السائق** + ملاحظات (هدايا...)
4. يُحوِّل الطلبات إلى «جاهز للتوزيع»
5. يُنشئ **جولة اليوم** (RouteRun): سائق + سيارة + كميات محمَّلة + احتياطي
6. يتابع حالة التسليمات على مدار اليوم
7. عند انتهاء الجولة: يُدخل مصروف الوقود
8. يراجع **ملخص الجولة**: مقبوضات − مصروفات = **الصافي**
9. يراجع **التقارير**: لكل سائق على حدة + الإجمالي + ديون المحلات

---

## السيناريو 2 — الموزّع (يوم عمل كامل)

```mermaid
flowchart TD
    L2[تسجيل الدخول من الهاتف] --> MW[قائمة طلبات اليوم\nاسم المحل + المدينة]
    MW --> CHK{يوجد طلبات؟}
    CHK -->|لا| WAIT[ينتظر تعيين المدير]
    CHK -->|نعم| OD[تفاصيل الطلب:\nالبنود + رصيد دين المحل\nملاحظة الهدية]
    OD --> MAP[يضغط الخريطة → يتنقل]
    MAP --> DEL[عند الوصول: يُسلِّم]
    DEL --> RET{يوجد مرتجع؟}
    RET -->|نعم| RETREC[يُسجِّل المرتجع:\nالمنتج + الكمية]
    RET -->|لا| PAY
    RETREC --> PAY[يُسجِّل الدفع:\nنوع + مبلغ]
    PAY --> SPLIT{دفع مجزأ؟}
    SPLIT -->|نعم| PAY2[يُضيف دفعة ثانية:\nمثلاً CASH + CREDIT]
    SPLIT -->|لا| DONE_ORD[يضغط 'تم التسليم']
    PAY2 --> DONE_ORD
    DONE_ORD --> NEXT{طلبات أخرى؟}
    NEXT -->|نعم| OD
    NEXT -->|لا| DONE([انتهى — يعود للمستودع])
```

**الخطوات التفصيلية:**

1. يفتح المتصفح على هاتفه → يُسجِّل دخوله
2. يرى قائمة طلباته مرتّبة: اسم المحل + المدينة
3. يفتح تفاصيل الطلب:
   - البنود والكميات
   - **رصيد دين المحل** (قراءة فقط)
   - ملاحظات الهدايا والتعليمات
4. يضغط الخريطة → ينتقل للمحل (Google Maps)
5. عند الوصول وتسليم البضاعة:
   - **لو رُفض جزء:** يُسجِّل المرتجع (منتج + كمية)
   - **يُسجِّل الدفع:** يختار النوع (نقد / دين / بنك / دفعة / تسديد) + المبلغ
   - **لو دفع مجزأ:** يُضيف دفعة ثانية (مثلاً 50€ نقد + 41€ دين)
   - يضغط **«تم التسليم»**
6. يكرر مع باقي الطلبات
7. يعود للمستودع — المدير يُدخل مصروف الوقود ويرى الملخص

---

## هيكل الصفحات

```
app/
├── (auth)/login/                         ✅

├── (admin)/
│   ├── dashboard/                        ✅ — يحتاج: بطاقة إجمالي الديون + صافي اليوم
│   ├── shops/                            ✅
│   │   ├── new/                          ✅ — يحتاج: حقل المدينة
│   │   ├── [id]/edit/                    ✅ — يحتاج: حقل المدينة
│   │   └── [id]/                         ✅ — يحتاج: بطاقة رصيد الدين
│   ├── products/                         ✅
│   │   └── [id]/history/                 ✅
│   ├── orders/                           ✅
│   │   ├── new/                          ✅ — يحتاج: dropdown السائق
│   │   └── [id]/                         ✅ — يحتاج: رصيد المحل + سجل المرتجعات
│   ├── distribution/                     ✅
│   │   └── route-runs/                   ⏳ جديدة
│   │       ├── new/                      ⏳ إنشاء جولة (سائق + سيارة + كميات)
│   │       └── [id]/                     ⏳ تفاصيل + مصروفات + ملخص الصافي
│   ├── payments/                         ✅ — يحتاج: دعم CREDIT/INSTALLMENT/SETTLEMENT
│   ├── reports/                          ✅ — يحتاج: تقرير لكل سائق + ديون المحلات
│   └── settings/users/                   ✅

├── (distributor)/
│   └── my-orders/                        ✅
│       └── [id]/                         ✅ — يحتاج: رصيد دين + تسجيل دفع + مرتجع

└── api/
    ├── auth/[...nextauth]/               ✅
    ├── shops/                            ✅ — يحتاج: حقل city
    │   └── [id]/balance/                 ⏳ حساب رصيد الدين
    ├── products/                         ✅
    ├── orders/                           ✅ — يحتاج: distributorId عند الإنشاء
    │   └── [id]/
    │       ├── events/                   ✅
    │       ├── status/                   ✅
    │       ├── assign/                   ✅
    │       ├── payments/                 ⏳ POST — الموزّع يُسجِّل دفعاً
    │       └── returns/                  ⏳ GET/POST — المرتجعات
    ├── distribution/                     ✅
    ├── route-runs/                       ⏳
    │   └── [id]/
    │       └── expenses/                 ⏳
    ├── payments/                         ✅ — يحتاج: CREDIT/INSTALLMENT/SETTLEMENT
    └── reports/                          ✅ — يحتاج: تقرير الديون + لكل سائق
```

---

## خارطة الطريق — الأولويات بالتسلسل

### الأولوية 1 — Schema v2 + Migration ⏳

**الهدف:** تجهيز قاعدة البيانات لكل الميزات الجديدة دفعة واحدة.

- [ ] إضافة `city String` لـ `Shop`
- [ ] إضافة `distributorId String?` لـ `Order`
- [ ] توسيع enum `PaymentMethod`: أضف `CREDIT, INSTALLMENT, SETTLEMENT`
- [ ] إنشاء موديل `OrderReturn`
- [ ] إنشاء موديل `RouteRun`
- [ ] إنشاء موديل `RouteExpense`
- [ ] تشغيل: `prisma migrate dev --name v2_full_features`
- [ ] تحديث `seed.ts` بأمثلة واقعية

---

### الأولوية 2 — تعيين السائق عند إنشاء الطلب ⏳

**الهدف:** المدير يختار السائق في نفس فورم الطلب.

- [ ] تحديث `app/(admin)/orders/new/page.tsx` — إضافة dropdown اختيار السائق
- [ ] تحديث `app/api/orders/route.ts` (POST) — حفظ `distributorId` + إنشاء `DistributionAssignment` تلقائياً
- [ ] تحديث صفحة تفاصيل الطلب — إظهار اسم السائق المُعيَّن

---

### الأولوية 3 — واجهة الموزّع: دفع + مرتجعات ⏳

**الهدف:** الموزّع يُسجِّل الدفع والمرتجعات من الهاتف.

**صفحة `(distributor)/my-orders/[id]/`:**
- [ ] إضافة بطاقة **رصيد دين المحل** (fetch من `/api/shops/[id]/balance`)
- [ ] إضافة فورم **تسجيل الدفع**: نوع + مبلغ (+ دفعة ثانية لو مجزأ)
- [ ] إضافة فورم **تسجيل المرتجع**: منتج + كمية + سبب (اختياري)
- [ ] ترتيب UX: مرتجع → دفع → تم التسليم

**API routes جديدة:**
- [ ] `POST /api/orders/[id]/payments` — الموزّع يُسجِّل دفعاً (يتحقق: الطلب مُعيَّن له)
- [ ] `POST /api/orders/[id]/returns` — الموزّع يُسجِّل مرتجعاً
- [ ] `GET /api/orders/[id]/returns` — جلب مرتجعات الطلب

---

### الأولوية 4 — رصيد الدين ⏳

**الهدف:** عرض رصيد الدين في كل مكان مناسب.

- [ ] `GET /api/shops/[id]/balance` — حساب الرصيد ديناميكياً
- [ ] صفحة المحل `/admin/shops/[id]/` — بطاقة «رصيد الدين الحالي»
- [ ] قائمة الطلبات — عمود «رصيد دين المحل» بجانب اسمه
- [ ] Dashboard — بطاقة «إجمالي الديون المتراكمة»
- [ ] تقرير الديون — جدول المحلات مرتّب تنازلياً حسب الرصيد

---

### الأولوية 5 — جولة اليوم (RouteRun) ⏳

**الهدف:** تجميع الجولة + حساب الصافي.

- [ ] `POST /api/route-runs` — إنشاء جولة
- [ ] `GET /api/route-runs/[id]` — تفاصيل الجولة
- [ ] `POST /api/route-runs/[id]/expenses` — إضافة مصروف
- [ ] صفحة `/admin/distribution/route-runs/new` — فورم إنشاء جولة
- [ ] صفحة `/admin/distribution/route-runs/[id]` — تفاصيل + مصروفات + **ملخص: مقبوضات − مصروفات = الصافي**
- [ ] رابط من صفحة distribution الحالية لإنشاء جولة جديدة

---

### الأولوية 6 — تحديث المحلات وإضافة المدينة ⏳

- [ ] تحديث فورم إنشاء المحل — إضافة حقل `city`
- [ ] تحديث فورم تعديل المحل — إضافة حقل `city`
- [ ] إضافة مدن افتراضية للـ seed (دندرموند، سنت كلاس، برخم...)

---

### الأولوية 7 — تحديث التقارير ⏳

- [ ] تقرير إجمالي اليوم: مقبوضات كاملة لجميع السائقين
- [ ] تقرير لكل سائق: ما وزّعه + ما جمعه + مصروفاته + صافيه
- [ ] تقرير ديون المحلات: جدول + ترتيب + فلتر

---

## ملاحظات تقنية للتنفيذ

| القاعدة | التفاصيل |
|---------|----------|
| رصيد الدين | لا يُخزَّن — يُحسَب دائماً من `Order JOIN Payment JOIN OrderReturn` |
| الهدايا | حقل `Order.notes` الموجود — لا جدول جديد |
| CREDIT payment | لا يوجد مبلغ مُستلَم — `amount = 0` أو null، يُحسَب من قيمة الطلب |
| الدفع المجزأ | دفعتان مستقلتان مرتبطتان بـ `orderId` نفسه في جدول `payments` |
| OrderReturn | مرتبط بـ `orderId` لا بـ `routeRunId` — لأن الموزّع يُسجِّله لحظة الرفض |
| RouteRun | اختيارية — يمكن البدء بدونها وإضافتها في المرحلة 5 |
| Migration | `prisma migrate dev --name v2_full_features` |
| seed.ts | أضف مدن واقعية + مثال دين + مثال تسديد رصيد |
