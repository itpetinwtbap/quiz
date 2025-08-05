-- Initialize Quiz Database

-- Create extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create default question package with original questions
INSERT INTO question_packages (id, name, description, author, version, "isActive", tags, metadata, "createdAt", "updatedAt")
VALUES (
    uuid_generate_v4(),
    'Базовый пакет',
    'Первоначальный набор вопросов для игры Что Где Когда',
    'System',
    '1.0',
    true,
    '["default", "basic"]',
    '{"source": "original", "type": "built-in"}',
    NOW(),
    NOW()
) ON CONFLICT DO NOTHING;

-- Get the package ID for inserting questions
DO $$
DECLARE
    package_id UUID;
BEGIN
    SELECT id INTO package_id FROM question_packages WHERE name = 'Базовый пакет' LIMIT 1;
    
    IF package_id IS NOT NULL THEN
        -- Insert default questions
        INSERT INTO questions (id, question, answer, comment, type, "orderIndex", "timeLimit", metadata, "packageId", "createdAt", "updatedAt")
        VALUES 
            (uuid_generate_v4(), 'Что такое черная дыра?', 'Область пространства-времени, гравитационное притяжение которой настолько велико, что покинуть её не могут даже объекты, движущиеся со скоростью света', null, 'text', 1, 60, '{}', package_id, NOW(), NOW()),
            (uuid_generate_v4(), 'Кто написал "Войну и мир"?', 'Лев Николаевич Толстой', null, 'text', 2, 60, '{}', package_id, NOW(), NOW()),
            (uuid_generate_v4(), 'Какой химический элемент обозначается символом Au?', 'Золото (Aurum)', null, 'text', 3, 60, '{}', package_id, NOW(), NOW()),
            (uuid_generate_v4(), 'В каком году был основан Google?', '1998 год', null, 'text', 4, 60, '{}', package_id, NOW(), NOW()),
            (uuid_generate_v4(), 'Какая планета самая большая в Солнечной системе?', 'Юпитер', null, 'text', 5, 60, '{}', package_id, NOW(), NOW()),
            (uuid_generate_v4(), 'Кто изобрел телефон?', 'Александр Грэм Белл', null, 'text', 6, 60, '{}', package_id, NOW(), NOW()),
            (uuid_generate_v4(), 'Сколько костей в теле взрослого человека?', '206 костей', null, 'text', 7, 60, '{}', package_id, NOW(), NOW()),
            (uuid_generate_v4(), 'Какой город является столицей Австралии?', 'Канберра', null, 'text', 8, 60, '{}', package_id, NOW(), NOW()),
            (uuid_generate_v4(), 'В каком году закончилась Вторая мировая война?', '1945 год', null, 'text', 9, 60, '{}', package_id, NOW(), NOW()),
            (uuid_generate_v4(), 'Кто написал "Гамлета"?', 'Уильям Шекспир', null, 'text', 10, 60, '{}', package_id, NOW(), NOW()),
            (uuid_generate_v4(), 'Какое самое глубокое место на Земле?', 'Марианская впадина', null, 'text', 11, 60, '{}', package_id, NOW(), NOW()),
            (uuid_generate_v4(), 'Сколько сердец у осьминога?', 'Три сердца', null, 'text', 12, 60, '{}', package_id, NOW(), NOW())
        ON CONFLICT DO NOTHING;
    END IF;
END $$;