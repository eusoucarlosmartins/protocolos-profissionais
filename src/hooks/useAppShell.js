import { useCallback, useEffect, useState } from "react";

export const useRoute = () => {
  const [path, setPath] = useState(() => window.location.pathname);

  useEffect(() => {
    const onPopState = () => setPath(window.location.pathname);
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const navigate = useCallback((newPath) => {
    window.history.pushState({}, "", newPath);
    setPath(newPath);
    window.scrollTo(0, 0);
  }, []);

  return [path, navigate];
};

export const useIsMobile = (bp = 640) => {
  const [mobile, setMobile] = useState(() => typeof window !== "undefined" && window.innerWidth < bp);

  useEffect(() => {
    const handleResize = () => setMobile(window.innerWidth < bp);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [bp]);

  return mobile;
};
