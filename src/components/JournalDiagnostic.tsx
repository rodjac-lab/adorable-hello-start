import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { diagnosticTools, getJournalStats } from '@/lib/journalStorage';
import { toast } from 'sonner';
import { Download, Upload, RefreshCw, Trash2, Search } from 'lucide-react';

export const JournalDiagnostic: React.FC = () => {
  const [diagnosticData, setDiagnosticData] = useState<any>(null);
  const [importData, setImportData] = useState('');

  const runDiagnostic = () => {
    const data = {
      stats: getJournalStats(),
      storage: diagnosticTools.inspectStorage(),
      timestamp: new Date().toISOString()
    };
    setDiagnosticData(data);
    toast.success('Diagnostic terminé');
  };

  const handleExport = () => {
    const exportData = diagnosticTools.exportAll();
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `journal-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Export terminé');
  };

  const handleImport = async () => {
    try {
      const data = JSON.parse(importData);
      const result = await diagnosticTools.importData(data);
      
      if (result.success) {
        toast.success(`Import réussi: ${result.imported} entrées`);
        setImportData('');
        runDiagnostic();
      } else {
        toast.error(`Import échoué: ${result.error}`);
      }
    } catch (error) {
      toast.error('Format JSON invalide');
    }
  };

  const handleForceMigration = () => {
    diagnosticTools.forceMigration();
    toast.success('Migration forcée terminée');
    runDiagnostic();
  };

  const handleReset = () => {
    if (confirm('⚠️ Cela supprimera toutes les données. Continuer ?')) {
      diagnosticTools.resetStorage();
      toast.success('Storage réinitialisé');
      runDiagnostic();
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="w-5 h-5" />
          Diagnostic du Journal
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="status" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="status">État</TabsTrigger>
            <TabsTrigger value="storage">Stockage</TabsTrigger>
            <TabsTrigger value="export">Export</TabsTrigger>
            <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          </TabsList>

          <TabsContent value="status" className="space-y-4">
            <div className="flex gap-2">
              <Button onClick={runDiagnostic} className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4" />
                Exécuter Diagnostic
              </Button>
            </div>

            {diagnosticData && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold">{diagnosticData.stats.totalEntries}</div>
                      <div className="text-sm text-muted-foreground">Entrées totales</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold">{diagnosticData.stats.minDay}-{diagnosticData.stats.maxDay}</div>
                      <div className="text-sm text-muted-foreground">Plage de jours</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <Badge variant={diagnosticData.stats.storageVersion === '2.0' ? 'default' : 'secondary'}>
                        v{diagnosticData.stats.storageVersion}
                      </Badge>
                      <div className="text-sm text-muted-foreground">Version</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <Badge variant={diagnosticData.stats.hasBackups ? 'default' : 'destructive'}>
                        {diagnosticData.stats.hasBackups ? 'OK' : 'AUCUN'}
                      </Badge>
                      <div className="text-sm text-muted-foreground">Backups</div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Jours présents</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {diagnosticData.stats.days.map((day: number) => (
                        <Badge key={day} variant="outline">Jour {day}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="storage" className="space-y-4">
            {diagnosticData && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Principal</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-lg font-mono">{diagnosticData.storage.sizes.main} chars</div>
                      <Badge variant={diagnosticData.storage.main ? 'default' : 'destructive'}>
                        {diagnosticData.storage.main ? 'Présent' : 'Vide'}
                      </Badge>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Backup 1</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-lg font-mono">{diagnosticData.storage.sizes.backup1} chars</div>
                      <Badge variant={diagnosticData.storage.backup1 ? 'default' : 'secondary'}>
                        {diagnosticData.storage.backup1 ? 'Présent' : 'Vide'}
                      </Badge>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Backup 2</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-lg font-mono">{diagnosticData.storage.sizes.backup2} chars</div>
                      <Badge variant={diagnosticData.storage.backup2 ? 'default' : 'secondary'}>
                        {diagnosticData.storage.backup2 ? 'Présent' : 'Vide'}
                      </Badge>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="export" className="space-y-4">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Export des données</CardTitle>
                </CardHeader>
                <CardContent>
                  <Button onClick={handleExport} className="flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    Télécharger toutes les données
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Import des données</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    placeholder="Collez ici le JSON exporté..."
                    value={importData}
                    onChange={(e) => setImportData(e.target.value)}
                    className="min-h-[200px] font-mono text-sm"
                  />
                  <Button 
                    onClick={handleImport} 
                    disabled={!importData.trim()}
                    className="flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    Importer les données
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="maintenance" className="space-y-4">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg text-amber-600">Actions de maintenance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button 
                    onClick={handleForceMigration} 
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Forcer la migration
                  </Button>
                  
                  <Button 
                    onClick={handleReset} 
                    variant="destructive"
                    className="flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Réinitialiser tout le stockage
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};