export interface JournalEntry {
  day: number;
  date: string;
  title: string;
  location: string;
  story: string;
  mood: string;
}

export const journalEntries: JournalEntry[] = [
  {
    day: 1,
    date: "15 janvier 2024",
    title: "Arrivée à Amman",
    location: "Amman",
    story: "Premier contact avec la capitale jordanienne. L'accueil chaleureux de l'aéroport, les premières impressions de cette ville moderne et traditionnelle à la fois. Installation à l'hôtel et première promenade dans les rues d'Amman.",
    mood: "Excité"
  },
  {
    day: 2,
    date: "16 janvier 2024",
    title: "Exploration d'Amman",
    location: "Amman",
    story: "Visite de la citadelle d'Amman, du théâtre romain et du souk. Découverte de l'hospitalité jordanienne autour d'un thé à la menthe. Les contrastes saisissants entre ancien et moderne.",
    mood: "Émerveillé"
  },
  {
    day: 3,
    date: "17 janvier 2024",
    title: "Jerash, joyau antique",
    location: "Jerash",
    story: "Route vers Jerash, l'une des cités antiques les mieux préservées au monde. Déambulation dans les ruines romaines, l'arc d'Hadrien, le forum ovale. L'histoire prend vie sous nos yeux.",
    mood: "Fasciné"
  },
  {
    day: 4,
    date: "18 janvier 2024",
    title: "Château d'Ajloun",
    location: "Ajloun",
    story: "Visite du château d'Ajloun, forteresse islamique du XIIe siècle. Vue panoramique sur la vallée du Jourdain. Rencontre avec des locaux qui partagent l'histoire de leur région.",
    mood: "Enrichi"
  },
  {
    day: 5,
    date: "19 janvier 2024",
    title: "Route vers Petra",
    location: "Petra",
    story: "Départ matinal pour Petra. Premier aperçu de la cité rose à travers le Siq. L'émotion de découvrir le Trésor, taillé dans la roche rose. Exploration des tombeaux et du théâtre nabatéen.",
    mood: "Bouleversé"
  }
];

export const getJournalEntries = () => journalEntries;
export const getJournalEntry = (day: number) => journalEntries.find(entry => entry.day === day);