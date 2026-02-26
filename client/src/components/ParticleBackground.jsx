import { useEffect, useMemo, useState } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";

export default function ParticleBackground() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => setReady(true));
  }, []);

  const options = useMemo(
    () => ({
      fullScreen: false,
      fpsLimit: 60,
      particles: {
        number: { value: 50, density: { enable: true, area: 1000 } },
        color: { value: "#8dc647" },
        opacity: { value: { min: 0.15, max: 0.4 } },
        size: { value: { min: 1.5, max: 3 } },
        links: {
          enable: true,
          color: "#8dc647",
          distance: 160,
          opacity: 0.12,
          width: 1,
        },
        move: {
          enable: true,
          speed: 0.4,
          direction: "none",
          outModes: { default: "bounce" },
        },
      },
      interactivity: {
        events: {
          onHover: { enable: true, mode: "grab" },
        },
        modes: {
          grab: { distance: 180, links: { opacity: 0.25 } },
        },
      },
      detectRetina: true,
    }),
    [],
  );

  if (!ready) return null;

  return <Particles className="absolute inset-0" options={options} />;
}
