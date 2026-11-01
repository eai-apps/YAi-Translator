/**
 * Список ложных друзей переводчика для языковых пар (этап 15Б, версия 0.17.5).
 * Свой курированный список из 100+ слов: предостерегает от типичных ошибок.
 */

export interface FalseFriendEntry {
  word: string;
  lang: 'de' | 'en';
  /** Настоящее значение слова */
  realMeaning: string;
  /** Ложная ассоциация в русском языке */
  mistakenAs: string;
  /** Правильное слово на немецком/английском для ложной ассоциации */
  correctWord: string;
}

export const DE_RU_FALSE_FRIENDS: Record<string, FalseFriendEntry> = {
  angel: { word: 'die Angel', lang: 'de', realMeaning: 'удочка', mistakenAs: 'ангел', correctWord: 'der Engel' },
  artist: { word: 'der Artist', lang: 'de', realMeaning: 'цирковой артист, акробат', mistakenAs: 'художник / актёр', correctWord: 'der Künstler / der Schauspieler' },
  bank: { word: 'die Bank', lang: 'de', realMeaning: 'скамья, лавка (или финансовый банк)', mistakenAs: 'только банк', correctWord: 'die Bank' },
  biskuit: { word: 'das Biskuit', lang: 'de', realMeaning: 'сухое бисквитное печенье', mistakenAs: 'бисквитный торт', correctWord: 'die Biskuit-Torte' },
  brav: { word: 'brav', lang: 'de', realMeaning: 'послушный, прилежный', mistakenAs: 'бравый, храбрый', correctWord: 'tapfer, mutig' },
  chef: { word: 'der Chef', lang: 'de', realMeaning: 'начальник, руководитель', mistakenAs: 'шеф-повар', correctWord: 'der Küchenchef' },
  dekade: { word: 'die Dekade', lang: 'de', realMeaning: 'десятилетие (10 лет)', mistakenAs: '10 дней (декада)', correctWord: 'der Zehntagezeitraum' },
  direktion: { word: 'die Direktion', lang: 'de', realMeaning: 'руководство или направление движения', mistakenAs: 'только дирекция', correctWord: 'die Direktion' },
  dom: { word: 'der Dom', lang: 'de', realMeaning: 'кафедральный собор', mistakenAs: 'жилой дом', correctWord: 'das Haus' },
  dose: { word: 'die Dose', lang: 'de', realMeaning: 'жестяная банка или электрическая розетка', mistakenAs: 'доза лекарства', correctWord: 'die Dosis' },
  dunst: { word: 'der Dunst', lang: 'de', realMeaning: 'испарения, чад, дымка', mistakenAs: 'дуст (порошок)', correctWord: 'das Insektizid' },
  familie: { word: 'die Familie', lang: 'de', realMeaning: 'семья', mistakenAs: 'фамилия', correctWord: 'der Nachname / Familienname' },
  figur: { word: 'die Figur', lang: 'de', realMeaning: 'телосложение, шахматная фигура, персонаж', mistakenAs: 'фигура речи / геометрическая фигура', correctWord: 'die Gestalt' },
  fraktion: { word: 'die Fraktion', lang: 'de', realMeaning: 'парламентская фракция', mistakenAs: 'доля, фракция нефти', correctWord: 'der Anteil, der Bruch' },
  gardine: { word: 'die Gardine', lang: 'de', realMeaning: 'тюль, занавеска', mistakenAs: 'гардина (карниз)', correctWord: 'die Gardinenstange' },
  general: { word: 'der General', lang: 'de', realMeaning: 'генерал', mistakenAs: 'главный, общий', correctWord: 'allgemein, Haupt-' },
  gift: { word: 'das Gift', lang: 'de', realMeaning: 'яд, отрава', mistakenAs: 'подарок (англ. gift)', correctWord: 'das Geschenk' },
  glas: { word: 'das Glas', lang: 'de', realMeaning: 'стекло, стакан', mistakenAs: 'глаз', correctWord: 'das Auge' },
  gips: { word: 'der Gips', lang: 'de', realMeaning: 'гипс или строительная штукатурка', mistakenAs: 'только медицинский гипс', correctWord: 'der Gipsverband' },
  gymnasium: { word: 'das Gymnasium', lang: 'de', realMeaning: 'старшая школа, гимназия', mistakenAs: 'гимнастический спортзал', correctWord: 'die Turnhalle, das Gym' },
  hafen: { word: 'der Hafen', lang: 'de', realMeaning: 'порт, гавань', mistakenAs: 'домашний халат', correctWord: 'der Bademantel, der Hausmantel' },
  hell: { word: 'hell', lang: 'de', realMeaning: 'светлый, яркий, звонкий', mistakenAs: 'ад (англ. hell)', correctWord: 'die Hölle' },
  hose: { word: 'die Hose', lang: 'de', realMeaning: 'брюки, штаны', mistakenAs: 'шланг (англ. hose)', correctWord: 'der Schlauch' },
  hut: { word: 'der Hut', lang: 'de', realMeaning: 'шляпа (die Hut — охрана/опека)', mistakenAs: 'хижина (англ. hut)', correctWord: 'die Hütte' },
  kabinett: { word: 'das Kabinett', lang: 'de', realMeaning: 'кабинет министров или застеклённая витрина', mistakenAs: 'рабочий кабинет в офисе', correctWord: 'das Arbeitszimmer, das Büro' },
  kamin: { word: 'der Kamin', lang: 'de', realMeaning: 'камин или дымоход', mistakenAs: 'печь-каменка', correctWord: 'der Ofen' },
  kanister: { word: 'der Kanister', lang: 'de', realMeaning: 'канистра', mistakenAs: 'канитель', correctWord: 'die Zauderei' },
  kappe: { word: 'die Kappe', lang: 'de', realMeaning: 'кепка, колпачок', mistakenAs: 'капюшон', correctWord: 'die Kapuze' },
  keks: { word: 'der Keks', lang: 'de', realMeaning: 'сухое печенье', mistakenAs: 'сдобный кекс', correctWord: 'der Rührkuchen' },
  kiste: { word: 'die Kiste', lang: 'de', realMeaning: 'деревянный ящик, сундук', mistakenAs: 'малярная кисть или кисть руки', correctWord: 'der Pinsel / die Hand' },
  kittel: { word: 'der Kittel', lang: 'de', realMeaning: 'рабочий халат, спецовка', mistakenAs: 'военный китель', correctWord: 'die Waffenrock, die Uniformjacke' },
  krawall: { word: 'der Krawall', lang: 'de', realMeaning: 'беспорядки, бунт, скандал', mistakenAs: 'обвал, крушение', correctWord: 'der Einsturz, der Erdrutsch' },
  krawatte: { word: 'die Krawatte', lang: 'de', realMeaning: 'галстук', mistakenAs: 'кровать', correctWord: 'das Bett' },
  kurieren: { word: 'kurieren', lang: 'de', realMeaning: 'лечить, исцелять', mistakenAs: 'курить', correctWord: 'rauchen' },
  kurs: { word: 'der Kurs', lang: 'de', realMeaning: 'учебный курс, направление или курс валют', mistakenAs: 'только направление', correctWord: 'die Richtung' },
  lappen: { word: 'der Lappen', lang: 'de', realMeaning: 'тряпка, лоскут (сленг: права)', mistakenAs: 'лапа животного', correctWord: 'die Pfote' },
  mappe: { word: 'die Mappe', lang: 'de', realMeaning: 'папка для бумаг, портфель', mistakenAs: 'географическая карта', correctWord: 'die Landkarte' },
  mark: { word: 'das Mark', lang: 'de', realMeaning: 'костный мозг или мякоть плода', mistakenAs: 'почтовая марка', correctWord: 'die Briefmarke' },
  marke: { word: 'die Marke', lang: 'de', realMeaning: 'торговая марка, бренд или жетон', mistakenAs: 'почтовая марка', correctWord: 'die Briefmarke' },
  mast: { word: 'der Mast', lang: 'de', realMeaning: 'корабельная мачта или вышка', mistakenAs: 'мост', correctWord: 'die Brücke' },
  miene: { word: 'die Miene', lang: 'de', realMeaning: 'выражение лица, мимика', mistakenAs: 'военная мина', correctWord: 'die Mine' },
  mist: { word: 'der Mist', lang: 'de', realMeaning: 'навоз, ерунда, дрянь', mistakenAs: 'туман (англ. mist)', correctWord: 'der Nebel' },
  moos: { word: 'das Moos', lang: 'de', realMeaning: 'мох (жарг.: бабки, деньги)', mistakenAs: 'мост', correctWord: 'die Brücke' },
  nelke: { word: 'die Nelke', lang: 'de', realMeaning: 'гвоздика (цветок или пряность)', mistakenAs: 'норка', correctWord: 'der Nerz' },
  noten: { word: 'die Noten', lang: 'de', realMeaning: 'музыкальные ноты или школьные оценки', mistakenAs: 'только ноты', correctWord: 'die Noten' },
  paket: { word: 'das Paket', lang: 'de', realMeaning: 'почтовая посылка или пакет программ', mistakenAs: 'целлофановый пакет', correctWord: 'die Plastiktüte, der Beutel' },
  pappe: { word: 'die Pappe', lang: 'de', realMeaning: 'картон', mistakenAs: 'канцелярская папка', correctWord: 'der Ordner, die Mappe' },
  pension: { word: 'die Pension', lang: 'de', realMeaning: 'гостевой дом, пансион или пенсия', mistakenAs: 'только пенсия', correctWord: 'die Rente' },
  peruecke: { word: 'die Perücke', lang: 'de', realMeaning: 'парик', mistakenAs: 'петрушка', correctWord: 'die Petersilie' },
  plakat: { word: 'das Plakat', lang: 'de', realMeaning: 'плакат, афиша, рекламный щит', mistakenAs: 'плакат в тетради', correctWord: 'das Poster' },
  post: { word: 'die Post', lang: 'de', realMeaning: 'почта, корреспонденция', mistakenAs: 'пост охраны / пост в соцсети', correctWord: 'der Wachposten / der Beitrag' },
  praesent: { word: 'das Präsent', lang: 'de', realMeaning: 'подарок, сувенир', mistakenAs: 'брезент', correctWord: 'die Plane, das Segeltuch' },
  praesens: { word: 'das Präsens', lang: 'de', realMeaning: 'настоящее время в грамматике', mistakenAs: 'презент / подарок', correctWord: 'das Geschenk' },
  probe: { word: 'die Probe', lang: 'de', realMeaning: 'репетиция, испытание или образец', mistakenAs: 'проба драгметалла', correctWord: 'der Feingehalt' },
  prospekt: { word: 'der Prospekt', lang: 'de', realMeaning: 'рекламный буклет, брошюра', mistakenAs: 'широкий проспект, улица', correctWord: 'die Allee, die Prachtstraße' },
  protokoll: { word: 'das Protokoll', lang: 'de', realMeaning: 'протокол заседания, протокол испытаний', mistakenAs: 'только полицейский протокол', correctWord: 'das Protokoll' },
  puppe: { word: 'die Puppe', lang: 'de', realMeaning: 'кукла, куколка насекомого', mistakenAs: 'пупок', correctWord: 'der Bauchnabel' },
  rebe: { word: 'die Rebe', lang: 'de', realMeaning: 'виноградная лоза', mistakenAs: 'репа', correctWord: 'die Rübe' },
  referat: { word: 'das Referat', lang: 'de', realMeaning: 'устный доклад, сообщение или отдел в ведомстве', mistakenAs: 'письменный реферат', correctWord: 'die Hausarbeit, der Aufsatz' },
  regal: { word: 'das Regal', lang: 'de', realMeaning: 'книжная полка, стеллаж', mistakenAs: 'царские регалии', correctWord: 'die Insignien' },
  roman: { word: 'der Roman', lang: 'de', realMeaning: 'роман (литературное произведение)', mistakenAs: 'мужское имя Роман', correctWord: 'Roman (Name)' },
  salbe: { word: 'die Salbe', lang: 'de', realMeaning: 'лечебная мазь', mistakenAs: 'орудийный залп', correctWord: 'die Salve' },
  satz: { word: 'der Satz', lang: 'de', realMeaning: 'предложение (в тексте), комплект, тариф или осадок', mistakenAs: 'только предложение', correctWord: 'der Satz' },
  schacht: { word: 'der Schacht', lang: 'de', realMeaning: 'шахта, ствол колодца', mistakenAs: 'шахматы', correctWord: 'das Schach' },
  schale: { word: 'die Schale', lang: 'de', realMeaning: 'миска, чаша или кожура фрукта', mistakenAs: 'шаль, платок', correctWord: 'der Schal, das Tuch' },
  schrank: { word: 'der Schrank', lang: 'de', realMeaning: 'шкаф', mistakenAs: 'шрам', correctWord: 'die Narbe' },
  schreck: { word: 'der Schreck', lang: 'de', realMeaning: 'испуг, шок, ужас', mistakenAs: 'мультгерой Шрек', correctWord: 'die Figur Shrek' },
  see: { word: 'der See / die See', lang: 'de', realMeaning: 'der See = озеро; die See = море', mistakenAs: 'только море', correctWord: 'das Meer' },
  sektor: { word: 'der Sektor', lang: 'de', realMeaning: 'отрасль экономики или сектор круга', mistakenAs: 'полицейский участок', correctWord: 'das Revier' },
  station: { word: 'die Station', lang: 'de', realMeaning: 'больничное отделение или остановка', mistakenAs: 'железнодорожный вокзал', correctWord: 'der Bahnhof' },
  stuhl: { word: 'der Stuhl', lang: 'de', realMeaning: 'стул со спинкой (или стул в медицине)', mistakenAs: 'табуретка или стол', correctWord: 'der Hocker / der Tisch' },
  tablette: { word: 'die Tablette', lang: 'de', realMeaning: 'лекарственная таблетка', mistakenAs: 'электронный планшет', correctWord: 'das Tablet' },
  tapete: { word: 'die Tapete', lang: 'de', realMeaning: 'обои на стену', mistakenAs: 'напольный ковёр', correctWord: 'der Teppich' },
  ton: { word: 'der Ton', lang: 'de', realMeaning: 'звук, тон (или гончарная глина)', mistakenAs: 'тяжёлая тонна', correctWord: 'die Tonne' },
  tresor: { word: 'der Tresor', lang: 'de', realMeaning: 'бронированный сейф', mistakenAs: 'сокровище', correctWord: 'der Schatz' },
  waffel: { word: 'die Waffel', lang: 'de', realMeaning: 'вафля (хрустящая сладость)', mistakenAs: 'оружие (die Waffe)', correctWord: 'die Waffe' },
  zelt: { word: 'das Zelt', lang: 'de', realMeaning: 'походная палатка, шатёр', mistakenAs: 'монашеская келья', correctWord: 'die Zelle' },
  zitrone: { word: 'die Zitrone', lang: 'de', realMeaning: 'лимон', mistakenAs: 'цитрон', correctWord: 'die Zitrone' },
  krawallbruder: { word: 'der Krawallbruder', lang: 'de', realMeaning: 'хулиган, дебошир', mistakenAs: 'кровавый брат', correctWord: 'der Raufbold' },
  lack: { word: 'der Lack', lang: 'de', realMeaning: 'лак или эмаль', mistakenAs: 'лук (растение)', correctWord: 'die Zwiebel' },
  leder: { word: 'das Leder', lang: 'de', realMeaning: 'натуральная кожа (материал)', mistakenAs: 'лидер', correctWord: 'der Anführer, der Leader' },
  list: { word: 'die List', lang: 'de', realMeaning: 'хитрость, уловка, коварство', mistakenAs: 'лист бумаги или список', correctWord: 'das Blatt / die Liste' },
  mappe2: { word: 'die Mappe', lang: 'de', realMeaning: 'папка для документов', mistakenAs: 'маппет-шоу', correctWord: 'die Puppenshow' },
  orden: { word: 'der Orden', lang: 'de', realMeaning: 'рыцарский орден или орденская награда', mistakenAs: 'ордер на арест', correctWord: 'der Haftbefehl' },
  pappe2: { word: 'die Pappe', lang: 'de', realMeaning: 'картон или клейстер', mistakenAs: 'папа', correctWord: 'der Vater, der Papa' },
  rock: { word: 'der Rock', lang: 'de', realMeaning: 'юбка (или рок-музыка)', mistakenAs: 'рок / судьба', correctWord: 'das Schicksal' },
  rost: { word: 'der Rost', lang: 'de', realMeaning: 'ржавчина или решётка гриля', mistakenAs: 'рост человека', correctWord: 'der Wuchs, die Körpergröße' },
  schal: { word: 'der Schal', lang: 'de', realMeaning: 'тёплый шарф', mistakenAs: 'шаль, платок', correctWord: 'das Tuch, die Stola' },
  schirm: { word: 'der Schirm', lang: 'de', realMeaning: 'зонт, щиток или экран монитора', mistakenAs: 'ширма в комнате', correctWord: 'die Spanische Wand' },
  spund: { word: 'der Spund', lang: 'de', realMeaning: 'бочечная пробка, затычка', mistakenAs: 'спуд', correctWord: 'die Versteck' },
  teller: { word: 'der Teller', lang: 'de', realMeaning: 'столовая тарелка', mistakenAs: 'талер (монета)', correctWord: 'der Taler' },
  winde: { word: 'die Winde', lang: 'de', realMeaning: 'лебёдка, ворот или цветок вьюнок', mistakenAs: 'ветры', correctWord: 'die Winde (Plural von Wind)' },
  zoll: { word: 'der Zoll', lang: 'de', realMeaning: 'таможенная пошлина или дюйм', mistakenAs: 'соль', correctWord: 'das Salz' },
  kamin2: { word: 'der Kamin', lang: 'de', realMeaning: 'камин', mistakenAs: 'камень', correctWord: 'der Stein' },
  kollege: { word: 'der Kollege', lang: 'de', realMeaning: 'товарищ по работе, коллега', mistakenAs: 'калека', correctWord: 'der Krüppel' },
  presse: { word: 'die Presse', lang: 'de', realMeaning: 'печать, СМИ или пресс-станок', mistakenAs: 'пресс мышц', correctWord: 'die Bauchmuskeln' },
  quittung: { word: 'die Quittung', lang: 'de', realMeaning: 'кассовый чек, расписка', mistakenAs: 'квитанция за квартиру', correctWord: 'die Rechnung' },
  stoff: { word: 'der Stoff', lang: 'de', realMeaning: 'ткань, вещество, материал или сленг: наркотики', mistakenAs: 'штоф (бутыль)', correctWord: 'die Flasche' },
  wetter: { word: 'das Wetter', lang: 'de', realMeaning: 'погода', mistakenAs: 'ветер', correctWord: 'der Wind' },
  zeit: { word: 'die Zeit', lang: 'de', realMeaning: 'время', mistakenAs: 'сайт', correctWord: 'die Website' },
  zweig: { word: 'der Zweig', lang: 'de', realMeaning: 'ветка дерева или филиал фирмы', mistakenAs: 'гвоздь', correctWord: 'der Nagel' },
};

/** Проверка, является ли слово ложным другом переводчика */
export function getFalseFriend(word: string, lang: 'de' | 'en'): FalseFriendEntry | null {
  const clean = word.trim().toLowerCase().replace(/^(der|die|das|the|a|an)\s+/i, '');
  if (lang === 'de') {
    return DE_RU_FALSE_FRIENDS[clean] ?? null;
  }
  return null;
}
