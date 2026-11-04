import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";
import BackToTop from "@/components/site/BackToTop";
import NavMenu from "@/components/site/NavMenu";
import RequestModal from "@/components/site/RequestModal";
import SiteRuntime from "@/components/site/SiteRuntime";
import Room from "./Room";
import "./work.css";

/**
 * The frame every scrolling work page shares: the site header (current door marked), the room glow and
 * "Back to the doors", the page itself, then the footer. The rooms scroll natively (no Lenis), like the reference.
 * Each route renders its template (StackPage, HungPage, WallPage), which wraps itself in this.
 */
export default function WorkPage({ door, children }: { door: number; children: React.ReactNode }) {
  return (
    <>
      <a className="skip" href="#main">Skip to content</a>
      <Header current={door} />
      <Room door={door} />
      {children}
      <Footer />
      <BackToTop />
      <NavMenu />
      <RequestModal />
      <SiteRuntime lenis={false} />
    </>
  );
}
