# دليل النشر والإعداد - AIGP Work Plan Portal

## 1. إعداد قاعدة البيانات PostgreSQL

### المتطلبات
- PostgreSQL 14+ (يُفضل 16)
- حساب مستخدم بصلاحيات إنشاء الجداول

### الخيار أ: Docker (الأسرع للـ Staging)

```bash
# تشغيل PostgreSQL عبر Docker
docker run -d \
  --name aigp-postgres \
  -e POSTGRES_DB=aigp_workplan \
  -e POSTGRES_USER=aigp_admin \
  -e POSTGRES_PASSWORD=<YOUR_SECURE_PASSWORD> \
  -p 5432:5432 \
  -v aigp_pgdata:/var/lib/postgresql/data \
  postgres:16-alpine

# التحقق من التشغيل
docker exec aigp-postgres pg_isready
```

### الخيار ب: Azure Database for PostgreSQL

```bash
# إنشاء عبر Azure CLI
az postgres flexible-server create \
  --resource-group AIGP-RG \
  --name aigp-db-staging \
  --admin-user aigp_admin \
  --admin-password <YOUR_SECURE_PASSWORD> \
  --sku-name Standard_B1ms \
  --tier Burstable \
  --version 16 \
  --database-name aigp_workplan \
  --public-access 0.0.0.0

# إضافة firewall rule
az postgres flexible-server firewall-rule create \
  --resource-group AIGP-RG \
  --name aigp-db-staging \
  --rule-name AllowAppServer \
  --start-ip-address <APP_SERVER_IP> \
  --end-ip-address <APP_SERVER_IP>
```

### الخيار ج: AWS RDS

```bash
aws rds create-db-instance \
  --db-instance-identifier aigp-db-staging \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version 16 \
  --master-username aigp_admin \
  --master-user-password <YOUR_SECURE_PASSWORD> \
  --allocated-storage 20 \
  --db-name aigp_workplan \
  --vpc-security-group-ids <SG_ID>
```

---

## 2. تشغيل الـ Migrations

الـ Migrations تعمل تلقائياً عند بدء التشغيل (`RUN_MIGRATIONS_ON_STARTUP=true`). أو يمكن تشغيلها يدوياً:

```bash
# تعيين DATABASE_URL
export DATABASE_URL="postgres://aigp_admin:<PASSWORD>@<HOST>:5432/aigp_workplan?sslmode=require"

# تشغيل يدوي (اختياري)
npx tsx server/db/migrate.ts
```

### ترتيب الـ Migrations:
1. `001_core_schema.sql` — الجداول الأساسية (entities, app_users, roles, permissions)
2. `002_business_schema.sql` — جداول الأعمال (tracks, work_plans, initiatives, prioritizations)
3. `003_reviews_audit.sql` — المراجعات وسجل التدقيق
4. `004_seed_rbac.sql` — بيانات الأدوار والصلاحيات الأولية
5. `005_seed_tracks.sql` — المسارات الافتراضية

---

## 3. النشر عبر Docker Compose

### الخطوات:

```bash
# 1. نسخ ملف البيئة
cp .env.example .env

# 2. تعديل المتغيرات
nano .env

# 3. بناء وتشغيل
docker compose up -d --build

# 4. التحقق
docker compose ps
curl http://localhost:4000/api/health
```

### متغيرات البيئة المطلوبة:

```env
# Database
DB_PASSWORD=<SECURE_PASSWORD>

# OIDC (Workspace ONE)
OIDC_ISSUER=https://access.vmware.com/SAAS/auth/oauthtoken
OIDC_AUDIENCE=aigp-workplan-portal

# Admin Bootstrap
BOOTSTRAP_ADMIN_EMAILS=admin1@moca.gov.ae,admin2@moca.gov.ae

# CORS
CORS_ORIGINS=https://aigp-stg.moca.gov.ae,https://aigp.moca.gov.ae

# Logging
LOG_LEVEL=info
NODE_ENV=production
```

---

## 4. النشر على Kubernetes (اختياري)

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: aigp-api
  namespace: aigp
spec:
  replicas: 2
  selector:
    matchLabels:
      app: aigp-api
  template:
    metadata:
      labels:
        app: aigp-api
    spec:
      containers:
      - name: api
        image: <REGISTRY>/aigp-work-plan-portal:latest
        ports:
        - containerPort: 4000
        envFrom:
        - secretRef:
            name: aigp-secrets
        livenessProbe:
          httpGet:
            path: /api/health
            port: 4000
          initialDelaySeconds: 10
        readinessProbe:
          httpGet:
            path: /api/ready
            port: 4000
          initialDelaySeconds: 15
        resources:
          requests:
            memory: "256Mi"
            cpu: "200m"
          limits:
            memory: "512Mi"
            cpu: "500m"
```

---

## 5. التحقق بعد النشر

```bash
# Health check
curl https://aigp-stg.moca.gov.ae/api/health
# Expected: {"status":"ok","timestamp":"..."}

# Readiness check
curl https://aigp-stg.moca.gov.ae/api/ready
# Expected: {"status":"ok","database":"connected","migrations":"complete"}

# Auth test (with valid token)
curl -H "Authorization: Bearer <TOKEN>" https://aigp-stg.moca.gov.ae/api/auth/me
```

---

## 6. النسخ الاحتياطي

```bash
# نسخ احتياطي يومي
pg_dump -h <HOST> -U aigp_admin -d aigp_workplan -F c -f backup_$(date +%Y%m%d).dump

# استعادة
pg_restore -h <HOST> -U aigp_admin -d aigp_workplan -c backup_20240101.dump
```

---

## 7. المراقبة

### Endpoints مفيدة:
- `GET /api/health` — حالة الخادم
- `GET /api/ready` — حالة قاعدة البيانات والـ migrations

### Logs:
```bash
# Docker
docker compose logs -f api

# Kubernetes
kubectl logs -f deployment/aigp-api -n aigp
```
