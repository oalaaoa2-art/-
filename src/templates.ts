import type { Block, BlockType, SiteDoc, Theme } from './types';

let counter = 0;
export const uid = (): string => `b${Date.now().toString(36)}${(counter++).toString(36)}`;

const img = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1400&q=80`;

/* -------------------------------- block kit -------------------------------- */

export const BLOCK_LABELS: Record<BlockType, { name: string; icon: string; hint: string }> = {
  nav: { name: 'Шапка сайта', icon: '▤', hint: 'Логотип, меню и кнопка' },
  hero: { name: 'Первый экран', icon: '✦', hint: 'Заголовок, подзаголовок, кнопки' },
  features: { name: 'Преимущества', icon: '▦', hint: 'Сетка карточек с иконками' },
  split: { name: 'Текст с фото', icon: '◧', hint: 'Две колонки и список' },
  gallery: { name: 'Галерея', icon: '▩', hint: 'Сетка работ или фотографий' },
  stats: { name: 'Цифры', icon: '＃', hint: 'Крупные метрики' },
  pricing: { name: 'Тарифы', icon: '⌘', hint: 'Три плана и кнопки' },
  quote: { name: 'Цитата', icon: '❝', hint: 'Отзыв клиента' },
  cta: { name: 'Призыв', icon: '➜', hint: 'Яркий блок с кнопками' },
  contact: { name: 'Контакты', icon: '✉', hint: 'Данные и форма' },
  footer: { name: 'Подвал', icon: '▁', hint: 'Ссылки и копирайт' },
};

export function createBlock(type: BlockType): Block {
  const id = uid();
  switch (type) {
    case 'nav':
      return { id, type, brand: 'Новый проект', links: ['О нас', 'Услуги', 'Контакты'], cta: 'Связаться' };
    case 'hero':
      return {
        id,
        type,
        kicker: 'Новый раздел',
        title: 'Заголовок, который цепляет',
        subtitle: 'Пара предложений о том, что вы делаете и почему это важно для читателя.',
        cta: 'Начать',
        cta2: 'Узнать больше',
        image: '',
      };
    case 'features':
      return {
        id,
        type,
        kicker: 'Возможности',
        title: 'Три причины выбрать нас',
        subtitle: '',
        items: [
          { icon: '✦', title: 'Быстро', text: 'Запуск за один день, без разработчиков и лишних согласований.' },
          { icon: '◈', title: 'Красиво', text: 'Аккуратная типографика и сетка, которые работают на любом экране.' },
          { icon: '◎', title: 'Просто', text: 'Редактируйте текст прямо на странице — без кода и настроек.' },
        ],
      };
    case 'split':
      return {
        id,
        type,
        kicker: 'О проекте',
        title: 'Расскажите историю',
        text: 'Замените этот текст своим: кто вы, для кого работаете и что делает вас особенными.',
        image: img('photo-1558655146-9f40138edfeb'),
        bullets: ['Пункт первый', 'Пункт второй', 'Пункт третий'],
        reverse: false,
      };
    case 'gallery':
      return {
        id,
        type,
        kicker: 'Портфолио',
        title: 'Избранные работы',
        subtitle: '',
        images: [
          { url: img('photo-1561070791-2526d30994b5'), caption: 'Проект первый' },
          { url: img('photo-1541462608143-67571c6738dd'), caption: 'Проект второй' },
          { url: img('photo-1524504388940-b1c1722653e1'), caption: 'Проект третий' },
        ],
      };
    case 'stats':
      return {
        id,
        type,
        title: '',
        items: [
          { value: '120+', label: 'проектов' },
          { value: '8 лет', label: 'на рынке' },
          { value: '98%', label: 'довольных клиентов' },
        ],
      };
    case 'pricing':
      return {
        id,
        type,
        kicker: 'Тарифы',
        title: 'Прозрачные цены',
        subtitle: 'Без скрытых платежей и мелкого шрифта.',
        plans: [
          {
            name: 'Старт',
            price: '0 ₽',
            period: '/ навсегда',
            text: 'Для знакомства',
            features: ['Один проект', 'Экспорт HTML', 'Библиотека шрифтов'],
            cta: 'Попробовать',
          },
          {
            name: 'Про',
            price: '990 ₽',
            period: '/ месяц',
            text: 'Для фрилансера',
            features: ['Неограниченно проектов', 'Все шаблоны', 'Приоритетная поддержка'],
            cta: 'Выбрать',
            featured: true,
          },
          {
            name: 'Студия',
            price: '4 900 ₽',
            period: '/ месяц',
            text: 'Для команды',
            features: ['Совместная работа', 'Брендкит', 'Помощь с запуском'],
            cta: 'Обсудить',
          },
        ],
      };
    case 'quote':
      return {
        id,
        type,
        quote: 'Мы собрали лендинг за вечер и на следующий день получили первые заявки.',
        author: 'Анна Смирнова',
        role: 'основательница студии, Москва',
      };
    case 'cta':
      return {
        id,
        type,
        title: 'Готовы начать?',
        text: 'Соберите страницу за пару минут и заберите готовый HTML — бесплатно и без регистрации.',
        cta: 'Создать сайт',
        cta2: 'Смотреть шаблоны',
      };
    case 'contact':
      return {
        id,
        type,
        kicker: 'Контакты',
        title: 'Давайте поговорим',
        text: 'Ответим в течение рабочего дня и предложим решение под вашу задачу.',
        email: 'hello@example.com',
        phone: '+7 900 000-00-00',
        address: 'Москва, ул. Примерная, 12',
      };
    case 'footer':
      return {
        id,
        type,
        brand: 'Новый проект',
        text: 'Небольшая подпись о проекте.',
        links: ['Наверх', 'Политика', 'Контакты'],
        note: `© ${new Date().getFullYear()} Новый проект. Все права защищены.`,
      };
    default:
      return { id, type };
  }
}

/* -------------------------------- templates -------------------------------- */

export type Template = {
  id: string;
  name: string;
  tagline: string;
  tags: string[];
  theme: Theme;
  blocks: () => Block[];
};

const baseTheme = (t: Partial<Theme>): Theme => ({
  bg: '#ffffff',
  surface: '#f6f7fb',
  text: '#111322',
  muted: '#5c6280',
  accent: '#4f46e5',
  accentText: '#ffffff',
  fontHeading: 'Inter',
  fontBody: 'Inter',
  radius: 18,
  maxWidth: 1140,
  ...t,
});

export const TEMPLATES: Template[] = [
  {
    id: 'aurora',
    name: 'Аврора',
    tagline: 'Лендинг SaaS-продукта с тарифами и цифрами',
    tags: ['Стартап', 'Продукт', 'Тарифы'],
    theme: baseTheme({
      bg: '#ffffff',
      surface: '#f5f6ff',
      text: '#111322',
      muted: '#5b6178',
      accent: '#4f46e5',
      fontHeading: 'Unbounded',
      fontBody: 'Inter',
      radius: 20,
      maxWidth: 1160,
    }),
    blocks: () => [
      { id: uid(), type: 'nav', brand: 'aurora', links: ['Продукт', 'Тарифы', 'Отзывы', 'Блог'], cta: 'Попробовать' },
      {
        id: uid(),
        type: 'hero',
        kicker: 'Новое поколение аналитики',
        title: 'Данные, которые понятно с первого взгляда',
        subtitle:
          'Aurora собирает метрики из всех сервисов в один спокойный дашборд. Без таблиц, без ручной работы, без сюрпризов в конце месяца.',
        cta: 'Начать бесплатно',
        cta2: 'Смотреть демо',
        image: '',
      },
      {
        id: uid(),
        type: 'stats',
        title: '',
        items: [
          { value: '14 дней', label: 'бесплатно, без карты' },
          { value: '2 400+', label: 'команд уже работают' },
          { value: '99,98%', label: 'аптайм за год' },
          { value: '4.9/5', label: 'оценка пользователей' },
        ],
      },
      {
        id: uid(),
        type: 'features',
        kicker: 'Возможности',
        title: 'Всё нужное — в одном окне',
        subtitle: 'Мы убрали лишнее и оставили то, чем действительно пользуются каждый день.',
        items: [
          { icon: '◈', title: 'Единый дашборд', text: 'Метрики из рекламы, CRM и продукта собираются автоматически каждые пять минут.' },
          { icon: '⚡', title: 'Мгновенные отчёты', text: 'Соберите отчёт для клиента за пару кликов и отправьте ссылку — без PDF и Excel.' },
          { icon: '◎', title: 'Умные оповещения', text: 'Aurora замечает аномалии раньше вас и присылает сообщение в мессенджер.' },
        ],
      },
      {
        id: uid(),
        type: 'split',
        kicker: 'Интеграции',
        title: 'Подключается ко всему, что у вас уже есть',
        text: 'Более 60 готовых коннекторов: от рекламных кабинетов и платёжных систем до собственного API. Настройка занимает минуту — токен и пара кликов.',
        image: img('photo-1551288049-bebda4e38f71'),
        bullets: ['Готовые коннекторы и вебхуки', 'Свой API и выгрузка в CSV', 'Данные хранятся в Европе'],
        reverse: false,
      },
      {
        id: uid(),
        type: 'pricing',
        kicker: 'Тарифы',
        title: 'Растём вместе с вами',
        subtitle: 'Начните бесплатно — платить нужно, только когда команда вырастет.',
        plans: [
          {
            name: 'Старт',
            price: '0 ₽',
            period: '/ навсегда',
            text: 'Для одного проекта',
            features: ['1 дашборд', '3 источника данных', 'Хранение 30 дней'],
            cta: 'Начать',
          },
          {
            name: 'Команда',
            price: '2 900 ₽',
            period: '/ месяц',
            text: 'Для растущего бизнеса',
            features: ['Безлимит дашбордов', '20 источников', 'Отчёты в PDF', 'Поддержка в чате'],
            cta: 'Выбрать план',
            featured: true,
          },
          {
            name: 'Бизнес',
            price: 'По запросу',
            period: '',
            text: 'Для крупных команд',
            features: ['SLA и выделенный менеджер', 'SSO и аудит-лог', 'Свои коннекторы'],
            cta: 'Обсудить',
          },
        ],
      },
      {
        id: uid(),
        type: 'quote',
        quote: 'Раньше сводку для руководства собирали два дня. Теперь она обновляется сама и всегда под рукой.',
        author: 'Дмитрий Волков',
        role: 'директор по продукту, Nexus',
      },
      {
        id: uid(),
        type: 'cta',
        title: 'Попробуйте Aurora сегодня',
        text: '14 дней полного доступа. Без карты, без звонков от менеджеров и без мелкого шрифта.',
        cta: 'Создать аккаунт',
        cta2: 'Задать вопрос',
      },
      {
        id: uid(),
        type: 'footer',
        brand: 'aurora',
        text: 'Спокойная аналитика для команд, которые ценят своё время.',
        links: ['Продукт', 'Тарифы', 'Блог', 'Контакты'],
        note: '© 2026 Aurora Analytics. Собрано в Реакторе.',
      },
    ],
  },
  {
    id: 'studio',
    name: 'Студия',
    tagline: 'Портфолио дизайнера: крупная типографика и галерея',
    tags: ['Портфолио', 'Дизайн', 'Минимализм'],
    theme: baseTheme({
      bg: '#f6f2e9',
      surface: '#fffdf7',
      text: '#181510',
      muted: '#6d6459',
      accent: '#181510',
      accentText: '#f6f2e9',
      fontHeading: 'Playfair Display',
      fontBody: 'Manrope',
      radius: 4,
      maxWidth: 1120,
    }),
    blocks: () => [
      { id: uid(), type: 'nav', brand: 'Мария Лебедева', links: ['Работы', 'Обо мне', 'Процесс'], cta: 'Написать' },
      {
        id: uid(),
        type: 'hero',
        kicker: 'Дизайн-студия, Москва',
        title: 'Спокойные интерфейсы и смелые айдентики',
        subtitle:
          'Меня зовут Мария. Восемь лет я помогаю продуктам выглядеть так, чтобы их хотелось открыть снова.',
        cta: 'Смотреть работы',
        cta2: 'Обсудить проект',
        image: img('photo-1534528741775-53994a69daeb'),
      },
      {
        id: uid(),
        type: 'gallery',
        kicker: 'Избранное',
        title: 'Работы разных лет',
        subtitle: 'Айдентика, интерфейсы и упаковка — от эскиза до передачи в разработку.',
        images: [
          { url: img('photo-1561070791-2526d30994b5'), caption: 'Фирменный стиль для кофейни' },
          { url: img('photo-1541462608143-67571c6738dd'), caption: 'Ребрендинг сервиса доставки' },
          { url: img('photo-1558655146-9f40138edfeb'), caption: 'Айдентика «Север»' },
        ],
      },
      {
        id: uid(),
        type: 'split',
        kicker: 'Обо мне',
        title: 'Работаю на стыке типографики и логики',
        text: 'Люблю проекты, где нужно не только красиво, но и по делу. Начинаю с исследования, заканчиваю дизайн-системой, с которой удобно жить разработке.',
        image: img('photo-1499750310107-5fef28a66643'),
        bullets: ['Стратегия и позиционирование', 'Дизайн-системы и UI-киты', 'Верстка и передача в разработку'],
        reverse: true,
      },
      {
        id: uid(),
        type: 'quote',
        quote: 'Мария умеет слушать и превращать смутные ожидания в цельный продукт. С ней спокойно.',
        author: 'Ольга Ким',
        role: 'соучредительница, «Тепло»',
      },
      {
        id: uid(),
        type: 'contact',
        kicker: 'Контакты',
        title: 'Расскажите о задаче',
        text: 'Свободна для новых проектов с 1 июня. Отвечаю в течение дня, обычно быстрее.',
        email: 'hi@lebedeva.studio',
        phone: '+7 903 000-00-00',
        address: 'Москва, работает удалённо по всему миру',
      },
      {
        id: uid(),
        type: 'footer',
        brand: 'Мария Лебедева',
        text: 'Брендинг и продуктовый дизайн.',
        links: ['Behance', 'Telegram', 'Dribbble'],
        note: '© 2026 Мария Лебедева. Собрано в Реакторе.',
      },
    ],
  },
  {
    id: 'cafe',
    name: 'Кофейня',
    tagline: 'Тёплый сайт для кофейни или локального бизнеса',
    tags: ['Еда', 'Локальный бизнес', 'Тепло'],
    theme: baseTheme({
      bg: '#fbf3e8',
      surface: '#fffaf2',
      text: '#2c1b10',
      muted: '#7d6553',
      accent: '#b4531f',
      accentText: '#fff8ef',
      fontHeading: 'Cormorant',
      fontBody: 'Nunito',
      radius: 24,
      maxWidth: 1140,
    }),
    blocks: () => [
      { id: uid(), type: 'nav', brand: 'Тёплый угол', links: ['Меню', 'О нас', 'Адрес'], cta: 'Забронировать' },
      {
        id: uid(),
        type: 'hero',
        kicker: 'Обжарка каждую неделю',
        title: 'Кофе, ради которого хочется выйти из дома',
        subtitle:
          'Маленькая обжарка в центре города. Свежие зёрна, честные цены и печенье, которое заканчивается к трём.',
        cta: 'Посмотреть меню',
        cta2: 'Как добраться',
        image: img('photo-1495474472287-4d71bcdd2085'),
      },
      {
        id: uid(),
        type: 'features',
        kicker: 'Почему мы',
        title: 'Три вещи, которые мы делаем хорошо',
        subtitle: '',
        items: [
          { icon: '☕', title: 'Своя обжарка', text: 'Обжариваем небольшими партиями и всегда указываем дату на пачке.' },
          { icon: '🥐', title: 'Свежая выпечка', text: 'Круассаны и канеле выходят из печи каждое утро в семь.' },
          { icon: '🪴', title: 'Можно остаться', text: 'Тихий зал, много розеток и никто не просит уйти через час.' },
        ],
      },
      {
        id: uid(),
        type: 'gallery',
        kicker: 'Атмосфера',
        title: 'Как у нас выглядит утро',
        subtitle: '',
        images: [
          { url: img('photo-1554118811-1e0d58224f24'), caption: 'Зал на Покровке' },
          { url: img('photo-1501339847302-ac426a4a7cbb'), caption: 'Барная стойка' },
          { url: img('photo-1442512595331-e89e73853f31'), caption: 'Фильтр дня' },
        ],
      },
      {
        id: uid(),
        type: 'split',
        kicker: 'Наш подход',
        title: 'Зерно, вода и немного терпения',
        text: 'Мы работаем с фермерами напрямую и платим выше рыночной цены. Поэтому вкус стабильный, а история — честная.',
        image: img('photo-1511920170033-f8396924c348'),
        bullets: ['Прямые контракты с фермами', 'Обжарка на месте, каждую неделю', 'Альтернатива для тех, кто не пьёт кофе'],
        reverse: false,
      },
      {
        id: uid(),
        type: 'quote',
        quote: 'Лучший флэт уайт в районе. Захожу каждое утро уже второй год — и не надоедает.',
        author: 'Игорь',
        role: 'постоянный гость',
      },
      {
        id: uid(),
        type: 'contact',
        kicker: 'Ждём в гости',
        title: 'Заходите на чашку',
        text: 'Работаем каждый день с 8:00 до 21:00. Столик лучше бронировать заранее — по выходным у нас людно.',
        email: 'hello@teply-ugol.ru',
        phone: '+7 495 000-00-00',
        address: 'Москва, Покровка, 18',
      },
      {
        id: uid(),
        type: 'footer',
        brand: 'Тёплый угол',
        text: 'Обжарка и кофейня на Покровке.',
        links: ['Instagram', 'Telegram', 'Меню'],
        note: '© 2026 Кофейня «Тёплый угол». Собрано в Реакторе.',
      },
    ],
  },
  {
    id: 'noir',
    name: 'Нуар',
    tagline: 'Дерзкое агентство: тёмный фон и кислотный акцент',
    tags: ['Агентство', 'Тёмная тема', 'Контраст'],
    theme: baseTheme({
      bg: '#0a0a0b',
      surface: '#131316',
      text: '#f4f4f2',
      muted: '#a1a1aa',
      accent: '#d7ff3e',
      accentText: '#0a0a0b',
      fontHeading: 'Unbounded',
      fontBody: 'Onest',
      radius: 10,
      maxWidth: 1200,
    }),
    blocks: () => [
      { id: uid(), type: 'nav', brand: 'noir.', links: ['Услуги', 'Кейсы', 'Процесс'], cta: 'Обсудить проект' },
      {
        id: uid(),
        type: 'hero',
        kicker: 'Креативное агентство',
        title: 'Делаем бренды, которые не пролистывают',
        subtitle:
          'Стратегия, айдентика и digital для компаний, которым тесно в рамках шаблонов. Шесть человек, ноль лишних согласований.',
        cta: 'Показать кейсы',
        cta2: 'Наш подход',
        image: '',
      },
      {
        id: uid(),
        type: 'stats',
        title: '',
        items: [
          { value: '48', label: 'запущенных брендов' },
          { value: '6', label: 'человек в команде' },
          { value: '3', label: 'недели до первого концепта' },
          { value: '2×', label: 'рост заявок у клиентов' },
        ],
      },
      {
        id: uid(),
        type: 'features',
        kicker: 'Что делаем',
        title: 'Полный цикл — от смысла до кода',
        subtitle: 'Не отдаём «на доделать»: собираем и запускаем сами.',
        items: [
          { icon: '◼', title: 'Стратегия', text: 'Исследуем рынок и находим позицию, которую сложно скопировать.' },
          { icon: '◆', title: 'Айдентика', text: 'Логотип, типографика, визуальный язык и гайдлайн, которому следуют.' },
          { icon: '▮', title: 'Digital', text: 'Сайты и продукты, которые быстро работают и легко живут без нас.' },
        ],
      },
      {
        id: uid(),
        type: 'gallery',
        kicker: 'Кейсы',
        title: 'Последние запуски',
        subtitle: '',
        images: [
          { url: img('photo-1618005182384-a83a8bd57fbe'), caption: 'Fintech «Kvant» — айдентика' },
          { url: img('photo-1550745165-9bc0b252726f'), caption: 'Аудиотека «Volna» — сайт' },
          { url: img('photo-1526374965328-7f61d4dc18c5'), caption: 'Студия «Format» — брендинг' },
        ],
      },
      {
        id: uid(),
        type: 'split',
        kicker: 'Процесс',
        title: 'Три недели до первого концепта',
        text: 'Спринты по неделе: на первом разбираемся в задаче, на втором показываем направление, на третьем доводим до решения. Всё прозрачно и без сюрпризов в смете.',
        image: img('photo-1522071820081-009f0129c71c'),
        bullets: ['Один созвон в неделю, остальное — в чате', 'Фиксированная смета на спринт', 'Исходники и права остаются у вас'],
        reverse: true,
      },
      {
        id: uid(),
        type: 'quote',
        quote: 'Они спорили с нами — и оказались правы. После ребрендинга стоимость лида упала почти втрое.',
        author: 'Артём Гусев',
        role: 'CMO, Kvant',
      },
      {
        id: uid(),
        type: 'cta',
        title: 'Свободны с июля',
        text: 'Берём один проект в месяц, чтобы делать его хорошо. Расскажите, что задумали.',
        cta: 'Оставить заявку',
        cta2: 'Смотреть бриф',
      },
      {
        id: uid(),
        type: 'footer',
        brand: 'noir.',
        text: 'Креативное агентство полного цикла.',
        links: ['Telegram', 'Behance', 'Почта'],
        note: '© 2026 noir. studio. Собрано в Реакторе.',
      },
    ],
  },
  {
    id: 'editorial',
    name: 'Журнал',
    tagline: 'Блог и медиа: антиква, воздух и крупные заголовки',
    tags: ['Блог', 'Медиа', 'Антиква'],
    theme: baseTheme({
      bg: '#fffdf8',
      surface: '#f4f1e8',
      text: '#191a1c',
      muted: '#686b70',
      accent: '#1d4ed8',
      accentText: '#ffffff',
      fontHeading: 'Bitter',
      fontBody: 'Spectral',
      radius: 2,
      maxWidth: 1100,
    }),
    blocks: () => [
      { id: uid(), type: 'nav', brand: 'Долго и подробно', links: ['Статьи', 'Рубрики', 'О проекте'], cta: 'Подписаться' },
      {
        id: uid(),
        type: 'hero',
        kicker: 'Журнал о работе и технологиях',
        title: 'Тексты, которые не хочется закрывать на второй строке',
        subtitle:
          'Раз в неделю — один большой разбор: как устроены команды, инструменты и решения, которые меняют работу.',
        cta: 'Читать свежее',
        cta2: 'Все рубрики',
        image: '',
      },
      {
        id: uid(),
        type: 'split',
        kicker: 'Главный материал',
        title: 'Почему маленькие команды выпускают больше',
        text: 'Мы поговорили с двенадцатью основателями и выяснили, что дело не в скорости разработки, а в количестве людей, которым нужно объяснять решение. Спойлер: меньше — почти всегда лучше.',
        image: img('photo-1518770660439-4636190af475'),
        bullets: ['12 интервью с основателями', 'Четыре общих паттерна', 'Что можно применить уже в понедельник'],
        reverse: false,
      },
      {
        id: uid(),
        type: 'features',
        kicker: 'Рубрики',
        title: 'О чём мы пишем',
        subtitle: '',
        items: [
          { icon: '✎', title: 'Практика', text: 'Инструкции и разборы: как сделать, а не как принято говорить.' },
          { icon: '◷', title: 'Время', text: 'Про фокус, выгорание и работу без бесконечных созвонов.' },
          { icon: '☼', title: 'Технологии', text: 'Инструменты, которые действительно упрощают жизнь.' },
        ],
      },
      {
        id: uid(),
        type: 'quote',
        quote: 'Единственный журнал, который я открываю не из чувства долга, а из любопытства.',
        author: 'Пётр Астахов',
        role: 'читатель с 2021 года',
      },
      {
        id: uid(),
        type: 'cta',
        title: 'Письмо по четвергам',
        text: 'Один текст в неделю, без рекламы и «полезных подборок». Отписаться можно одним кликом.',
        cta: 'Подписаться',
        cta2: 'Архив выпусков',
      },
      {
        id: uid(),
        type: 'footer',
        brand: 'Долго и подробно',
        text: 'Независимый журнал о работе и технологиях.',
        links: ['Статьи', 'RSS', 'Telegram'],
        note: '© 2026 «Долго и подробно». Собрано в Реакторе.',
      },
    ],
  },
  {
    id: 'pulse',
    name: 'Пульс',
    tagline: 'Яркий лендинг продукта с акцентным градиентом',
    tags: ['Продукт', 'Градиент', 'Энергия'],
    theme: baseTheme({
      bg: '#0d0b1f',
      surface: '#161233',
      text: '#f1eefe',
      muted: '#a9a2cf',
      accent: '#a78bfa',
      accentText: '#140f2e',
      fontHeading: 'Tektur',
      fontBody: 'Rubik',
      radius: 22,
      maxWidth: 1140,
    }),
    blocks: () => [
      { id: uid(), type: 'nav', brand: 'pulse', links: ['Как работает', 'Цены', 'FAQ'], cta: 'Скачать' },
      {
        id: uid(),
        type: 'hero',
        kicker: 'Тренировки без скуки',
        title: 'Тренируйся по плану, который подстраивается под тебя',
        subtitle:
          'Pulse собирает тренировку из вашего сна, пульса и настроения. Пятнадцать минут тоже считаются — и это нормально.',
        cta: 'Попробовать 7 дней',
        cta2: 'Как это работает',
        image: '',
      },
      {
        id: uid(),
        type: 'stats',
        title: '',
        items: [
          { value: '15 мин', label: 'минимальная тренировка' },
          { value: '600+', label: 'упражнений в базе' },
          { value: '4.8', label: 'рейтинг в App Store' },
        ],
      },
      {
        id: uid(),
        type: 'features',
        kicker: 'Возможности',
        title: 'Три вещи, которые всё меняют',
        subtitle: '',
        items: [
          { icon: '◉', title: 'Умный план', text: 'Алгоритм учитывает сон и нагрузку и предлагает тренировку на сегодня.' },
          { icon: '⇄', title: 'Любой инвентарь', text: 'Коврик, гантели или ничего — план подстроится под то, что есть.' },
          { icon: '♡', title: 'Без давления', text: 'Пропустили неделю? Pulse начнёт с мягкого возвращения, а не с упрёков.' },
        ],
      },
      {
        id: uid(),
        type: 'pricing',
        kicker: 'Подписка',
        title: 'Один тариф, без звёздочек',
        subtitle: 'Все функции доступны каждому. Отмена в один клик.',
        plans: [
          {
            name: 'Неделя',
            price: '0 ₽',
            period: '/ пробный период',
            text: 'Чтобы попробовать',
            features: ['Все тренировки', 'Умный план', 'Без карты'],
            cta: 'Начать',
          },
          {
            name: 'Год',
            price: '2 490 ₽',
            period: '/ год',
            text: 'Выгоднее на 40%',
            features: ['Все функции', 'Офлайн-тренировки', 'История и статистика', 'Поддержка'],
            cta: 'Оформить',
            featured: true,
          },
          {
            name: 'Месяц',
            price: '349 ₽',
            period: '/ месяц',
            text: 'Без обязательств',
            features: ['Все функции', 'Отмена в один клик'],
            cta: 'Выбрать',
          },
        ],
      },
      {
        id: uid(),
        type: 'quote',
        quote: 'Впервые за три года я не бросил тренировки через месяц. Потому что никто не заставляет.',
        author: 'Ксения Р.',
        role: 'пользовательница Pulse',
      },
      {
        id: uid(),
        type: 'cta',
        title: 'Начните с пятнадцати минут',
        text: 'Первая неделя бесплатно. Дальше решите сами — без напоминаний и удержаний.',
        cta: 'Скачать приложение',
        cta2: 'Задать вопрос',
      },
      {
        id: uid(),
        type: 'footer',
        brand: 'pulse',
        text: 'Тренировки, которые подстраиваются под жизнь.',
        links: ['App Store', 'Google Play', 'Telegram'],
        note: '© 2026 Pulse. Собрано в Реакторе.',
      },
    ],
  },
];

export const PALETTES: { name: string; bg: string; surface: string; text: string; muted: string; accent: string; accentText: string }[] = [
  { name: 'Индиго', bg: '#ffffff', surface: '#f5f6ff', text: '#111322', muted: '#5b6178', accent: '#4f46e5', accentText: '#ffffff' },
  { name: 'Бумага', bg: '#f6f2e9', surface: '#fffdf7', text: '#181510', muted: '#6d6459', accent: '#181510', accentText: '#f6f2e9' },
  { name: 'Терракота', bg: '#fbf3e8', surface: '#fffaf2', text: '#2c1b10', muted: '#7d6553', accent: '#b4531f', accentText: '#fff8ef' },
  { name: 'Нуар', bg: '#0a0a0b', surface: '#131316', text: '#f4f4f2', muted: '#a1a1aa', accent: '#d7ff3e', accentText: '#0a0a0b' },
  { name: 'Газета', bg: '#fffdf8', surface: '#f4f1e8', text: '#191a1c', muted: '#686b70', accent: '#1d4ed8', accentText: '#ffffff' },
  { name: 'Ночная фиалка', bg: '#0d0b1f', surface: '#161233', text: '#f1eefe', muted: '#a9a2cf', accent: '#a78bfa', accentText: '#140f2e' },
  { name: 'Мята', bg: '#f4fbf7', surface: '#ffffff', text: '#0f2320', muted: '#557068', accent: '#0f9d76', accentText: '#ffffff' },
  { name: 'Море', bg: '#f2f7fc', surface: '#ffffff', text: '#0b1a29', muted: '#52697d', accent: '#0a6ebd', accentText: '#ffffff' },
  { name: 'Роза', bg: '#fff7f8', surface: '#fff0f3', text: '#26121a', muted: '#7d5c66', accent: '#d6336c', accentText: '#fff7f8' },
  { name: 'Песок', bg: '#faf6ef', surface: '#fffdf8', text: '#22201b', muted: '#6f6a5f', accent: '#c98a2b', accentText: '#1b1509' },
];

export function docFromTemplate(t: Template): SiteDoc {
  return { name: t.name, theme: { ...t.theme }, blocks: t.blocks(), templateId: t.id };
}

export function emptyDoc(): SiteDoc {
  return {
    name: 'Мой сайт',
    theme: {
      bg: '#ffffff',
      surface: '#f5f6ff',
      text: '#111322',
      muted: '#5b6178',
      accent: '#4f46e5',
      accentText: '#ffffff',
      fontHeading: 'Onest',
      fontBody: 'Inter',
      radius: 20,
      maxWidth: 1140,
    },
    blocks: [],
    templateId: '',
  };
}

export const STORAGE_KEY = 'reactor.site.v1';
