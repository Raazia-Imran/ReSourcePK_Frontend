import { useEffect, useState } from "react";
const eventName = "rethread-profile-appearance";
function read(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || {};
  } catch {
    return {};
  }
}
export default function useProfileAppearance(userId) {
  const key = `rethread:appearance:${userId}`;
  const [appearance, setAppearance] = useState(() => read(key));
  useEffect(() => {
    const update = () => setAppearance(read(key));
    window.addEventListener(eventName, update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener(eventName, update);
      window.removeEventListener("storage", update);
    };
  }, [key]);
  function save(value) {
    localStorage.setItem(key, JSON.stringify(value));
    setAppearance(value);
    window.dispatchEvent(new Event(eventName));
  }
  return { appearance, save };
}
