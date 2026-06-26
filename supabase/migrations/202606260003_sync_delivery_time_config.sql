-- Keep the public delivery-time setting aligned with the admin config key.
insert into config_global (key, value)
select 'delivery_time_message', value
from config_global
where key = 'lead_time_message'
on conflict (key) do nothing;

insert into config_global (key, value)
values ('delivery_time_message', '15 DÍAS HÁBILES')
on conflict (key) do nothing;
