import { HyperText } from "components/HyperText";
import { FlickeringGrid } from "components/FlickeringGrid";
import "pages/styles/Home.css";

function Home() {
  return (
    <div className="home-page">
      <FlickeringGrid
        className="home-flickering-grid"
        squareSize={4}
        gridGap={6}
        flickerChance={0.1}
        color="#49596d"
        maxOpacity={0.5}
      />
      <div style={{ textAlign: "center" }} className="home-content">
        <HyperText as="h1" duration={1000} startOnView>
          Hiro Labs
        </HyperText>
      </div>
    </div>
  );
}

export default Home;
