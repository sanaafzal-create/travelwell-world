/**
 * TravelWell.World — catalog-name translations (1c, demo-path pass).
 *
 * The catalog (SIs, regions, wells) is authored in English in taxonomy.ts. This
 * is a thin display-translation layer keyed by `<kind>.<id>.<field>`, used by the
 * cards + demo pages so names read in the traveler's language. It does NOT change
 * the data model — English remains the source; missing locales fall back to it.
 *
 * Brand decision: the Well *names* ("Fly-Well", "Stay-Well") stay English — the
 * "-Well" system is a coined brand, translated names read awkwardly. Their
 * descriptive *tags* translate. SI + region names/lines translate in full.
 *
 * Launch-language strings are demo-ready; a native-speaker polish is worth doing
 * before scale (especially Arabic + the poetic region lines).
 */
import { useStore } from "@/store/useStore";

type L = { es?: string; ar?: string; zh?: string; fr?: string };

const CATALOG: Record<string, L> = {
  // ── Special Interest names ──────────────────────────────────────────────
  "si.ultra.name": { es: "Ultra-Lujo", ar: "الفخامة القصوى", zh: "超奢华", fr: "Ultra-Luxe" },
  "si.tropical.name": { es: "Islas Tropicales", ar: "جزر استوائية", zh: "热带海岛", fr: "Îles Tropicales" },
  "si.romance.name": { es: "Romance y Lunas de Miel", ar: "رومانسية وشهر العسل", zh: "浪漫与蜜月", fr: "Romance & Lunes de Miel" },
  "si.safari.name": { es: "Aventuras de Safari", ar: "مغامرات السفاري", zh: "野生动物之旅", fr: "Aventures Safari" },
  "si.expedition.name": { es: "Expediciones Globales", ar: "مغامرات استكشافية عالمية", zh: "全球探险远征", fr: "Expéditions Mondiales" },
  "si.adventure.name": { es: "Aventuras Globales", ar: "مغامرات عالمية", zh: "全球探险", fr: "Aventures Mondiales" },
  "si.liveaboard.name": { es: "Cruceros de Buceo", ar: "رحلات الغطس المقيمة", zh: "潜水船宿", fr: "Croisières Plongée" },
  "si.river.name": { es: "Cruceros Fluviales", ar: "رحلات نهرية", zh: "内河游轮", fr: "Croisières Fluviales" },
  "si.diveglobal.name": { es: "Buceo por el Mundo", ar: "الغطس حول العالم", zh: "全球潜水", fr: "Plongée Mondiale" },
  "si.ocean.name": { es: "Océano y Deportes Acuáticos", ar: "المحيط والرياضات المائية", zh: "海洋与水上运动", fr: "Océan & Sports Nautiques" },
  "si.wellness.name": { es: "Bienestar, Spa y Retiros", ar: "العافية والسبا والمنتجعات", zh: "养生、水疗与静修", fr: "Bien-être, Spa & Retraites" },
  "si.wildlife.name": { es: "Fauna y Naturaleza", ar: "الحياة البرّية والطبيعة", zh: "野生动物与自然", fr: "Faune & Nature" },
  "si.glamping.name": { es: "Glamping Global", ar: "التخييم الفاخر عالميًا", zh: "全球豪华野营", fr: "Glamping Mondial" },
  "si.family.name": { es: "Viajes en Familia", ar: "سفر العائلة", zh: "家庭旅行", fr: "Voyages en Famille" },
  "si.group.name": { es: "Viajes en Grupo", ar: "السفر الجماعي", zh: "团体旅行", fr: "Voyages en Groupe" },
  "si.hiking.name": { es: "Senderismo y Trekking", ar: "المشي وتسلّق المسارات", zh: "徒步与越野", fr: "Randonnée & Trekking" },
  "si.ski.name": { es: "Esquí y Nieve", ar: "التزلّج والثلج", zh: "滑雪与冰雪", fr: "Ski & Neige" },
  "si.olympic.name": { es: "Viajes Olímpicos", ar: "سفر أولمبي", zh: "奥运之旅", fr: "Voyages Olympiques" },
  "si.senior.name": { es: "Viajes para Mayores", ar: "سفر كبار السن", zh: "长者旅行", fr: "Voyages Seniors" },
  "si.culinary.name": { es: "Experiencias Culinarias", ar: "تجارب الطهي", zh: "美食体验", fr: "Expériences Culinaires" },
  "si.culture.name": { es: "Cultura y Patrimonio", ar: "الثقافة والتراث", zh: "文化与遗产", fr: "Culture & Patrimoine" },
  "si.deepdive.name": { es: "Inmersiones Culturales", ar: "انغماس ثقافي عميق", zh: "深度文化探索", fr: "Immersions Culturelles" },
  "si.pilgrimage.name": { es: "Religión y Peregrinación", ar: "الدين والحج", zh: "宗教与朝圣", fr: "Religion & Pèlerinage" },
  "si.entertainment.name": { es: "Espectáculos en Vivo", ar: "الترفيه الحيّ", zh: "现场娱乐", fr: "Spectacles en Direct" },
  "si.nightlife.name": { es: "Vida Nocturna y Ciudad", ar: "الحياة الليلية والمدينة", zh: "夜生活与都市", fr: "Vie Nocturne & Ville" },
  "si.sports.name": { es: "Viajes Deportivos", ar: "السفر الرياضي", zh: "体育旅行", fr: "Voyages Sportifs" },
  "si.spectator.name": { es: "Viajes de Espectador Deportivo", ar: "سفر مشاهدة الرياضة", zh: "观赛旅行", fr: "Voyages Spectateur Sportif" },
  "si.prosports.name": { es: "Viajes de Equipos Profesionales", ar: "سفر الفرق المحترفة", zh: "职业球队旅行", fr: "Voyages d'Équipes Pro" },
  "si.compsports.name": { es: "Viajes de Equipos Competitivos", ar: "سفر الفرق التنافسية", zh: "竞技球队旅行", fr: "Voyages d'Équipes Compétitives" },
  "si.sailing.name": { es: "Chárteres de Vela", ar: "رحلات الإبحار المؤجّرة", zh: "帆船包船", fr: "Charters à Voile" },
  "si.yacht.name": { es: "Chárteres de Yate", ar: "رحلات اليخوت المؤجّرة", zh: "游艇包船", fr: "Charters de Yacht" },
  "si.wine.name": { es: "Tours de Vino y Licores", ar: "جولات النبيذ والمشروبات", zh: "葡萄酒与烈酒之旅", fr: "Circuits Vin & Spiritueux" },

  // ── Region names ────────────────────────────────────────────────────────
  "region.01F.name": { es: "Europa Occidental", ar: "أوروبا الغربية", zh: "西欧", fr: "Europe de l'Ouest" },
  "region.02F.name": { es: "El Mediterráneo", ar: "البحر المتوسط", zh: "地中海", fr: "La Méditerranée" },
  "region.03F.name": { es: "Europa del Norte y Nórdicos", ar: "شمال أوروبا والدول الاسكندنافية", zh: "北欧", fr: "Europe du Nord & Nordiques" },
  "region.04A.name": { es: "Oriente Medio y el Golfo", ar: "الشرق الأوسط والخليج", zh: "中东与海湾", fr: "Moyen-Orient & Golfe" },
  "region.05A.name": { es: "África Oriental", ar: "شرق أفريقيا", zh: "东非", fr: "Afrique de l'Est" },
  "region.06A.name": { es: "África Austral", ar: "الجنوب الأفريقي", zh: "南部非洲", fr: "Afrique Australe" },
  "region.07A.name": { es: "Asia del Sur y Sudeste", ar: "جنوب وجنوب شرق آسيا", zh: "南亚与东南亚", fr: "Asie du Sud & du Sud-Est" },
  "region.08A.name": { es: "Asia Oriental", ar: "شرق آسيا", zh: "东亚", fr: "Asie de l'Est" },
  "region.09P.name": { es: "Oceanía y el Pacífico", ar: "أوقيانوسيا والمحيط الهادئ", zh: "大洋洲与太平洋", fr: "Océanie & Pacifique" },
  "region.10S.name": { es: "América Latina", ar: "أمريكا اللاتينية", zh: "拉丁美洲", fr: "Amérique Latine" },
  "region.11C.name": { es: "Caribe y Atlántico", ar: "الكاريبي والأطلسي", zh: "加勒比与大西洋", fr: "Caraïbes & Atlantique" },
  "region.12A.name": { es: "Estados Unidos", ar: "الولايات المتحدة", zh: "美国", fr: "États-Unis" },
  "region.13A.name": { es: "Canadá", ar: "كندا", zh: "加拿大", fr: "Canada" },

  // ── Region lines ────────────────────────────────────────────────────────
  "region.01F.line": { es: "Capitales del viejo mundo, con soltura moderna", ar: "عواصم العالم القديم بيُسر حديث", zh: "旧世界之都，现代从容", fr: "Capitales du vieux monde, aisance moderne" },
  "region.02F.line": { es: "Sol, mar y siglos", ar: "شمس وبحر وقرون", zh: "阳光、海洋与千年", fr: "Soleil, mer et siècles" },
  "region.03F.line": { es: "Fiordos, diseño, luz larga", ar: "مضايق وتصميم وضوء ممتد", zh: "峡湾、设计与漫长的光", fr: "Fjords, design, lumière longue" },
  "region.04A.line": { es: "Donde lo antiguo se encuentra con lo audaz", ar: "حيث يلتقي العريق بالجريء", zh: "古老与大胆相遇之地", fr: "Où l'ancien rencontre l'audace" },
  "region.05A.line": { es: "La cuna del safari", ar: "مهد السفاري", zh: "野生动物之旅的摇篮", fr: "Le berceau du safari" },
  "region.06A.line": { es: "Grandes cielos, mayor fauna", ar: "سماوات واسعة وحياة برّية أوسع", zh: "辽阔天空，更壮野趣", fr: "Grands ciels, plus grand gibier" },
  "region.07A.line": { es: "Templos, islas, especias", ar: "معابد وجزر وتوابل", zh: "庙宇、海岛与香料", fr: "Temples, îles, épices" },
  "region.08A.line": { es: "Tradición a la velocidad del presente", ar: "تقاليد بسرعة الحاضر", zh: "以当下之速承载传统", fr: "La tradition à la vitesse du présent" },
  "region.09P.line": { es: "El fin del mapa, el inicio del asombro", ar: "نهاية الخريطة، بداية الدهشة", zh: "地图的尽头，惊叹的起点", fr: "Le bout de la carte, le début de l'émerveillement" },
  "region.10S.line": { es: "Color, ritmo, horizontes salvajes", ar: "لون وإيقاع وآفاق برّية", zh: "色彩、节奏与狂野地平线", fr: "Couleur, rythme, horizons sauvages" },
  "region.11C.line": { es: "Mil tonos de azul", ar: "ألف درجة من الأزرق", zh: "千种蔚蓝", fr: "Mille nuances de bleu" },
  "region.12A.line": { es: "Cincuenta formas de vagar", ar: "خمسون طريقة للتجوال", zh: "五十种漫游方式", fr: "Cinquante façons de vagabonder" },
  "region.13A.line": { es: "Vasto, salvaje y acogedor", ar: "شاسعة وبرّية وكريمة", zh: "辽阔、狂野而亲切", fr: "Vaste, sauvage et accueillant" },

  // ── Well tags (names stay English brand) ────────────────────────────────
  "well.fly.tag": { es: "Cómo llegar", ar: "الوصول إلى هناك", zh: "抵达", fr: "Y aller" },
  "well.stay.tag": { es: "Dónde descansas", ar: "حيث ترتاح", zh: "何处安歇", fr: "Où vous reposer" },
  "well.eat.tag": { es: "Lo que saboreas", ar: "ما تتذوّقه", zh: "尽享美味", fr: "Ce que vous savourez" },
  "well.move.tag": { es: "Cómo moverte", ar: "التنقّل", zh: "四处通行", fr: "Se déplacer" },
  "well.gear.tag": { es: "Lo que llevas", ar: "ما تحمله", zh: "随身所带", fr: "Ce que vous emportez" },
  "well.beauty.tag": { es: "Verse y sentirse bien", ar: "المظهر والإحساس الجيّد", zh: "美丽与舒适", fr: "Beauté & bien-être" },
  "well.activities.tag": { es: "Lo que te emociona", ar: "ما يثير حماسك", zh: "令你心动", fr: "Ce qui vous passionne" },
  "well.shop.tag": { es: "Llevarlo a casa", ar: "تأخذه معك", zh: "带回家", fr: "Ramener chez soi" },
  "well.insure.tag": { es: "Tranquilidad", ar: "راحة البال", zh: "安心", fr: "Sérénité" },
  "well.ship.tag": { es: "Enviarlo por delante", ar: "إرساله مسبقًا", zh: "先行寄送", fr: "L'envoyer devant" },
  "well.nanny.tag": { es: "Cuidado de los pequeños", ar: "رعاية الصغار", zh: "照护孩子", fr: "S'occuper des petits" },
  "well.security.tag": { es: "Protección discreta", ar: "حماية متحفّظة", zh: "低调守护", fr: "Protection discrète" },
};

export function catalogT(key: string, locale: string, fallback: string): string {
  if (locale === "en") return fallback;
  const e = CATALOG[key] as Record<string, string> | undefined;
  return (e && e[locale]) || fallback;
}

/** Hook: `ct("si.tropical.name", s.name)` → localized name, English fallback. */
export function useCatalogName() {
  const locale = useStore((s) => s.locale);
  return (key: string, fallback: string) => catalogT(key, locale, fallback);
}
