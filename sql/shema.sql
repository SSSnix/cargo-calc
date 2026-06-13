-- 1. Создаём таблицу настроек
CREATE TABLE delivery_settings (
                                   id              int4 PRIMARY KEY DEFAULT 1,  -- Всегда будет одна запись с id=1
                                   start_lat       float8 NOT NULL,              -- Широта начальной точки
                                   start_lon       float8 NOT NULL,              -- Долгота начальной точки
                                   finish_lat      float8 NOT NULL,              -- Широта конечной точки
                                   finish_lon      float8 NOT NULL,              -- Долгота конечной точки
                                   tariff_per_km   int4 NOT NULL,
                                   updated_at      timestamptz DEFAULT now()
);

-- 2. Запрещаем всем прямой доступ к таблице через RLS
ALTER TABLE delivery_settings ENABLE ROW LEVEL SECURITY;

-- 3. Создаём политику: данные могут читать все (это нужно для работы калькулятора)
CREATE POLICY "Allow read for all" ON delivery_settings
    FOR SELECT USING (true);

-- 4. Создаём политику: изменять данные может только авторизованный администратор
CREATE POLICY "Allow update only for admin" ON delivery_settings
    FOR UPDATE USING (auth.uid() = 'ваш-user-id');

CREATE OR REPLACE FUNCTION calculate_delivery_price(
    from_lat float8, from_lon float8,
    to_lat   float8, to_lon   float8
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER -- Функция выполняется с правами создателя
AS $$
DECLARE
start_lat_var     float8;
    start_lon_var     float8;
    finish_lat_var    float8;
    finish_lon_var    float8;
    tariff_var        int4;
    route_legs        jsonb;
    total_distance    float8;
BEGIN
    -- 1. Получаем координаты старта, финиша и тариф
SELECT start_lat, start_lon, finish_lat, finish_lon, tariff_per_km
INTO start_lat_var, start_lon_var, finish_lat_var, finish_lon_var, tariff_var
FROM delivery_settings WHERE id = 1;

-- 2. Формируем запрос к OSRM Table API
-- Порядок точек: start -> from -> to -> finish
SELECT net.http_get(
               'http://router.project-osrm.org/table/v1/driving/' ||
               start_lon_var || ',' || start_lat_var || ';' ||
               from_lon      || ',' || from_lat      || ';' ||
               to_lon        || ',' || to_lat        || ';' ||
               finish_lon_var|| ',' || finish_lat_var ||
               '?annotations=distance'
       ) INTO route_legs;

-- 3. Суммируем нужные расстояния из матрицы
-- (индексы: 0-start, 1-from, 2-to, 3-finish)
total_distance := (route_legs->'distances'->0->>1)::float8 +  -- start -> from
                      (route_legs->'distances'->1->>2)::float8 +  -- from -> to
                      (route_legs->'distances'->2->>3)::float8;   -- to -> finish

    -- 4. Возвращаем стоимость
RETURN jsonb_build_object('price', (total_distance / 1000) * tariff_var);
END;
$$;