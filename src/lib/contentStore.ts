
import type { JournalEntry } from '@/lib/journalStorage';

export type ContentSource = 'canonical' | 'custom';

export interface JournalContentEntry extends JournalEntry {
  source: ContentSource;
}

export interface PlaceReference {
  day: number;
  name: string;
  summary: string;
  coordinates: [number, number];
  source: ContentSource;
}

export interface FoodExperience {
  name: string;
  type: string;
  description: string;
  experience: string;
  rating: number;
  location: string;
  price: string;
  source: ContentSource;
}

export interface ReadingRecommendation {
  title: string;
  author: string;
  type: string;
  description: string;
  why: string;
  amazon: string;
  rating: number;
  source: ContentSource;
}

const JOURNAL_STORAGE_KEY = 'journalEntries';
const VERSION_KEY = 'journalStorage_version';
const SOURCE_STATE_KEY = 'contentStore_sources';
const CURRENT_VERSION = '3.0';

interface SourceState {
  journal: Record<number, ContentSource>;
  hasImported?: boolean;
}

const defaultSourceState: SourceState = {
  journal: {},
  hasImported: false,
};

const canonicalJournalEntries: JournalContentEntry[] = [
  {
    day: 1,
    date: '15 janvier 2024',
    title: 'Arrivée à Amman',
    location: 'Amman, Jordanie',
    story: [
      "Après un vol nocturne bercé par la lumière des étoiles, je touche enfin le sol jordanien.",
      "L'odeur de cardamome du café arabe embaume l'aérogare de Queen Alia tandis que je franchis les portes de l'immigration.",
      "Un chauffeur souriant m'attend avec un panneau griffonné à la main : premier sourire, première conversation, première invitation à ralentir et à écouter.",
    ].join('\n\n'),
    mood: 'Excité',
    photos: ['/lovable-uploads/ab7525ee-de5e-4ec5-bd8a-474c543dff10.png'],
    link: 'https://maps.app.goo.gl/2CwZq8vSxcrb3MBv7',
    source: 'canonical',
  },
  {
    day: 2,
    date: '16 janvier 2024',
    title: 'Jerash et les collines du Nord',
    location: 'Jerash, Ajloun, Amman',
    story: [
      "Au lever du soleil, la lumière découpe les colonnades de Jerash comme une scène de théâtre antique.",
      "Les ruines racontent la grandeur de la Décapole pendant qu'à Ajloun, les pierres du château portent encore l'écho des croisades.",
      "La journée s'achève à Amman autour d'un mansaf partagé avec la famille de mon hôte : un festin autant culturel que gastronomique.",
    ].join('\n\n'),
    mood: 'Émerveillé',
    link: 'https://maps.app.goo.gl/g3PDc28B4wXCRB4x6',
    source: 'canonical',
  },
];

const canonicalPlaceReferences: PlaceReference[] = [
  {
    day: 1,
    name: 'Amman',
    summary: 'Capitale du royaume hachémite, point de départ et de retour du voyage.',
    coordinates: [31.9539, 35.9106],
    source: 'canonical',
  },
  {
    day: 2,
    name: 'Jerash',
    summary: 'Cité gréco-romaine remarquablement conservée, joyau du nord jordanien.',
    coordinates: [32.2811, 35.8998],
    source: 'canonical',
  },
  {
    day: 2,
    name: 'Ajloun',
    summary: 'Forteresse ayyoubide veillant sur les vallées verdoyantes et les oliveraies.',
    coordinates: [32.3326, 35.7519],
    source: 'canonical',
  },
];

const canonicalFoodExperiences: FoodExperience[] = [
  {
    name: 'Mansaf',
    type: 'Plat national',
    description: "Le plat emblématique jordanien : agneau cuit dans une sauce au yaourt fermenté (jameed), servi sur un lit de riz et mangé traditionnellement avec les mains.",
    experience: "Partagé lors d'un déjeuner familial à Amman. L'expérience était autant sociale que gustative - toute la famille mange dans le même plat, créant une intimité particulière.",
    rating: 5,
    location: 'Restaurant familial, Amman',
    price: 'Modéré',
    source: 'canonical',
  },
  {
    name: 'Falafel et Houmous',
    type: 'Street food',
    description: "Boulettes de pois chiches frites servies avec houmous crémeux, tahini, et légumes frais dans du pain pita chaud.",
    experience: "Découvert dans une petite échoppe près du théâtre romain. Le propriétaire m'a expliqué ses secrets : pois chiches trempés 24h et épices moulues chaque matin.",
    rating: 4,
    location: 'Downtown Amman',
    price: 'Très abordable',
    source: 'canonical',
  },
  {
    name: 'Knafeh',
    type: 'Dessert',
    description: "Dessert traditionnel au fromage fondu recouvert de cheveux d'ange (kataifi) et arrosé de sirop parfumé à l'eau de rose.",
    experience: "Une révélation ! La version de Nablus dégustée à Amman était parfaite : croquant du dessus, fondant à l'intérieur. Un équilibre sucré-salé surprenant.",
    rating: 5,
    location: 'Pâtisserie Al-Aker, Amman',
    price: 'Abordable',
    source: 'canonical',
  },
  {
    name: 'Thé à la menthe et café arabe',
    type: 'Boissons',
    description: "Thé noir parfumé à la menthe fraîche et café arabe (qahwa) parfumé à la cardamome, servis dans de petits verres.",
    experience: "Rituel quotidien dans chaque lieu visité. Le thé accompagne chaque conversation, chaque pause. Le café arabe, plus corsé, ponctue les moments importants.",
    rating: 4,
    location: 'Partout',
    price: 'Très abordable',
    source: 'canonical',
  },
];

const canonicalReadingRecommendations: ReadingRecommendation[] = [
  {
    title: "Lawrence d'Arabie",
    author: 'T.E. Lawrence',
    type: 'Autobiographie',
    description: "Le récit captivant de l'officier britannique qui a vécu la révolte arabe de 1916-1918. Une plongée dans l'histoire du Moyen-Orient moderne.",
    why: "Indispensable pour comprendre l'histoire moderne de la région et l'émergence de la Jordanie moderne sous l'émir Abdullah.",
    amazon: 'https://amazon.fr/...',
    rating: 5,
    source: 'canonical',
  },
  {
    title: 'Pétra : Merveille du monde',
    author: 'Jane Taylor',
    type: 'Guide culturel',
    description: "Guide complet sur l'histoire, l'archéologie et l'art nabatéen de Pétra. Avec de magnifiques photographies et plans détaillés.",
    why: "Le guide de référence pour comprendre l'ingéniosité nabatéenne et l'importance historique du site.",
    amazon: 'https://amazon.fr/...',
    rating: 4,
    source: 'canonical',
  },
  {
    title: 'Les Bédouins de Jordanie',
    author: 'Shelagh Weir',
    type: 'Anthropologie',
    description: "Étude approfondie de la culture bédouine traditionnelle, ses traditions, son artisanat et son mode de vie.",
    why: "Pour découvrir l'âme nomade de la Jordanie et comprendre l'hospitalité légendaire de ses habitants.",
    amazon: 'https://amazon.fr/...',
    rating: 4,
    source: 'canonical',
  },
  {
    title: 'Cuisine du Moyen-Orient',
    author: 'Claudia Roden',
    type: 'Gastronomie',
    description: "Bible de la cuisine moyen-orientale avec des recettes authentiques jordaniennes, palestiniennes et syriennes.",
    why: "Pour reproduire chez soi les saveurs découvertes et prolonger le voyage culinaire.",
    amazon: 'https://amazon.fr/...',
    rating: 5,
    source: 'canonical',
  },
  {
    title: 'Jordan: A Timeless Land',
    author: 'Mohamed El-Khoury',
    type: 'Beau livre',
    description: "Superbe livre photographique qui capture la beauté des paysages jordaniens, de Pétra au Wadi Rum.",
    why: "Pour revivre visuellement la magie des paysages jordaniens et partager la beauté du pays.",
    amazon: 'https://amazon.fr/...',
    rating: 4,
    source: 'canonical',
  },
  {
    title: 'Le Royaume hachémite de Jordanie',
    author: 'Philippe Droz-Vincent',
    type: 'Géopolitique',
    description: 'Analyse politique et sociale de la Jordanie contemporaine, son rôle régional et ses défis.',
    why: 'Pour comprendre les enjeux actuels du royaume et son importance stratégique au Moyen-Orient.',
    amazon: 'https://amazon.fr/...',
    rating: 4,
    source: 'canonical',
  },
];

const stripSource = (entry: JournalContentEntry): JournalEntry => {
  const { source: _source, ...rest } = entry;
  return rest;
};

const loadSourceState = (): SourceState => {
  try {
    const raw = localStorage.getItem(SOURCE_STATE_KEY);
    if (!raw) {
      return { ...defaultSourceState };
    }

    const parsed = JSON.parse(raw);
    return {
      journal: parsed.journal ?? {},
      hasImported: parsed.hasImported ?? false,
    } as SourceState;
  } catch (error) {
    console.warn('⚠️ Impossible de charger l\'état des sources:', error);
    return { ...defaultSourceState };
  }
};

const saveSourceState = (state: SourceState) => {
  localStorage.setItem(SOURCE_STATE_KEY, JSON.stringify(state));
};

const matchCanonicalEntry = (entry: JournalEntry): JournalContentEntry | undefined => {
  return canonicalJournalEntries.find((canonical) => {
    return (
      canonical.day === entry.day &&
      canonical.title === entry.title &&
      canonical.location === entry.location &&
      canonical.story === entry.story
    );
  });
};

export const initializeContentStore = () => {
  try {
    const existing = localStorage.getItem(JOURNAL_STORAGE_KEY);
    if (!existing || existing === '[]') {
      const entriesToSave = canonicalJournalEntries.map(stripSource);
      localStorage.setItem(JOURNAL_STORAGE_KEY, JSON.stringify(entriesToSave));
      localStorage.setItem(VERSION_KEY, CURRENT_VERSION);
      saveSourceState({
        journal: canonicalJournalEntries.reduce<Record<number, ContentSource>>((map, entry) => {
          map[entry.day] = 'canonical';
          return map;
        }, {}),
        hasImported: false,
      });
      return;
    }

    const parsed: JournalEntry[] = JSON.parse(existing);
    syncJournalSources(parsed);

    if (!localStorage.getItem(VERSION_KEY)) {
      localStorage.setItem(VERSION_KEY, CURRENT_VERSION);
    }
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation du contentStore:', error);
  }
};

export const syncJournalSources = (entries: JournalEntry[]): JournalContentEntry[] => {
  const state = loadSourceState();
  let stateChanged = false;

  const entryDays = new Set(entries.map((entry) => entry.day));
  const syncedEntries = entries.map((entry) => {
    const canonicalMatch = matchCanonicalEntry(entry);
    const source: ContentSource = canonicalMatch ? 'canonical' : 'custom';

    if (state.journal[entry.day] !== source) {
      state.journal[entry.day] = source;
      stateChanged = true;
    }

    return {
      ...entry,
      source,
    };
  });

  Object.keys(state.journal).forEach((key) => {
    const day = Number(key);
    if (!entryDays.has(day)) {
      delete state.journal[day];
      stateChanged = true;
    }
  });

  if (stateChanged) {
    saveSourceState(state);
  }

  return syncedEntries;
};

export const getJournalEntriesWithSource = (entries: JournalEntry[]): JournalContentEntry[] => {
  return syncJournalSources(entries);
};

export const isCustomJournalDay = (day: number): boolean => {
  const state = loadSourceState();
  return state.journal[day] === 'custom';
};

export const markJournalDayAsCustom = (day: number) => {
  const state = loadSourceState();
  if (state.journal[day] !== 'custom') {
    state.journal[day] = 'custom';
    saveSourceState(state);
  }
};

export const registerImportedJournalEntries = (entries: JournalEntry[]) => {
  const state = loadSourceState();
  entries.forEach((entry) => {
    state.journal[entry.day] = 'custom';
  });
  state.hasImported = true;
  saveSourceState(state);
};

export const clearContentStoreState = () => {
  localStorage.removeItem(SOURCE_STATE_KEY);
};

export const getCanonicalJournalEntries = (): JournalContentEntry[] => {
  return [...canonicalJournalEntries];
};

export const getPlaceReferences = (): PlaceReference[] => {
  return [...canonicalPlaceReferences];
};

export const getFoodExperiences = (): FoodExperience[] => {
  return [...canonicalFoodExperiences];
};

export const getReadingRecommendations = (): ReadingRecommendation[] => {
  return [...canonicalReadingRecommendations];
};
main
