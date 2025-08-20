import { useState, useEffect, useCallback } from 'react';
import { 
  JournalEntry, 
  loadJournalEntries, 
  updateJournalEntry, 
  addJournalEntry,
  getJournalStats 
} from '@/lib/journalStorage';

const defaultEntries: JournalEntry[] = [
  { 
    day: 1, 
    date: "15 mars 2024",
    title: "Arrivée à Amman",
    location: "Amman, Jordanie",
    story: "Départ de Lyon le 30/07, direction Paris CDG en train. Le trajet en Ouigo s'est avéré décevant : inconfort, mal de dos… Heureusement, à l'aéroport CDG, les choses s'enchaînent facilement : pas de bagage à enregistrer, embarquement rapide. Les places en rang 11 offrent un bon confort pour les jambes, mais le dos continue de protester.\n\nÀ l'arrivée à l'aéroport Queen Alia d'Amman, un contact de l'agence nous prend en charge. Les formalités sont rapides. Achat de carte SIM, puis trajet de 45 minutes jusqu'à l'hôtel. La chaleur est bien là. Le chauffeur est bavard et parle un peu français. Une fois à l'hôtel : installation et dodo.",
    mood: "Enthousiaste",
    photos: ["amman-theater.jpg", "citadel-view.jpg"]
  },
  {
    day: 2,
    date: "16 mars 2024", 
    title: "Jerash, Ajlun et spa à Amman",
    location: "Jerash, Ajlun, Amman",
    story: "Mal dormi, toujours ce mal de dos. Petit déjeuner très correct à l'hôtel, puis réception de la voiture de location. Grosse déception : au lieu du SUV attendu, on se retrouve avec une Nissan Kicks. « Yes, this is mini SUV sir ». Mouais… On compte faire une réclamation.\n\nDirection Jerash. Les ruines romaines sont splendides. Le site est immense, bien conservé. On y ressent l'empreinte d'un passé glorieux. Une balade impressionnante à travers les siècles.\n\nDéjeuner sur place : assiette mixte grill avec agneau, bœuf et poulet, hummus, taboulé. Tout est délicieux, les saveurs locales s'imposent dès ce premier vrai repas.\n\nDans un coin discret du restaurant, cette salle était réservée à la préparation des chichas. Alignées comme des soldats prêts à servir, elles attendaient les amateurs de fumée parfumée. Nous avons décliné l'invitation cette fois-ci. Peut-être une autre fois.\n\nL'après-midi, visite du château de Ajlun. Intéressant mais très fréquenté, un peu trop. Retour à Amman pour une séance spa à l'hôtel : hammam, sauna, gommage, massage… Une belle pause bien méritée.\n\nLe soir, dîner chez Ghaith, petit restaurant familial du quartier, à distance de marche. Très bon, ambiance simple et conviviale.",
    mood: "Mitigé",
    photos: ["jerash-columns.jpg", "ajlun-castle.jpg"],
    link: "https://maps.app.goo.gl/XHDM6vpRh1KCrQbB6"
  }
];

export const useJournalEntries = () => {
  const [customEntries, setCustomEntries] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Charger les entrées au démarrage
  useEffect(() => {
    console.log('🚀 Initializing journal entries...');
    try {
      const loaded = loadJournalEntries();
      console.log('📚 Loaded custom entries:', loaded);
      setCustomEntries(loaded);
      setError(null);
    } catch (err) {
      console.error('❌ Failed to load entries:', err);
      setError('Erreur lors du chargement des entrées');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fusionner les entrées par défaut et personnalisées
  const getAllEntries = useCallback((): JournalEntry[] => {
    const customDays = new Set(customEntries.map(entry => entry.day));
    const merged: JournalEntry[] = [];
    
    console.log('🔄 Merging entries:');
    console.log('   📝 Custom entries:', customEntries);
    console.log('   📚 Custom days:', Array.from(customDays));
    
    // Ajouter toutes les entrées personnalisées
    merged.push(...customEntries);
    
    // Ajouter les entrées par défaut seulement si pas de version personnalisée
    defaultEntries.forEach(defaultEntry => {
      if (!customDays.has(defaultEntry.day)) {
        merged.push(defaultEntry);
      }
    });
    
    const final = merged.sort((a, b) => a.day - b.day);
    console.log('✨ Final merged entries:', final);
    
    return final;
  }, [customEntries]);

  // Ajouter une nouvelle entrée
  const addEntry = useCallback((formData: any): boolean => {
    console.log('➕ Adding new entry:', formData);
    
    try {
      const newEntry: JournalEntry = {
        day: formData.day,
        date: formData.date.toLocaleDateString('fr-FR', { 
          day: 'numeric', 
          month: 'long', 
          year: 'numeric' 
        }),
        title: formData.title,
        location: formData.location,
        story: formData.story,
        mood: formData.mood,
        photos: formData.photos || [],
        link: formData.link || undefined,
      };

      const success = addJournalEntry(newEntry);
      
      if (success) {
        // Recharger les données depuis le localStorage pour être sûr
        const updated = loadJournalEntries();
        setCustomEntries(updated);
        console.log('✅ Entry added successfully');
        setError(null);
        return true;
      } else {
        setError('Erreur lors de l\'ajout de l\'entrée');
        return false;
      }
    } catch (err) {
      console.error('❌ Error adding entry:', err);
      setError('Erreur lors de l\'ajout de l\'entrée');
      return false;
    }
  }, []);

  // Modifier une entrée existante
  const editEntry = useCallback((formData: any, originalDay: number): boolean => {
    console.log('✏️ Editing entry for day:', originalDay);
    console.log('📝 Form data:', formData);
    
    try {
      const updatedEntry: JournalEntry = {
        day: formData.day,
        date: formData.date.toLocaleDateString('fr-FR', { 
          day: 'numeric', 
          month: 'long', 
          year: 'numeric' 
        }),
        title: formData.title,
        location: formData.location,
        story: formData.story,
        mood: formData.mood,
        photos: formData.photos || [],
        link: formData.link || undefined,
      };

      const success = updateJournalEntry(updatedEntry);
      
      if (success) {
        // Recharger les données depuis le localStorage pour être sûr
        const updated = loadJournalEntries();
        setCustomEntries(updated);
        console.log('✅ Entry updated successfully');
        setError(null);
        return true;
      } else {
        setError('Erreur lors de la modification de l\'entrée');
        return false;
      }
    } catch (err) {
      console.error('❌ Error editing entry:', err);
      setError('Erreur lors de la modification de l\'entrée');
      return false;
    }
  }, []);

  // Obtenir les statistiques
  const getStats = useCallback(() => {
    return getJournalStats();
  }, []);

  // Forcer le rechargement des données
  const reloadEntries = useCallback(() => {
    console.log('🔄 Manually reloading entries...');
    setIsLoading(true);
    try {
      const loaded = loadJournalEntries();
      setCustomEntries(loaded);
      setError(null);
    } catch (err) {
      console.error('❌ Failed to reload entries:', err);
      setError('Erreur lors du rechargement des entrées');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    allEntries: getAllEntries(),
    customEntries,
    isLoading,
    error,
    addEntry,
    editEntry,
    getStats,
    reloadEntries
  };
};