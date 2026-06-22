const { Pool } = require('pg');
const logger = require('../utils/logger');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'florabot',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

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

    // Seed some trees if empty
    const { rows } = await client.query('SELECT COUNT(*) FROM trees');
    if (parseInt(rows[0].count) === 0) {
      await client.query(`
        INSERT INTO trees (name_ru, name_latin, family, description, flower_description, bloom_season, regions, image_url) VALUES
        ('Яблоня домашняя', 'Malus domestica', 'Розовые (Rosaceae)', 'Листопадное дерево высотой 3–12 м. Широко культивируется ради плодов.', 'Цветки белые или розовые, диаметром 3–4 см, собраны в зонтиковидные соцветия из 3–7 цветков.', 'Апрель–Май', ARRAY['Европа', 'Азия', 'Россия'], '/uploads/apple.jpg'),
        ('Вишня обыкновенная', 'Prunus cerasus', 'Розовые (Rosaceae)', 'Небольшое дерево или кустарник. Плоды — кислые красные костянки.', 'Цветки белые, 5-лепестковые, собраны по 2–4 штуки, появляются до распускания листьев.', 'Апрель–Май', ARRAY['Европа', 'Средняя Азия', 'Россия'], '/uploads/cherry.jpg'),
        ('Сирень обыкновенная', 'Syringa vulgaris', 'Маслинные (Oleaceae)', 'Кустарник или небольшое дерево высотой до 7 м.', 'Цветки мелкие, сиреневые или белые, собраны в крупные метёлки длиной до 20 см, очень ароматные.', 'Май–Июнь', ARRAY['Балканы', 'Европа', 'Россия'], '/uploads/lilac.jpg'),
        ('Каштан конский', 'Aesculus hippocastanum', 'Сапиндовые (Sapindaceae)', 'Крупное дерево высотой до 25–30 м. Используется в озеленении.', 'Цветки белые с жёлтыми и красными пятнами, собраны в прямостоячие метёлки высотой 20–30 см.', 'Май', ARRAY['Балканы', 'Европа', 'Россия'], '/uploads/chestnut.jpg'),
        ('Черёмуха обыкновенная', 'Prunus padus', 'Розовые (Rosaceae)', 'Дерево или кустарник высотой 2–10 м, с характерным запахом.', 'Цветки белые, душистые, диаметром около 1,5 см, собраны в поникающие кисти длиной 7–15 см.', 'Май', ARRAY['Европа', 'Азия', 'Россия', 'Сибирь'], '/uploads/bird_cherry.jpg'),
        ('Акация белая', 'Robinia pseudoacacia', 'Бобовые (Fabaceae)', 'Дерево высотой 20–25 м родом из Северной Америки.', 'Цветки белые, мотыльковые, собраны в поникающие кисти 10–20 см, очень ароматные.', 'Май–Июнь', ARRAY['Северная Америка', 'Европа', 'Россия', 'Украина'], '/uploads/acacia.jpg'),
        ('Рябина обыкновенная', 'Sorbus aucuparia', 'Розовые (Rosaceae)', 'Дерево высотой 5–15 м с перистыми листьями.', 'Цветки белые, мелкие, собраны в крупные щитковидные соцветия диаметром до 10 см.', 'Май–Июнь', ARRAY['Европа', 'Азия', 'Россия', 'Сибирь'], '/uploads/rowan.jpg'),
        ('Липа мелколистная', 'Tilia cordata', 'Мальвовые (Malvaceae)', 'Дерево высотой до 30 м, одно из самых распространённых в Европе.', 'Цветки мелкие, желтовато-белые, очень ароматные, собраны в полузонтики из 5–11 цветков.', 'Июнь–Июль', ARRAY['Европа', 'Западная Сибирь', 'Россия'], '/uploads/linden.jpg')
      `);
      logger.info('Trees seeded');
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
