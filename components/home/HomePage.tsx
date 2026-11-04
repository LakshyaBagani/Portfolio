import Loader from "./Loader";
import Cord from "./Cord";
import Hero from "./Hero";
import Doors from "./Doors";
import Story from "./Story";
import Holo from "./Holo";
import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";
import BackToTop from "@/components/site/BackToTop";
import NavMenu from "@/components/site/NavMenu";
import RequestModal from "@/components/site/RequestModal";
import SiteRuntime from "@/components/site/SiteRuntime";

/** the one-page home. /home, /work and /my-story render the same page and land on that section (data-initial). */
export default function HomePage({ initial = "home" }: { initial?: "home" | "works" | "about" }) {
  return (
    <>
      <a className="skip" href="#main">Skip to content</a>
      <Loader />
      <Header />
      <Cord />
      <main id="main" data-initial={initial}>
        <Hero />
        <Doors />
        <Story />
      </main>
      <Footer />
      <BackToTop />
      <NavMenu />
      <Holo />
      <RequestModal />
      <SiteRuntime />
    </>
  );
}
