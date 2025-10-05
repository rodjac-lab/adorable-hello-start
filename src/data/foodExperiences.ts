import type { FoodExperience as BaseFoodExperience } from '@/types/content';

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

export const getFoodExperiences = (): FoodExperience[] => [...foodExperiences];
