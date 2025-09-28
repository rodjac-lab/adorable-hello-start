export interface FoodExperience {
  id: string;
  day: number;
  dish: string;
  location: string;
  description: string;
  rating: number;
  cultural_note?: string;
}

export const foodExperiences: FoodExperience[] = [
  {
    id: "1",
    day: 1,
    dish: "Mansaf",
    location: "Restaurant traditionnel, Amman",
    description: "Le plat national jordanien ! Agneau cuit dans le jameed (yaourt séché fermenté) servi sur lit de riz. Une explosion de saveurs authentiques qui m'a immédiatement transporté au cœur de la culture bédouine.",
    rating: 5,
    cultural_note: "Le mansaf se mange traditionnellement avec les mains, debout, en signe de respect. C'est un plat de partage et d'hospitalité."
  },
  {
    id: "2",
    day: 2,
    dish: "Falafel et Houmous",
    location: "Souk d'Amman",
    description: "Petit-déjeuner de rue authentique : falafels croustillants accompagnés d'un houmous onctueux, de tahini et de légumes frais. Servi dans du pain pita chaud, un délice simple mais parfait.",
    rating: 4,
    cultural_note: "Le falafel est originaire du Moyen-Orient et chaque pays revendique sa propre version. En Jordanie, ils sont particulièrement épicés !"
  },
  {
    id: "3",
    day: 3,
    dish: "Kunafa de Nablus",
    location: "Pâtisserie de Jerash",
    description: "Dessert traditionnel aux cheveux d'ange, fromage blanc et sirop de fleur d'oranger. Une texture unique entre croquant et fondant, une douceur qui clôture parfaitement un repas copieux.",
    rating: 5,
    cultural_note: "La kunafa est considérée comme la reine des desserts du Levant. Celle de Nablus est réputée être la meilleure !"
  }
];

export const getFoodExperiences = () => foodExperiences;