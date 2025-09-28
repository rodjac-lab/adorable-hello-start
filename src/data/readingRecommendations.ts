export interface BookRecommendation {
  id: string;
  title: string;
  author: string;
  description: string;
  category: string;
  why_recommend: string;
  amazon_link?: string;
}

export const readingRecommendations: BookRecommendation[] = [
  {
    id: "1",
    title: "Lawrence d'Arabie",
    author: "T.E. Lawrence",
    description: "Les mémoires légendaires de T.E. Lawrence sur sa campagne dans le désert arabique pendant la Première Guerre mondiale.",
    category: "Histoire",
    why_recommend: "Pour comprendre l'histoire moderne du Moyen-Orient et l'importance stratégique de la région. Lawrence a vécu et combattu en Jordanie.",
    amazon_link: "https://amazon.com/example1"
  },
  {
    id: "2",
    title: "Petra, Cité Perdue",
    author: "Christian Augé",
    description: "Guide archéologique et historique complet sur Petra, ses mystères et sa redécouverte.",
    category: "Archéologie",
    why_recommend: "Indispensable avant de visiter Petra. Donne tout le contexte historique et culturel pour apprécier pleinement ce site extraordinaire.",
    amazon_link: "https://amazon.com/example2"
  },
  {
    id: "3",
    title: "Le Royaume hachémite de Jordanie",
    author: "Philippe Droz-Vincent",
    description: "Analyse géopolitique moderne de la Jordanie, son rôle régional et ses défis contemporains.",
    category: "Géopolitique",
    why_recommend: "Pour comprendre la Jordanie d'aujourd'hui, ses enjeux politiques et sa position unique au Moyen-Orient.",
    amazon_link: "https://amazon.com/example3"
  }
];

export const getReadingRecommendations = () => readingRecommendations;