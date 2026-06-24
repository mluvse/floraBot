const { Pool } = require('pg');
const logger = require('../utils/logger');

const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    })
  : new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'florabot',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
    });

const TREES = [
  // Цветущие деревья
  ['Яблоня домашняя','Malus domestica','Розовые (Rosaceae)','Листопадное дерево 3–12 м. Одно из древнейших культурных растений мира.','Цветки белые или розовые, 3–4 см, в зонтиковидных соцветиях из 3–7 цветков. Лепестки округлые, тычинок много, пестик один.','Апрель–Май',['Европа','Азия','Россия'],'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Flowering_Apple_Tree.jpg/800px-Flowering_Apple_Tree.jpg'],
  ['Вишня обыкновенная','Prunus cerasus','Розовые (Rosaceae)','Дерево или кустарник 2–7 м. Широко культивируется ради кисло-сладких плодов.','Цветки белые, 2–3 см, 5-лепестковые, по 2–4 штуки на коротких цветоножках, появляются до листьев.','Апрель–Май',['Европа','Средняя Азия','Россия'],'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bb/Cherry_Blossoms_in_Vancouver_3_crop.jpg/800px-Cherry_Blossoms_in_Vancouver_3_crop.jpg'],
  ['Сирень обыкновенная','Syringa vulgaris','Маслинные (Oleaceae)','Кустарник до 7 м. Широко используется в озеленении благодаря ароматным соцветиям.','Цветки сиреневые или белые, четырёхлепестковые, в крупных метёлках до 20 см. Очень ароматные.','Май–Июнь',['Балканы','Европа','Россия'],'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Lilac_blooms_2013.jpg/800px-Lilac_blooms_2013.jpg'],
  ['Каштан конский','Aesculus hippocastanum','Сапиндовые (Sapindaceae)','Дерево до 30 м. Широко используется в городском озеленении.','Цветки белые с жёлтыми и красными пятнами, в прямостоячих метёлках 20–30 см.','Май',['Балканы','Европа','Россия'],'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/Aesculus_hippocastanum_flowers.jpg/800px-Aesculus_hippocastanum_flowers.jpg'],
  ['Черёмуха обыкновенная','Prunus padus','Розовые (Rosaceae)','Дерево 2–10 м. Характерен специфический запах коры и листьев.','Цветки белые, душистые, около 1.5 см, в поникающих кистях 7–15 см.','Май',['Европа','Азия','Россия','Сибирь'],'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/Prunus_padus_flowers.jpg/800px-Prunus_padus_flowers.jpg'],
  ['Акация белая','Robinia pseudoacacia','Бобовые (Fabaceae)','Быстрорастущее дерево 20–25 м из Северной Америки. Ценный медонос.','Цветки белые, мотыльковые, в поникающих кистях 10–20 см, очень ароматные.','Май–Июнь',['Северная Америка','Европа','Россия'],'https://upload.wikimedia.org/wikipedia/commons/thumb/7/79/Robinia_pseudoacacia_flowers.jpg/800px-Robinia_pseudoacacia_flowers.jpg'],
  ['Рябина обыкновенная','Sorbus aucuparia','Розовые (Rosaceae)','Дерево 5–15 м с перистыми листьями и яркими красными плодами.','Цветки белые, мелкие, около 1 см, в щитковидных соцветиях до 10 см.','Май–Июнь',['Европа','Азия','Россия','Сибирь'],'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Sorbus_aucuparia20100925_015.jpg/800px-Sorbus_aucuparia20100925_015.jpg'],
  ['Липа мелколистная','Tilia cordata','Мальвовые (Malvaceae)','Дерево до 30 м, живёт 400–500 лет. Ценный медонос. Древесина мягкая, лёгкая, хорошо режется.','Цветки желтовато-белые, ароматные, в полузонтиках из 5–11 цветков с прицветным листом.','Июнь–Июль',['Европа','Западная Сибирь','Россия'],'https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/Tilia_cordata_flowers_and_leaves.jpg/800px-Tilia_cordata_flowers_and_leaves.jpg'],
  ['Магнолия крупноцветковая','Magnolia grandiflora','Магнолиевые (Magnoliaceae)','Вечнозелёное дерево до 30 м из юго-востока США.','Цветки белые, огромные 15–30 см, с сильным ароматом, из 6–12 лепестков.','Май–Сентябрь',['Северная Америка','Южная Европа','Кавказ'],'https://upload.wikimedia.org/wikipedia/commons/thumb/5/56/White_Magnolia_Flowers_South_Carolina.jpg/800px-White_Magnolia_Flowers_South_Carolina.jpg'],
  ['Сакура','Prunus serrulata','Розовые (Rosaceae)','Декоративное дерево 5–12 м, символ Японии. Широко культивируется во всём мире.','Цветки розовые или белые, 3–5 см, простые или махровые, по 3–5 штук в соцветии.','Март–Май',['Япония','Китай','Корея','Европа'],'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Cherry_blossom_%28sakura%29.jpg/800px-Cherry_blossom_%28sakura%29.jpg'],
  ['Слива домашняя','Prunus domestica','Розовые (Rosaceae)','Плодовое дерево 6–12 м. Важнейшая плодовая культура умеренного климата.','Цветки белые, 1.5–2 см, по 1–3 штуки, появляются до листьев или одновременно.','Апрель–Май',['Европа','Кавказ','Азия','Россия'],'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Plum_flowers_2.jpg/800px-Plum_flowers_2.jpg'],
  ['Груша обыкновенная','Pyrus communis','Розовые (Rosaceae)','Дерево 5–20 м. Широко возделывается ради сочных плодов.','Цветки белые, реже розоватые, 2.5–3.5 см, в соцветиях из 6–12 цветков.','Апрель–Май',['Европа','Кавказ','Средняя Азия','Россия'],'https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/Pyrus_communis_flower.jpg/800px-Pyrus_communis_flower.jpg'],
  ['Боярышник колючий','Crataegus monogyna','Розовые (Rosaceae)','Колючий кустарник 3–8 м. Используется в живых изгородях и озеленении.','Цветки белые, мелкие, около 1.5 см, в щитковидных соцветиях.','Май–Июнь',['Европа','Россия','Кавказ'],'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Crataegus_monogyna_flowers.jpg/800px-Crataegus_monogyna_flowers.jpg'],
  ['Персик обыкновенный','Prunus persica','Розовые (Rosaceae)','Плодовое дерево 4–8 м тёплых регионов.','Цветки ярко-розовые, 2.5–3.5 см, сидячие, появляются до листьев.','Март–Апрель',['Китай','Средняя Азия','Кавказ','Южная Европа'],'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Prunus_persica_flowers.jpg/800px-Prunus_persica_flowers.jpg],
  ['Абрикос обыкновенный','Prunus armeniaca','Розовые (Rosaceae)','Дерево 5–8 м. Одна из древнейших плодовых культур.','Цветки белые или бледно-розовые, 2.5–3 см, появляются раньше листьев.','Март–Апрель',['Средняя Азия','Кавказ','Китай','Южная Европа'],'https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Apricot_flowers.jpg/800px-Apricot_flowers.jpg'],
  ['Клён остролистный','Acer platanoides','Сапиндовые (Sapindaceae)','Дерево до 28 м. Одно из самых распространённых деревьев Европы.','Цветки желтовато-зелёные, мелкие, в щитковидных соцветиях, появляются до листьев.','Апрель–Май',['Европа','Кавказ','Россия'],'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f4/Acer_platanoides_flowers.jpg/800px-Acer_platanoides_flowers.jpg'],
  // Деревья из docx (хвойные и лиственные без цветков)
  ['Сосна обыкновенная','Pinus sylvestris','Сосновые (Pinaceae)','Хвойное дерево до 40 м. Древесина средней плотности, высокой прочности, стойкая против гниения. Широко используется в строительстве и мебельном производстве.','Мужские шишки (микростробилы) жёлтые, собраны у основания молодых побегов. Женские шишки (мегастробилы) сначала красноватые, затем деревенеют.','Май–Июнь',['Европа','Азия','Россия','Сибирь'],'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/Pinus_sylvestris_Rannametsa.jpg/800px-Pinus_sylvestris_Rannametsa.jpg'],
  ['Ель европейская','Picea abies','Сосновые (Pinaceae)','Хвойное дерево до 50 м. Древесина однородного строения, обладает хорошими резонансными свойствами. Применяется в строительстве и музыкальных инструментах.','Мужские шишки красноватые или желтоватые. Женские шишки вначале красные, затем зеленеют и буреют, длиной 10–15 см.','Май',['Европа','Россия','Сибирь'],'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Picea_abies_Rannametsa.jpg/800px-Picea_abies_Rannametsa.jpg'],
  ['Дуб черешчатый','Quercus robur','Буковые (Fagaceae)','Мощное дерево до 40 м, живёт до 1000 лет. Древесина плотная, прочная, стойкая против гниения, красивой текстуры. Применяется для паркета, мебели, судостроения.','Мужские цветки в серёжках длиной 2–3 см, женские — одиночные или по 2–3 на длинных ножках.','Апрель–Май',['Европа','Кавказ','Россия'],'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8b/Quercus_robur_flowers.jpg/800px-Quercus_robur_flowers.jpg'],
  ['Берёза повислая','Betula pendula','Берёзовые (Betulaceae)','Дерево до 25 м с белой берестой. Древесина однородная, высокой прочности. Применяется для фанеры, лыж, ружейных лож, активированного угля.','Мужские серёжки длинные, повислые, 3–6 см, желтовато-бурые. Женские серёжки короче, прямостоячие, зелёные.','Апрель–Май',['Европа','Азия','Россия','Сибирь'],'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f9/Birch_forest_in_Yakutia.jpg/800px-Birch_forest_in_Yakutia.jpg'],
  ['Осина','Populus tremula','Ивовые (Salicaceae)','Дерево до 35 м. Древесина мягкая, лёгкая, хорошо режется и лущится. Применяется для спичек, тары, целлюлозы.','Серёжки появляются до листьев: мужские красноватые до 10 см, женские зеленоватые.','Март–Апрель',['Европа','Азия','Россия','Сибирь'],'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fd/Populus_tremula_flowers.jpg/800px-Populus_tremula_flowers.jpg'],
  ['Ольха серая','Alnus incana','Берёзовые (Betulaceae)','Дерево или кустарник до 20 м. Древесина мягкая, антисептическая, мало усыхающая. Применяется в фанерном производстве и для изготовления тары.','Мужские серёжки длинные, повислые, красновато-бурые. Женские — короткие, яйцевидные, деревенеющие в шишечки.','Февраль–Апрель',['Европа','Россия','Сибирь'],'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fe/Alnus_incana_flowers.jpg/800px-Alnus_incana_flowers.jpg'],
  ['Ольха чёрная','Alnus glutinosa','Берёзовые (Betulaceae)','Дерево до 35 м, растёт по берегам водоёмов. Древесина с природными антисептическими свойствами, практически не гниёт в воде.','Мужские серёжки длинные, тёмно-бурые, повислые. Женские — яйцевидные, в шишечки.','Март–Апрель',['Европа','Кавказ','Россия'],'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Alnus_glutinosa_male_flowers.jpg/800px-Alnus_glutinosa_male_flowers.jpg'],
];

const initDB = async () => {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        avatar_url VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS trees (
        id SERIAL PRIMARY KEY,
        name_ru VARCHAR(150) NOT NULL,
        name_latin VARCHAR(150),
        family VARCHAR(100),
        description TEXT,
        flower_description TEXT,
        bloom_season VARCHAR(100),
        regions TEXT[],
        image_url VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS recognition_history (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        tree_id INTEGER REFERENCES trees(id) ON DELETE SET NULL,
        image_url VARCHAR(255),
        confidence FLOAT,
        raw_result JSONB,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    const { rows } = await client.query('SELECT COUNT(*) FROM trees');
    if (parseInt(rows[0].count) === 0) {
      for (const t of TREES) {
        await client.query(
          `INSERT INTO trees (name_ru,name_latin,family,description,flower_description,bloom_season,regions,image_url)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
          t
        );
      }
      logger.info(`Trees seeded: ${TREES.length} trees`);
    }
    logger.info('Database initialized successfully');
  } catch (err) {
    logger.error('DB init error:', err);
    throw err;
  } finally {
    client.release();
  }
};

module.exports = { pool, initDB };
