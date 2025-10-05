import type { FoodExperience as BaseFoodExperience, ContentStatus } from '@/types/content';
import { EDITOR_STORAGE_KEYS } from '@/features/editor/constants';
import { loadPublicationState, resolvePublicationStatus } from '@/features/publishing/publicationState';

export type FoodExperience = BaseFoodExperience;

export const foodExperiences: FoodExperience[] = [
  {
    id: 'mansaf',
    name: 'Mansaf',
    type: 'Plat national',
    description:
      "Le plat emblématique jordanien : agneau cuit dans une sauce au yaourt fermenté (jameed), servi sur un lit de riz et mangé traditionnellement avec les mains.",
    experience:
      "Partagé lors d'un déjeuner familial à Amman. L'expérience était autant sociale que gustative - toute la famille mange dans le même plat, créant une intimité particulière.",
    rating: 5,
    location: 'Restaurant familial, Amman',
    price: 'Modéré',
  },
  {
    id: 'falafel-houmous',
    name: 'Falafel et Houmous',
    type: 'Street food',
    description:
      "Boulettes de pois chiches frites servies avec houmous crémeux, tahini, et légumes frais dans du pain pita chaud.",
    experience:
      "Découvert dans une petite échoppe près du théâtre romain. Le propriétaire m'a expliqué ses secrets : pois chiches trempés 24h et épices moulues chaque matin.",
    rating: 4,
    location: 'Downtown Amman',
    price: 'Très abordable',
  },
  {
    id: 'knafeh',
    name: 'Knafeh',
    type: 'Dessert',
    description:
      "Dessert traditionnel au fromage fondu recouvert de cheveux d'ange (kataifi) et arrosé de sirop parfumé à l'eau de rose.",
    experience:
      "Une révélation ! La version de Nablus dégustée à Amman était parfaite : croquant du dessus, fondant à l'intérieur. Un équilibre sucré-salé surprenant.",
    rating: 5,
    location: 'Pâtisserie Al-Aker, Amman',
    price: 'Abordable',
  },
  {
    id: 'mint-tea-arabic-coffee',
    name: 'Thé à la menthe et café arabe',
    type: 'Boissons',
    description:
      "Thé noir parfumé à la menthe fraîche et café arabe (qahwa) parfumé à la cardamome, servis dans de petits verres.",
    experience:
      "Rituel quotidien dans chaque lieu visité. Le thé accompagne chaque conversation, chaque pause. Le café arabe, plus corsé, ponctue les moments importants.",
    rating: 4,
    location: 'Partout',
    price: 'Très abordable',
  },
];

const FOOD_STORAGE_KEY = EDITOR_STORAGE_KEYS.food;
const isBrowser = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

type FoodExperienceStatusFilter = ContentStatus | 'all';

interface GetFoodExperiencesOptions {
  status?: FoodExperienceStatusFilter;
}

const canonicalFoodIds = new Set(foodExperiences.map((experience) => experience.id));

const sanitizeStoredExperiences = (raw: unknown): FoodExperience[] => {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw
    .filter((item): item is FoodExperience => {
      if (typeof item !== 'object' || item === null) {
        return false;
      }

      const candidate = item as Partial<FoodExperience>;
      return typeof candidate.id === 'string';
    })
    .map((experience) => ({ ...experience }));
};

const loadStoredFoodExperiences = (): FoodExperience[] => {
  if (!isBrowser) {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(FOOD_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    return sanitizeStoredExperiences(parsed);
  } catch (error) {
    console.warn('⚠️ Impossible de charger les expériences culinaires personnalisées :', error);
    return [];
  }
};

const shouldInclude = (status: ContentStatus, filter: FoodExperienceStatusFilter): boolean => {
  if (filter === 'all') {
    return true;
  }

  return status === filter;
};

export const getFoodExperiences = (options?: GetFoodExperiencesOptions): FoodExperience[] => {
  const filter = options?.status ?? 'published';

  if (!isBrowser) {
    if (filter === 'draft') {
      return [];
    }
    return foodExperiences.map((experience) => ({ ...experience }));
  }

  const storedExperiences = loadStoredFoodExperiences();
  const storedMap = new Map(storedExperiences.map((experience) => [experience.id, experience]));
  const publicationState = loadPublicationState();

  const results: FoodExperience[] = [];

  foodExperiences.forEach((experience) => {
    const override = storedMap.get(experience.id);
    const candidate = override ?? experience;
    const status = resolvePublicationStatus(publicationState, 'food', experience.id, {
      defaultStatus: 'published',
    });

    if (shouldInclude(status, filter)) {
      results.push({ ...candidate });
    }
  });

  storedExperiences.forEach((experience) => {
    if (canonicalFoodIds.has(experience.id)) {
      return;
    }

    const status = resolvePublicationStatus(publicationState, 'food', experience.id, {
      defaultStatus: 'draft',
    });

    if (shouldInclude(status, filter)) {
      results.push({ ...experience });
    }
  });

  return results;
};
