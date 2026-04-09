-- CRM API role constraint fix (PostgreSQL)
-- 목적:
-- 1) roles.name 값이 앱에서 사용하는 값(ADMIN/CRM/USER)과 일치하도록 정리
-- 2) roles_name_check 제약조건을 안전하게 재생성

BEGIN;

-- legacy prefix 값이 남아 있으면 표준 값으로 정리
UPDATE roles SET name = 'ADMIN' WHERE name = 'ROLE_ADMIN';
UPDATE roles SET name = 'CRM' WHERE name = 'ROLE_CRM';
UPDATE roles SET name = 'USER' WHERE name = 'ROLE_USER';

-- 기존 제약조건 제거 후 재생성
ALTER TABLE roles DROP CONSTRAINT IF EXISTS roles_name_check;
ALTER TABLE roles
  ADD CONSTRAINT roles_name_check
  CHECK (name IN ('ADMIN', 'CRM', 'USER'));

COMMIT;

-- 검증 쿼리
-- SELECT id, name FROM roles ORDER BY id;
-- SELECT conname, pg_get_constraintdef(c.oid)
-- FROM pg_constraint c
-- JOIN pg_class t ON t.oid = c.conrelid
-- WHERE t.relname = 'roles' AND c.conname = 'roles_name_check';
