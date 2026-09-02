-- ============================================================
-- D2 补充：给 API 角色授权（SQL Editor 建表后需手动授权一次）
-- 安全说明：表级授权 + RLS 双层防护，未登录用户只能看到 0 行
-- ============================================================
grant usage on schema public to anon, authenticated;

grant select, insert, update, delete
  on all tables in schema public to anon, authenticated;

grant execute on all functions in schema public to anon, authenticated;

-- 以后新建的表也自动授权
alter default privileges in schema public
  grant select, insert, update, delete on tables to anon, authenticated;
alter default privileges in schema public
  grant execute on functions to anon, authenticated;
