import "components/styles/Footer.css";

function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <p>&copy; {new Date().getFullYear()} Hiro Labs LLC. All rights reserved.</p>
      </div>
    </footer>
  );
}

export default Footer;
