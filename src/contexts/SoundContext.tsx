import { createContext, useContext, useState, ReactNode } from "react";

interface SoundContextType {
  muted: boolean;
  toggleMute: () => void;
}

const SoundContext = createContext<SoundContextType>({ muted: false, toggleMute: () => {} });

export const SoundProvider = ({ children }: { children: ReactNode }) => {
  const [muted, setMuted] = useState(false);
  const toggleMute = () => setMuted((prev) => !prev);
  return (
    <SoundContext.Provider value={{ muted, toggleMute }}>
      {children}
    </SoundContext.Provider>
  );
};

export const useSound = () => useContext(SoundContext);
