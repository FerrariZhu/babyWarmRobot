-- ============================================================
-- Demo seed data — 开发测试用，每表至少 50 条（偏真实命名）
-- Run after 004_fix_schema.sql
-- 登录: demo_user_1@warmrobot.dev ~ demo_user_50@warmrobot.dev
-- 密码: password123
-- ============================================================

-- ------------------------------------------------------------
-- 0. 清理旧 demo 数据（可重复执行）
-- ------------------------------------------------------------
delete from public.weather_cache where cache_key like 'demo:%';

delete from public.clothing_templates
where description like 'seed:demo:%';

delete from public.materials where code like 'ext_mat_%';
delete from public.categories where code like 'ext_cat_%';
delete from public.thicknesses where code like 'ext_thick_%';
delete from public.size_labels where code like 'ext_size_%';

-- 兼容旧版 mock 标记
delete from public.weather_cache where cache_key like 'mock:%';
delete from public.clothing_templates where name like '模板单品 #%';
delete from public.materials where code like 'mock_mat_%';
delete from public.categories where code like 'mock_cat_%';
delete from public.thicknesses where code like 'mock_thick_%';
delete from public.size_labels where code like 'mock_size_%';

delete from auth.identities
where user_id in (
  select id from auth.users
  where email like 'demo_user_%@warmrobot.dev'
     or email like 'mock_user_%@example.com'
);

delete from auth.users
where email like 'demo_user_%@warmrobot.dev'
   or email like 'mock_user_%@example.com';

-- ------------------------------------------------------------
-- 1. auth.users × 50
-- ------------------------------------------------------------
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token,
  raw_app_meta_data, raw_user_meta_data
)
select
  '00000000-0000-0000-0000-000000000000',
  (
    substr(md5('demo-user-' || i), 1, 8) || '-' ||
    substr(md5('demo-user-' || i), 9, 4) || '-' ||
    substr(md5('demo-user-' || i), 13, 4) || '-' ||
    substr(md5('demo-user-' || i), 17, 4) || '-' ||
    substr(md5('demo-user-' || i), 21, 12)
  )::uuid,
  'authenticated', 'authenticated',
  'demo_user_' || i || '@warmrobot.dev',
  crypt('password123', gen_salt('bf')),
  now() - (i || ' days')::interval,
  now() - (i || ' days')::interval,
  now(),
  '', '', '', '',
  '{"provider":"email","providers":["email"]}'::jsonb,
  jsonb_build_object(
    'display_name', (array[
      '陈静','林浩','黄晓雯','刘志远','赵婷','周磊','吴梦琪','郑凯','孙雨桐','朱俊杰',
      '何美玲','高翔','马莉','罗文斌','梁悦','宋哲','唐颖','韩冬','冯佳','邓子轩',
      '曹雪','彭宇','曾心怡','萧然','蔡思雨','潘俊','袁艺','于海','余小萌','叶知秋',
      '蒋梦洁','杜明','程琳','魏子涵','苏晓','吕晨','丁一','任欣','沈佳宁','姚远',
      '卢思成','姜糖','崔诺','谭沐阳','陆瑶','汪星辰','范小米','金豆豆','石磊','戴乐']
    )[1 + ((i - 1) % 50)],
    'name', (array[
      '陈静','林浩','黄晓雯','刘志远','赵婷','周磊','吴梦琪','郑凯','孙雨桐','朱俊杰',
      '何美玲','高翔','马莉','罗文斌','梁悦','宋哲','唐颖','韩冬','冯佳','邓子轩',
      '曹雪','彭宇','曾心怡','萧然','蔡思雨','潘俊','袁艺','于海','余小萌','叶知秋',
      '蒋梦洁','杜明','程琳','魏子涵','苏晓','吕晨','丁一','任欣','沈佳宁','姚远',
      '卢思成','姜糖','崔诺','谭沐阳','陆瑶','汪星辰','范小米','金豆豆','石磊','戴乐']
    )[1 + ((i - 1) % 50)]
  )
from generate_series(1, 50) as i;

insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
select
  gen_random_uuid(), u.id,
  jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true),
  'email', u.id::text, now(), u.created_at, now()
from auth.users u
where u.email like 'demo_user_%@warmrobot.dev';

-- ------------------------------------------------------------
-- 2. profiles — 城市与坐标
-- ------------------------------------------------------------
update public.profiles p
set
  display_name = sub.parent_name,
  city = (array['北京','上海','广州','深圳','杭州','成都','武汉','西安','南京','重庆',
               '苏州','天津','青岛','厦门','长沙','合肥','郑州','东莞','佛山','无锡'])[1 + (sub.i - 1) % 20],
  latitude = (array[39.90,31.23,23.13,22.54,30.27,30.57,30.59,34.34,32.06,29.56,
                    31.30,39.08,36.07,24.48,28.23,31.82,34.75,23.02,23.02,31.57])[1 + (sub.i - 1) % 20],
  longitude = (array[116.41,121.47,113.26,114.06,120.16,104.07,114.31,108.94,118.80,106.55,
                     120.62,117.20,120.38,118.09,112.94,117.23,113.65,113.75,113.12,120.31])[1 + (sub.i - 1) % 20]
from (
  select
    u.id,
    (regexp_match(u.email, 'demo_user_(\d+)'))[1]::int as i,
    u.raw_user_meta_data ->> 'display_name' as parent_name
  from auth.users u
  where u.email like 'demo_user_%@warmrobot.dev'
) sub
where p.id = sub.id;

-- ------------------------------------------------------------
-- 3. 扩展常量表（真实命名）
-- ------------------------------------------------------------
insert into public.materials (code, name_zh, name_en, description, base_warmth, keywords, sort_order)
select v.code, v.name_zh, v.name_en, v.description, v.base_warmth, v.keywords::text[], v.sort_order
from (values
  ('ext_mat_01','莫代尔','Modal','柔软透气，适合贴身打底',16,'{莫代尔,modal}',101),
  ('ext_mat_02','莱赛尔','Lyocell','天丝类，吸湿排汗',17,'{莱赛尔,天丝,lyocell}',102),
  ('ext_mat_03','法兰绒','Flannel','秋冬床单/居家服常用',38,'{法兰绒,flannel}',103),
  ('ext_mat_04','珊瑚绒','Coral fleece','保暖家居/睡袋内胆',42,'{珊瑚绒}',104),
  ('ext_mat_05','精梳棉','Combed cotton','比普棉更细腻',22,'{精梳棉,combed}',105),
  ('ext_mat_06','有机棉','Organic cotton','低敏宝宝适用',20,'{有机棉,organic}',106),
  ('ext_mat_07','丝光棉','Mercerized cotton','略有光泽的薄棉',18,'{丝光棉}',107),
  ('ext_mat_08','灯芯绒','Corduroy','秋冬裤装常见',45,'{灯芯绒,corduroy}',108),
  ('ext_mat_09','针织棉','Knit cotton','弹性好，连体衣常用',24,'{针织棉,针织}',109),
  ('ext_mat_10','夹棉','Quilted cotton','薄棉袄/夹棉外套',48,'{夹棉,绗缝}',110),
  ('ext_mat_11','羊羔绒','Sherpa','外层内里绒感',44,'{羊羔绒,sherpa}',111),
  ('ext_mat_12','德绒','Heat fiber','自发热感打底',35,'{德绒,发热}',112),
  ('ext_mat_13','真丝混纺','Silk blend','夏季高端连体衣',14,'{真丝,silk}',113),
  ('ext_mat_14','麻棉混纺','Linen cotton','夏季透气外穿',16,'{麻棉,linen}',114),
  ('ext_mat_15','速干面料','Quick dry','运动/户外场景',12,'{速干,quick dry}',115),
  ('ext_mat_16','Coolmax','Coolmax','夏季排汗',11,'{coolmax}',116),
  ('ext_mat_17','PU涂层','PU coated','防泼水外层',30,'{PU,涂层}',117),
  ('ext_mat_18','TPU膜','TPU membrane','雨裤/雨披',28,'{TPU}',118),
  ('ext_mat_19','仿羽绒棉','Synthetic fill','聚酯填充替代羽绒',55,'{仿羽绒,聚酯棉}',119),
  ('ext_mat_20','白鸭绒90%','90% duck down','常见羽绒服填充标称',72,'{90绒,白鸭绒}',120),
  ('ext_mat_21','白鹅绒95%','95% goose down','高端羽绒',88,'{95绒,鹅绒}',121),
  ('ext_mat_22','美利奴羊毛','Merino wool','温控性好',52,'{美利奴,merino}',122),
  ('ext_mat_23','牦牛绒','Yak wool','高原保暖',58,'{牦牛绒}',123),
  ('ext_mat_24','骆驼绒','Camel hair','轻暖',56,'{骆驼绒}',124),
  ('ext_mat_25','醋酯纤维','Acetate','丝滑内衬',15,'{醋酯}',125),
  ('ext_mat_26','再生纤维','Recycled fiber','环保概念面料',19,'{再生,recycled}',126),
  ('ext_mat_27','竹棉混纺','Bamboo cotton','比纯竹更常见',19,'{竹棉}',127),
  ('ext_mat_28','双面粉刷棉','Brushed cotton','内外皆绒',32,'{双面绒,brush}',128),
  ('ext_mat_29','华夫格棉','Waffle cotton','纹理透气',21,'{华夫格,waffle}',129),
  ('ext_mat_30','罗马布','Roma knit','有弹性打底',23,'{罗马布}',130),
  ('ext_mat_31','空气层','Air layer','卫衣/连体中层',36,'{空气层,air layer}',131),
  ('ext_mat_32','银狐绒','Silver fox fleece','网红家居绒',41,'{银狐绒}',132),
  ('ext_mat_33','水晶绒','Crystal fleece','睡袋外层',37,'{水晶绒}',133),
  ('ext_mat_34','舒棉绒','Comfort fleece','偏薄抓绒',38,'{舒棉绒}',134),
  ('ext_mat_35','牛奶丝','Milk silk','夏季睡衣',13,'{牛奶丝}',135),
  ('ext_mat_36','冰丝','Ice silk','夏季外出',12,'{冰丝}',136),
  ('ext_mat_37','云感棉','Cloud cotton','品牌常用营销名',20,'{云感棉}',137),
  ('ext_mat_38','长绒棉','Long staple cotton','高品质棉',26,'{长绒棉}',138),
  ('ext_mat_39','水洗棉','Washed cotton','做旧软感',22,'{水洗棉}',139),
  ('ext_mat_40','桑蚕丝','Mulberry silk','夏季高端',14,'{桑蚕丝,真丝}',140)
) as v(code, name_zh, name_en, description, base_warmth, keywords, sort_order)
on conflict (code) do nothing;

insert into public.categories (code, name_zh, name_en, layer_order, coverage_multiplier, warmth_bonus, sort_order)
select v.code, v.name_zh, v.name_en, v.layer, v.cov, v.bonus, v.ord
from (values
  ('ext_cat_01','口水巾','Bib',0,0.30,0,101),
  ('ext_cat_02','包被/抱被','Swaddle',1,0.85,0,102),
  ('ext_cat_03','肚围/护肚','Belly band',0,0.40,3,103),
  ('ext_cat_04','连脚裤','Footed pants',1,0.85,0,104),
  ('ext_cat_05','分体套装','Two-piece set',1,0.95,0,105),
  ('ext_cat_06','马甲/背心','Vest',2,0.70,0,106),
  ('ext_cat_07','斗篷披风','Cape',3,0.90,0,107),
  ('ext_cat_08','雨衣','Raincoat',3,1.00,0,108),
  ('ext_cat_09','雨裤','Rain pants',1,0.75,0,109),
  ('ext_cat_10','学步鞋袜套','Sock shoes',0,0.35,4,110),
  ('ext_cat_11','耳罩','Ear muffs',0,0.25,4,111),
  ('ext_cat_12','防晒衣','UV jacket',3,0.80,0,112),
  ('ext_cat_13','家居服套装','Loungewear',1,0.90,0,113),
  ('ext_cat_14','夹棉连体','Quilted romper',2,1.05,0,114),
  ('ext_cat_15','羽绒连体','Down romper',3,1.15,0,115),
  ('ext_cat_16','针织开衫','Cardigan',2,0.95,0,116),
  ('ext_cat_17','打底秋裤','Long johns',1,0.75,0,117),
  ('ext_cat_18','羽绒裤','Down pants',1,0.85,0,118),
  ('ext_cat_19','滑雪服','Snowsuit',3,1.25,0,119),
  ('ext_cat_20','睡袍','Robe',1,0.90,0,120),
  ('ext_cat_21','襁褓睡袋','Swaddle sack',1,1.00,0,121),
  ('ext_cat_22','分腿睡袋','Sleep sack',1,1.05,0,122),
  ('ext_cat_23','恒温睡袋','TOG sleep sack',1,1.10,0,123),
  ('ext_cat_24','纱布盖毯','Muslin blanket',0,0.50,0,124),
  ('ext_cat_25','小毯子','Blanket',0,0.55,2,125),
  ('ext_cat_26','推车脚套','Stroller footmuff',1,0.90,0,126),
  ('ext_cat_27','背带罩','Carrier cover',3,0.85,0,127),
  ('ext_cat_28','遮阳帽','Sun hat',0,0.30,0,128),
  ('ext_cat_29','渔夫帽','Bucket hat',0,0.35,0,129),
  ('ext_cat_30','贝雷帽','Beret',0,0.30,5,130),
  ('ext_cat_31','连指手套','Mittens',0,0.30,5,131),
  ('ext_cat_32','分指手套','Gloves',0,0.28,5,132),
  ('ext_cat_33','护膝','Knee pads',0,0.20,0,133),
  ('ext_cat_34','围嘴套装','Bib set',0,0.25,0,134),
  ('ext_cat_35','礼盒连体衣','Gift set romper',1,1.00,0,135),
  ('ext_cat_36','满月礼服','Ceremony outfit',2,1.00,0,136),
  ('ext_cat_37','拍照造型服','Photo prop outfit',1,0.80,0,137),
  ('ext_cat_38','泳衣','Swimsuit',1,0.60,0,138),
  ('ext_cat_39','泳帽','Swim cap',0,0.20,0,139)
) as v(code, name_zh, name_en, layer, cov, bonus, ord)
on conflict (code) do nothing;

insert into public.thicknesses (code, name_zh, name_en, multiplier, sort_order)
select v.code, v.name_zh, v.name_en, v.mult, v.ord
from (values
  ('ext_thick_01','极薄/夏款',  'Ultra thin',  0.85, 101),
  ('ext_thick_02','薄款',       'Thin',        1.00, 102),
  ('ext_thick_03','春秋单',     'Spring fall', 1.15, 103),
  ('ext_thick_04','标准',       'Standard',    1.30, 104),
  ('ext_thick_05','偏厚',       'Medium plus', 1.40, 105),
  ('ext_thick_06','加厚',       'Thick',       1.60, 106),
  ('ext_thick_07','特厚',       'Extra thick', 1.75, 107),
  ('ext_thick_08','冬季款',     'Winter',      1.80, 108),
  ('ext_thick_09','深冬款',     'Deep winter', 1.90, 109),
  ('ext_thick_10','轻量羽绒',   'Light puffer',1.35, 110)
) as v(code, name_zh, name_en, mult, ord)
on conflict (code) do nothing;

-- 厚度表补至 50（在 ext_thick_10 基础上变体描述）
insert into public.thicknesses (code, name_zh, name_en, multiplier, sort_order)
select
  'ext_thick_' || lpad((10 + i)::text, 2, '0'),
  (array['单布款','双层面料','三层夹棉','轻暖款','中暖款','重暖款','TOG1.0','TOG2.5','TOG3.5','室内款',
         '外出款','过渡季','梅雨季','空调房','暖气房','北方供暖','南方湿冷','海边防风','高原防晒','露营款',
         '推车款','背带款','爬行款','学步款','午睡款','夜间款','清晨款','傍晚款','周末郊游','商场室内',
         '托育园款','社区遛娃','公园款','郊区款','城际出行','飞机款','高铁款','自驾款','骑行挡风','户外拍照',
         '节日拜年','亲友聚餐','疫苗接种','儿保体检','游泳前后','洗澡后','晒黄疸','满月酒','百天宴','周岁礼']
  )[1 + ((i - 1) % 40)],
  'Variant ' || (10 + i),
  round((1.0 + ((10 + i) % 9) * 0.1)::numeric, 2),
  110 + i
from generate_series(1, 40) as i
on conflict (code) do nothing;

insert into public.size_labels (code, name_zh, age_months_min, age_months_max, sort_order)
select v.code, v.name_zh, v.min_m, v.max_m, v.ord
from (values
  ('ext_size_48','48码（早产/小胎）',0,1,101),
  ('ext_size_53','53码',0,2,102),
  ('ext_size_60','60码',2,5,103),
  ('ext_size_65','65码',4,8,104),
  ('ext_size_70','70码',5,10,105),
  ('ext_size_75','75码',7,12,106),
  ('ext_size_85','85码',10,16,107),
  ('ext_size_95','95码',14,22,108),
  ('ext_size_105','105码',20,30,109),
  ('ext_size_110','110码',28,36,110)
) as v(code, name_zh, min_m, max_m, ord)
on conflict (code) do nothing;

insert into public.size_labels (code, name_zh, age_months_min, age_months_max, sort_order)
select
  'ext_size_' || (110 + i),
  (array['新生儿通用','满月码','百天码','半岁码','九个月','一岁码','十五个月','十八个月','两码合一','偏大一号',
         '偏小一号','刚合身穿','留成长空间','二手转入','亲友赠送','海淘美码0-3M','海淘3-6M','海淘6-9M','海淘9-12M','欧码62',
         '欧码68','欧码74','欧码80','欧码86','欧码92','英码0-3','英码3-6','英码6-9','英码9-12','日码60',
         '日码70','日码80','日码90','日码95','日码100','连体衣专用','分体上装码','分体下装码','睡袋专用码','鞋袜配套码']
  )[1 + ((i - 1) % 33)],
  (i % 18),
  12 + (i % 24),
  110 + i
from generate_series(1, 33) as i
on conflict (code) do nothing;

-- clothing_templates 补至 50
insert into public.clothing_templates (
  name, description, category, material, material_id, thickness, warmth_score,
  age_months_min, age_months_max, sort_order
)
select
  tpl.name,
  'seed:demo:' || tpl.name,
  tpl.cat::public.clothing_category,
  m.code::public.fabric_material,
  m.id,
  tpl.thick::public.thickness_level,
  0,
  tpl.age_min,
  tpl.age_max,
  tpl.ord
from (values
  (11,'新生儿纯棉和尚服','bodysuit','thin',0,3),
  (12,'罗纹长袖包屁衣','bodysuit','medium',1,6),
  (13,'竹纤维短袖连体衣','bodysuit','thin',3,9),
  (14,'薄款针织开衫','mid','thin',6,24),
  (15,'摇粒绒拉链外套','mid','medium',6,24),
  (16,'夹棉连体外出服','outer','medium',3,18),
  (17,'轻量羽绒马甲','outer','medium',9,24),
  (18,'厚款羽绒服','outer','thick',12,36),
  (19,'防风软壳外套','outer','medium',12,36),
  (20,'加绒卫裤','pants','medium',12,36),
  (21,'纯棉秋裤','pants','thin',6,24),
  (22,'一体式睡袋 TOG1.0','sleepwear','thin',0,6),
  (23,'分腿睡袋 TOG2.5','sleepwear','medium',6,18),
  (24,'冬季加厚睡袋','sleepwear','thick',0,12),
  (25,'胎帽（纯棉）','hat','thin',0,3),
  (26,'针织护耳帽','hat','medium',6,24),
  (27,'防风雷锋帽','hat','thick',6,24),
  (28,'短筒棉袜三双装','socks','thin',0,12),
  (29,'毛圈厚袜','socks','thick',6,24),
  (30,'连指小手套','gloves','medium',6,24),
  (31,'薄款防晒衣','outer','thin',6,36),
  (32,'纱布小方巾','other','thin',0,12),
  (33,'全棉包被（春秋）','other','medium',0,3),
  (34,'冬季包被（夹棉）','other','thick',0,6),
  (35,'口水巾三条装','other','thin',0,24),
  (36,'肚围护脐带','other','thin',0,6),
  (37,'连脚爬服','bodysuit','medium',3,12),
  (38,'摇粒绒居家套装','inner','medium',6,24),
  (39,'羊毛打底衫','inner','medium',9,36),
  (40,'羽绒连体衣','outer','thick',6,24),
  (41,'雨披式外套','outer','medium',12,36),
  (42,'室内家居连体','bodysuit','thin',3,18),
  (43,'外出连体+帽子套装','bodysuit','medium',3,12),
  (44,'托育园备用衣裤','inner','thin',12,36),
  (45,'周末郊游三件套','mid','medium',9,24),
  (46,'暖气房薄款打底','inner','thin',0,12),
  (47,'南方湿冷抓绒','mid','medium',6,24),
  (48,'北方供暖室内','inner','thin',6,24),
  (49,'夜间换洗备用包屁衣','bodysuit','medium',0,12),
  (50,'满月礼盒连体衣','bodysuit','medium',0,3)
) as tpl(ord, name, cat, thick, age_min, age_max)
cross join lateral (
  select id, code
  from public.materials
  where code in (
    'cotton_light','cotton_heavy','bamboo','fleece','wool_light',
    'wool_heavy','down_light','down_heavy','waterproof','other'
  )
  order by code
  offset (tpl.ord % 10) limit 1
) m;

-- ------------------------------------------------------------
-- 4. babies × 50
-- ------------------------------------------------------------
insert into public.babies (
  id, user_id, name, birth_date, gender, activity_level,
  current_size_label, current_size_updated_at, is_active, notes
)
select
  (
    substr(md5('demo-baby-' || sub.i), 1, 8) || '-' ||
    substr(md5('demo-baby-' || sub.i), 9, 4) || '-' ||
    substr(md5('demo-baby-' || sub.i), 13, 4) || '-' ||
    substr(md5('demo-baby-' || sub.i), 17, 4) || '-' ||
    substr(md5('demo-baby-' || sub.i), 21, 12)
  )::uuid,
  sub.user_id,
  (array[
    '小糯米','豆豆','乐宝','橙子','糖糖','安安','汤圆','小满','小米','果果',
    '团子','星星','沐沐','一一','禾禾','夏夏','冬冬','晨晨','芽芽','朵朵',
    '小北','南南','沐阳','知知','悠悠','然然','诺诺','言言','小禾','澄澄',
    '小棠','舟舟','小鱼','麦麦','桃桃','小七','九九','小羽','元宝','点点',
    '小澈','陶陶','小木','鹿鹿','小棠','糖豆','小葵','小满','小朵','乐言']
  )[1 + ((sub.i - 1) % 50)],
  current_date - ((3 + (sub.i % 28)) || ' months')::interval,
  (array['male','female','unknown'])[1 + (sub.i % 3)],
  (array['low','medium','high']::public.activity_level[])[1 + (sub.i % 3)],
  (array['52','59','66','73','80','90','100'])[1 + (sub.i % 7)],
  now() - (sub.i || ' days')::interval,
  true,
  'seed:demo:baby:' || lpad(sub.i::text, 3, '0')
from (
  select u.id as user_id, (regexp_match(u.email, 'demo_user_(\d+)'))[1]::int as i
  from auth.users u
  where u.email like 'demo_user_%@warmrobot.dev'
) sub;

-- ------------------------------------------------------------
-- 5. baby_warmth_preferences × 50
-- ------------------------------------------------------------
insert into public.baby_warmth_preferences (baby_id, warmth_offset, notes)
select
  b.id,
  ((b.ord % 11) - 5)::numeric,
  (array[
    '平时穿得偏暖，建议比标准多一层',
    '怕热，出门少穿一件',
    '刚学会走路，活动量大，略减一层',
    '托育园室内有暖气，外出再加厚',
    '新手爸妈，先按标准来',
    '老人带娃，习惯多裹一层',
    '湿疹期，避免过厚闷热',
    '南方没暖气，冬季偏暖',
    '北方有供暖，室内偏薄',
    '早产儿，比同龄偏暖',
    '满月后体质不错，按标准即可',
    '最近感冒刚好，暂时偏暖',
    '爱出汗，选透气材质优先',
    '推车出行多，防风比保暖优先',
    '背带常穿，核心保暖即可'
  ])[1 + ((b.ord - 1) % 15)]
from (
  select id, row_number() over (order by created_at) as ord
  from public.babies
  where notes like 'seed:demo:baby:%'
) b;

-- ------------------------------------------------------------
-- 6. clothing_items × 100
-- ------------------------------------------------------------
insert into public.clothing_items (
  id, user_id, baby_id, name, category, material, material_id, thickness,
  size_label, weight_grams, color, source, source_url, is_available, season_tags, notes
)
select
  (
    substr(md5('demo-item-a-' || sub.i), 1, 8) || '-' ||
    substr(md5('demo-item-a-' || sub.i), 9, 4) || '-' ||
    substr(md5('demo-item-a-' || sub.i), 13, 4) || '-' ||
    substr(md5('demo-item-a-' || sub.i), 17, 4) || '-' ||
    substr(md5('demo-item-a-' || sub.i), 21, 12)
  )::uuid,
  sub.user_id, sub.baby_id,
  (array[
    '全棉时代 婴幼儿纯棉连体衣','英氏 新生儿和尚服','优衣库 婴儿摇粒绒外套','巴拉巴拉 薄款羽绒马甲',
    '童泰 罗纹包屁衣三件装','安奈儿 竹纤维短袖爬服','Gap 婴儿针织开衫','H&M 婴儿 fleece 连体',
    'mothercare 睡袋 1.0 TOG','Nest Designs 竹棉睡袋','Mini Balabala 加绒卫裤','戴维贝拉 防风外套',
    'papa 有机棉打底衫','优衣库 婴儿轻型羽绒服','英氏 夹棉外出连体','全棉时代 胎帽两件装',
    '卡特 纯棉短袜六双装','江博士 室内学步袜','无品牌 外婆手织小毛衣','亲友赠送 二手包被',
    '淘宝 韩版针织帽','京东 婴儿防水围兜','拼多多 肚围两条','线下母婴店 连脚爬服',
    '山姆 Member''s Mark 居家套装','Costco 婴儿连体三件套','抖音 直播款抓绒外套','小红书 种草纱布巾',
    '闲鱼 九成新羽绒连体','品牌unknown 满月礼盒装','丽婴房 春秋连体衣','好孩子 分腿睡袋',
    '可优比 恒温睡袋','十月结晶 待产包连体','子初 纯棉包屁衣','博洋 儿童秋裤',
    '南极人 加绒打底裤（偏小）','马克珍妮 针织连衣裙改','雅鹿 儿童羽绒内胆','波司登 童款羽绒（大码卷边）',
    '幼儿园名帖 备用换洗衣','社区团购 棉服','海淘 Next 包屁衣','海淘 Zara 针织',
    '西松屋 日本购连体','MIKIHOUSE 二手入','本地裁缝 改小棉裤','奶奶织 毛线裤',
    '社区闲置群 80码外套','朋友转赠 66码连体','电商大促囤货 73码','双11 预售 90码羽绒'
  ])[1 + ((sub.i - 1) % 50)],
  (array['bodysuit','inner','mid','outer','pants','sleepwear','hat','socks','gloves','scarf','other']::public.clothing_category[])[1 + (sub.i % 11)],
  m.code::public.fabric_material, m.id,
  (array['thin','medium','thick']::public.thickness_level[])[1 + (sub.i % 3)],
  (array['52','59','66','73','80','90','100'])[1 + (sub.i % 7)],
  180 + (sub.i * 19) % 520,
  (array['奶白','浅杏','淡粉','浅蓝','灰白','浅黄','薄荷绿','浅卡其'])[1 + (sub.i % 8)],
  (array['manual','url','template','ocr']::public.item_source[])[1 + (sub.i % 4)],
  case when sub.i % 4 = 1 then
    (array[
      'https://item.taobao.com/item.htm?id=1001',
      'https://item.jd.com/1002.html',
      'https://mobile.yangkeduo.com/goods.html?goods_id=1003',
      'https://detail.tmall.com/item.htm?id=1004'
    ])[1 + (sub.i % 4)]
  else null end,
  sub.i % 6 <> 0,
  array[(array['spring','summer','autumn','winter'])[1 + (sub.i % 4)]],
  'seed:demo:wardrobe'
from (
  select u.id as user_id, b.id as baby_id,
    (regexp_match(u.email, 'demo_user_(\d+)'))[1]::int as i
  from auth.users u
  join public.babies b on b.user_id = u.id
   and b.notes = 'seed:demo:baby:' || lpad((regexp_match(u.email, 'demo_user_(\d+)'))[1], 3, '0')
  where u.email like 'demo_user_%@warmrobot.dev'
) sub
cross join lateral (
  select id, code from public.materials
  where code in ('cotton_light','cotton_heavy','bamboo','fleece','wool_light','wool_heavy','down_light','down_heavy','waterproof','other')
  order by code offset (sub.i % 10) limit 1
) m;

insert into public.clothing_items (
  user_id, baby_id, name, category, material, material_id, thickness,
  size_label, weight_grams, color, source, is_available, notes
)
select
  sub.user_id, sub.baby_id,
  (array[
    '优衣库 婴儿Extra Warm 羽绒','英氏 厚款羽绒服','Mini Peace 加绒外套','Adidas 婴儿运动套装上',
    'Nike 婴儿卫衣（偏大）','Uniqlo 婴儿HEATTECH 打底','Decathlon 婴儿抓绒','迪卡侬 防风软壳',
    '本地商场 丽婴房 针织','社区母婴 二手 80码棉服','淘宝 代购 日单连体','京东自营 童泰 秋裤',
    '拼多多 毛圈袜五双','山姆 婴儿居家连体','盒马 婴儿纱布巾三条','孩子王 门店购 睡袋',
    '爱婴室 会员价 包屁衣','贝贝怡 电商款 夹棉','安踏儿童 迷你款 卫衣','李宁婴儿 国潮连体',
    '牧高笛 婴儿露营保暖层','凯乐石 童款抓绒（改小）','骆驼 亲子款 马甲','探路者 童款 冲锋衣内胆',
    '线下裁缝铺 改短 羽绒','外婆新织 羊毛开衫','姑姑送 手工鞋袜','表姐转 95新 睡袋',
    '小区群 闲置 66码','公司同事 赠送 73码','月子中心 赠送 胎帽','医院待产包 剩余 52码',
    '摄影工作室 租借 造型服（已购）','百天照 定制 连体','周岁宴 中式 小马甲','亲子旅行 备用户外服',
    '疫苗日 备用 薄外套','儿保 常穿 连体','游泳课 浴巾斗篷','洗澡后 速干 浴袍',
    '早教中心 备用 袜','祖父母家 放一套 73','外公外婆家 放一套 80','车上常备 薄毯+连体',
    '推车里 脚套','背带 搭配 防风罩','自行车 儿童座椅 挡风被','冬季 商场 室内脱穿 马甲',
    '春节拜年 新衣 80码','换季整理 66码 备用连体'
  ])[1 + ((gs.i - 1) % 50)],
  (array['bodysuit','inner','mid','outer','pants','sleepwear','hat','socks','gloves','scarf','other']::public.clothing_category[])[1 + ((gs.i + 2) % 11)],
  m.code::public.fabric_material, m.id,
  (array['thin','medium','thick']::public.thickness_level[])[1 + ((gs.i + 1) % 3)],
  (array['66','73','80','90'])[1 + (gs.i % 4)],
  220 + (gs.i * 13) % 480,
  (array['藏青','酒红','燕麦','浅灰','米白','松绿','藕粉'])[1 + (gs.i % 7)],
  (array['manual','url','template','ocr']::public.item_source[])[1 + (gs.i % 4)],
  gs.i % 8 <> 0,
  'seed:demo:wardrobe'
from generate_series(1, 50) gs(i)
cross join lateral (
  select u.id as user_id, b.id as baby_id
  from auth.users u
  join public.babies b on b.user_id = u.id
   and b.notes = 'seed:demo:baby:' || lpad(((gs.i - 1) % 50 + 1)::text, 3, '0')
  where u.email = 'demo_user_' || ((gs.i - 1) % 50 + 1) || '@warmrobot.dev'
  limit 1
) sub
cross join lateral (
  select id, code from public.materials
  where code in ('cotton_light','cotton_heavy','bamboo','fleece','wool_light','wool_heavy','down_light','down_heavy','waterproof','other')
  order by code offset ((gs.i + 3) % 10) limit 1
) m;

-- ------------------------------------------------------------
-- 7. outfit_recommendations × 50
-- ------------------------------------------------------------
insert into public.outfit_recommendations (
  id, user_id, baby_id, recommended_date,
  weather_temp, weather_feels_like, weather_humidity, weather_wind_speed, weather_pressure, weather_text,
  weather_latitude, weather_longitude, weather_uv_index, weather_precip_mm, weather_precip_probability,
  required_warmth, actual_warmth, reason, variant, scenario, time_slot
)
select
  (
    substr(md5('demo-rec-' || i), 1, 8) || '-' ||
    substr(md5('demo-rec-' || i), 9, 4) || '-' ||
    substr(md5('demo-rec-' || i), 13, 4) || '-' ||
    substr(md5('demo-rec-' || i), 17, 4) || '-' ||
    substr(md5('demo-rec-' || i), 21, 12)
  )::uuid,
  sub.user_id, sub.baby_id,
  current_date - ((i % 25) || ' days')::interval,
  (-2 + (i % 32))::numeric,
  (-5 + (i % 35))::numeric,
  35 + (i % 55),
  round((0.5 + (i % 15) * 0.4)::numeric, 1),
  995 + (i % 25),
  (array['晴','多云','阴','小雨','中雨','小雪','雾','扬沙'])[1 + (i % 8)],
  sub.latitude, sub.longitude,
  round((1 + (i % 8) * 0.6)::numeric, 1),
  round(((i % 15) * 0.8)::numeric, 1),
  (i * 2) % 100,
  25 + (i % 65),
  27 + (i % 63),
  'seed:demo|' || (array[
    '体感约8°C，有风，建议内层包屁衣+抓绒中层+轻薄羽绒外层，出门戴帽子。',
    '体感18°C，室内活动为主，一件薄连体即可，注意肚围保暖。',
    '体感25°C，晴，短袖连体+遮阳帽，外出注意防晒。',
    '体感12°C，阴，建议连体打底+针织开衫，推车可加小毯。',
    '体感3°C，北风，厚羽绒连体+雷锋帽+厚袜，减少户外停留时间。',
    '夜间睡眠18°C，推荐TOG2.5分腿睡袋，不必额外加盖。',
    '体感15°C，小雨，防水软壳+内层打底，记得带备用衣物。',
    '体感22°C，湿度偏高，选透气竹纤维连体，少穿一层。',
    '体感10°C，宝宝学走路，比标准少一层中层，避免出汗着凉。',
    '体感-1°C，雪后，厚羽绒+防风外层+连指手套，外出限时。',
    '暖气房22°C/室外5°C，采用洋葱式穿搭，进门及时脱外层。',
    '体感16°C，托育园室内，薄打底+备用马甲即可。',
    '清晨10°C/午后18°C，建议备一件可脱卸的马甲。',
    '体感20°C，有UV，薄长袖+防晒帽，避免直晒。',
    '体感14°C，南风，标准三层：打底+抓绒+防风外套。'
  ])[1 + ((i - 1) % 15)],
  (array['default','warmer','cooler'])[1 + (i % 3)],
  (array['indoor','outdoor','sleep'])[1 + (i % 3)],
  (array['morning','afternoon','evening','night'])[1 + (i % 4)]
from generate_series(1, 50) as i
cross join lateral (
  select p.id as user_id, b.id as baby_id, p.latitude, p.longitude
  from auth.users u
  join public.profiles p on p.id = u.id
  join public.babies b on b.user_id = p.id
   and b.notes = 'seed:demo:baby:' || lpad(i::text, 3, '0')
  where u.email = 'demo_user_' || i || '@warmrobot.dev'
  limit 1
) sub;

-- ------------------------------------------------------------
-- 8. outfit_recommendation_items × 100
-- ------------------------------------------------------------
insert into public.outfit_recommendation_items (recommendation_id, clothing_item_id, layer_order, is_worn)
select r.id, c.id, c.rn::smallint, c.rn = 1 and r.ord % 4 = 0
from (
  select id, user_id, row_number() over (order by created_at, id) as ord
  from public.outfit_recommendations
  where reason like 'seed:demo|%'
) r
join (
  select user_id, id, row_number() over (partition by user_id order by id) as rn
  from public.clothing_items
  where notes = 'seed:demo:wardrobe'
) c on c.user_id = r.user_id and c.rn <= 2;

-- ------------------------------------------------------------
-- 9. weather_cache × 50
-- ------------------------------------------------------------
insert into public.weather_cache (cache_key, latitude, longitude, city, fetched_at, expires_at, payload)
select
  'demo:' || loc.city || ':' || to_char(now(), 'YYYY-MM-DD') || ':' || lpad(i::text, 2, '0'),
  loc.lat, loc.lng, loc.city,
  now() - (i || ' hours')::interval,
  now() + ((90 - i) || ' minutes')::interval,
  jsonb_build_object(
    'temp', -2 + (i % 32),
    'feels_like', -5 + (i % 35),
    'humidity', 35 + (i % 55),
    'wind_speed', round((0.5 + (i % 15) * 0.4)::numeric, 1),
    'pressure', 995 + (i % 25),
    'text', (array['晴','多云','阴','小雨','小雪','雾'])[1 + (i % 6)],
    'provider', 'demo'
  )
from generate_series(1, 50) as i
cross join lateral (
  select
    (array['北京','上海','广州','深圳','杭州','成都','武汉','西安','南京','重庆',
           '苏州','青岛','厦门','长沙','合肥','郑州','东莞','佛山','无锡','宁波'])[1 + (i % 20)] as city,
    (array[39.90,31.23,23.13,22.54,30.27,30.57,30.59,34.34,32.06,29.56,
           31.30,36.07,24.48,28.23,31.82,34.75,23.02,23.02,31.57,29.87])[1 + (i % 20)] as lat,
    (array[116.41,121.47,113.26,114.06,120.16,104.07,114.31,108.94,118.80,106.55,
           120.62,120.38,118.09,112.94,117.23,113.65,113.75,113.12,120.31,121.55])[1 + (i % 20)] as lng
) loc;

-- ------------------------------------------------------------
-- 10. url_parse_jobs × 50
-- ------------------------------------------------------------
insert into public.url_parse_jobs (user_id, source_url, status, result, error_message, completed_at)
select
  u.id,
  (array[
    'https://item.taobao.com/item.htm?id=6789012345',
    'https://detail.tmall.com/item.htm?id=12345678901',
    'https://item.jd.com/100012345678.html',
    'https://mobile.yangkeduo.com/goods.html?goods_id=9876543210'
  ])[1 + (i % 4)],
  (array['pending','processing','success','failed'])[1 + (i % 4)],
  case when i % 4 = 2 then jsonb_build_object(
    'title', (array[
      '全棉时代 新生儿纯棉连体衣 66码',
      '英氏 婴儿罗纹长袖包屁衣 四季款',
      '巴拉巴拉 婴儿轻薄羽绒服 73码',
      '童泰 竹纤维短袖爬服 夏季',
      '优衣库 婴儿摇粒绒拉链外套',
      'Nest Designs 竹棉睡袋 1.0 TOG',
      '戴维贝拉 婴儿防风软壳外套',
      'Mini Balabala 加绒卫裤 80码'
    ])[1 + (i % 8)],
    'material_guess', (array['cotton_heavy','cotton_light','down_light','bamboo','fleece','bamboo','waterproof','fleece'])[1 + (i % 8)],
    'size_guess', (array['66','73','80','59','90'])[1 + (i % 5)],
    'price', (99 + (i % 200))::text
  ) else '{}'::jsonb end,
  case when i % 4 = 3 then
    (array[
      '页面需要登录，无法抓取商品详情',
      '链接已失效或商品下架',
      '平台反爬限制，请手动添加',
      '解析超时，请稍后重试'
    ])[1 + (i % 4)]
  else null end,
  case when i % 4 in (2, 3) then now() - (i || ' hours')::interval else null end
from generate_series(1, 50) as i
join auth.users u on u.email = 'demo_user_' || i || '@warmrobot.dev';

-- ------------------------------------------------------------
-- 11. 验证
-- ------------------------------------------------------------
do $$
declare
  cnt integer;
  tbl text;
  min_expected integer := 50;
  tables text[] := array[
    'profiles','babies','materials','categories','thicknesses','size_labels',
    'clothing_templates','clothing_items','baby_warmth_preferences',
    'outfit_recommendations','outfit_recommendation_items','weather_cache','url_parse_jobs'
  ];
begin
  foreach tbl in array tables loop
    execute format('select count(*) from public.%I', tbl) into cnt;
    if cnt < min_expected then
      raise warning '表 % 当前仅 % 条，少于 % 条', tbl, cnt, min_expected;
    else
      raise notice '表 % : % 条 ✓', tbl, cnt;
    end if;
  end loop;
  raise notice 'Demo 账号: demo_user_1@warmrobot.dev ~ demo_user_50@warmrobot.dev，密码 password123';
end $$;
