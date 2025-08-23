import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { diagnosticTools } from '@/lib/journalStorage';

const DataRecovery = () => {
  const [recoveryInfo, setRecoveryInfo] = useState<any>(null);

  const checkBackups = () => {
    const inspection = diagnosticTools.inspectStorage();
    setRecoveryInfo(inspection);
  };

  const recoverFromBackup = () => {
    try {
      const recovered = diagnosticTools.recoverFromBackup();
      console.log('🔄 Données récupérées:', recovered);
      setRecoveryInfo(prev => ({ ...prev, recovered }));
      // Recharger la page pour voir les changements
      window.location.reload();
    } catch (error) {
      console.error('❌ Erreur de récupération:', error);
    }
  };

  const exportAllData = () => {
    const allData = diagnosticTools.exportAll();
    console.log('📊 Toutes les données:', allData);
    
    // Télécharger les données
    const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `journal-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto mt-4">
      <CardHeader>
        <CardTitle>🚑 Récupération des Données du Journal</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertDescription>
            Vos données peuvent être récupérables depuis les sauvegardes automatiques.
          </AlertDescription>
        </Alert>

        <div className="flex gap-2 flex-wrap">
          <Button onClick={checkBackups} variant="outline">
            🔍 Vérifier les sauvegardes
          </Button>
          <Button onClick={recoverFromBackup} variant="default">
            🔄 Récupérer depuis sauvegarde
          </Button>
          <Button onClick={exportAllData} variant="outline">
            📥 Exporter toutes les données
          </Button>
        </div>

        {recoveryInfo && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Informations de sauvegarde:</h3>
            <div className="text-sm space-y-1">
              <div>Principale: {recoveryInfo.sizes?.main || 0} caractères</div>
              <div>Sauvegarde 1: {recoveryInfo.sizes?.backup1 || 0} caractères</div>
              <div>Sauvegarde 2: {recoveryInfo.sizes?.backup2 || 0} caractères</div>
              <div>Version: {recoveryInfo.version}</div>
            </div>
            
            {recoveryInfo.recovered && (
              <div className="mt-4 p-2 bg-green-100 rounded">
                <div className="font-semibold">✅ Données récupérées:</div>
                <div>{recoveryInfo.recovered.length} entrées trouvées</div>
                <div>Jours: {recoveryInfo.recovered.map((e: any) => e.day).join(', ')}</div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DataRecovery;