import React, { createContext, useContext, useState, ReactNode } from 'react';

interface LocationContextType {
  locationId: string;
  setLocationId: (id: string) => void;
  locationName: string;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const LocationProvider = ({ children }: { children: ReactNode }) => {
  const [locationId, setLocationId] = useState('sanganer_01');
  
  // In a real app, this would be derived from a locations API/lookup
  const locationName = locationId === 'sanganer_01' ? 'Sanganer Block, Jaipur, Rajasthan' : 'Phagi Block, Jaipur, Rajasthan';

  return (
    <LocationContext.Provider value={{ locationId, setLocationId, locationName }}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};
