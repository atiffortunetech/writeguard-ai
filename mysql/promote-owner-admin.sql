-- Promote SaaS owner to app admin (unlimited usage + /admin panel)
-- Run in Hostinger phpMyAdmin → select database u998538981_writeguard → SQL tab

UPDATE users
SET role = 'ADMIN'
WHERE email = 'atiffortunetech@gmail.com';
