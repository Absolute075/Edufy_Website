#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="${1:-./db}"
echo "Создаю структуру DB enterprise в: $ROOT_DIR"

mk() { mkdir -p "$ROOT_DIR/$1"; }
touchf() { mkdir -p "$(dirname "$ROOT_DIR/$1")"; : > "$ROOT_DIR/$1"; }

# README
mk ""
cat > "$ROOT_DIR/README.md" <<'MD'
Edufy — DB directory (enterprise)
Contains migrations (Flyway, Liquibase), seeds, scripts, backups, monitoring and tools.
Use scripts/migrate_all.sh to run all migrations.
MD

# docker init
mk "docker/init"
cat > "$ROOT_DIR/docker/docker-compose.db.yml" <<'YML'
version: "3.8"
services:
  postgres:
    image: postgres:15
    env_file:
      - ../configs/db_credentials.env
    volumes:
      - ./docker/data/postgres:/var/lib/postgresql/data
      - ./migrations/flyway:/flyway/sql
    ports:
      - "5432:5432"
  redis:
    image: redis:7
    ports:
      - "6379:6379"
YML

cat > "$ROOT_DIR/docker/init/01-init-postgres.sql" <<'SQL'
-- create extensions, roles
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- roles will be created by scripts/create_roles.sh or flyway
SQL

cat > "$ROOT_DIR/docker/init/02-create-roles.sql" <<'SQL'
-- default roles for edufy
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='edufy_admin') THEN
    CREATE ROLE edufy_admin LOGIN PASSWORD 'CHANGE_ME';
  END IF;
END$$;
SQL

# migrations
mk "migrations/flyway/global"
mk "migrations/flyway/auth_service"
mk "migrations/flyway/user_service"
mk "migrations/flyway/analytics_service"
mk "migrations/flyway/file_service"
mk "migrations/flyway/notification_service"
mk "migrations/flyway/payment_service"
mk "migrations/flyway/queue_service"
mk "migrations/flyway/realtime_service"
mk "migrations/flyway/search_service"
mk "migrations/flyway/gateway_service"

cat > "$ROOT_DIR/migrations/flyway/global/V1__create_extensions.sql" <<'SQL'
-- Global extensions and audit tables
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE TABLE IF NOT EXISTS audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name text NOT NULL,
  operation text NOT NULL,
  payload jsonb,
  created_at timestamptz default now()
);
SQL

# example auth migration
cat > "$ROOT_DIR/migrations/flyway/auth_service/V1__create_auth_tables.sql" <<'SQL'
-- Auth service initial tables
CREATE TABLE IF NOT EXISTS auth_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email varchar(255) NOT NULL UNIQUE,
  password_hash varchar(255) NOT NULL,
  created_at timestamptz DEFAULT now()
);
CREATE TABLE IF NOT EXISTS auth_refresh_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth_users(id) ON DELETE CASCADE,
  token varchar(512) NOT NULL,
  expires_at timestamptz NOT NULL
);
SQL

cat > "$ROOT_DIR/migrations/flyway/auth_service/rollback/R1__drop_auth_tables.sql" <<'SQL'
DROP TABLE IF EXISTS auth_refresh_tokens;
DROP TABLE IF EXISTS auth_users;
SQL

# example user_service migration
cat > "$ROOT_DIR/migrations/flyway/user_service/V1__create_user_tables.sql" <<'SQL'
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username varchar(100) UNIQUE NOT NULL,
  email varchar(255) UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);
SQL

# create seed dirs and sample seeds
mk "migrations/flyway/file_service/seed"
cat > "$ROOT_DIR/migrations/flyway/file_service/seed/demo_files.sql" <<'SQL'
INSERT INTO files_meta (id, owner_id, file_name, created_at)
VALUES (gen_random_uuid(), null, 'example.pdf', now());
SQL

mk "seeds/global"
mk "seeds/auth_service"
mk "seeds/user_service"
mk "seeds/analytics_service"

cat > "$ROOT_DIR/seeds/global/roles_seed.sql" <<'SQL'
INSERT INTO roles (id, name) VALUES (gen_random_uuid(), 'ADMIN'), (gen_random_uuid(), 'USER') ON CONFLICT DO NOTHING;
SQL

cat > "$ROOT_DIR/seeds/auth_service/admin_users_seed.sql" <<'SQL'
INSERT INTO auth_users (id, email, password_hash)
VALUES (gen_random_uuid(), 'admin@edufy.local', 'CHANGE_ME_HASH');
SQL

cat > "$ROOT_DIR/seeds/user_service/demo_users_seed.sql" <<'SQL'
INSERT INTO users (id, username, email)
VALUES (gen_random_uuid(), 'demo_user', 'demo@edufy.local');
SQL

# schemas (snapshot)
mk "schemas"
cat > "$ROOT_DIR/schemas/full_schema_snapshot.sql" <<'SQL'
-- Generated snapshot placeholder
-- Use export_schemas.sh to generate live snapshots
SQL

# configs
mk "configs"
cat > "$ROOT_DIR/configs/db_credentials.env.example" <<'ENV'
POSTGRES_USER=edufy_admin
POSTGRES_PASSWORD=CHANGE_ME
POSTGRES_DB=postgres
ENV

cat > "$ROOT_DIR/configs/flyway.conf" <<'CONF'
flyway.url=jdbc:postgresql://localhost:5432/postgres
flyway.user=\${POSTGRES_USER}
flyway.password=\${POSTGRES_PASSWORD}
flyway.locations=filesystem:./migrations/flyway
CONF

cat > "$ROOT_DIR/configs/liquibase.properties" <<'CONF'
changeLogFile: migrations/liquibase/changelog-master.xml
url: jdbc:postgresql://localhost:5432/postgres
username: ${POSTGRES_USER:-edufy_admin}
password: ${POSTGRES_PASSWORD:-CHANGE_ME}
CONF

# scripts
mk "scripts"
cat > "$ROOT_DIR/scripts/migrate_all.sh" <<'SH'
#!/usr/bin/env bash
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
echo "Running Flyway migrations from $ROOT/migrations/flyway"
flyway -configFiles=$ROOT/configs/flyway.conf migrate
echo "Migrations done."
SH
chmod +x "$ROOT_DIR/scripts/migrate_all.sh"

cat > "$ROOT_DIR/scripts/migrate_service.sh" <<'SH'
#!/usr/bin/env bash
# Usage: migrate_service.sh auth_service
SERVICE=${1:-}
if [ -z "$SERVICE" ]; then
  echo "Usage: $0 <service>"
  exit 1
fi
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
flyway -configFiles=$ROOT/configs/flyway.conf -locations=filesystem:$ROOT/migrations/flyway/$SERVICE migrate
SH
chmod +x "$ROOT_DIR/scripts/migrate_service.sh"

cat > "$ROOT_DIR/scripts/seed_all.sh" <<'SH'
#!/usr/bin/env bash
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
psql_env=( -h localhost -U ${POSTGRES_USER:-edufy_admin} -d ${POSTGRES_DB:-postgres} )
for f in $ROOT/seeds/global/*.sql; do
  echo "Applying $f"; psql "${psql_env[@]}" -f "$f"
done
for dir in $ROOT/seeds/*/; do
  for f in "$dir"/*.sql; do
    [ -f "$f" ] && echo "Applying $f" && psql "${psql_env[@]}" -f "$f"
  done
done
echo "Seeding complete."
SH
chmod +x "$ROOT_DIR/scripts/seed_all.sh"

cat > "$ROOT_DIR/scripts/backup_all.sh" <<'SH'
#!/usr/bin/env bash
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/backups/daily/$(date +%F_%H%M%S)"
mkdir -p "$OUT"
for DB in $(psql -U ${POSTGRES_USER:-edufy_admin} -t -c "SELECT datname FROM pg_database WHERE datistemplate = false;" | sed '/^$/d'); do
  echo "Backing up $DB..."
  pg_dump -U ${POSTGRES_USER:-edufy_admin} -d "$DB" | gzip > "$OUT/${DB}.sql.gz"
done
echo "Backups saved to $OUT"
SH
chmod +x "$ROOT_DIR/scripts/backup_all.sh"

cat > "$ROOT_DIR/scripts/restore_from_backup.sh" <<'SH'
#!/usr/bin/env bash
if [ -z "$1" ]; then
  echo "Usage: restore_from_backup.sh <backup_dir>"
  exit 1
fi
BACKUP_DIR="$1"
for gz in "$BACKUP_DIR"/*.sql.gz; do
  DBNAME=$(basename "$gz" .sql.gz)
  echo "Restoring $DBNAME from $gz"
  gunzip -c "$gz" | psql -U ${POSTGRES_USER:-edufy_admin} -d "$DBNAME"
done
echo "Restore complete."
SH
chmod +x "$ROOT_DIR/scripts/restore_from_backup.sh"

# monitoring
mk "monitoring/grafana-dashboards"
mk "monitoring/alerting"
cat > "$ROOT_DIR/monitoring/prometheus-db.yml" <<'YML'
# Prometheus job for Postgres exporter
global:
  scrape_interval: 15s
scrape_configs:
  - job_name: 'postgres'
    static_configs:
      - targets: ['localhost:9187']
YML

cat > "$ROOT_DIR/monitoring/alerting/db_alerts.yml" <<'YML'
groups:
- name: db.rules
  rules:
  - alert: PostgresDown
    expr: up{job="postgres"} == 0
    for: 1m
    labels:
      severity: critical
    annotations:
      summary: "Postgres is down"
YML

# backups dirs
mk "backups/daily"
mk "backups/weekly"
mk "backups/monthly"
mk "backups/logs"
cat > "$ROOT_DIR/backups/logs/backup_history.log" <<'LOG'
# backup history
LOG

# tools placeholders
mk "tools"
cat > "$ROOT_DIR/tools/validate_sql_structure.py" <<'PY'
#!/usr/bin/env python3
# Проверка простейшей структуры миграций
import os
root='migrations/flyway'
for svc in os.listdir(root):
    path=os.path.join(root,svc)
    if os.path.isdir(path):
        files=[f for f in os.listdir(path) if f.endswith('.sql')]
        print(svc, len(files), "migration files")
PY
chmod +x "$ROOT_DIR/tools/validate_sql_structure.py"

# logs
mk "logs"
touch "$ROOT_DIR/logs/migrations.log"
touch "$ROOT_DIR/logs/seeds.log"
touch "$ROOT_DIR/logs/backup.log"

echo "Готово — структура создана в $ROOT_DIR"
