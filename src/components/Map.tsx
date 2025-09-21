import { MapView } from './map/MapView';
import { MapConfigurator } from './map/MapConfigurator';
import { isStudioMode } from '@/utils/environment';

const Map = () => {
  const studio = isStudioMode();

  return (
    <div
      className={
        studio
          ? 'grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px] xl:grid-cols-[minmax(0,1fr)_460px]'
          : 'space-y-6'
      }
    >
      <MapView />
      {studio && <MapConfigurator />}
    </div>
  );
};

export default Map;
