import { Routes, Route } from "react-router-dom";
import Layout from "components/Layout";
import { Home, About, BookDemo, NotFound } from "pages";

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/demo" element={<BookDemo />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

export default App;
