# اسکلت پرداخت آنلاین

- COD = success فوری
- آنلاین = pending تا payment_status در DB عوض شود
- polling هر ۵ ثانیه + RT.orders / RT.payment
- بعد از درگاه: webhook فقط payment_status را paid/failed می‌کند
