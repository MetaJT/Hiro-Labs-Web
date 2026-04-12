import { useEffect, useState } from "react";

function Home() {
  const [health, setHealth] = useState<string>("checking...");

  useEffect(() => {
    fetch("/api/health")
      .then((res) => res.json())
      .then((data) => setHealth(data.status))
      .catch(() => setHealth("unreachable"));
  }, []);

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", padding: "2rem" }}>
      <h1>Hiro Labs</h1>
      <p>
        API status: <strong>{health}</strong>
      </p>
    </div>
  );
}

export default Home;
